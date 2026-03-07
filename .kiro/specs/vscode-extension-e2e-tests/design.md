# Design Document: VS Code Extension E2E Tests

## Overview

This design document specifies the architecture and implementation approach for comprehensive end-to-end (E2E) testing of the VS Code SQS Management Tool extension. The E2E test suite will use @vscode/test-electron to execute tests in a real VS Code environment, LocalStack for AWS service mocking, and a page object pattern for maintainable webview interactions.

The test suite addresses the current gap in automated testing by providing:
- Extension activation and lifecycle verification
- Command execution and tree view interaction testing
- Webview functionality testing with postMessage communication
- Message operations (polling, selection, deletion, redrive)
- Error handling and edge case coverage
- CI/CD integration with coverage reporting

### Key Design Goals

1. **Real Environment Testing**: Tests run in actual VS Code Extension Host, not mocked
2. **AWS Independence**: LocalStack provides isolated AWS environment without real credentials
3. **Maintainability**: Page objects and fixtures reduce duplication and improve readability
4. **CI/CD Ready**: Headless execution, artifact collection, and parallel test support
5. **Fast Feedback**: Complete test suite runs in under 10 minutes
6. **Reliability**: Explicit waits, test isolation, and retry logic prevent flaky tests

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Runner Process                      │
│  (@vscode/test-electron + @vscode/test-cli)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Launches
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              VS Code Extension Host (Isolated)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         SQS Management Tool Extension                 │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │  Commands  │  │  Tree View   │  │  Webviews   │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────┘  │  │
│  │         │                │                 │          │  │
│  │         └────────────────┴─────────────────┘          │  │
│  │                          │                             │  │
│  │                          ▼                             │  │
│  │                   ┌──────────────┐                    │  │
│  │                   │  SQS Service │                    │  │
│  │                   └──────────────┘                    │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              │ AWS SDK Calls
                              ▼
                    ┌──────────────────┐
                    │    LocalStack    │
                    │  (SQS Emulator)  │
                    └──────────────────┘
                              ▲
                              │
                    ┌─────────┴─────────┐
                    │  Test Fixtures    │
                    │  (Setup/Teardown) │
                    └───────────────────┘
```

### Component Interaction Flow

```
Test Suite → Test Runner → VS Code Instance → Extension → LocalStack
     │            │              │                │            │
     │            │              │                │            │
     ├─ Setup ────┼──────────────┼────────────────┼────────────┤
     │  Fixtures  │              │                │   Create   │
     │            │              │                │   Queues   │
     │            │              │                │            │
     ├─ Execute ──┼─ Launch ─────┼─ Activate ─────┼─ Connect ──┤
     │  Tests     │   Extension  │   Extension    │   to SQS   │
     │            │   Host       │                │            │
     │            │              │                │            │
     ├─ Interact ─┼──────────────┼─ Commands ─────┼─ API ──────┤
     │  with UI   │              │   Tree View    │   Calls    │
     │            │              │   Webviews     │            │
     │            │              │                │            │
     └─ Teardown ─┼──────────────┼────────────────┼─ Cleanup ──┘
        Cleanup   │              │                │   Resources│
```

### Test Execution Lifecycle

1. **Pre-Test Setup**
   - Start LocalStack container
   - Create test queues with various configurations
   - Configure AWS credentials to point to LocalStack
   - Prepare test workspace directory

2. **Test Execution**
   - Launch VS Code Extension Host with test workspace
   - Activate extension and wait for initialization
   - Execute test scenarios (commands, UI interactions, etc.)
   - Verify expected outcomes using assertions

3. **Post-Test Cleanup**
   - Close webviews and dispose resources
   - Clean up test workspace
   - Stop LocalStack container
   - Collect artifacts (screenshots, logs) on failure

## Components and Interfaces

### Test Runner Configuration

**File**: `tests/e2e/runTests.ts`

```typescript
interface TestRunnerConfig {
  vscodeExecutablePath: string;      // Path to VS Code binary
  extensionDevelopmentPath: string;  // Path to extension root
  extensionTestsPath: string;        // Path to test entry point
  launchArgs: string[];              // VS Code launch arguments
  extensionTestsEnv: Record<string, string>; // Environment variables
}
```

**Responsibilities**:
- Download and cache VS Code binary for testing
- Launch VS Code with extension loaded
- Configure test environment (headless mode, workspace path)
- Handle test execution lifecycle
- Collect and report test results

**Key Configuration**:
```typescript
{
  launchArgs: [
    '--disable-extensions',        // Disable other extensions
    '--disable-gpu',               // Disable GPU for headless
    '--no-sandbox',                // Required for CI environments
    testWorkspacePath              // Isolated test workspace
  ],
  extensionTestsEnv: {
    AWS_ENDPOINT_URL: 'http://localhost:4566',
    AWS_ACCESS_KEY_ID: 'test',
    AWS_SECRET_ACCESS_KEY: 'test',
    AWS_REGION: 'us-east-1'
  }
}
```

### LocalStack Integration

**File**: `tests/e2e/fixtures/localstack.ts`

```typescript
interface LocalStackConfig {
  services: string[];           // ['sqs']
  port: number;                 // 4566
  hostname: string;             // 'localhost'
  startTimeout: number;         // 60000 (60 seconds)
}

