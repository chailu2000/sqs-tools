# Testing the Svelte Bundle Extension

## Prerequisites

1. Backend server running on `http://localhost:8080`
2. AWS credentials configured
3. At least one SQS queue configured in the backend

## How to Test

### 1. Launch Extension Development Host

In VS Code:
1. Open the `vscode-extension/sqs-management-tool` folder
2. Press `F5` to launch Extension Development Host
3. A new VS Code window will open with the extension loaded

### 2. Open SQS Management Tool

In the Extension Development Host window:
1. Click the Explorer icon in the Activity Bar (left sidebar)
2. Look for "SQS QUEUES" section
3. You should see your configured queues listed

### 3. Select a Queue

1. Click on any queue in the tree view
2. A new webview panel should open showing the Svelte app
3. The Queue Info tab should be active by default

## Test Cases

### Queue Info Tab
- [ ] Queue name displays in header
- [ ] Queue attributes display (Messages Available, In Flight, etc.)
- [ ] Refresh button shows tooltip message
- [ ] Purge button shows confirmation dialog
- [ ] Dark mode styles work

### Main Queue Tab
- [ ] Tab shows message count badge
- [ ] Poll button starts 120s polling with progress bar
- [ ] Progress bar shows percentage and message count
- [ ] Stop button appears during polling
- [ ] Messages appear in table with checkboxes
- [ ] Clicking row opens message details panel below table
- [ ] Clicking checkbox selects message and shows bulk actions bar
- [ ] Delete icon shows confirmation dialog
- [ ] Bulk delete works for selected messages
- [ ] Pagination appears when > 10 messages
- [ ] Switching tabs stops polling silently

### DLQ Tab (if queue has DLQ)
- [ ] Tab is enabled and shows DLQ message count
- [ ] Messages load from DLQ
- [ ] Selecting messages shows "Redrive Selected" button
- [ ] Redrive moves messages from DLQ to main queue
- [ ] Success/failure messages display correctly

### Message Details Panel
- [ ] Opens when clicking table row (not checkbox)
- [ ] Shows message ID, receipt handle, attributes
- [ ] Shows full message body
- [ ] Close button (×) closes the panel
- [ ] Selecting different row updates the panel

### Polling Behavior
- [ ] Polls for 120 seconds
- [ ] Shows real-time progress (0-100%)
- [ ] Deduplicates messages by ID
- [ ] Updates table in real-time as messages arrive
- [ ] Shows "X found so far" count
- [ ] Stops automatically after 120s
- [ ] Can be stopped manually with Stop button
- [ ] Stops silently when switching tabs

### Bulk Operations
- [ ] Select all checkbox in header works
- [ ] Bulk actions bar shows selected count
- [ ] Delete selected shows confirmation
- [ ] Clear selection button works
- [ ] Selection persists across pages

## Known Limitations

1. **Refresh Button** - Shows message to close/reopen queue view (no live refresh)
2. **Queue Attributes** - Not updated in real-time (close/reopen to refresh)
3. **DLQ Detection** - Based on queue configuration from backend

## Debugging

### Check Console Logs

In Extension Development Host:
1. Help → Toggle Developer Tools
2. Check Console tab for errors
3. Look for polling logs: "=== POLL STARTED ===", etc.

### Check Extension Host Logs

In the main VS Code window (not Extension Development Host):
1. View → Output
2. Select "Extension Host" from dropdown
3. Look for extension activation and API call logs

### Common Issues

**Webview doesn't open:**
- Check that backend is running
- Check Extension Host logs for errors
- Verify queue is configured in backend

**Messages don't load:**
- Check browser console for postMessage errors
- Verify API calls in Extension Host logs
- Check AWS credentials

**Polling doesn't work:**
- Check console for "POLL STARTED" logs
- Verify waitTimeSeconds is set correctly
- Check for JavaScript errors in console

**Styles look wrong:**
- Check that CSS file was built: `vscode-extension/sqs-management-tool/media/sqs-management-tool-frontend.css`
- Verify CSP allows styles from webview.cspSource
- Check dark mode preference in VS Code

## Rebuilding After Changes

### Frontend Changes

```bash
cd frontend
npm run build:extension
```

### Extension Changes

```bash
cd vscode-extension/sqs-management-tool
npm run compile
```

Then reload the Extension Development Host window (Cmd+R or Ctrl+R).

## Success Criteria

The extension is working correctly if:
1. Queue selection opens webview with Svelte app
2. All three tabs work (Queue Info, Main Queue, DLQ)
3. Polling shows progress and accumulates messages
4. Message table with checkboxes and bulk actions works
5. Message details panel opens on row click
6. Delete and redrive operations work
7. No console errors
8. Dark mode styles work
