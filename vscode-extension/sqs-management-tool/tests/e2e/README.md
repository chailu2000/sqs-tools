# E2E Test Suite Documentation

## Overview

The E2E (End-to-End) test suite validates the VS Code extension's functionality in a real VS Code environment using LocalStack for AWS SQS simulation.

## Test Architecture

### Test Runner (`runTests.ts`)

The test runner uses `@vscode/test-electron` to:
1. Download and launch VS Code
2. Load the extension under development
3. Create a temporary test workspace
4. Configure environment variables for LocalStack
5. Execute the test suite

**Key Features**:
- Supports headed mode (visible VS Code window) via `HEADED=true`
- Supports CI mode with additional flags via `CI=true`
- Configures LocalStack endpoint and AWS credentials
- Sets `VSCODE_TEST_MODE=true` to disable auto-discovery

### Test Entry Point (`index.ts`)

Configures Mocha test runner and manages global setup/teardown:
- Calls `globalSetup()` before all tests
- Calls `globalTeardown()` after all tests
- Configures test timeouts and reporting
- Saves failure details to `test-results/` directory

### Global Setup (`fixtures/setup.ts`)

Manages shared test infrastructure:
- **LocalStack**: Starts and verifies SQS service availability
- **Extension Context**: Activates extension and exports test API
- **AWS Credentials**: Configures test credentials in SecretStorage
- **Queue Storage**: Provides helpers to add/remove queues directly
- **Test Helpers**: `createTestQueue()` and `cleanupTestQueue()`

## Running Tests

### Prerequisites

1. **LocalStack must be running**:
   ```bash
   docker compose -f tests/e2e/config/docker-compose.localstack.yml up -d
   ```

2. **Dependencies installed**:
   ```bash
   pnpm install
   ```

### Commands

```bash
# Run tests (headless)
pnpm run test:e2e

# Run tests with visible VS Code window
pnpm run test:e2e:headed

# Run tests in CI mode
pnpm run test:e2e:ci

# Run tests with coverage
pnpm run test:e2e:coverage

# Debug tests
pnpm run test:e2e:debug
```

### Manual Steps

```bash
# 1. Compile extension and tests
pnpm run compile
pnpm run compile:e2e

# 2. Ensure LocalStack is running
docker ps | grep localstack

# 3. Run tests
VSCODE_TEST_MODE=true node ./out/tests/e2e/runTests.js
```

## Test Results (Current State)

### Summary
- **Total Tests**: 59
- **Passing**: 55 (93%)
- **Pending**: 4 (7%)
- **Failing**: 0 (0%)

### Test Breakdown by Category

| Category | Passing | Pending | Total | Pass Rate |
|----------|---------|---------|-------|-----------|
| Webview Functionality | 8 | 0 | 8 | 100% |
| Tree View Interaction | 7 | 0 | 7 | 100% |
| Message Polling | 8 | 0 | 8 | 100% |
| Message Operations | 7 | 0 | 7 | 100% |
| DLQ Operations | 6 | 0 | 6 | 100% |
| Command Execution | 3 | 4 | 7 | 43% |
| Error Handling | 10 | 0 | 10 | 100% |
| Extension Activation | 3 | 0 | 3 | 100% |
| **Total** | **55** | **4** | **59** | **93%** |

### Passing Tests (55)

#### Webview Functionality (8/8)
- ✅ should create webview with correct title
- ✅ should display Queue Info tab on load
- ✅ should display queue attributes
- ✅ should navigate between tabs
- ✅ should enable DLQ tab when queue has DLQ configured
- ✅ should disable DLQ tab when queue has no DLQ
- ✅ should clean up resources when webview is closed
- ✅ should support multiple webview instances for different queues

#### Tree View Interaction (7/7)
- ✅ should display queues from LocalStack in tree view
- ✅ should open webview when queue is selected
- ✅ should reload queue data when refresh button is clicked
- ✅ should update tree view automatically after adding queue
- ✅ should update tree view after removing queue
- ✅ should update queue attributes in tree view
- ✅ should show empty state message when no queues configured