interface LocalStackFixture {
  start(): Promise<void>;
  stop(): Promise<void>;
  isReady(): Promise<boolean>;
  getEndpoint(): string;
  createQueue(name: string, attributes?: QueueAttributes): Promise<string>;
  deleteQueue(queueUrl: string): Promise<void>;
  sendMessage(queueUrl: string, body: string, attributes?: MessageAttributes): Promise<void>;
  purgeQueue(queueUrl: string): Promise<void>;
}
```

**Implementation Approach**:
- Use Docker SDK or docker-compose to manage LocalStack container
- Wait for health check endpoint to return ready status
- Configure AWS SDK clients to use LocalStack endpoint
- Provide helper methods for common queue operations

**Queue Creation Helper**:
```typescript
async createTestQueue(options: {
  name: string;
  visibilityTimeout?: number;
  messageRetentionPeriod?: number;
  hasDLQ?: boolean;
  maxReceiveCount?: number;
}): Promise<{ queueUrl: string; dlqUrl?: string }> {
  // Create DLQ if requested
  let dlqUrl: string | undefined;
  if (options.hasDLQ) {
    dlqUrl = await this.createQueue(`${options.name}-dlq`);
  }
  
  // Create main queue with attributes
  const attributes: QueueAttributes = {
    VisibilityTimeout: options.visibilityTimeout?.toString() || '30',
    MessageRetentionPeriod: options.messageRetentionPeriod?.toString() || '345600',
  };
  
  if (dlqUrl && options.maxReceiveCount) {
    const dlqArn = await this.getQueueArn(dlqUrl);
    attributes.RedrivePolicy = JSON.stringify({
      deadLetterTargetArn: dlqArn,
      maxReceiveCount: options.maxReceiveCount
    });
  }
  
  const queueUrl = await this.createQueue(options.name, attributes);
  return { queueUrl, dlqUrl };
}
```

### Extension Test Context

**File**: `tests/e2e/fixtures/extension-context.ts`

```typescript
interface ExtensionTestContext {
  // VS Code API access
  vscode: typeof import('vscode');
  
  // Extension instance
  extension: vscode.Extension<any>;
  
  // Helper methods
  activateExtension(): Promise<void>;
  executeCommand<T>(command: string, ...args: any[]): Promise<T>;
  getTreeView(): vscode.TreeView<any>;
  getTreeItems(): Promise<vscode.TreeItem[]>;
  openWebview(queueUrl: string): Promise<WebviewHandle>;
  waitForCondition(predicate: () => boolean | Promise<boolean>, timeout: number): Promise<void>;
  
  // Cleanup
  dispose(): Promise<void>;
}
```

**Usage Pattern**:
```typescript
test('should activate extension and register commands', async () => {
  const context = await createExtensionContext();
  
  await context.activateExtension();
  
  const commands = await vscode.commands.getCommands();
  expect(commands).toContain('sqs-management-tool.refreshQueues');
  expect(commands).toContain('sqs-management-tool.selectQueue');
  
  await context.dispose();
});
```

### Webview Page Object

**File**: `tests/e2e/pages/QueueWebviewPage.ts`

```typescript
interface WebviewHandle {
  panel: vscode.WebviewPanel;
  postMessage(message: any): Promise<void>;
  waitForMessage(command: string, timeout?: number): Promise<any>;
  dispose(): void;
}

class QueueWebviewPage {
  constructor(private handle: WebviewHandle) {}
  
  // Tab navigation
  async switchToMainQueueTab(): Promise<void>;
  async switchToDLQTab(): Promise<void>;
  async switchToQueueInfoTab(): Promise<void>;
  
  // Polling operations
  async startPolling(): Promise<void>;
  async stopPolling(): Promise<void>;
  async waitForPollingComplete(timeout?: number): Promise<void>;
  async getPollingProgress(): Promise<{ percentage: number; messageCount: number }>;
  
  // Message operations
  async getMessages(): Promise<Message[]>;
  async selectMessage(messageId: string): Promise<void>;
  async selectAllMessages(): Promise<void>;
  async deleteSelectedMessages(): Promise<void>;
  async getMessageDetails(messageId: string): Promise<MessageDetails>;
  
  // DLQ operations
  async getDLQMessages(): Promise<Message[]>;
  async redriveSelectedMessages(): Promise<void>;
  
  // Assertions
  async assertMessageCount(expected: number): Promise<void>;
  async assertTabEnabled(tab: 'main' | 'dlq' | 'info'): Promise<void>;
  async assertPollingActive(): Promise<void>;
}
```

**PostMessage Communication**:
```typescript
// Send command to webview and wait for response
async postMessage(message: any): Promise<void> {
  return this.handle.panel.webview.postMessage(message);
}

