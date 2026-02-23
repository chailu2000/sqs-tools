# Design Document: E2E Test Infrastructure

## Overview

This design document outlines the implementation approach for comprehensive end-to-end (E2E) testing of the SQS Management Tool frontend using Playwright. The E2E test suite will verify all major user flows including queue management, message operations, DLQ operations, settings configuration, polling behavior, view mode consistency, and error handling. The tests will run in CI/CD pipelines to catch regressions before they reach production.

### Test Scope

The E2E test suite will cover:

1. **Queue Management**: Add, select, remove queues with error handling
2. **Message Operations**: Send, receive, delete messages with validation
3. **DLQ Operations**: View and redrive dead-letter queue messages
4. **Settings Configuration**: AWS profile management and credential testing
5. **Polling Behavior**: Automatic message polling with progress tracking
6. **View Mode Consistency**: Cards/Table view persistence across tabs
7. **Error Handling**: User-friendly error messages and validation
8. **Visual Regression**: Screenshot comparison for UI layout changes
9. **CI/CD Integration**: Automated test execution in pull request workflows

### Test Infrastructure

- **Test Framework**: Playwright (Node.js)
- **Test Runner**: Playwright Test Runner
- **Assertion Library**: Playwright's built-in assertions + expect
- **Test Data**: Randomized test data using faker.js
- **Visual Testing**: Playwright's built-in screenshot comparison
- **CI/CD**: GitHub Actions with headless browser mode

## Architecture

### Test Organization

```
tests/
├── e2e/
│   ├── queue-management.spec.ts      # Queue CRUD operations
│   ├── message-operations.spec.ts    # Message send/receive/delete
│   ├── dlq-operations.spec.ts        # DLQ view and redrive
│   ├── settings.spec.ts              # AWS settings configuration
│   ├── polling.spec.ts               # Polling behavior
│   ├── view-modes.spec.ts            # View mode persistence
│   ├── error-handling.spec.ts        # Error scenarios
│   ├── visual-regression.spec.ts     # Screenshot comparison
│   └── ci-cd.spec.ts                 # CI/CD workflow tests
├── fixtures/
│   ├── queue-data.ts                 # Test queue configurations
│   ├── message-data.ts               # Test message payloads
│   └── dlq-data.ts                   # Test DLQ scenarios
├── pages/
│   ├── BasePage.ts                   # Base page object
│   ├── QueuePage.ts                  # Queue management page
│   ├── MessagePage.ts                # Message operations page
│   └── SettingsPage.ts               # Settings page
├── utils/
│   ├── test-data.ts                  # Test data generators
│   ├── assertions.ts                 # Custom assertions
│   └── visual-regression.ts          # Visual testing utilities
└── playwright.config.ts              # Playwright configuration
```

### Page Object Model

The test suite will use the Page Object Model (POM) pattern to create maintainable, reusable test components:

```typescript
// BasePage.ts
class BasePage {
    protected page: Page;
    
    constructor(page: Page) {
        this.page = page;
    }
    
    async goto() {
        await this.page.goto('/');
    }
    
    async waitForPageLoad() {
        await this.page.waitForSelector('.app-container');
    }
}

// QueuePage.ts
class QueuePage extends BasePage {
    // Selectors
    queueList = '.queue-list';
    addQueueButton = '.btn-add';
    queueItem = '.queue-item';
    removeQueueButton = '.btn-remove';
    errorToast = '.error-toast';
    
    // Actions
    async addQueue(name: string, region: string) {
        await this.page.click(this.addQueueButton);
        await this.page.fill('[placeholder="Queue name or URL"]', name);
        await this.page.selectOption('select', region);
        await this.page.click('button:has-text("Add")');
    }
    
    async removeQueue(name: string) {
        const queueItem = this.page.locator(this.queueItem).filter({ hasText: name });
        await queueItem.locator(this.removeQueueButton).click();
        await this.page.click('button:has-text("Remove")');
    }
    
    async getQueueCount() {
        return await this.page.count(this.queueItem);
    }
}
```

## Components and Interfaces

### Test Configuration Interface

```typescript
interface TestConfig {
    baseUrl: string;
    timeout: number;
    headless: boolean;
    viewport: {
        width: number;
        height: number;
    };
    screenshotOnFailure: boolean;
    video: 'on' | 'off' | 'retain-on-failure';
    trace: 'on' | 'off' | 'retain-on-failure';
}

interface QueueTestData {
    name: string;
    region: string;
    dlqName?: string;
}

interface MessageTestData {
    body: string;
    attributes?: Record<string, any>;
}
```

### Test Data Generators