#### Message Polling (8/8)
- ✅ should start polling with 120-second duration
- ✅ should display progress bar during polling
- ✅ should display message count during polling
- ✅ should add messages to table during polling
- ✅ should deduplicate messages by message ID
- ✅ should halt polling immediately when stop button is clicked
- ✅ should stop polling automatically after 120 seconds
- ✅ should stop polling when switching tabs

#### Message Operations (7/7)
- ✅ should show details panel when message row is clicked
- ✅ should close details panel
- ✅ should select message with checkbox
- ✅ should select multiple messages
- ✅ should select all messages with select-all checkbox
- ✅ should show confirmation for single message deletion
- ✅ should show confirmation for bulk message deletion

#### DLQ Operations (6/6)
- ✅ should enable DLQ tab when DLQ is configured
- ✅ should disable DLQ tab when no DLQ configured
- ✅ should load DLQ messages when tab is opened
- ✅ should display redrive button with selected messages
- ✅ should redrive messages from DLQ to main queue
- ✅ should update DLQ table after redrive

#### Command Execution (3/7)
- ✅ should execute refreshQueues without errors
- ✅ should execute selectQueue with queue config parameter
- ✅ should copy queue URL to clipboard

#### Error Handling (10/10)
- ✅ should handle operations on non-existent queue
- ✅ should handle queue with invalid URL format
- ✅ should handle empty queue list gracefully
- ✅ should handle duplicate queue IDs
- ✅ should handle webview creation for valid queue
- ✅ should handle multiple webview instances
- ✅ should handle refresh command errors gracefully
- ✅ should handle copy command with valid queue
- ✅ should handle queue removal
- ✅ should handle clearing all queues

#### Extension Activation (3/3)
- ✅ should activate extension without errors
- ✅ should register all commands after activation
- ✅ should create tree view after activation

### Pending Tests (4)

These tests are **correctly skipped** as they require UI interaction that cannot be automated without complex mocking:

#### Command Execution (4/7)
- ⏭️ **addQueue** - Requires `showQuickPick` and `showInputBox` interaction
  - Would hang waiting for user to select "By Queue Name" or "By Queue URL"
  - Would hang waiting for user to enter queue name/URL and region
  
- ⏭️ **removeQueue** - Requires `showWarningMessage` confirmation
  - Would hang waiting for user to confirm "Yes" or "No"
  
- ⏭️ **exportQueues** - Requires `showSaveDialog` file picker
  - Would hang waiting for user to select file location
  
- ⏭️ **importQueues** - Requires `showOpenDialog` file picker
  - Would hang waiting for user to select file to import

**Note**: These commands are fully implemented and functional. They can be tested manually or with VS Code UI mocking libraries (not currently implemented).

## Test Patterns

### Creating Test Queues

```typescript
// Create a standard queue
const queue = await createTestQueue('my-queue');
createdQueues.push(queue);

// Create a queue with DLQ
const queueWithDLQ = await createTestQueue('my-queue', true);
createdQueues.push(queueWithDLQ);
```

### Executing Commands

```typescript
// Refresh tree view
await context.executeCommand('sqs-management-tool.refreshQueues');

// Select queue (opens webview)
await context.executeCommand('sqs-management-tool.selectQueue', queueConfig);

// Copy queue URL
const queueItem = { queue: queueConfig, label: queueConfig.name, collapsibleState: 0 };
await context.executeCommand('sqs-management-tool.copyQueueUrl', queueItem);
```

### Accessing Extension Storage

```typescript
const helper = await getExtensionHelper();

// Get all queues
const queues = await helper.getQueuesFromStorage();

// Add queue directly (bypasses UI)
await helper.addQueueToStorage(queueConfig);

// Remove queue
await helper.removeQueueFromStorage(queueId);

// Clear all queues
await helper.clearAllQueues();
```