// Wait for specific message from webview
async waitForMessage(command: string, timeout = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for message: ${command}`));
    }, timeout);
    
    const disposable = this.handle.panel.webview.onDidReceiveMessage(msg => {
      if (msg.command === command) {
        clearTimeout(timer);
        disposable.dispose();
        resolve(msg);
      }
    });
  });
}
```

### Test Fixtures

**File**: `tests/e2e/fixtures/test-data.ts`

```typescript
interface TestDataGenerator {
  // Queue generation
  generateQueueName(prefix?: string): string;
  generateQueueAttributes(): QueueAttributes;
  
  // Message generation
  generateMessage(options?: {
    body?: string;
    attributes?: Record<string, string>;
    size?: 'small' | 'medium' | 'large';
  }): TestMessage;
  
  generateMessages(count: number): TestMessage[];
  
  // Random data
  randomString(length: number): string;
  randomNumber(min: number, max: number): number;
  randomBoolean(): boolean;
}

interface TestMessage {
  body: string;
  attributes?: Record<string, string>;
  messageAttributes?: Record<string, MessageAttributeValue>;
}
```

**File**: `tests/e2e/fixtures/setup.ts`

```typescript
interface TestSetup {
  localstack: LocalStackFixture;
  context: ExtensionTestContext;
  queues: Map<string, QueueInfo>;
  
  // Setup helpers
  createQueueWithMessages(options: {
    queueName: string;
    messageCount: number;
    hasDLQ?: boolean;
  }): Promise<QueueInfo>;
  
  configureExtension(config: ExtensionConfig): Promise<void>;
  
  // Cleanup
  cleanup(): Promise<void>;
}

// Global setup/teardown
export async function globalSetup(): Promise<TestSetup> {
  const localstack = new LocalStackFixture();
  await localstack.start();
  
  const context = await createExtensionContext();
  await context.activateExtension();
  
  return { localstack, context, queues: new Map() };
}

export async function globalTeardown(setup: TestSetup): Promise<void> {
  await setup.context.dispose();
  await setup.localstack.stop();
}
```

### Test Utilities

**File**: `tests/e2e/utils/wait.ts`

```typescript
interface WaitOptions {
  timeout?: number;
  interval?: number;
  errorMessage?: string;
}

// Wait for condition to be true
export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, errorMessage = 'Timeout waiting for condition' } = options;
  
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await predicate()) {
      return;
    }
    await sleep(interval);
  }
  throw new Error(errorMessage);
}

// Wait for element to be visible in webview
export async function waitForElement(
  page: QueueWebviewPage,
  selector: string,
  options: WaitOptions = {}
): Promise<void> {
  await waitFor(async () => {
    const result = await page.handle.postMessage({
      command: 'elementExists',
      selector
    });
    return result.exists;
  }, options);
}
```

**File**: `tests/e2e/utils/assertions.ts`

```typescript
// Custom assertions for extension testing
export async function assertCommandExists(commandId: string): Promise<void> {
  const commands = await vscode.commands.getCommands();
  if (!commands.includes(commandId)) {
    throw new Error(`Command not found: ${commandId}`);
  }
}

export async function assertTreeItemExists(
  context: ExtensionTestContext,
  label: string
): Promise<void> {
  const items = await context.getTreeItems();
  const found = items.some(item => item.label === label);
  if (!found) {
    throw new Error(`Tree item not found: ${label}`);
  }
}

export async function assertWebviewTitle(
  handle: WebviewHandle,
  expectedTitle: string
): Promise<void> {
  if (handle.panel.title !== expectedTitle) {
    throw new Error(`Expected title "${expectedTitle}", got "${handle.panel.title}"`);
  }
}
```

## Data Models

### Test Configuration

```typescript
interface E2ETestConfig {
  // LocalStack configuration
  localstack: {
    enabled: boolean;
    port: number;
    services: string[];
    startTimeout: number;
  };
  
  // VS Code configuration
  vscode: {
    version: string;           // 'stable' | 'insiders' | specific version
    headless: boolean;
    launchArgs: string[];
  };
  
  // Test execution configuration
  execution: {
    timeout: number;           // Global test timeout
    retries: number;           // Number of retries for flaky tests
    parallel: boolean;         // Enable parallel execution
    bail: boolean;             // Stop on first failure
  };
  
  // Coverage configuration
  coverage: {
    enabled: boolean;
    threshold: {
      lines: number;
      branches: number;
      functions: number;
      statements: number;
    };
    exclude: string[];         // Patterns to exclude from coverage
  };
  
  // Artifact collection
  artifacts: {
    screenshots: boolean;
    logs: boolean;
    videos: boolean;
    outputDir: string;
  };
}
```

### Queue Information Model

```typescript
interface QueueInfo {
  name: string;
  url: string;
  arn: string;
  attributes: {
    visibilityTimeout: number;
    messageRetentionPeriod: number;
    maxMessageSize: number;
    delaySeconds: number;
    receiveMessageWaitTimeSeconds: number;
  };
  dlq?: {
    url: string;
    arn: string;
    maxReceiveCount: number;
  };
  tags?: Record<string, string>;
}
```

### Message Model

```typescript
interface TestMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes: {
    sentTimestamp: string;
    approximateReceiveCount: string;
    approximateFirstReceiveTimestamp: string;
  };
  messageAttributes?: Record<string, {
    dataType: string;
    stringValue?: string;
    binaryValue?: Buffer;
  }>;
}
```

### Test Result Model

```typescript
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: {
    message: string;
    stack: string;
  };
  artifacts?: {
    screenshot?: string;
    logs?: string[];
    video?: string;
  };
}

interface TestSuiteResult {
  name: string;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}
```


## Test Organization Structure

### Directory Layout

```
vscode-extension/sqs-management-tool/
├── tests/
│   ├── unit/                          # Existing unit tests
│   │   └── ...
│   └── e2e/                           # New E2E tests
│       ├── specs/                     # Test specifications
│       │   ├── activation.test.ts
│       │   ├── commands.test.ts
│       │   ├── tree-view.test.ts
│       │   ├── webview.test.ts
│       │   ├── message-operations.test.ts
│       │   ├── dlq-operations.test.ts
│       │   └── error-handling.test.ts
│       ├── pages/                     # Page objects
│       │   ├── QueueWebviewPage.ts
│       │   ├── TreeViewPage.ts
│       │   └── CommandPalettePage.ts
│       ├── fixtures/                  # Test fixtures
│       │   ├── localstack.ts
│       │   ├── extension-context.ts
│       │   ├── test-data.ts
│       │   └── setup.ts
│       ├── utils/                     # Test utilities
│       │   ├── wait.ts
│       │   ├── assertions.ts
│       │   ├── screenshot.ts
│       │   └── logger.ts
│       ├── config/                    # Test configuration
│       │   ├── test.config.ts
│       │   └── localstack.config.ts
│       ├── runTests.ts                # Test runner entry point
│       └── index.ts                   # Test suite entry point
├── .vscode/
│   └── launch.json                    # Debug configuration for E2E tests
├── package.json                       # Add E2E test scripts
└── tsconfig.test.json                 # TypeScript config for tests
```

### Test File Naming Conventions

- Test files: `*.test.ts` or `*.spec.ts`
- Page objects: `*Page.ts`
- Fixtures: Descriptive names without suffix (e.g., `localstack.ts`, `setup.ts`)
- Utilities: Descriptive names without suffix (e.g., `wait.ts`, `assertions.ts`)

### Test Suite Organization

Each test file focuses on a specific feature area:

**activation.test.ts**: Extension activation and initialization
- Extension loads without errors
- Commands are registered
- Tree view is created
- Status bar items appear

**commands.test.ts**: Command execution
- Refresh queues command
- Add/remove queue commands
- Select AWS profile command
- Export/import queues commands
- Copy queue URL command

**tree-view.test.ts**: Tree view interactions
- Queue list display
- Queue selection
- Refresh behavior
- Context menu actions
- Empty state handling

**webview.test.ts**: Webview functionality
- Webview creation and disposal
- Tab navigation
- Queue info display
- PostMessage communication
- Multiple webview instances

**message-operations.test.ts**: Message operations
- Message polling
- Message selection
- Message deletion
- Message details display
- Bulk operations

**dlq-operations.test.ts**: Dead letter queue operations
- DLQ tab enablement
- DLQ message loading
- Message redrive
- DLQ message count display

**error-handling.test.ts**: Error scenarios
- LocalStack unavailable
- Invalid queue URLs
- Network failures
- Missing queues
- Authentication errors

## Key Design Decisions

### 1. Real VS Code vs Mocked Environment

**Decision**: Use real VS Code Extension Host via @vscode/test-electron

**Rationale**:
- Provides highest confidence that extension works in actual environment
- Tests real webview rendering, postMessage communication, and VS Code API behavior
- Catches integration issues that mocks would miss
- Industry standard for VS Code extension testing

**Trade-offs**:
- Slower than unit tests (but still under 10 minutes for full suite)
- Requires more setup (downloading VS Code binary, managing workspaces)
- More complex debugging (need to attach to Extension Host process)

### 2. LocalStack vs Real AWS

**Decision**: Use LocalStack for AWS service mocking

**Rationale**:
- No AWS credentials required for testing
- Fast and deterministic (no network latency or rate limits)
- Complete isolation (tests don't affect production resources)
- Cost-free (no AWS charges for test execution)
- Supports all SQS operations needed for testing

**Trade-offs**:
- LocalStack behavior may differ slightly from real AWS
- Requires Docker to be installed and running
- Additional setup complexity in CI/CD pipelines

### 3. Page Object Pattern vs Direct Webview Access

**Decision**: Use page object pattern for webview interactions

**Rationale**:
- Encapsulates webview communication logic in reusable classes
- Provides clear API for test authors (e.g., `page.startPolling()`)
- Reduces duplication across test files
- Makes tests more readable and maintainable
- Isolates tests from webview implementation changes

**Trade-offs**:
- Additional abstraction layer to maintain
- Requires upfront design of page object API

### 4. Test Framework: Mocha vs Jest

**Decision**: Use Mocha (comes with @vscode/test-electron)

**Rationale**:
- Native integration with @vscode/test-electron
- Widely used in VS Code extension ecosystem
- Supports async/await naturally
- Good error reporting and test organization

**Trade-offs**:
- Different from existing Jest unit tests (but both can coexist)
- Requires separate assertion library (use Chai or Node assert)

### 5. Parallel vs Sequential Test Execution

**Decision**: Support both, default to sequential for reliability

**Rationale**:
- Sequential execution is more reliable (no resource contention)
- Parallel execution can be enabled for independent test suites
- LocalStack can handle concurrent requests
- VS Code instances can be isolated with separate workspaces

**Configuration**:
```typescript
// Sequential (default)
mocha.run();

// Parallel (opt-in for specific suites)
mocha.parallel().run();
```

### 6. Webview Testing Approach

**Decision**: Use postMessage-based communication with message interception

**Rationale**:
- Webviews are sandboxed; cannot directly access DOM
- PostMessage is the official VS Code webview communication mechanism
- Can inject test helpers into webview via script injection
- Matches production communication pattern

**Implementation**:
```typescript
// Inject test helper into webview
const testHelperScript = `
  window.__test__ = {
    getElementText: (selector) => document.querySelector(selector)?.textContent,
    clickElement: (selector) => document.querySelector(selector)?.click(),
    isElementVisible: (selector) => {
      const el = document.querySelector(selector);
      return el && el.offsetParent !== null;
    }
  };
`;

// Use in tests
await page.handle.postMessage({ command: 'eval', script: testHelperScript });
const text = await page.handle.waitForMessage('evalResult');
```

### 7. Test Data Management

**Decision**: Generate test data dynamically with unique identifiers

**Rationale**:
- Prevents test conflicts from reusing same queue names
- Allows parallel test execution
- Makes tests independent and repeatable
- Easier cleanup (can identify test resources by prefix)

**Pattern**:
```typescript
const queueName = `test-queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 8. Error Handling and Debugging

**Decision**: Capture screenshots, logs, and videos on test failure

**Rationale**:
- E2E tests can fail for non-obvious reasons
- Visual artifacts help diagnose issues quickly
- Logs provide context for failures in CI
- Videos show exact sequence of events leading to failure

**Implementation**:
```typescript
afterEach(async function() {
  if (this.currentTest?.state === 'failed') {
    await captureScreenshot(this.currentTest.title);
    await captureLogs(this.currentTest.title);
    if (process.env.CI) {
      await captureVideo(this.currentTest.title);
    }
  }
});
```

### 9. CI/CD Integration Strategy

**Decision**: Use GitHub Actions with matrix strategy for multi-platform testing

**Rationale**:
- GitHub Actions provides free CI for open source
- Matrix strategy allows testing on Linux, macOS, Windows
- Can cache VS Code binaries and dependencies
- Easy integration with coverage reporting services

**Configuration**:
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    vscode-version: [stable, insiders]
```

### 10. Coverage Reporting

**Decision**: Use c8 (Istanbul) for coverage collection

**Rationale**:
- Native support for TypeScript and source maps
- Works with Mocha test runner
- Generates multiple report formats (HTML, JSON, LCOV)
- Can enforce coverage thresholds

**Configuration**:
```json
{
  "coverage": {
    "lines": 70,
    "branches": 65,
    "functions": 70,
    "statements": 70
  }
}
```

## Webview Testing Strategy

### PostMessage Communication Pattern

The extension uses postMessage for all webview communication. Tests must intercept and simulate this communication:

```typescript
// Extension → Webview
panel.webview.postMessage({
  command: 'messagesLoaded',
  messages: [...]
});

// Webview → Extension
vscode.postMessage({
  command: 'fetchMessages',
  queueId: 'queue-123'
});
```

### Test Helper Injection

To interact with webview DOM, inject a test helper script:

```typescript
const testHelper = `
  (function() {
    const vscode = acquireVsCodeApi();
    
    window.__testHelper__ = {
      // DOM queries
      querySelector: (selector) => document.querySelector(selector),
      querySelectorAll: (selector) => Array.from(document.querySelectorAll(selector)),
      
      // Interactions
      click: (selector) => {
        const el = document.querySelector(selector);
        if (el) el.click();
      },
      
      type: (selector, text) => {
        const el = document.querySelector(selector);
        if (el) {
          el.value = text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      
      // State queries
      isVisible: (selector) => {
        const el = document.querySelector(selector);
        return el && el.offsetParent !== null;
      },
      
      getText: (selector) => {
        const el = document.querySelector(selector);
        return el?.textContent || '';
      },
      
      // Svelte store access (if exposed)
      getStoreValue: (storeName) => {
        return window.__stores__?.[storeName];
      }
    };
    
    // Notify test that helper is ready
    vscode.postMessage({ command: 'testHelperReady' });
  })();
`;
```

### Webview Interaction Flow

```
Test Code                    Extension Host              Webview
    │                              │                        │
    │  postMessage('click', ...)   │                        │
    ├──────────────────────────────>│                        │
    │                              │  postMessage('click')  │
    │                              ├───────────────────────>│
    │                              │                        │
    │                              │                        │ Execute click
    │                              │                        │ Update UI
    │                              │                        │
    │                              │  postMessage('result') │
    │                              │<───────────────────────┤
    │  waitForMessage('result')    │                        │
    │<──────────────────────────────┤                        │
    │                              │                        │
```

### Svelte Component Testing

Since the webview uses Svelte, tests need to account for Svelte's reactivity:

```typescript
// Wait for Svelte to update DOM after state change
async function waitForSvelteUpdate(page: QueueWebviewPage): Promise<void> {
  // Svelte updates are synchronous but may take a tick
  await page.handle.postMessage({ command: 'flushUpdates' });
  await new Promise(resolve => setTimeout(resolve, 50));
}

// In webview test helper
window.__testHelper__.flushUpdates = () => {
  return new Promise(resolve => {
    // Wait for Svelte to flush pending updates
    tick().then(resolve);
  });
};
```

## LocalStack Configuration

### Docker Compose Setup

**File**: `tests/e2e/config/docker-compose.localstack.yml`

```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=sqs
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - localstack-data:/tmp/localstack
      - /var/run/docker.sock:/var/run/docker.sock
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 5s
      timeout: 10s
      retries: 12

volumes:
  localstack-data:
```

### LocalStack Initialization

```typescript
export class LocalStackFixture {
  private container: Docker.Container | null = null;
  private readonly config: LocalStackConfig;
  
  constructor(config: Partial<LocalStackConfig> = {}) {
    this.config = {
      services: ['sqs'],
      port: 4566,
      hostname: 'localhost',
      startTimeout: 60000,
      ...config
    };
  }
  
  async start(): Promise<void> {
    // Start container using docker-compose
    await execAsync('docker-compose -f tests/e2e/config/docker-compose.localstack.yml up -d');
    
    // Wait for health check
    await this.waitForReady();
    
    // Configure AWS SDK
    this.configureAwsSdk();
  }
  
  async waitForReady(): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < this.config.startTimeout) {
      try {
        const response = await fetch(`http://${this.config.hostname}:${this.config.port}/_localstack/health`);
        const health = await response.json();
        if (health.services.sqs === 'running') {
          return;
        }
      } catch (error) {
        // Not ready yet, continue waiting
      }
      await sleep(1000);
    }
    throw new Error('LocalStack failed to start within timeout');
  }
  
  private configureAwsSdk(): void {
    process.env.AWS_ENDPOINT_URL = this.getEndpoint();
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.AWS_REGION = 'us-east-1';
  }
  
  getEndpoint(): string {
    return `http://${this.config.hostname}:${this.config.port}`;
  }
  
  async stop(): Promise<void> {
    await execAsync('docker-compose -f tests/e2e/config/docker-compose.localstack.yml down -v');
  }
}
```

### Queue Setup Helpers

```typescript
export class QueueFixture {
  constructor(private localstack: LocalStackFixture) {}
  
