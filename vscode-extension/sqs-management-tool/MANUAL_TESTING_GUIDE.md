# Manual Testing Guide - Standalone Extension

This guide walks you through manually testing the standalone VS Code extension with real AWS credentials.

## Prerequisites

1. **AWS Profile configured** - You should have AWS profiles set up in `~/.aws/credentials` or `~/.aws/config`
2. **SQS Queues** - Have at least one SQS queue in your AWS account (or create one for testing)
3. **VS Code** - Latest version installed

## Setup

### 1. Build the Extension

```bash
cd vscode-extension/sqs-management-tool
pnpm install
pnpm run compile
```

### 2. Launch Extension Development Host

There are two ways to test:

#### Option A: Using VS Code Debug (Recommended)

1. Open the `vscode-extension/sqs-management-tool` folder in VS Code
2. Press `F5` or go to Run > Start Debugging
3. This will open a new VS Code window with the extension loaded

#### Option B: Package and Install

```bash
# Package the extension
pnpm run package  # or: vsce package

# Install the .vsix file
# In VS Code: Extensions > ... > Install from VSIX
```

## Testing Scenarios

### Scenario 1: First-Time Setup (AWS Profile Selection)

**Goal**: Test AWS credential configuration flow

1. **Open Extension Development Host** (F5)
2. **Check Status Bar** - You should see `⚠️ AWS: Not Configured` in the bottom-right
3. **Click the AWS status bar item** or run command `SQS: Select AWS Profile`
4. **Select your AWS profile** from the list
5. **Verify**: Status bar should change to `☁️ AWS: Configured`

**Expected Behavior**:
- Status bar updates immediately
- No errors in Output > Extension Host

### Scenario 2: Auto-Discovery of Queues

**Goal**: Test automatic queue discovery (if you have ListQueues permission)

1. **After configuring AWS profile**, wait a few seconds
2. **Check for prompt**: "Found X queue(s). Would you like to import them?"
3. **Click "Import All"**
4. **Open SQS Management view** in the Activity Bar (left sidebar)
5. **Verify**: Queues appear in the tree view

**Expected Behavior**:
- Queues are discovered automatically
- Each queue shows name and region
- Tree view is populated

**If no prompt appears**:
- You might not have ListQueues permission
- Or you have no queues in the default region (us-east-1)
- This is fine - proceed to manual queue addition

### Scenario 3: Manually Add Queue by Name

**Goal**: Test adding a queue using its name

1. **Click the `+` button** in the SQS Management view
2. **Select "By Queue Name"**
3. **Enter queue name** (e.g., `my-test-queue`)
4. **Enter AWS region** (e.g., `us-east-1`)
5. **Verify**: Queue appears in tree view

**Expected Behavior**:
- Queue is added to tree view
- Shows queue name and region
- No errors

**Troubleshooting**:
- If error "Queue not found": Check queue name and region are correct
- If error "Access denied": Check your AWS profile has `sqs:GetQueueUrl` permission

### Scenario 4: Manually Add Queue by URL

**Goal**: Test adding a queue using its full URL

1. **Click the `+` button** in the SQS Management view
2. **Select "By Queue URL"**
3. **Enter full queue URL** (e.g., `https://sqs.us-east-1.amazonaws.com/123456789012/my-queue`)
4. **Verify**: Queue appears in tree view

**Expected Behavior**:
- Queue is added to tree view
- Region is extracted from URL automatically
- Queue attributes are fetched

### Scenario 5: Open Queue Webview

**Goal**: Test opening the queue management interface

1. **Click on a queue** in the tree view
2. **Verify**: Webview opens with queue details
3. **Check tabs**: Queue Info, Main Queue, DLQ (if configured)

**Expected Behavior**:
- Webview opens in editor area
- Title shows "SQS: [queue-name]"
- Queue Info tab shows attributes (message count, retention period, etc.)

**Troubleshooting**:
- If webview is blank: Check browser console (Help > Toggle Developer Tools)
- If "bundle.js not found": Run `pnpm run compile` again

### Scenario 6: Receive Messages

**Goal**: Test polling messages from a queue

1. **Open a queue** (click in tree view)
2. **Switch to "Main Queue" tab**
3. **Click "Start Polling"** button
4. **Wait for messages** to appear (if queue has messages)
5. **Verify**: Messages appear in table with ID, body, timestamp

**Expected Behavior**:
- Polling starts (progress bar shows)
- Messages appear in table
- Can click message row to see details

**If no messages**:
- Queue might be empty
- Try sending a test message first (see Scenario 7)

### Scenario 7: Send Message

**Goal**: Test sending a message to a queue

1. **Open a queue**
2. **Switch to "Main Queue" tab**
3. **Click "Send Message"** button
4. **Enter message body** (e.g., `{"test": "message"}`)
5. **Click "Send"**
6. **Verify**: Success notification appears

**Expected Behavior**:
- Message is sent successfully
- Notification: "Message sent successfully"
- Can poll to see the message appear

### Scenario 8: Delete Message

**Goal**: Test deleting a message from a queue