### Waiting for Async Operations

```typescript
// Wait for webview to open
await waitFor(
    () => vscode.window.tabGroups.all.some(group =>
        group.tabs.some(tab => tab.label.includes(queueConfig.name))
    ),
    { timeout: 10000, errorMessage: 'Webview should open' }
);

// Simple delay
await new Promise(resolve => setTimeout(resolve, 2000));
```

## Test Fixtures

### LocalStack Fixture (`fixtures/localstack.ts`)
- Verifies LocalStack health endpoint
- Configures AWS SDK for LocalStack
- Provides retry logic for service availability

### Queue Fixture (`fixtures/test-data.ts`)
- Creates standard and FIFO queues
- Creates queues with DLQ configuration
- Sends test messages
- Deletes queues

### Extension Helper (`fixtures/extension-helper.ts`)
- Direct access to extension context
- Bypasses UI dialogs for queue management
- Provides storage manipulation methods

## Troubleshooting

### Tests Hanging

**Symptom**: Tests hang indefinitely without completing

**Causes**:
1. LocalStack not running
2. Extension trying to show UI dialogs (input boxes, confirmations)
3. Global setup not completing

**Solutions**:
```bash
# Check LocalStack
docker ps | grep localstack

# Restart LocalStack
docker compose -f tests/e2e/config/docker-compose.localstack.yml restart

# Clean test artifacts
./clean-tests.sh
```

### Storage Key Mismatch

**Symptom**: `SyntaxError: Unexpected end of JSON input`

**Cause**: Test code using wrong storage key

**Solution**: Always use `'queues'` key (not `'sqs-queues'`) to match `QueueStorage` service

### Extension Not Activating

**Symptom**: `Extension not activated` or `Extension context not available`

**Cause**: Extension activation failed or test API not exported

**Solution**: Check that `extension-standalone.ts` exports test API:
```typescript
return {
    context,
    queueStorage,
    credentialProvider,
    clientFactory,
    queueTreeDataProvider
};
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Start LocalStack
  run: |
    docker compose -f vscode-extension/sqs-management-tool/tests/e2e/config/docker-compose.localstack.yml up -d
    sleep 5

- name: Run E2E Tests
  run: |
    cd vscode-extension/sqs-management-tool
    pnpm run test:e2e:ci
  env:
    CI: true
```

## Future Improvements

### Potential Enhancements

1. **Mock UI Interactions**
   - Use `sinon` to mock `vscode.window.showInputBox()`
   - Use `sinon` to mock `vscode.window.showWarningMessage()`
   - Enable testing of `addQueue` and `removeQueue` commands

2. **Visual Regression Testing**
   - Capture webview screenshots
   - Compare against baseline images

3. **Performance Testing**
   - Measure command execution times
   - Track memory usage
   - Monitor LocalStack response times

4. **Property-Based Testing**
   - Add fast-check for queue configuration validation
   - Test message attribute preservation
   - Test redrive operation correctness

## Maintenance

### Adding New Tests

1. Create test file in `tests/e2e/specs/`
2. Import required fixtures and helpers
3. Use `createTestQueue()` for queue creation
4. Clean up in `afterEach()` hook
5. Compile and run: `pnpm run test:e2e`

### Updating Fixtures

1. Modify fixture in `tests/e2e/fixtures/`
2. Update TypeScript interfaces if needed
3. Recompile: `pnpm run compile:e2e`
4. Run tests to verify: `pnpm run test:e2e`

### Debugging Tests

```bash
# Run with debug flag
pnpm run test:e2e:debug

# Run in headed mode to see VS Code window
pnpm run test:e2e:headed

# Check test output
cat test-results/failure-*.txt
```

## References

- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-electron](https://github.com/microsoft/vscode-test)
- [Mocha Test Framework](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
