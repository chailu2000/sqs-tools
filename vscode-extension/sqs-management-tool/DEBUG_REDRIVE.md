# Debugging Redrive Issue

## Steps to Debug

### 1. Rebuild and Reload

```bash
cd vscode-extension/sqs-management-tool
pnpm run compile
```

Then in the Extension Development Host window:
- Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux) to reload

### 2. Open Extension Host Output

In the Extension Development Host window:
1. Go to **View > Output**
2. Select **Extension Host** from the dropdown
3. Clear the output (trash icon)

### 3. Reproduce the Issue

1. Open a queue that has a DLQ configured
2. Switch to the DLQ tab
3. Load messages from the DLQ
4. Select one or more messages
5. Click "Redrive Selected"

### 4. Check the Logs

Look for these log messages in Extension Host output:

```
Extension received message from webview: {"command":"redriveSelectedMessages","hasMessages":true}
Redrive request received: {...}
Starting redrive from DLQ <dlq-url> to main queue <main-url>
Messages to redrive: [...]
Redrive completed: {...}
```

### 5. Common Error Patterns

#### Error: "No DLQ configured for this queue"

**Log shows**:
```
Redrive request received: {...}
Redrive error: No DLQ configured for this queue
```

**Solution**: The queue config doesn't have `dlqUrl` set. Check:
- Queue was added correctly with DLQ info
- Queue attributes include RedrivePolicy

#### Error: "Cannot read property 'body' of undefined"

**Log shows**:
```
Redrive request received: {...}
Messages to redrive: undefined
```

**Solution**: Messages aren't being passed correctly from webview. Check:
- Webview is sending `messages` array
- Each message has `messageId`, `receiptHandle`, `body`

#### Error: AWS SDK errors

**Log shows**:
```
Starting redrive from DLQ...
Redrive error caught: AccessDenied / InvalidParameterValue / etc
```

**Solution**: AWS permission or parameter issue. Check:
- IAM permissions (sqs:ReceiveMessage, sqs:SendMessage, sqs:DeleteMessage)
- Queue URLs are correct
- Messages have valid receipt handles

#### No logs at all

**Log shows**: Nothing when clicking "Redrive Selected"

**Solution**: Message not reaching extension. Check:
- Webview console for errors (Help > Toggle Developer Tools)
- `window.vscode` is defined in webview
- Frontend bundle is up to date

### 6. Check Webview Console

In the Extension Development Host window:
1. Go to **Help > Toggle Developer Tools**
2. Go to **Console** tab
3. Look for errors

Common webview errors:
- `vscode is not defined` - Webview not initialized properly
- `Timeout waiting for redriveResult` - Extension not responding
- Network errors - Webview trying to use HTTP API instead of postMessage

### 7. Verify Message Format

The webview should send:
```javascript
{
  command: 'redriveSelectedMessages',
  queueId: 'queue-id',
  messages: [
    {
      messageId: 'msg-123',
      receiptHandle: 'handle-abc',
      body: 'message body',
      messageAttributes: { ... }
    }
  ]
}
```

The extension should respond:
```javascript
{
  command: 'redriveResult',
  successCount: 1,
  failureCount: 0,
  processedCount: 1,
  succeeded: ['msg-123'],
  failed: []
}
```

### 8. Test with AWS CLI

Verify the operation works outside the extension:

```bash
# Receive from DLQ
aws sqs receive-message \
  --queue-url <your-dlq-url> \
  --max-number-of-messages 1

# Send to main queue
aws sqs send-message \
  --queue-url <your-main-queue-url> \
  --message-body "test message"

# Delete from DLQ
aws sqs delete-message \
  --queue-url <your-dlq-url> \
  --receipt-handle <receipt-handle-from-receive>
```

If these work, the issue is in the extension code. If they fail, it's an AWS permission/configuration issue.

## What to Report

When reporting the issue, include:

1. **Extension Host Output** (full log from step 4)
2. **Webview Console Output** (errors from step 6)
3. **Queue Configuration**:
   - Main queue URL
   - DLQ URL
   - AWS region
4. **Message Details**:
   - How many messages selected
   - Any special characters in message body
5. **AWS Profile**:
   - Profile name
   - IAM permissions attached

## Quick Fixes to Try

### Fix 1: Rebuild Frontend

The webview might be using old code:

```bash
cd frontend
pnpm run build
cd ../vscode-extension/sqs-management-tool
pnpm run compile
```

### Fix 2: Clear Extension State

```bash
# Close VS Code
rm -rf vscode-extension/sqs-management-tool/.vscode-test
# Reopen and press F5
```

### Fix 3: Check Message Structure

Add this to webview console before clicking redrive:

```javascript
// In browser console
window.addEventListener('message', (event) => {
  console.log('Webview received:', event.data);
});
```

Then click redrive and see if response arrives.