1. **Poll messages** (see Scenario 6)
2. **Select a message** (checkbox)
3. **Click "Delete Selected"** button
4. **Confirm deletion**
5. **Verify**: Message disappears from table

**Expected Behavior**:
- Confirmation dialog appears
- Message is deleted from SQS
- Table updates automatically

### Scenario 9: DLQ Operations (if you have a queue with DLQ)

**Goal**: Test Dead Letter Queue functionality

1. **Open a queue that has a DLQ configured**
2. **Verify**: "DLQ" tab is enabled
3. **Switch to "DLQ" tab**
4. **Click "Load Messages"**
5. **Select messages** to redrive
6. **Click "Redrive Selected"**
7. **Verify**: Messages move from DLQ to main queue

**Expected Behavior**:
- DLQ tab is only enabled for queues with DLQ
- Can view DLQ messages
- Can redrive messages back to main queue

### Scenario 10: Refresh Queues

**Goal**: Test refreshing the queue list

1. **Click refresh button** in SQS Management view (circular arrow icon)
2. **Verify**: Tree view updates
3. **Check**: Any new queues appear, deleted queues disappear

**Expected Behavior**:
- Tree view refreshes
- Queue attributes are updated

### Scenario 11: Remove Queue

**Goal**: Test removing a queue from the extension

1. **Right-click a queue** in tree view
2. **Select "Remove Queue"**
3. **Confirm removal**
4. **Verify**: Queue disappears from tree view

**Expected Behavior**:
- Confirmation dialog appears
- Queue is removed from extension (NOT deleted from AWS)
- Tree view updates

**Note**: This only removes the queue from the extension's list, it does NOT delete the queue from AWS.

### Scenario 12: Multiple Queues

**Goal**: Test managing multiple queues

1. **Add 2-3 queues** from different regions
2. **Open multiple queue webviews** (click different queues)
3. **Verify**: Each webview shows correct queue
4. **Switch between tabs**
5. **Verify**: Each tab maintains its state

**Expected Behavior**:
- Can have multiple queue webviews open
- Each webview is independent
- Switching tabs doesn't lose state

## Common Issues and Solutions

### Issue: "AWS: Not Configured" won't change

**Solution**:
- Check AWS credentials file exists: `~/.aws/credentials`
- Verify profile name is correct
- Try entering credentials manually (select "Enter credentials manually" option)

### Issue: "Queue not found" error

**Solution**:
- Verify queue name is exact (case-sensitive)
- Check region is correct
- Ensure queue exists in AWS Console

### Issue: "Access Denied" errors

**Solution**:
- Check IAM permissions for your AWS profile
- Required permissions:
  - `sqs:GetQueueUrl` (for adding by name)
  - `sqs:GetQueueAttributes` (for queue details)
  - `sqs:ReceiveMessage` (for polling)
  - `sqs:SendMessage` (for sending)
  - `sqs:DeleteMessage` (for deleting)
  - `sqs:ListQueues` (for auto-discovery, optional)

### Issue: Webview is blank

**Solution**:
- Open Developer Tools: Help > Toggle Developer Tools
- Check Console for errors
- Verify `media/bundle.js` exists
- Try rebuilding: `pnpm run compile`

### Issue: Extension not loading

**Solution**:
- Check Output > Extension Host for errors
- Verify `package.json` has correct `main` entry: `"./out/extension-standalone.js"`
- Rebuild: `pnpm run compile`

## Verifying Standalone Architecture

To confirm the extension is truly standalone (not using the backend):

1. **Check no backend is running**: `docker ps` should NOT show Spring Boot container
2. **Check network requests**: Open Developer Tools > Network tab
   - Should see NO requests to `localhost:8080`
   - Should see requests to AWS SQS endpoints (e.g., `sqs.us-east-1.amazonaws.com`)
3. **Check logs**: Output > Extension Host should show "Standalone" in activation message

## Testing Checklist

- [ ] AWS profile selection works
- [ ] Status bar updates correctly
- [ ] Auto-discovery prompts (if applicable)
- [ ] Add queue by name
- [ ] Add queue by URL
- [ ] Queue appears in tree view
- [ ] Open queue webview
- [ ] View queue attributes
- [ ] Poll messages
- [ ] Send message
- [ ] Delete message
- [ ] DLQ tab enabled/disabled correctly
- [ ] Redrive messages from DLQ
- [ ] Refresh queue list
- [ ] Remove queue from extension
- [ ] Multiple queues work independently
- [ ] No backend requests (verify in Network tab)

## Next Steps

After manual testing, consider:

1. **Test with different AWS profiles** - Switch between profiles
2. **Test with different regions** - Add queues from multiple regions
3. **Test error scenarios** - Invalid queue names, wrong regions, etc.
4. **Test with large messages** - Send messages near 256KB limit
5. **Test with FIFO queues** - If you have FIFO queues

## Feedback

If you encounter any issues during testing, check:
- Output > Extension Host (for extension logs)
- Developer Tools > Console (for webview errors)
- `~/.kiro/logs/` (if logging is enabled)

Report issues with:
- Steps to reproduce
- Expected vs actual behavior
- Error messages
- Screenshots (if applicable)
