# Safe SQS Message Polling - Implementation Walkthrough

This document provides a complete walkthrough of the safe message polling feature added to the VS Code SQS Management Tool. It explains the problem, the solution, and all code changes made.

## The Problem

AWS SQS does not support true peeking. Every `ReceiveMessage` API call increments the message's `ApproximateReceiveCount`, even with `visibilityTimeout=0`. When polling in a tight loop, messages would quickly exceed the queue's `maxReceiveCount` and be moved to the Dead Letter Queue (DLQ).

### Original Behavior
1. User clicks "Poll for Messages" with Peek Mode enabled
2. Extension fetches messages every 100ms with `visibilityTimeout=0`
3. SQS increments `ApproximateReceiveCount` on every fetch
4. Messages reach `maxReceiveCount` quickly
5. Messages move to DLQ unexpectedly

## The Solution

Three-part system implemented:
1. **Temporary visibility timeout (30s) during polling** - hides messages from other poll requests
2. **Deferred visibility reset** - reset to 0 when polling ends
3. **Failsafe on panel close** - cleanup if webview is closed during polling
4. **UI warning banner** - inform users about receive count behavior

---

## Files Changed

### 1. New Files

#### `vscode-extension/sqs-management-tool/src/services/visibility-tracker.ts`
> NEW - Tracks receipt handles for messages that need visibility reset

```typescript
class VisibilityTracker {
    private trackedMessages = new Map<string, Set<TrackedMessage>>();

    trackMessage(panelId: string, message: TrackedMessage): void;
    untrackMessage(panelId: string, receiptHandle: string): void;
    resetVisibilityForPanel(panelId: string): Promise<void>;
}
```

**Tests**: `vscode-extension/sqs-management-tool/src/services/__tests__/visibility-tracker.test.ts`

#### `SQS_SAFE_POLLING_WALKTHROUGH.md`
> NEW - User-facing documentation explaining the change

---

### 2. Modified Files

#### `frontend/src/lib/components/MessageTable.svelte`
> MODIFIED - Added warning banner and updated `stopPolling()` to call `api.resetVisibility()`

**Changes**:
1. Added warning banner after polling controls:
```svelte
<div class="info-banner warning">
    ⚠️ <strong>SQS Receive Count Warning</strong>: AWS SQS does not support non-destructive peeking. Every time a message is fetched (by receiving once or polling), SQS increments its receive count. If this count exceeds the queue's <code>maxReceiveCount</code> threshold, SQS will automatically move the message to the DLQ.
</div>
```

2. Updated `stopPolling()` function:
```typescript
function stopPolling() {
    polling = false;
    // Reset visibility of all tracked messages back to 0
    if (store.selectedQueue) {
        api.resetVisibility(store.selectedQueue.id);
    }
}
```

**Note**: Web app polling uses the Java backend which handles peek mode differently (see backend changes below).

---

#### `frontend/src/lib/components/MessageTableExtension.svelte`
> MODIFIED - Added warning banner and updated `stopPolling()` to call `api.resetVisibility()`

**Changes**:
1. Added same warning banner as MessageTable.svelte
2. Updated `stopPolling()` function to call `api.resetVisibility()`

**Lines**: ~210-217 (stopPolling function)

---

#### `frontend/src/lib/api-adapter.ts`
> MODIFIED - Updated `receiveMessages()` and `receiveDlqMessages()` to pass `peek` flag

**Changes**:
1. Updated `receiveMessages()` to pass `peek` in postMessage:
```typescript
vscode.postMessage({
    command: 'fetchMessages',
    queueId,
    maxMessages: options.maxMessages,
    visibilityTimeout: options.visibilityTimeout,
    waitTimeSeconds: options.waitTimeSeconds || 0,
    peek: options.peek  // <-- Added
});
```

2. Updated `receiveDlqMessages()` similarly
3. Added `resetVisibility()` method (fire-and-forget):
```typescript
async resetVisibility(queueId: string): Promise<void> {
    vscode.postMessage({
        command: 'resetVisibility',
        queueId
    });
}
```

---

#### `vscode-extension/sqs-management-tool/src/extension-standalone.ts`
> MODIFIED - Integrated VisibilityTracker, added peek mode handling, resetVisibility handler

**Changes**:

1. **Added import**:
```typescript
import { VisibilityTracker } from './services/visibility-tracker';
```

2. **Added global instance**:
```typescript
let visibilityTracker: VisibilityTracker;
```

