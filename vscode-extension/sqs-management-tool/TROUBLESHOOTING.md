# Troubleshooting Guide

## Issues Fixed

### 1. Status Bar Not Updating After Profile Selection

**Issue**: After selecting an AWS profile, the status bar still shows "⚠️ AWS: Not Configured" even though queues can be added.

**Root Cause**: When a profile is selected, credentials are loaded from the profile but not stored in SecretStorage. When the status bar update function calls `getCredentials()` without a profile parameter, it can't find the credentials.

**Fix Applied**: Modified `extension-standalone.ts` to store profile credentials in SecretStorage after loading them:

```typescript
// Use selected profile
credentials = await credentialProvider.getCredentials(selected.label);
// Store the profile credentials in SecretStorage so they persist
await credentialProvider.storeCredentials(credentials);
```

**How to Verify**:
1. Select an AWS profile
2. Status bar should immediately update to "☁️ AWS: Configured"
3. Reload VS Code window - status should remain "☁️ AWS: Configured"

### 2. Redrive Messages Timeout Error

**Issue**: When trying to redrive messages from DLQ, get error: `Uncaught (in promise) Error: Timeout waiting for redriveResult`

**Possible Causes**:
1. Extension not sending response back to webview
2. Message format mismatch between extension and webview
3. Error in redrive operation not being caught

**Debugging Steps**:

1. **Check Extension Host Output**:
   - Open: View > Output > Extension Host
   - Look for errors during redrive operation
   - Check if `redriveSelectedMessages` is being called

2. **Check Webview Console**:
   - Open: Help > Toggle Developer Tools
   - Look for errors in Console tab
   - Check Network tab for any HTTP requests (there shouldn't be any)

3. **Check Message Flow**:
   - Webview sends: `{ command: 'redriveSelectedMessages', messages: [...] }`
   - Extension should respond: `{ command: 'redriveResult', successCount: X, failureCount: Y, ... }`

**Common Issues**:

#### Issue A: Extension Not Receiving Message

**Symptoms**: No logs in Extension Host output when clicking "Redrive Selected"

**Solution**:
- Verify webview is using `api-adapter.ts` (not `api.ts`)
- Check that `window.vscode` is defined in webview
- Rebuild frontend: `cd frontend && pnpm run build`

#### Issue B: Extension Receiving But Not Responding

**Symptoms**: Extension Host shows "redriveSelectedMessages" but no response

**Solution**:
- Check for errors in the redrive operation
- Verify `sanitizeForWebview` isn't stripping required fields
- Add logging to see what's being sent back:

```typescript
console.log('Sending redriveResult:', result);
panel.webview.postMessage(sanitizeForWebview({
    command: 'redriveResult',
    ...result
}));
```

#### Issue C: Response Format Mismatch

**Symptoms**: Extension sends response but webview doesn't recognize it

**Expected Response Format**:
```typescript
{
    command: 'redriveResult',
    successCount: number,
    failureCount: number,
    processedCount: number,
    succeeded: string[],  // Array of message IDs
    failed: Array<{ messageId: string, error: string }>
}
```

**Solution**:
- Verify `RedriveResult` interface matches between extension and webview
- Check `sanitizeForWebview` isn't modifying the structure

## General Debugging Tips

### Enable Verbose Logging

Add logging to key points:

```typescript
// In extension-standalone.ts
async function handleWebviewMessage(message: any, panel: vscode.WebviewPanel, queue: QueueConfig) {
    console.log('[Extension] Received message:', message.command);
    
    // ... handle message ...
    
    console.log('[Extension] Sending response:', response);
    panel.webview.postMessage(response);
}
```

### Check Webview Bundle

Verify the webview is using the correct bundle:

```bash
# Check if bundle.js exists
ls -la vscode-extension/sqs-management-tool/media/bundle.js

# Rebuild if needed
cd frontend
pnpm run build
```

### Verify Extension Entry Point

Check `package.json`:

```json
{
  "main": "./out/extension-standalone.js"
}
```

### Test with Simple Queue First

Before testing redrive:
1. Add a simple queue (no DLQ)
2. Send a test message
3. Poll and receive the message
4. Delete the message

This verifies basic communication works.

### Check AWS Permissions

Redrive requires these permissions:
- `sqs:ReceiveMessage` (on DLQ)
- `sqs:SendMessage` (on main queue)
- `sqs:DeleteMessage` (on DLQ)

Test with AWS CLI:
```bash
# Receive from DLQ
aws sqs receive-message --queue-url <dlq-url>

# Send to main queue
aws sqs send-message --queue-url <main-queue-url> --message-body "test"

# Delete from DLQ
aws sqs delete-message --queue-url <dlq-url> --receipt-handle <handle>
```

## Next Steps

If issues persist after applying fixes:

1. **Rebuild everything**:
```bash
cd vscode-extension/sqs-management-tool
pnpm run clean  # if available
pnpm install
cd ../../frontend
pnpm install
pnpm run build
cd ../vscode-extension/sqs-management-tool
pnpm run compile
```

2. **Test in clean environment**:
   - Close all VS Code windows
   - Delete `.vscode-test` folder
   - Press F5 to launch fresh Extension Development Host

3. **Check for conflicting extensions**:
   - Disable other AWS-related extensions
   - Test with minimal extensions

4. **Report issue with details**:
   - Extension Host output logs
   - Webview console logs
   - Steps to reproduce
   - AWS region and queue configuration