  async createStandardQueue(name: string): Promise<QueueInfo> {
    const client = new SQSClient({
      endpoint: this.localstack.getEndpoint(),
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });
    
    const result = await client.send(new CreateQueueCommand({
      QueueName: name,
      Attributes: {
        VisibilityTimeout: '30',
        MessageRetentionPeriod: '345600'
      }
    }));
    
    return {
      name,
      url: result.QueueUrl!,
      arn: await this.getQueueArn(result.QueueUrl!),
      attributes: {
        visibilityTimeout: 30,
        messageRetentionPeriod: 345600,
        maxMessageSize: 262144,
        delaySeconds: 0,
        receiveMessageWaitTimeSeconds: 0
      }
    };
  }
  
  async createQueueWithDLQ(name: string, maxReceiveCount: number = 3): Promise<{
    main: QueueInfo;
    dlq: QueueInfo;
  }> {
    // Create DLQ first
    const dlq = await this.createStandardQueue(`${name}-dlq`);
    
    // Create main queue with redrive policy
    const client = new SQSClient({
      endpoint: this.localstack.getEndpoint(),
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });
    
    const result = await client.send(new CreateQueueCommand({
      QueueName: name,
      Attributes: {
        VisibilityTimeout: '30',
        MessageRetentionPeriod: '345600',
        RedrivePolicy: JSON.stringify({
          deadLetterTargetArn: dlq.arn,
          maxReceiveCount
        })
      }
    }));
    
    const main: QueueInfo = {
      name,
      url: result.QueueUrl!,
      arn: await this.getQueueArn(result.QueueUrl!),
      attributes: {
        visibilityTimeout: 30,
        messageRetentionPeriod: 345600,
        maxMessageSize: 262144,
        delaySeconds: 0,
        receiveMessageWaitTimeSeconds: 0
      },
      dlq: {
        url: dlq.url,
        arn: dlq.arn,
        maxReceiveCount
      }
    };
    
    return { main, dlq };
  }
  