3. **Updated activate() to initialize**:
```typescript
visibilityTracker = new VisibilityTracker((region: string) => {
    const client = clientFactory.getClient(region);
    return new SQSService(client);
});
```

4. **Updated `fetchMessages` handler**:
```typescript
case 'fetchMessages':
    try {
        // If Peek Mode is enabled (peek is true) and visibilityTimeout is 0,
        // we use a temporary visibility timeout of 30 seconds to prevent the same messages
        // from being received repeatedly by subsequent poll requests in the same session.
        const isPeekMode = message.peek === true;
        const requestedVisibility = message.visibilityTimeout !== undefined ? message.visibilityTimeout : 30;
        const useTempVisibility = isPeekMode && requestedVisibility === 0;
        const visibilityTimeout = useTempVisibility ? 30 : requestedVisibility;

        const messages = await sqsService.receiveMessages(queue.url, {
            maxMessages: message.maxMessages || 10,
            visibilityTimeout: visibilityTimeout,
            waitTimeSeconds: message.waitTimeSeconds || 0
        });

        // Track handles of messages that were read with a temporary visibility timeout
        if (useTempVisibility && messages.length > 0) {
            for (const msg of messages) {
                visibilityTracker.trackMessage(queue.id, {
                    receiptHandle: msg.receiptHandle,
                    queueUrl: queue.url,
                    region: queue.region
                });
            }
        }

        panel.webview.postMessage(sanitizeForWebview({
            command: 'messagesLoaded',
            messages
        }));
    } catch (error: any) {
        // ... error handling
    }
    break;
```

5. **Updated `fetchDLQMessages` handler** - same logic for DLQ messages

6. **Updated `deleteMessage` handler**:
```typescript
case 'deleteMessage':
    try {
        // Determine target queue URL based on which tab the message came from
        const deleteQueueUrl = message.dlq && queue.dlqUrl ? queue.dlqUrl : queue.url;
        await sqsService.deleteMessage(deleteQueueUrl, message.receiptHandle);
        
        // Untrack deleted message
        visibilityTracker.untrackMessage(queue.id, message.receiptHandle);

        panel.webview.postMessage(sanitizeForWebview({
            command: 'messageDeleted',
            success: true
        }));
        vscode.window.showInformationMessage('Message deleted successfully');
    } catch (error: any) {
        // ... error handling
    }
    break;
```

7. **Added `resetVisibility` handler**:
```typescript
case 'resetVisibility':
    try {
        log(`Resetting visibility for queue: ${queue.name} (explicit request)`);
        await visibilityTracker.resetVisibilityForPanel(queue.id);
    } catch (error: any) {
        log(`Failed to reset visibility for queue ${queue.name}: ${error.message}`);
    }
    break;
```

8. **Updated `panel.onDidDispose`**:
```typescript
panel.onDidDispose(
    async () => {
        log(`Panel disposed for queue: ${queue.name}. Resetting any tracked peek messages...`);
        await visibilityTracker.resetVisibilityForPanel(queue.id);
    },
    null,
    context.subscriptions
);
```

---

#### `vscode-extension/sqs-management-tool/src/models/sqs-service.ts`
> MODIFIED - Updated `RedriveResult` interface

**Change**:
```typescript
export interface RedriveResult {
    processedCount: number;
    successCount: number;
    failureCount: number;
    succeeded: string[];  // Changed from Array<{ messageId: string }>
    failed: Array<{ messageId: string; error: string }>;
}
```

---

#### `vscode-extension/sqs-management-tool/src/services/sqs-service.ts`
> MODIFIED - Updated `redriveSelectedMessages()` and `redriveMessages()` to use correct format

**Changes**:
1. In `redriveSelectedMessages()`:
```typescript
result.succeeded.push(message.messageId);  // Changed from { messageId: message.messageId }
```

2. In `redriveMessages()`:
```typescript
result.succeeded.push(message.messageId);  // Changed from { messageId: message.messageId }
```

---

#### `vscode-extension/sqs-management-tool/src/services/redrive-service.ts`
> MODIFIED - Updated to use correct format

**Changes**:
1. Line ~128:
```typescript
result.succeeded.push(message.messageId);  // Changed from { messageId: message.messageId }
```

2. Line ~168:
```typescript
result.succeeded.push(message.messageId);  // Changed from { messageId: message.messageId }
```

---

## How It Works

### Message Flow During Polling