```typescript
// utils/test-data.ts
import { faker } from '@faker-js/faker';

export function generateQueueName() {
    return `test-queue-${faker.string.alphanumeric(8).toLowerCase()}`;
}

export function generateMessageBody() {
    return JSON.stringify({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['order', 'payment', 'notification']),
        data: faker.lorem.paragraph(),
        timestamp: new Date().toISOString()
    });
}

export function generateRegion() {
    return faker.helpers.arrayElement([
        'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'
    ]);
}

export function generateInvalidQueueName() {
    return faker.helpers.arrayElement(['', '   ', 'invalid@queue', 'a'.repeat(256)]);
}
```

## Data Models

### Test Result Model

```typescript
interface TestResult {
    spec: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    errors?: TestError[];
    screenshots?: Screenshot[];
}

interface TestError {
    message: string;
    stack: string;
    screenshot?: string;
}

interface Screenshot {
    name: string;
    path: string;
    diff?: string;
}
```

### Visual Regression Model

```typescript
interface VisualBaseline {
    name: string;
    screenshot: Buffer;
    threshold: number;
}

interface VisualComparisonResult {
    passed: boolean;
    diffPixels: number;
    diffPercentage: number;
    diffImage?: Buffer;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Queue Addition Increases Queue Count

*For any* queue list with N queues, when a valid queue is added, the queue list should contain N+1 queues

**Validates: Requirements 1.3**

### Property 2: Queue Removal Decreases Queue Count

*For any* queue list with N queues, when a queue is removed, the queue list should contain N-1 queues

**Validates: Requirements 1.5**

### Property 3: Error Toast Appears on Operation Failure

*For any* queue operation that fails, an error toast notification should be displayed with a descriptive error message

**Validates: Requirements 1.6, 2.6, 3.6**

### Property 4: Message Addition Increases Message Count

*For any* message table with M messages, when a valid message is sent, the message table should display M+1 messages after receiving

**Validates: Requirements 2.2**

### Property 5: Message Deletion Decreases Message Count

*For any* message table with M messages, when a message is deleted, the message table should display M-1 messages

**Validates: Requirements 2.5**

### Property 6: View Mode Persists Across Tab Switches

*For any* view mode (cards or table), when switching between main queue and DLQ tabs, the view mode should remain unchanged

**Validates: Requirements 6.2**

### Property 7: View Mode Persists Across Queue Selections

*For any* view mode (cards or table), when selecting a different queue, the view mode should remain unchanged

**Validates: Requirements 6.3**

### Property 8: Polling Updates Message Count

*For any* active polling session, when new messages arrive in the queue, the message table should update to display the new messages

**Validates: Requirements 5.2**

### Property 9: Polling Stops When Disabled

*For any* active polling session, when polling is disabled, the message fetching should stop and the polling indicator should disappear

**Validates: Requirements 5.3**

### Property 10: Invalid Input Prevents Submission

*For any* form with required fields, when submitting with invalid or missing input, the submission should be prevented and field-specific error messages should be displayed

**Validates: Requirements 7.2, 7.5**

### Property 11: Error Messages Are User-Friendly

*For any* error scenario, the error message displayed to the user should be descriptive and actionable

**Validates: Requirements 7.1, 7.4**

### Property 12: Visual Regression Threshold

*For any* UI component, when visual regression testing is enabled, screenshots should match baselines within the configured threshold

**Validates: Requirements 8.3**

## Error Handling

### Test Error Categories

1. **Assertion Errors**: Test expectations failed
2. **Timeout Errors**: Operations exceeded timeout threshold
3. **Navigation Errors**: Page navigation failed
4. **Element Errors**: Element not found or not interactable
5. **Network Errors**: API communication failed

### Error Recovery Strategies

- **Retry Logic**: Retry failed operations up to 3 times with exponential backoff
- **Timeout Configuration**: 30-second default timeout, 60-second for complex operations
- **Screenshot Capture**: Capture screenshots on failure for debugging
- **Video Recording**: Record video of failing tests for analysis
- **Trace Logging**: Enable trace logging for flaky tests

### Error Message Guidelines

- Include context: What operation failed and why
- Include actionable information: How to reproduce or fix
- Include relevant data: Queue names, message IDs, timestamps
- Include stack traces: For debugging purposes

## Testing Strategy

### Dual Testing Approach

The E2E test suite will use both unit testing and property-based testing approaches:

#### Unit Tests (Specific Examples)

Unit tests will verify specific examples, edge cases, and error conditions:

- **Queue Management**: Add/remove specific queues with known names
- **Message Operations**: Send/receive specific message payloads
- **Error Scenarios**: Test specific error conditions (invalid input, network failures)
- **Visual Regression**: Compare specific UI states against baselines

#### Property Tests (Universal Properties)

Property-based tests will verify universal properties across all inputs:

- **Queue Count Properties**: Verify queue count changes correctly for any queue
- **Message Count Properties**: Verify message count changes correctly for any message
- **View Mode Persistence**: Verify view mode persists across any tab/queue switch
- **Error Handling Properties**: Verify error messages appear for any failure scenario

### Test Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    timeout: 30000,
    use: {
        baseURL: 'http://localhost:5173',
        headless: true,
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        actionTimeout: 10000,
    },
    
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
        {
            name: 'firefox',
            use: { browserName: 'firefox' },
        },
        {
            name: 'webkit',
            use: { browserName: 'webkit' },
        },
    ],
    
    reporter: [
        ['html', { outputFolder: 'test-results/html' }],
        ['json', { outputFile: 'test-results/json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
    ],
});
```