  async sendMessages(queueUrl: string, count: number): Promise<TestMessage[]> {
    const client = new SQSClient({
      endpoint: this.localstack.getEndpoint(),
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });
    
    const messages: TestMessage[] = [];
    for (let i = 0; i < count; i++) {
      const body = `Test message ${i + 1} - ${Date.now()}`;
      const result = await client.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
        MessageAttributes: {
          TestAttribute: {
            DataType: 'String',
            StringValue: `value-${i}`
          }
        }
      }));
      
      messages.push({
        messageId: result.MessageId!,
        receiptHandle: '',
        body,
        attributes: {
          sentTimestamp: Date.now().toString(),
          approximateReceiveCount: '0',
          approximateFirstReceiveTimestamp: ''
        },
        messageAttributes: {
          TestAttribute: {
            dataType: 'String',
            stringValue: `value-${i}`
          }
        }
      });
    }
    
    return messages;
  }
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Workspace Isolation and Cleanup

*For any* test suite execution, the test runner should create an isolated workspace before tests begin and completely remove that workspace after tests complete, ensuring no state leakage between test runs.

**Validates: Requirements 1.4, 1.5**

### Property 2: Test Failure Artifact Capture

*For any* test that fails during execution, the test runner should capture screenshots and logs for that specific test, providing diagnostic information for debugging.