```
User clicks "Poll for Messages" with Peek Mode enabled
    ↓
Extension sends fetchMessages with peek=true, visibilityTimeout=0
    ↓
Extension host receives message and checks: peek=true AND visibilityTimeout=0
    ↓
If true: uses temporary visibilityTimeout=30 for the fetch
    ↓
For each received message: visibilityTracker.trackMessage() is called
    ↓
Messages are displayed in UI with 30s visibility timeout
    ↓
On stopPolling() or panel close: api.resetVisibility(queueId) is called
    ↓
Extension host calls visibilityTracker.resetVisibilityForPanel(queueId)
    ↓
All tracked messages have their visibility reset to 0
    ↓
Messages immediately available for other consumers
```

### Key Behaviors

| Scenario | Before | After |
|----------|--------|-------|
| Poll with Peek Mode | Messages fetched every 100ms, receive count increments rapidly | Messages fetched with 30s visibility, receive count increments once per message |
| Stop polling | Messages remain hidden for 30s | Messages immediately visible (visibility reset to 0) |
| Close webview during polling | Messages hidden for 30s | Messages immediately visible (failsafe cleanup) |
| Delete message during polling | Not tracked, left in visibility timeout | Message untracked, no cleanup needed |
| Tab switch during polling | Messages remain tracked | Messages remain tracked, reset when polling stops |

---

## Verification Steps

### 1. Start VS Code Extension
```bash
cd vscode-extension/sqs-management-tool
pnpm run compile
pnpm run bundle
# Open VS Code and load the extension
```

### 2. Open a Queue with Messages
- Select a queue that has messages
- You should see the warning banner near the polling controls

### 3. Start Polling with Peek Mode
- Click "Poll for Messages"
- Ensure "Peek Mode (keep available)" is checked
- Observe that messages appear once, not repeatedly

### 4. Stop Polling
- Click "Stop"
- Check AWS Console or CLI to verify messages are now visible for other consumers

### 5. Test Tab Switching
- Start polling
- Switch to the "DLQ" tab (if available)
- Switch back to "Main Queue" tab
- Messages should still be available

### 6. Test Webview Close
- Start polling
- Close the VS Code webview panel
- Reopen the panel
- Messages should be immediately available

---

## Testing

### Unit Tests
```bash
cd vscode-extension/sqs-management-tool
pnpm run test
```

Expected: All 77 tests pass

### Manual Testing Checklist
- [ ] Warning banner appears when polling controls are visible
- [ ] Polling with Peek Mode doesn't cause receive count inflation
- [ ] Stopping polling makes messages immediately available
- [ ] Tab switching doesn't leave messages in invisible state
- [ ] Closing webview during polling triggers cleanup

---

## Notes for Developers

### Why Temporary Visibility Timeout?

SQS doesn't support true peeking - every `ReceiveMessage` increments `ApproximateReceiveCount`. By using a temporary 30s visibility timeout during polling:
- Messages are hidden from other poll requests in the same session
- Each message is received exactly once during polling
- Receive count only increments once per message

### Why Deferred Reset?

Instead of resetting visibility after each fetch (which would cause immediate re-delivery), we:
1. Track all receipt handles during the polling session
2. Reset all to 0 when polling ends (manual stop, timeout, or panel close)
3. This ensures messages become available only when polling is truly complete

### Edge Cases Handled

1. **Multiple polling sessions**: Each panel has its own tracking, so sessions don't interfere
2. **Message deletion**: Deleted messages are untracked to avoid errors on visibility reset
3. **Panel close during polling**: `onDidDispose` cleanup ensures no messages are left invisible
4. **Error handling**: Visibility reset failures are caught and logged

---

## Related Files

| File | Purpose |
|------|---------|
| `visibility-tracker.ts` | Tracks messages that need visibility reset |
| `extension-standalone.ts` | Main extension entry point with message handlers |
| `MessageTableExtension.svelte` | Extension frontend component |
| `MessageTable.svelte` | Web app frontend component |
| `api-adapter.ts` | Frontend API adapter for VS Code postMessage |
| `sqs-service.ts` | AWS S3/SQS service layer |
| `redrive-service.ts` | DLQ redrive service |

---

## Summary

The safe polling feature prevents receive count inflation by:
1. Using temporary 30s visibility timeout during polling
2. Tracking all fetched messages
3. Resetting visibility when polling ends or webview closes
4. Warning users about receive count risk

This ensures messages stay in your queue and don't get pushed to the DLQ unexpectedly.