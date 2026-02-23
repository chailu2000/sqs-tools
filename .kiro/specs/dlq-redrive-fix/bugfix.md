# Bugfix Requirements Document

## Introduction

The selective redrive feature for DLQ messages fails to move selected messages from the DLQ to the main queue. The root cause is a visibility timeout conflict: when the backend receives messages from the DLQ to obtain receipt handles, these newly received messages may not match the user's originally selected messages (which are still under visibility timeout from the initial receive operation). This causes message ID mismatches, silent redrive failures, and incorrect UI state where the DLQ table clears despite messages remaining in the DLQ.

This bug affects users who need to selectively redrive specific messages from the DLQ, forcing them to use the "redrive all" functionality instead, which lacks granular control.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user selects messages in the DLQ tab and clicks "Redrive Selected" THEN the backend receives a fresh batch of messages from the DLQ (which may not include the selected messages due to visibility timeout) and attempts to match by message ID, resulting in "Message not found" errors for mismatched messages

1.2 WHEN the backend successfully matches some message IDs but the redrive operation completes THEN the frontend immediately calls loadMessages() which receives zero messages from the DLQ (due to the 30-second visibility timeout from the backend's receive operation), causing the DLQ table to clear incorrectly

1.3 WHEN the selective redrive operation fails to move messages THEN the system shows a generic success message ("Messages redriven successfully") without indicating which messages failed or why

1.4 WHEN messages fail to redrive due to message ID mismatch THEN the failure is silent and the user receives no indication that specific messages were not processed

1.5 WHEN the DLQ table clears after a failed redrive operation THEN the user incorrectly believes the messages were successfully moved, but the messages remain in the DLQ and do not appear in the main queue

### Expected Behavior (Correct)

2.1 WHEN a user selects messages in the DLQ tab and clicks "Redrive Selected" THEN the system SHALL use the receipt handles already available from the initial message load (stored in the frontend) to redrive the exact messages the user selected, without re-receiving messages from the DLQ

2.2 WHEN the selective redrive operation completes THEN the system SHALL display detailed results showing the count of successfully redriven messages and any failures (e.g., "Successfully redriven 3 of 5 messages. 2 failed.")

2.3 WHEN some messages fail to redrive THEN the system SHALL remove only the successfully redriven messages from the DLQ table and keep failed messages visible with error indicators

2.4 WHEN all selected messages are successfully redriven THEN the system SHALL remove those messages from the DLQ table and they SHALL appear in the main queue

2.5 WHEN the redrive operation encounters errors for specific messages THEN the system SHALL provide detailed error information for each failed message (e.g., message ID and error reason)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user uses the "Redrive All" functionality THEN the system SHALL CONTINUE TO process all DLQ messages in batches as it currently does

3.2 WHEN messages are successfully redriven using "Redrive All" THEN the system SHALL CONTINUE TO delete them from the DLQ and send them to the main queue

3.3 WHEN a user loads messages from the DLQ tab THEN the system SHALL CONTINUE TO display all available messages with their attributes and metadata

3.4 WHEN a user selects messages in the main queue tab THEN the system SHALL CONTINUE TO allow deletion and visibility timeout operations without interference from DLQ operations

3.5 WHEN the backend sends a message to the main queue and deletes it from the DLQ THEN the system SHALL CONTINUE TO perform these operations atomically (delete only if send succeeds)