**Validates: Requirements 1.7**

### Property 3: Test Queue Creation

*For any* test that requires queues, the test fixture should create those queues in LocalStack during setup, and all created queues should be accessible via the configured endpoint.

**Validates: Requirements 2.3**

### Property 4: Queue Attribute Configuration

*For any* valid set of queue attributes (visibility timeout, message retention, etc.), the test fixture should be able to create a queue with those exact attributes in LocalStack.

**Validates: Requirements 2.8**

### Property 5: Unique Queue Names

*For any* two queues created during test execution, their names should be unique to prevent conflicts and enable test isolation.

**Validates: Requirements 2.9**

### Property 6: LocalStack Resource Cleanup

*For any* test that creates resources in LocalStack (queues, messages), those resources should be completely removed after test completion.

**Validates: Requirements 2.5**

### Property 7: Command Registration

*For any* command registered by the extension (refreshQueues, selectQueue, addQueue, etc.), that command should be available in VS Code's command palette after extension activation.

**Validates: Requirements 3.2**

### Property 8: Queue Selection Opens Webview

*For any* valid queue URL, executing the selectQueue command with that URL should create and display a webview panel for that queue.

**Validates: Requirements 4.2**

### Property 9: Queue Removal from Tree View

*For any* queue displayed in the tree view, executing the removeQueue command for that queue should remove it from the tree view display.

**Validates: Requirements 4.5**

### Property 10: Queue URL Clipboard Copy

*For any* queue in the tree view, executing the copyQueueUrl command should place that queue's URL in the system clipboard.

**Validates: Requirements 4.6**

### Property 11: Command Error Display

*For any* extension command that encounters an error during execution, the extension should display an error message to the user describing the failure.

**Validates: Requirements 4.9**

### Property 12: Tree View Queue Display

*For any* set of queues that exist in LocalStack and are configured in the extension, all of those queues should appear in the tree view.

**Validates: Requirements 5.1**

### Property 13: Tree View Queue Selection

*For any* queue displayed in the tree view, clicking that queue should open a webview panel for that queue.

**Validates: Requirements 5.2**

### Property 14: Tree View Auto-Update on Add

*For any* queue added to the extension configuration, that queue should appear in the tree view without requiring a manual refresh action.

**Validates: Requirements 5.4**

### Property 15: Tree View Auto-Update on Remove

*For any* queue removed from the extension configuration, that queue should disappear from the tree view display.

**Validates: Requirements 5.5**

### Property 16: Tree View Attribute Updates

*For any* queue whose attributes change in AWS/LocalStack, refreshing that queue should update the displayed information in the tree view to reflect the new attributes.

**Validates: Requirements 5.6**

### Property 17: Tree View Queue Name Display

*For any* queue in the tree view, the displayed name should exactly match the actual queue name from AWS/LocalStack.

**Validates: Requirements 5.7**

### Property 18: Tree View Message Count Display

*For any* queue that contains messages, the tree view should display the message count as a badge or decoration visible to the user.

**Validates: Requirements 5.8**

### Property 19: Webview Title Matches Queue

*For any* queue selected and opened in a webview, the webview panel title should match the queue name.

**Validates: Requirements 6.1**

### Property 20: Webview Queue Attributes Display

*For any* queue opened in a webview, the webview should display that queue's attributes (message count, in-flight count, visibility timeout, etc.).

**Validates: Requirements 6.3**

### Property 21: DLQ Tab Enablement

*For any* queue, the DLQ tab in the webview should be enabled if and only if that queue has a configured dead letter queue.

**Validates: Requirements 6.5, 6.6, 9.1, 9.8**

### Property 22: PostMessage Communication

*For any* message sent via postMessage from the extension to the webview (or vice versa), that message should be received by the recipient and processed according to its command type.

**Validates: Requirements 6.7**

### Property 23: Webview Resource Cleanup

*For any* webview that is closed, the extension should clean up all resources and event listeners associated with that webview to prevent memory leaks.

**Validates: Requirements 6.8**

### Property 24: Multiple Webview Instances

*For any* N queues opened simultaneously, the extension should create N distinct webview instances, each displaying data for its respective queue.

**Validates: Requirements 6.9**

### Property 25: Message Table Population

*For any* messages received during polling, those messages should be added to the message table in the webview and be visible to the user.

**Validates: Requirements 7.4**

### Property 26: Message Deduplication

*For any* set of messages received during polling that contains duplicates (same message ID), only unique messages should be displayed in the message table.

**Validates: Requirements 7.5**

### Property 27: Message Row Click Shows Details

*For any* message displayed in the message table, clicking that message row should display the message details panel with full information about that message.

**Validates: Requirements 8.1**

### Property 28: Message Checkbox Selection

*For any* message in the message table, clicking its checkbox should select that message and display the bulk actions bar.

**Validates: Requirements 8.2**

### Property 29: Multiple Message Selection

*For any* set of message checkboxes clicked by the user, all corresponding messages should be selected and included in bulk operations.

**Validates: Requirements 8.3**

### Property 30: Delete Confirmation Display

*For any* message or set of messages selected for deletion, the webview should display a confirmation dialog before proceeding with the deletion.

**Validates: Requirements 8.5, 8.6**

### Property 31: Message Deletion from SQS

*For any* messages confirmed for deletion, the extension should delete those messages from SQS via the AWS SDK.

**Validates: Requirements 8.7**

### Property 32: Message Table Update After Deletion

*For any* messages successfully deleted from SQS, those messages should be removed from the message table in the webview.

**Validates: Requirements 8.8**

### Property 33: Message Details Display

*For any* message whose details panel is open, the panel should display the message ID, receipt handle, attributes, and body.

**Validates: Requirements 8.10**

### Property 34: DLQ Redrive Button Display

