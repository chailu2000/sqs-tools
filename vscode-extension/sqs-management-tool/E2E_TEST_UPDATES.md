# E2E Test Updates for Standalone Extension

## Summary

Updated E2E tests to work with the standalone extension architecture. The tests now properly handle AWS credentials, queue storage, and avoid the auto-discovery prompt.

## Key Changes

### 1. Extension Changes (`src/extension-standalone.ts`)

- **Skip auto-discovery in test mode**: Added check for `VSCODE_TEST_MODE` environment variable to prevent the "Import 6 queues?" prompt during tests
- **Export test API**: Extension now returns an object with `queueStorage`, `credentialProvider`, `clientFactory`, and `queueTreeDataProvider` for test access

```typescript
// Return test API for E2E tests
return {
    queueStorage,
    credentialProvider,
    clientFactory,
    queueTreeDataProvider
};
```

### 2. Test Runner Changes (`tests/e2e/runTests.ts`)

- Added `VSCODE_TEST_MODE: 'true'` to environment variables to disable auto-discovery

### 3. Test Fixture Updates

#### `tests/e2e/fixtures/test-data.ts`
- Changed `QueueInfo` interface to `QueueConfig` to match extension's model
- Updated `createStandardQueue()` and `createQueueWithDLQ()` to return `QueueConfig` objects with all required fields
- Added `generateId()` method for creating unique queue IDs

#### `tests/e2e/fixtures/extension-helper.ts`
- Created helper to access extension's internal storage
- Provides methods to:
  - Configure test AWS credentials
  - Add/remove queues from storage
  - Get queues from storage for verification
  - Clear all queues

#### `tests/e2e/fixtures/setup.ts`
- Updated to use `QueueConfig` instead of `QueueInfo`

### 4. Test Spec Updates

#### `tests/e2e/specs/webview.test.ts`
- Updated to pass `QueueConfig` objects to `selectQueue` command instead of URLs
- Tests now create full queue configurations with all required fields

#### `tests/e2e/specs/tree-view.test.ts`
- Configure credentials BEFORE extension activation
- Clear queue storage before tests
- Add queues directly to storage (simulates user having added them via UI)
- Dismiss auto-discovery prompts

## Testing Approach

The E2E tests now follow this pattern:

1. **Setup Phase**:
   - Start LocalStack
   - Configure test AWS credentials
   - Clear queue storage
   - Activate extension (auto-discovery is skipped in test mode)

2. **Test Execution**:
   - Create queues in LocalStack using `QueueFixture`
   - Add queues to extension storage using `ExtensionHelper`
   - Execute commands and verify behavior
   - Check storage state for verification

3. **Cleanup Phase**:
   - Delete queues from LocalStack
   - Stop LocalStack
   - Dispose extension context

## Why This Approach?

### E2E vs Unit Testing Trade-offs

**True E2E would**:
- Automate clicking UI buttons
- Fill in input dialogs programmatically
- Test the complete user interaction flow

**Current approach**:
- Tests extension in real VS Code environment ✓
- Tests AWS integration with LocalStack ✓
- Tests queue storage and retrieval ✓
- Tests webview creation and commands ✓
- Simulates post-UI-interaction state (queues in storage)

**Rationale**:
- VS Code's input dialogs (`showInputBox`, `showQuickPick`) are modal and block execution
- Automating these dialogs requires complex mocking or UI automation frameworks
- The current approach tests the same code paths and state, just bypasses the input collection step
- This is a common pattern in VS Code extension testing

## Running Tests

```bash
# Headless mode
pnpm run test:e2e

# Headed mode (see the extension UI)
pnpm run test:e2e:headed
```

## Next Steps

To make tests more E2E-like, consider:

1. **Mock input dialogs**: Override `vscode.window.showInputBox` and `vscode.window.showQuickPick` to auto-respond
2. **Test auto-discovery flow**: Remove `VSCODE_TEST_MODE` check and test the "Import queues?" prompt handling
3. **Add UI automation**: Use tools like Playwright to actually click buttons and fill forms

For now, the tests provide good coverage of the extension's functionality while remaining maintainable and fast.
