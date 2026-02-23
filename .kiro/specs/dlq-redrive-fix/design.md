# DLQ Selective Redrive Bugfix Design

## Overview

The selective redrive feature fails due to a visibility timeout conflict. When users select messages to redrive, the backend re-receives messages from the DLQ to obtain receipt handles, but these newly received messages may not match the user's originally selected messages (which are still under visibility timeout). This causes message ID mismatches, silent failures, and incorrect UI state.

The fix eliminates the need for the backend to re-receive messages by passing receipt handles directly from the frontend (which already has them from the initial load). This ensures the exact selected messages are redriven, provides detailed success/failure feedback, and updates the UI correctly based on actual results.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when selective redrive is invoked without passing receipt handles, forcing the backend to re-receive messages that may not match the user's selection
- **Property (P)**: The desired behavior - selected messages are redriven using their original receipt handles, with detailed success/failure feedback and accurate UI updates
- **Preservation**: Existing "redrive all" functionality, message loading, and main queue operations that must remain unchanged
- **Receipt Handle**: An SQS-provided token that uniquely identifies a received message and is required for deletion operations
- **Visibility Timeout**: The period during which a received message is invisible to other consumers (30 seconds in this system)
- **Selective Redrive**: The operation where users choose specific messages from the DLQ to move back to the main queue
- **Message ID Mismatch**: When the backend's newly received messages don't include the user's originally selected messages due to visibility timeout

## Bug Details

### Fault Condition

The bug manifests when a user selects specific messages in the DLQ and clicks "Redrive Selected". The backend receives the request with only message IDs, then performs a fresh `receiveMessage` operation on the DLQ to obtain receipt handles. However, the originally selected messages are still under visibility timeout from the frontend's initial load, so the backend receives a different batch of messages. The backend attempts to match by message ID, resulting in "Message not found" errors and silent failures.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type RedriveRequest
  OUTPUT: boolean
  
  RETURN input.operation == "selective_redrive"
         AND input.receiptHandles == null
         AND input.messageIds != null
         AND selectedMessagesStillUnderVisibilityTimeout(input.messageIds)
END FUNCTION
```

### Examples

- **Example 1**: User loads DLQ showing messages M1, M2, M3. User selects M1 and M2, clicks "Redrive Selected". Backend receives fresh batch containing M3, M4, M5 (M1 and M2 are invisible). Backend cannot find M1 or M2, redrive fails silently. Frontend clears table (visibility timeout), user thinks success but M1 and M2 remain in DLQ.

- **Example 2**: User selects 5 messages. Backend's fresh receive gets 3 matching messages and 2 different ones. Backend redrives the 3 matches successfully but fails on 2. UI shows "Messages redriven successfully" and clears all 5 from table, but 2 remain in DLQ.

- **Example 3**: User selects 1 message immediately after loading DLQ. Backend's fresh receive gets completely different messages (original still under timeout). Redrive fails completely but UI shows success and clears table.

- **Edge Case**: User selects messages, waits 31+ seconds (past visibility timeout), then clicks redrive. Backend's fresh receive might now include the originally selected messages, operation succeeds by coincidence.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- "Redrive All" functionality must continue to process all DLQ messages in batches
- Successfully redriven messages must continue to be deleted from DLQ and sent to main queue
- Message loading in DLQ tab must continue to display all available messages with attributes
- Main queue operations (deletion, visibility timeout changes) must remain unaffected
- Atomic operations (delete from DLQ only if send to main queue succeeds) must be preserved

**Scope:**
All operations that do NOT involve selective redrive should be completely unaffected by this fix. This includes:
- "Redrive All" batch processing
- Initial message loading and display
- Main queue message operations
- DLQ message attribute display and filtering

## Hypothesized Root Cause

Based on the bug description, the root cause is:

1. **Missing Receipt Handle Propagation**: The frontend has receipt handles from the initial `receiveMessage` call but doesn't pass them to the backend in the selective redrive request. The API contract only includes message IDs.

2. **Unnecessary Re-Receive Operation**: The backend performs a fresh `receiveMessage` on the DLQ to obtain receipt handles, which is unnecessary if the frontend could provide them directly.

3. **Visibility Timeout Conflict**: The 30-second visibility timeout from the frontend's initial receive prevents the backend's fresh receive from getting the same messages, causing message ID mismatches.

4. **Insufficient Error Handling**: The backend doesn't provide detailed feedback about which messages succeeded or failed, and the frontend doesn't handle partial failures correctly.

5. **Premature UI Update**: The frontend immediately calls `loadMessages()` after redrive, which returns zero messages due to visibility timeout, causing the table to clear incorrectly regardless of actual redrive success.

## Correctness Properties

Property 1: Fault Condition - Selective Redrive Uses Original Receipt Handles

_For any_ selective redrive request where the user has selected specific messages from the DLQ, the fixed system SHALL use the receipt handles from the original message load (stored in the frontend) to redrive exactly those selected messages, without performing a fresh receiveMessage operation on the DLQ, and SHALL provide detailed success/failure feedback for each message.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Selective Operations Unchanged

_For any_ operation that is NOT selective redrive (including "Redrive All", message loading, main queue operations, and DLQ display), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing functionality for batch processing, message display, and queue operations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/src/components/DLQTab.tsx` (or similar)