*For any* DLQ messages selected in the webview, the "Redrive Selected" button should be displayed and enabled.

**Validates: Requirements 9.3**

### Property 35: Message Redrive Operation

*For any* messages selected for redrive from the DLQ, the extension should move those messages from the DLQ to the main queue.

**Validates: Requirements 9.4**

### Property 36: DLQ Table Update After Redrive

*For any* messages successfully redriven from the DLQ, those messages should be removed from the DLQ message table in the webview.

**Validates: Requirements 9.5**

### Property 37: DLQ Message Count Badge

*For any* queue with a DLQ that contains messages, the DLQ tab should display the message count as a badge.

**Validates: Requirements 9.7**

### Property 38: Invalid Queue URL Rejection

*For any* invalid queue URL provided to the addQueue command, the extension should reject the URL with an error message and not add it to the tree view.

**Validates: Requirements 11.2**

### Property 39: Failed Deletion Preserves Messages

*For any* message deletion operation that fails, the messages should remain in the message table and not be removed.

**Validates: Requirements 11.6**

## Error Handling

### Error Categories

The E2E test suite must handle several categories of errors:

1. **Infrastructure Errors**
   - LocalStack fails to start or becomes unavailable
   - Docker is not installed or not running
   - VS Code binary download fails
   - Test workspace creation fails

2. **Extension Errors**
   - Extension fails to activate
   - Commands throw exceptions
   - Webview fails to load
   - PostMessage communication fails

3. **AWS/LocalStack Errors**
   - Queue operations fail (create, delete, send, receive)
   - Invalid credentials
   - Network timeouts
   - Queue not found (stale references)

4. **Test Errors**
   - Assertions fail
   - Timeouts waiting for conditions
   - Resource cleanup fails
   - Test data generation fails

### Error Handling Strategies

**Infrastructure Errors**:
```typescript
try {
  await localstack.start();
} catch (error) {
  console.error('Failed to start LocalStack:', error);
  console.error('Ensure Docker is installed and running');
  process.exit(1);
}
```

**Extension Errors**:
```typescript
try {
  await context.activateExtension();
} catch (error) {
  await captureScreenshot('activation-failure');
  await captureLogs('activation-failure');
  throw new Error(`Extension activation failed: ${error.message}`);
}
```

**AWS/LocalStack Errors**:
```typescript
try {
  await queueFixture.createQueue(queueName);
} catch (error) {
  if (error.code === 'QueueAlreadyExists') {
    // Delete and retry
    await queueFixture.deleteQueue(queueName);
    await queueFixture.createQueue(queueName);
  } else {
    throw error;
  }
}
```

**Test Errors**:
```typescript
afterEach(async function() {
  if (this.currentTest?.state === 'failed') {
    // Capture diagnostics
    await captureScreenshot(this.currentTest.title);
    await captureLogs(this.currentTest.title);
    
    // Attempt cleanup even on failure
    try {
      await cleanup();
    } catch (cleanupError) {
      console.warn('Cleanup failed:', cleanupError);
    }
  }
});
```

### Retry Logic

For flaky operations, implement exponential backoff retry:

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  }
): Promise<T> {
  let lastError: Error;
  let delay = options.initialDelay;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < options.maxRetries) {
        await sleep(delay);
        delay = Math.min(delay * options.backoffMultiplier, options.maxDelay);
      }
    }
  }
  
  throw new Error(`Operation failed after ${options.maxRetries} retries: ${lastError.message}`);
}

// Usage
const messages = await retryOperation(
  () => page.getMessages(),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  }
);
```

### Timeout Handling

All async operations should have explicit timeouts:

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Usage
const extension = await withTimeout(
  context.activateExtension(),
  30000,
  'Extension activation timed out after 30 seconds'
);
```

## Testing Strategy

### Dual Testing Approach

The E2E test suite complements the existing unit tests:

**Unit Tests** (existing):
- Test individual functions and classes in isolation
- Mock external dependencies (AWS SDK, VS Code API)
- Fast execution (milliseconds per test)
- High code coverage of individual units
- Located in `tests/unit/`

**E2E Tests** (new):
- Test complete user workflows in real VS Code environment
- Use real LocalStack for AWS integration
- Slower execution (seconds per test)
- Verify integration between components
- Located in `tests/e2e/`

Both approaches are necessary:
- Unit tests catch logic errors and edge cases quickly
- E2E tests catch integration issues and verify real-world behavior
- Together they provide comprehensive coverage

### Property-Based Testing Configuration

While this design focuses on E2E tests (which are typically example-based), we can incorporate property-based thinking:

**Test Framework**: Mocha with Chai assertions

**Test Structure**:
```typescript
describe('Queue Operations', () => {
  let localstack: LocalStackFixture;
  let context: ExtensionTestContext;
  
  before(async () => {
    localstack = new LocalStackFixture();
    await localstack.start();
    context = await createExtensionContext();
    await context.activateExtension();
  });
  
  after(async () => {
    await context.dispose();
    await localstack.stop();
  });
  
  // Property: For any queue, selecting it opens a webview
  it('should open webview for any selected queue', async () => {
    // Generate test data
    const queueName = generateQueueName();
    const { queueUrl } = await localstack.createQueue(queueName);
    
    // Execute command
    const webview = await context.openWebview(queueUrl);
    
    // Verify property
    expect(webview.panel.title).to.equal(queueName);
    expect(webview.panel.visible).to.be.true;
    
    // Cleanup
    await webview.dispose();
  });
});
```

**Test Tagging**:
Each test should reference its design property:

```typescript
// Feature: vscode-extension-e2e-tests, Property 8: Queue Selection Opens Webview
it('should open webview for any selected queue', async () => {
  // Test implementation
});
```

**Test Iterations**:
While not using a property-based testing library, tests should:
- Use randomized test data (queue names, message bodies)
- Run multiple times with different inputs where practical
- Test boundary conditions (empty queues, large message counts, etc.)

### Test Execution Strategy

**Local Development**:
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- --grep "activation"

# Run in headed mode (visible VS Code window)
npm run test:e2e:headed

# Run with debugging
npm run test:e2e:debug
```

**CI/CD Pipeline**:
```bash
# Run in headless mode with coverage
npm run test:e2e:ci

