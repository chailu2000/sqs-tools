# Implementation Plan: Safe SQS Message Polling

This plan addresses the issue where SQS messages are repeatedly received during active polling sessions, causing their `ApproximateReceiveCount` to balloon and push them into the Dead Letter Queue (DLQ).

We will ensure messages are polled only once during the polling session and made available again for normal consumers afterward. In addition, we will display clear warnings in the UI about SQS receive count behavior, since true non-destructive peeking is not supported by AWS SQS.

## SQS Behavior and Design Decisions

### The SQS Constraint
AWS SQS **does not support true peeking**. Every `ReceiveMessage` API call that successfully returns a message always increments its `ApproximateReceiveCount` by 1. 

If we poll in a tight loop with a visibility timeout of `0` (or immediately reset visibility to `0`), we will retrieve the same messages over and over in rapid succession, quickly exceeding the queue's `maxReceiveCount` (DLQ threshold) and pushing them to the DLQ.

### Safe Polling Design
To prevent DLQ overflow while keeping the tool non-intrusive:
1. **Fetch with Temporary Visibility Timeout during Polling**:
   When active polling is initiated in Peek Mode (where `peek = true` or `visibilityTimeout = 0`), the polling loop will call SQS with a temporary visibility timeout of `30` seconds. This hides the fetched messages from subsequent poll requests within the same polling session, ensuring each message is received **exactly once** during the poll.
2. **Track Receipt Handles**:
   The frontend and extension host will track the receipt handles of all messages fetched under this temporary visibility timeout.
3. **Deferred Visibility Reset**:
   When the polling session ends (manually stopped, timed out, or tab switched), the frontend will trigger a bulk change-visibility call to reset the visibility timeout of all fetched messages back to `0` so they are immediately available to other consumers.
4. **Failsafe on Close**:
   If the user closes the VS Code webview panel during active polling, the extension host's `panel.onDidDispose` will intercept this and automatically reset the visibility timeout of all tracked messages back to `0`.
5. **Prominent UI Warnings**:
   We will add clear warning callouts in the Svelte UI explaining how SQS increments the receive count and why Peek Mode can lead to messages moving to the DLQ if they are repeatedly polled or fetched.

---

## Proposed Changes

### 1. Visibility Tracking Service & Unit Tests

#### [NEW] [visibility-tracker.ts](file:///Users/luindc22203/workspace/sqs-tools/vscode-extension/sqs-management-tool/src/services/visibility-tracker.ts)
* Create `VisibilityTracker` class to manage receipt handles of messages that need their visibility timeout reset.
* Methods:
  * `trackMessage(panelId, { receiptHandle, queueUrl, region })`
  * `untrackMessage(panelId, receiptHandle)`
  * `resetVisibilityForPanel(panelId)`

#### [NEW] [visibility-tracker.test.ts](file:///Users/luindc22203/workspace/sqs-tools/vscode-extension/sqs-management-tool/src/services/__tests__/visibility-tracker.test.ts)
* Add unit tests to verify `VisibilityTracker`:
  * Adding and tracking messages.
  * Removing messages when they are deleted.
  * Resetting visibility back to `0` for all tracked messages.
  * Handling SQS client failures gracefully.

---

### 2. VS Code Extension Host

#### [MODIFY] [api-adapter.ts](file:///Users/luindc22203/workspace/sqs-tools/frontend/src/lib/api-adapter.ts)
* Update `api.receiveMessages` and `api.receiveDlqMessages` to pass the `peek` flag in the `postMessage` command:
  ```typescript
  vscode.postMessage({
      command: 'fetchMessages',
      queueId,
      maxMessages: options.maxMessages,
      visibilityTimeout: options.visibilityTimeout,
      waitTimeSeconds: options.waitTimeSeconds || 0,
      peek: options.peek // <-- Added
  });
  ```

#### [MODIFY] [extension-standalone.ts](file:///Users/luindc22203/workspace/sqs-tools/vscode-extension/sqs-management-tool/src/extension-standalone.ts)
* Instantiate a global `VisibilityTracker`.
* Update the `fetchMessages` message handler:
  * Read `message.peek` and `message.visibilityTimeout`.
  * If `peek` is true and `visibilityTimeout === 0`, modify the options passed to `receiveMessages` to use a temporary visibility timeout of `30` seconds.
  * For each successfully received message, call `visibilityTracker.trackMessage(queue.id, ...)` to track it.
* Update `deleteMessage` handler:
  * When a message is deleted, untrack its receipt handle: `visibilityTracker.untrackMessage(queue.id, message.receiptHandle)`.
* Add a new message handler for `resetVisibility`:
  * Triggers `visibilityTracker.resetVisibilityForPanel(message.queueId)` when the frontend finishes polling.
* Update `panel.onDidDispose` to call `visibilityTracker.resetVisibilityForPanel(queue.id)` to clean up if the webview is closed.

---

### 3. Frontend UI Components & Warning Banner

#### [MODIFY] [MessageTableExtension.svelte](file:///Users/luindc22203/workspace/sqs-tools/frontend/src/lib/components/MessageTableExtension.svelte)
* Add a warning callout banner under the polling controls:
  > ⚠️ **SQS Receive Count Warning**: AWS SQS does not support non-destructive peeking. Every time a message is fetched (by receiving once or polling), SQS increments its receive count. If this count exceeds the queue's `maxReceiveCount` threshold, SQS will automatically move the message to the DLQ.
* Maintain a collection of receipt handles for messages loaded during polling.
* When polling is stopped or completed, invoke `api.resetVisibility(queueId)` or post a message to trigger the backend visibility reset.

#### [MODIFY] [MessageTable.svelte](file:///Users/luindc22203/workspace/sqs-tools/frontend/src/lib/components/MessageTable.svelte)
* Add the same receive count warning banner.
* Implement the same temporary visibility timeout and deferred reset logic for web app polling.

---

## Verification Plan

### Automated Tests
* Run the new and existing unit tests:
  ```bash
  cd vscode-extension/sqs-management-tool && pnpm run test
  ```

### Manual Verification
1. Open a queue containing messages.
2. Verify the new SQS Receive Count warning banner is clearly visible in the UI.
3. Click **Poll for Messages** with Peek Mode checked (Visibility = 0).
4. Verify that messages are retrieved and listed in the UI.
5. Using AWS CLI or AWS Console, verify that message receive counts do not increment continuously (they only increment by 1).
6. Click **Stop** (or wait for timeout) and verify that messages become immediately visible again for other consumers.
7. Start polling again and close the VS Code webview during polling. Verify in AWS Console/CLI that the messages become visible again immediately (their visibility is reset to 0 by the extension host's dispose failsafe).