### Property-Based Testing Configuration

For property-based testing, we will use `@fast-check/playwright`:

```typescript
// Example property test
import * as fc from 'fast-check';
import { test, expect } from '@playwright/test';

test('Queue addition increases queue count', async ({ page }) => {
    await fc.assert(
        fc.asyncProperty(fc.string(), async (queueName) => {
            // Arrange
            await page.goto('/');
            const initialCount = await page.count('.queue-item');
            
            // Act
            await page.click('.btn-add');
            await page.fill('[placeholder="Queue name or URL"]', queueName);
            await page.click('button:has-text("Add")');
            
            // Assert
            const finalCount = await page.count('.queue-item');
            expect(finalCount).toBe(initialCount + 1);
        }),
        { numRuns: 100 }
    );
});
```

### Test Tagging

Each test will be tagged with metadata for filtering and reporting:

```typescript
test('Add queue with valid configuration', {
    tag: '@queue @smoke',
    info: 'Feature: e2e-tests, Property 1'
}, async ({ page }) => {
    // Test implementation
});
```

### Test Categories

1. **Smoke Tests**: Quick tests for critical paths (run on every commit)
2. **Regression Tests**: Comprehensive tests for all features (run on PR)
3. **Visual Tests**: Screenshot comparison tests (run on PR)
4. **Performance Tests**: Tests for polling and large data scenarios (run nightly)

### CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
    pull_request:
        branches: [main, develop]
    push:
        branches: [main]

jobs:
    e2e-tests:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            
            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '20'
                  cache: 'npm'
                  
            - name: Install dependencies
              run: npm ci
              
            - name: Build application
              run: npm run build
              
            - name: Start application
              run: npm run preview &
              
            - name: Run E2E tests
              run: npm run test:e2e
              env:
                  CI: true
                  
            - name: Upload test results
              if: always()
              uses: actions/upload-artifact@v4
              with:
                  name: e2e-test-results
                  path: test-results/
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

- Set up Playwright configuration
- Create base page objects and utilities
- Implement test data generators
- Create smoke test suite

### Phase 2: Feature Tests (Week 2)

- Implement queue management tests
- Implement message operation tests
- Implement DLQ operation tests
- Implement settings tests

### Phase 3: Advanced Features (Week 3)

- Implement polling behavior tests
- Implement view mode persistence tests
- Implement error handling tests
- Implement visual regression tests

### Phase 4: CI/CD Integration (Week 4)

- Set up GitHub Actions workflow
- Configure test reporting
- Implement flaky test handling
- Optimize test execution time

## Success Metrics

- **Test Coverage**: 90%+ of user flows covered
- **Test Execution Time**: < 10 minutes for full suite
- **Flakiness Rate**: < 1% of tests flaky
- **CI/CD Integration**: Tests run on every PR
- **Visual Coverage**: All major UI components have visual tests

## Maintenance Strategy

### Test Maintenance Guidelines

1. **Update Tests with Features**: Update E2E tests when adding new features
2. **Refactor Page Objects**: Refactor POM when UI changes
3. **Review Flaky Tests**: Investigate and fix flaky tests promptly
4. **Update Dependencies**: Keep Playwright and dependencies updated
5. **Review Test Coverage**: Regularly review and expand test coverage

### Test Quality Metrics

- **Code Coverage**: Target 80%+ for test utilities
- **Test Execution Time**: Individual tests < 30 seconds
- **Test Independence**: Tests should not depend on each other
- **Test Documentation**: Each test should have clear documentation

## Review and Approval

This design document has been reviewed and approved for implementation. The test suite will be developed incrementally, with each phase reviewed and merged before proceeding to the next.

### Design Review Checklist

- [x] Test scope defined and agreed upon
- [x] Architecture designed and documented
- [x] Page object model established
- [x] Test data strategy defined
- [x] Error handling approach documented
- [x] CI/CD integration planned
- [x] Success metrics established
- [x] Maintenance strategy defined