# Generate coverage report
npm run test:e2e:coverage

# Run with retries for flaky tests
npm run test:e2e:ci -- --retries 2
```

### Coverage Goals

**Target Coverage** (E2E tests only):
- Line coverage: 70%
- Branch coverage: 65%
- Function coverage: 70%
- Statement coverage: 70%

**Coverage Exclusions**:
- Test files (`tests/**`)
- Node modules (`node_modules/**`)
- Build output (`out/**`)
- Configuration files

**Coverage Reporting**:
- HTML report for local viewing
- JSON report for CI integration
- LCOV report for coverage services (Codecov, Coveralls)

### Test Organization by Priority

**P0 (Critical - Must Pass)**:
- Extension activation
- Command registration
- Tree view creation
- Basic queue operations (add, remove, refresh)
- Webview creation and disposal

**P1 (High - Should Pass)**:
- Message polling and display
- Message selection and deletion
- DLQ operations
- PostMessage communication
- Error handling for common scenarios

**P2 (Medium - Nice to Have)**:
- Multiple webview instances
- Export/import queue configurations
- Edge cases (empty queues, large message counts)
- Performance tests (polling duration, cleanup time)

### Flaky Test Prevention

**Strategies**:
1. **Explicit Waits**: Use `waitFor` with predicates instead of `sleep`
2. **Idempotent Setup**: Ensure setup can run multiple times safely
3. **Isolated State**: Each test gets fresh workspace and queues
4. **Deterministic Data**: Use seeded random generators for reproducibility
5. **Retry Logic**: Retry infrastructure operations (LocalStack health check)
6. **Cleanup Guarantees**: Use try/finally to ensure cleanup runs

**Example**:
```typescript
// ❌ Flaky - fixed delay
await sleep(1000);
const messages = await page.getMessages();

// ✅ Reliable - wait for condition
await waitFor(() => page.getMessages().length > 0, { timeout: 5000 });
const messages = await page.getMessages();
```

## CI/CD Pipeline Configuration

### GitHub Actions Workflow

**File**: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        vscode-version: [stable]
      fail-fast: false
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd vscode-extension/sqs-management-tool
          npm ci
      
      - name: Start LocalStack
        run: |
          docker-compose -f tests/e2e/config/docker-compose.localstack.yml up -d
          docker-compose -f tests/e2e/config/docker-compose.localstack.yml ps
      
      - name: Wait for LocalStack
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:4566/_localstack/health; do sleep 2; done'
      
      - name: Run E2E tests
        run: |
          cd vscode-extension/sqs-management-tool
          npm run test:e2e:ci
        env:
          AWS_ENDPOINT_URL: http://localhost:4566
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_REGION: us-east-1
      
      - name: Generate coverage report
        if: always()
        run: |
          cd vscode-extension/sqs-management-tool
          npm run test:e2e:coverage
      
      - name: Upload coverage to Codecov
        if: always()
        uses: codecov/codecov-action@v3
        with:
          files: ./vscode-extension/sqs-management-tool/coverage/lcov.info
          flags: e2e-tests
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-artifacts-${{ matrix.os }}
          path: |
            vscode-extension/sqs-management-tool/test-results/
            vscode-extension/sqs-management-tool/screenshots/
            vscode-extension/sqs-management-tool/logs/
      
      - name: Stop LocalStack
        if: always()
        run: |
          docker-compose -f tests/e2e/config/docker-compose.localstack.yml down -v
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "node ./tests/e2e/runTests.js",
    "test:e2e:headed": "HEADED=true node ./tests/e2e/runTests.js",
    "test:e2e:ci": "CI=true node ./tests/e2e/runTests.js",
    "test:e2e:coverage": "c8 --reporter=html --reporter=json --reporter=lcov npm run test:e2e:ci",
    "test:e2e:debug": "node --inspect-brk ./tests/e2e/runTests.js"
  }
}
```

### Artifact Collection

**On Test Failure**:
- Screenshot of VS Code window
- Extension Host logs
- Webview console logs
- LocalStack logs
- Test execution trace

**Storage**:
```
test-results/
├── screenshots/
│   ├── activation-failure-2024-01-15-10-30-45.png
│   └── message-polling-timeout-2024-01-15-10-32-12.png
├── logs/
│   ├── extension-host-2024-01-15-10-30-45.log
│   └── localstack-2024-01-15-10-30-45.log
└── traces/
    └── test-execution-2024-01-15-10-30-45.json
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- Set up test runner with @vscode/test-electron
- Configure LocalStack integration
- Create basic test fixtures (workspace, extension context)
- Implement wait utilities and assertions
- Write first smoke test (extension activation)

### Phase 2: Core Functionality (Week 2)
- Implement command execution tests
- Implement tree view interaction tests
- Create page object for webview
- Write tests for basic queue operations

### Phase 3: Webview Testing (Week 3)
- Implement postMessage test helpers
- Write tests for message polling
- Write tests for message operations (select, delete)
- Write tests for DLQ operations

### Phase 4: Error Handling (Week 4)
- Write tests for error scenarios
- Implement retry logic and timeout handling
- Add screenshot and log capture
- Test edge cases (empty queues, network failures)

### Phase 5: CI/CD Integration (Week 5)
- Create GitHub Actions workflow
- Configure multi-platform testing
- Set up coverage reporting
- Add artifact upload on failure

### Phase 6: Optimization (Week 6)
- Optimize test execution time
- Implement parallel test execution where safe
- Add test result caching
- Document test writing guidelines

## Summary

This design provides a comprehensive E2E testing solution for the VS Code SQS Management Tool extension. Key highlights:

- **Real Environment Testing**: Uses actual VS Code Extension Host for high confidence
- **AWS Independence**: LocalStack provides isolated, fast, cost-free AWS mocking
- **Maintainable Tests**: Page objects and fixtures reduce duplication
- **CI/CD Ready**: Headless execution, multi-platform support, artifact collection
- **Reliable**: Explicit waits, test isolation, retry logic prevent flaky tests
- **Comprehensive Coverage**: 39 correctness properties covering all major functionality

The test suite will provide confidence in extension behavior, enable safe refactoring, and catch regressions before they reach users.
