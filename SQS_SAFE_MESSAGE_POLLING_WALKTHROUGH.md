# SQS Safe Message Polling - User-Facing Documentation

## Overview

This document explains the safe message polling feature that prevents SQS messages from being repeatedly fetched during active polling sessions, which would cause their receive count to balloon and push them into the Dead Letter Queue (DLQ).

## The Problem

AWS SQS does not support true peeking. Every time a message is fetched using `ReceiveMessage`, SQS increments the message's `ApproximateReceiveCount`. When polling in a tight loop with visibility timeout of 0, the same messages would be retrieved over and over, quickly exceeding the queue's `maxReceiveCount` threshold and causing messages to be moved to the DLQ.

### Before the Fix

| Action | Result |
|--------|--------|
| User clicks "Poll for Messages" with Peek Mode enabled | Messages fetched every 100ms with visibilityTimeout=0 |
| SQS receives same message | `ApproximateReceiveCount` increments on every fetch |
| After 100 fetches | `ApproximateReceiveCount` = 100 (if maxReceiveCount is 100, message goes to DLQ) |
| User loses messages | Messages moved to DLQ unexpectedly |

## The Solution

We implemented a three-part system to ensure messages are polled only once during a polling session and made available again afterward:

1. **Temporary visibility timeout (30s) during polling** - Messages are fetched with a temporary 30-second visibility timeout, hiding them from subsequent poll requests in the same session
2. **Deferred visibility reset** - When polling ends (manual stop, timeout, or panel close), all tracked messages have their visibility reset to 0, making them immediately available to other consumers
3. **Failsafe on panel close** - If the webview panel is closed during active polling, tracked messages are automatically cleaned up

### How It Works Now

| Action | Result |
|--------|--------|
| User clicks "Poll for Messages" with Peek Mode enabled | Messages fetched with temporary visibilityTimeout=30 |
| SQS receives message | `ApproximateReceiveCount` increments only ONCE per message |
| User stops polling | All tracked messages have visibility reset to 0 |
| Messages are available | Other consumers can now fetch them immediately |

## Key Changes for Users

### 1. Warning Banner

A prominent warning banner now appears when polling controls are visible:

> ⚠️ **SQS Receive Count Warning**: AWS SQS does not support non-destructive peeking. Every time a message is fetched (by receiving once or polling), SQS increments its receive count. If this count exceeds the queue's `maxReceiveCount` threshold, SQS will automatically move the message to the DLQ.

This banner reminds users why Peek Mode works the way it does and what to expect.

### 2. Polling Behavior

| Feature | Description |
|---------|-------------|
| **Peek Mode (default)** | Uses temporary 30s visibility during polling to prevent receive count inflation |
| **Stop Polling** | Immediately resets visibility of all tracked messages to 0 |
| **Close Panel** | Auto-cleanup of tracked messages |
| **Message Deletion** | Deleted messages are automatically untracked |

### 3. Testing the Fix

To verify the safe polling feature is working:

1. Open a queue with messages
2. Click "Poll for Messages" with "Peek Mode" checked
3. Observe messages appear once, not repeatedly
4. Click "Stop" or wait for timeout
5. Check AWS Console or CLI - messages should now be visible for other consumers (visibility reset to 0)

### 4. Receive Count Behavior

With Peek Mode enabled:
- **Before**: Each fetch increments receive count, rapid inflation
- **After**: Each message is received exactly once during polling, receive count increments only once

With Peek Mode disabled (normal mode):
- No change - visibility timeout is set to user-specified value

## Technical Details

### Visibility Tracking

The system maintains a tracking map of receipt handles during polling:

```typescript
interface TrackedMessage {
    receiptHandle: string;
    queueUrl: string;
    region: string;
}
```

Messages are tracked when:
- Peek Mode is enabled (`peek = true`)
- Visibility timeout is 0 (or not specified)

Messages are untracked when:
- User deletes the message
- Polling session ends
- Panel is closed

### Reset Mechanism

When visibility reset is triggered:
1. All tracked messages for the current panel are retrieved
2. A bulk `ChangeMessageVisibility` call is made to set visibility to 0 for each
3. The tracking list is cleared
4. Any failures are logged but don't stop processing of other messages

## Related Files

| File | Purpose |
|------|---------|
| `visibility-tracker.ts` | Tracks messages that need visibility reset |
| `extension-standalone.ts` | Main extension entry point with message handlers |
| `MessageTableExtension.svelte` | Extension frontend with warning banner |
| `MessageTable.svelte` | Web app frontend with warning banner |
| `api-adapter.ts` | Frontend API adapter for VS Code postMessage |

## Summary

The safe polling feature ensures:
1. Messages are fetched only once during polling sessions
2. Receive count only increments once per message
3. Messages become available again immediately when polling stops
4. Users are warned about SQS receive count behavior

This prevents messages from being unexpectedly pushed to the DLQ while maintaining the non-destructive peeking experience users expect.