**Changes**:
1. **Store Receipt Handles**: Modify the message state to include receipt handles alongside message IDs and other attributes when messages are initially loaded from the DLQ

2. **Pass Receipt Handles in API Request**: Update the selective redrive API call to include receipt handles in the request payload:
   ```typescript
   // Before: { messageIds: string[] }
   // After: { messages: Array<{ messageId: string, receiptHandle: string }> }
   ```

3. **Handle Partial Success Response**: Update the response handler to process detailed results showing which messages succeeded and which failed, updating the UI accordingly

4. **Selective UI Update**: Remove only successfully redriven messages from the DLQ table, keeping failed messages visible with error indicators

**File**: `backend/src/api/redrive.ts` (or similar)

**Changes**:
1. **Accept Receipt Handles**: Modify the selective redrive endpoint to accept receipt handles in the request body instead of just message IDs

2. **Remove Re-Receive Logic**: Eliminate the `receiveMessage` call that attempts to get fresh messages from the DLQ

3. **Use Provided Receipt Handles**: Use the receipt handles from the request directly for the `deleteMessage` operations after successfully sending to the main queue

4. **Return Detailed Results**: Modify the response to include per-message success/failure status:
   ```typescript
   {
     succeeded: Array<{ messageId: string }>,
     failed: Array<{ messageId: string, error: string }>
   }
   ```

5. **Maintain Atomic Operations**: Ensure that messages are deleted from DLQ only after successful send to main queue (preserve existing behavior)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate the selective redrive flow with visibility timeout conflicts. Mock the SQS operations to control which messages are returned on fresh receives. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Visibility Timeout Mismatch Test**: Load 3 messages (M1, M2, M3), select M1 and M2, mock backend fresh receive to return M3 and M4. Verify that redrive fails for M1 and M2 (will fail on unfixed code - message not found errors)

2. **Partial Match Test**: Load 5 messages, select all 5, mock backend fresh receive to return 3 of the 5. Verify that only 3 are redriven and 2 fail silently (will fail on unfixed code - no error feedback)

3. **UI State Test**: After failed redrive, call loadMessages() immediately. Verify that table clears incorrectly due to visibility timeout (will fail on unfixed code - shows empty table despite messages in DLQ)

4. **Complete Mismatch Test**: Select messages, mock backend to receive completely different batch. Verify that all redrives fail but UI shows success (will fail on unfixed code - incorrect success message)

**Expected Counterexamples**:
- Message ID mismatches causing "Message not found" errors
- Silent failures with no user feedback
- UI clearing incorrectly after failed operations
- Possible causes: missing receipt handles in API, unnecessary re-receive operation, insufficient error handling

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := selectiveRedrive_fixed(input)
  ASSERT result.usedOriginalReceiptHandles == true
  ASSERT result.detailedFeedback != null
  ASSERT result.uiUpdatedCorrectly == true
  ASSERT result.onlySuccessfulMessagesRemoved == true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalOperation(input) = fixedOperation(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-selective-redrive operations

**Test Plan**: Observe behavior on UNFIXED code first for "Redrive All", message loading, and main queue operations, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Redrive All Preservation**: Observe that "Redrive All" processes messages in batches on unfixed code, then write test to verify this continues after fix
2. **Message Loading Preservation**: Observe that DLQ message loading displays all attributes correctly on unfixed code, then write test to verify this continues after fix
3. **Main Queue Operations Preservation**: Observe that main queue deletion and visibility timeout operations work correctly on unfixed code, then write test to verify these continue after fix
4. **Atomic Operations Preservation**: Observe that messages are deleted from DLQ only after successful send to main queue on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test that receipt handles are stored correctly when messages are loaded
- Test that selective redrive API request includes receipt handles
- Test that backend uses provided receipt handles without re-receiving
- Test that detailed success/failure results are returned and processed
- Test that UI updates correctly based on partial success scenarios
- Test edge cases (all succeed, all fail, empty selection)

### Property-Based Tests

- Generate random message selections and verify receipt handles are always used from original load
- Generate random success/failure combinations and verify UI updates correctly for each
- Generate random message batches and verify "Redrive All" continues to work across many scenarios
- Test that main queue operations remain unaffected across many random inputs

### Integration Tests

- Test full selective redrive flow: load messages, select subset, redrive, verify correct messages moved
- Test partial failure scenario: some messages succeed, some fail, verify UI shows correct state
- Test "Redrive All" after selective redrive to ensure no interference
- Test switching between DLQ and main queue tabs during operations
- Test visibility timeout edge cases (redrive immediately vs after timeout expires)
