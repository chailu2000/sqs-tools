# Implementation Plan: VS Code Extension E2E Tests

## Overview

This implementation plan creates a comprehensive end-to-end test suite for the VS Code SQS Management Tool extension. The test suite uses @vscode/test-electron for real VS Code environment testing, LocalStack for AWS service mocking, and follows a page object pattern for maintainable webview interactions. Implementation follows a 6-phase roadmap: Foundation, Core Functionality, Webview Testing, Error Handling, CI/CD Integration, and Optimization.

## Tasks

- [x] 1. Phase 1: Foundation - Test Runner and LocalStack Setup
  - [x] 1.1 Set up test runner infrastructure with @vscode/test-electron
    - Create `tests/e2e/runTests.ts` with VS Code download and launch configuration
    - Configure test runner to create isolated workspaces for each test suite
    - Add support for headless and headed modes via environment variables
    - Configure extension development path and test entry point
    - Set up environment variables for LocalStack endpoint and AWS credentials
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8, 1.9_

  - [x] 1.2 Create test suite entry point and Mocha configuration
    - Create `tests/e2e/index.ts` as the test suite entry point
    - Configure Mocha with appropriate timeouts (30+ seconds for activation)
    - Set up test hooks for global setup and teardown
    - Configure test reporter for CI and local development
    - _Requirements: 1.6, 14.1, 14.2_

  - [x] 1.3 Implement LocalStack fixture for AWS mocking
    - Create `tests/e2e/fixtures/localstack.ts` with LocalStackFixture class
    - Implement Docker Compose configuration in `tests/e2e/config/docker-compose.localstack.yml`
    - Add start() method to launch LocalStack container
    - Add waitForReady() method with health check polling
    - Add stop() method to clean up LocalStack container
    - Configure AWS SDK to use LocalStack endpoint
    - _Requirements: 2.1, 2.2, 2.4, 2.6_

  - [x] 1.4 Create queue fixture for test data setup
    - Create `tests/e2e/fixtures/test-data.ts` with QueueFixture class
    - Implement createStandardQueue() method for basic queue creation
    - Implement createQueueWithDLQ() method for queues with dead letter queues
    - Implement sendMessages() method to populate queues with test messages
    - Add helper methods for queue cleanup and deletion
    - Ensure unique queue names using timestamps and random strings
    - _Requirements: 2.3, 2.7, 2.8, 2.9, 10.1, 10.2, 10.9_

  - [x] 1.5 Create extension context fixture for VS Code API access
    - Create `tests/e2e/fixtures/extension-context.ts` with ExtensionTestContext class
    - Implement activateExtension() method with timeout handling
    - Implement executeCommand() method for command execution
    - Implement getTreeView() and getTreeItems() methods for tree view access
    - Implement openWebview() method to create webview handles
    - Add dispose() method for resource cleanup
    - _Requirements: 10.4, 10.5_

  - [x] 1.6 Implement wait utilities and custom assertions
    - Create `tests/e2e/utils/wait.ts` with waitFor() function using predicates
    - Create `tests/e2e/utils/assertions.ts` with custom assertion helpers
    - Implement assertCommandExists() for command registration verification
    - Implement assertTreeItemExists() for tree view item verification
    - Implement assertWebviewTitle() for webview title verification
    - _Requirements: 10.8, 15.3, 15.5_

  - [x] 1.7 Create global setup and teardown functions
    - Create `tests/e2e/fixtures/setup.ts` with globalSetup() and globalTeardown()
    - Implement workspace creation and cleanup logic
    - Implement LocalStack lifecycle management
    - Implement extension context initialization
    - Add cleanup guarantees using try/finally blocks
    - _Requirements: 1.5, 2.5, 10.10, 15.6_

  - [x]* 1.8 Write smoke test for extension activation
    - Create `tests/e2e/specs/activation.test.ts`
    - Write test to verify extension activates without errors
    - Write test to verify commands are registered after activation
    - Write test to verify tree view is created after activation
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Checkpoint - Verify foundation is working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Phase 2: Core Functionality - Commands and Tree View
  - [x] 3.1 Implement command execution tests
    - Create `tests/e2e/specs/commands.test.ts`
    - Write test for refreshQueues command execution
    - Write test for selectQueue command with queue URL parameter
    - Write test for addQueue command with input dialog
    - Write test for removeQueue command
    - Write test for copyQueueUrl command with clipboard verification
    - Write test for exportQueues and importQueues commands
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 3.2 Write property test for command registration
    - **Property 7: Command Registration**
    - **Validates: Requirements 3.2**
    - Verify all extension commands are available after activation

  - [ ]* 3.3 Write property test for command error handling
    - **Property 11: Command Error Display**
    - **Validates: Requirements 4.9**
    - Verify commands display error messages on failure

  - [x] 3.4 Implement tree view interaction tests
    - Create `tests/e2e/specs/tree-view.test.ts`
    - Write test for tree view queue display with LocalStack queues
    - Write test for queue selection opening webview
    - Write test for refresh button reloading queue data
    - Write test for queue addition updating tree view automatically
    - Write test for queue removal updating tree view
    - Write test for queue attribute updates in tree view
    - Write test for empty state message when no queues configured
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9_

  - [ ]* 3.5 Write property tests for tree view operations
    - **Property 12: Tree View Queue Display**
    - **Validates: Requirements 5.1**
    - **Property 13: Tree View Queue Selection**
    - **Validates: Requirements 5.2**
    - **Property 17: Tree View Queue Name Display**
    - **Validates: Requirements 5.7**
    - **Property 18: Tree View Message Count Display**
    - **Validates: Requirements 5.8**

- [x] 4. Checkpoint - Verify core functionality is working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Phase 3: Webview Testing - PostMessage and UI Interactions
  - [x] 5.1 Create webview page object for UI interactions
    - Create `tests/e2e/pages/QueueWebviewPage.ts` with QueueWebviewPage class
    - Implement postMessage() method for sending commands to webview
    - Implement waitForMessage() method for receiving webview responses
    - Implement tab navigation methods (switchToMainQueueTab, switchToDLQTab, switchToQueueInfoTab)
    - Implement polling operation methods (startPolling, stopPolling, waitForPollingComplete)
    - Implement message operation methods (getMessages, selectMessage, deleteSelectedMessages)
    - Implement DLQ operation methods (getDLQMessages, redriveSelectedMessages)
    - Implement assertion methods (assertMessageCount, assertTabEnabled, assertPollingActive)
    - _Requirements: 10.6, 10.7, 10.8_

  - [x] 5.2 Implement webview test helper injection
    - Create test helper script for webview DOM access
    - Inject test helper into webview on creation
    - Implement querySelector, click, type, isVisible, getText helpers
    - Add support for Svelte store access if needed
    - Wait for testHelperReady message before proceeding with tests
    - _Requirements: 6.7_

  - [x] 5.3 Implement webview functionality tests
    - Create `tests/e2e/specs/webview.test.ts`
    - Write test for webview creation with correct title
    - Write test for Queue Info tab display on load
    - Write test for queue attributes display
    - Write test for tab navigation (Main Queue, DLQ, Queue Info)
    - Write test for DLQ tab enablement based on queue configuration
    - Write test for webview resource cleanup on close
    - Write test for multiple webview instances for different queues
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9_

  - [ ]* 5.4 Write property tests for webview operations
    - **Property 8: Queue Selection Opens Webview**
    - **Validates: Requirements 4.2**
    - **Property 19: Webview Title Matches Queue**
    - **Validates: Requirements 6.1**
    - **Property 21: DLQ Tab Enablement**
    - **Validates: Requirements 6.5, 6.6, 9.1, 9.8**
    - **Property 22: PostMessage Communication**
    - **Validates: Requirements 6.7**

  - [x] 5.5 Implement message polling tests
    - Create `tests/e2e/specs/message-polling.test.ts`
    - Write test for polling start with 120-second duration
    - Write test for progress bar display during polling
    - Write test for message count display during polling
    - Write test for messages added to table during polling
    - Write test for message deduplication by message ID
    - Write test for stop button halting polling immediately
    - Write test for automatic polling stop after 120 seconds
    - Write test for polling stop on tab switch
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 5.6 Write property tests for message polling
    - **Property 25: Message Table Population**
    - **Validates: Requirements 7.4**
    - **Property 26: Message Deduplication**
    - **Validates: Requirements 7.5**

  - [x] 5.7 Implement message operations tests
    - Create `tests/e2e/specs/message-operations.test.ts`
    - Write test for message row click showing details panel
    - Write test for message checkbox selection
    - Write test for multiple message selection
    - Write test for select-all checkbox functionality
    - Write test for single message deletion with confirmation
    - Write test for bulk message deletion with confirmation
    - Write test for message deletion from SQS
    - Write test for message table update after deletion
    - Write test for message details panel display
    - Write test for message details panel close
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.10, 8.11_

  - [ ]* 5.8 Write property tests for message operations
    - **Property 27: Message Row Click Shows Details**
    - **Validates: Requirements 8.1**
    - **Property 28: Message Checkbox Selection**
    - **Validates: Requirements 8.2**
    - **Property 30: Delete Confirmation Display**
    - **Validates: Requirements 8.5, 8.6**
    - **Property 31: Message Deletion from SQS**
    - **Validates: Requirements 8.7**
    - **Property 32: Message Table Update After Deletion**
    - **Validates: Requirements 8.8**

  - [x] 5.9 Implement DLQ operations tests
    - Create `tests/e2e/specs/dlq-operations.test.ts`
    - Write test for DLQ tab enablement with configured DLQ
    - Write test for DLQ message loading on tab open
    - Write test for redrive button display with selected messages
    - Write test for message redrive from DLQ to main queue
    - Write test for DLQ table update after redrive
    - Write test for DLQ message count badge display
    - Write test for DLQ tab disabled when no DLQ configured
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8_

  - [ ]* 5.10 Write property tests for DLQ operations
    - **Property 34: DLQ Redrive Button Display**
    - **Validates: Requirements 9.3**
    - **Property 35: Message Redrive Operation**
    - **Validates: Requirements 9.4**
    - **Property 36: DLQ Table Update After Redrive**
    - **Validates: Requirements 9.5**
    - **Property 37: DLQ Message Count Badge**
    - **Validates: Requirements 9.7**

- [x] 6. Checkpoint - Verify webview testing is working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Phase 4: Error Handling - Error Scenarios and Edge Cases
  - [x] 7.1 Implement error handling tests
    - Create `tests/e2e/specs/error-handling.test.ts`
    - Write test for LocalStack unavailable error handling
    - Write test for invalid queue URL rejection
    - Write test for invalid AWS credentials error
    - Write test for missing queue (deleted in AWS) handling
    - Write test for message polling network error handling
    - Write test for message deletion failure handling
    - Write test for webview load failure handling
    - Write test for postMessage communication failure handling
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [ ]* 7.2 Write property tests for error handling
    - **Property 38: Invalid Queue URL Rejection**
    - **Validates: Requirements 11.2**
    - **Property 39: Failed Deletion Preserves Messages**
    - **Validates: Requirements 11.6**

  - [x] 7.3 Implement retry logic for flaky operations
    - Create `tests/e2e/utils/retry.ts` with retryOperation() function
    - Implement exponential backoff retry strategy
    - Add retry configuration (maxRetries, initialDelay, maxDelay, backoffMultiplier)
    - Apply retry logic to LocalStack health checks
    - Apply retry logic to extension activation
    - _Requirements: 15.4_

  - [x] 7.4 Implement timeout handling utilities
    - Create withTimeout() function in `tests/e2e/utils/wait.ts`
    - Add timeout wrappers for extension activation
    - Add timeout wrappers for webview operations
    - Add timeout wrappers for AWS operations
    - Provide descriptive error messages on timeout
    - _Requirements: 15.8_

  - [x] 7.5 Implement screenshot and log capture on failure
    - Create `tests/e2e/utils/screenshot.ts` with captureScreenshot() function
    - Create `tests/e2e/utils/logger.ts` with captureLogs() function
    - Add afterEach hook to capture artifacts on test failure
    - Save screenshots to `test-results/screenshots/` directory
    - Save logs to `test-results/logs/` directory
    - Include timestamp and test name in artifact filenames
    - _Requirements: 1.7_

- [x] 8. Checkpoint - Verify error handling is working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Phase 5: CI/CD Integration - GitHub Actions and Coverage
  - [x] 9.1 Create GitHub Actions workflow for E2E tests
    - Create `.github/workflows/e2e-tests.yml` workflow file
    - Configure matrix strategy for multiple OS (Linux, macOS, Windows)
    - Add steps for checkout, Node.js setup, and dependency installation
    - Add step to start LocalStack using docker-compose
    - Add step to wait for LocalStack health check
    - Add step to run E2E tests in headless mode
    - Configure environment variables for LocalStack endpoint
    - _Requirements: 12.1, 12.2, 12.3, 12.7_

  - [x] 9.2 Configure test artifact upload on failure
    - Add GitHub Actions step to upload screenshots on test failure
    - Add GitHub Actions step to upload logs on test failure
    - Configure artifact retention period
    - Add artifact download links to workflow summary
    - _Requirements: 12.5, 12.9_

  - [x] 9.3 Configure coverage reporting
    - Add c8 (Istanbul) for coverage collection
    - Create coverage configuration in `tests/e2e/config/coverage.config.json`
    - Configure coverage thresholds (lines: 70%, branches: 65%, functions: 70%, statements: 70%)
    - Configure coverage exclusions (tests, node_modules, build output)
    - Generate HTML, JSON, and LCOV coverage reports
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.8_

  - [x] 9.4 Integrate coverage reporting with CI
    - Add GitHub Actions step to generate coverage report
    - Add GitHub Actions step to upload coverage to Codecov
    - Configure coverage threshold enforcement in CI
    - Fail build if coverage falls below threshold
    - _Requirements: 12.6, 13.7_

  - [x] 9.5 Add npm scripts for test execution
    - Add `test:e2e` script for local test execution
    - Add `test:e2e:headed` script for headed mode testing
    - Add `test:e2e:ci` script for CI execution with headless mode
    - Add `test:e2e:coverage` script for coverage report generation
    - Add `test:e2e:debug` script for debugging with inspector
    - _Requirements: 1.8, 1.9_

  - [x] 9.6 Configure dependency caching in CI
    - Add npm cache configuration to GitHub Actions
    - Cache VS Code binary downloads
    - Cache node_modules directory
    - Configure cache key based on package-lock.json
    - _Requirements: 12.8_

- [x] 10. Checkpoint - Verify CI/CD integration is working
  - Ensure all tests pass in CI, ask the user if questions arise.

- [x] 11. Phase 6: Optimization - Performance and Documentation
  - [x] 11.1 Optimize test execution time
    - Profile test suite to identify slow tests
    - Optimize LocalStack startup time
    - Optimize queue creation and message sending
    - Reduce unnecessary waits and timeouts
    - Target full suite execution under 10 minutes
    - _Requirements: 15.1_

  - [x] 11.2 Implement parallel test execution support
    - Identify independent test suites that can run in parallel
    - Configure Mocha for parallel execution where safe
    - Ensure test isolation with unique queue names and workspaces
    - Add configuration flag to enable/disable parallel execution
    - _Requirements: 15.2, 15.7_

  - [x] 11.3 Create test configuration file
    - Create `tests/e2e/config/test.config.ts` with E2ETestConfig interface
    - Configure LocalStack settings (port, services, timeout)
    - Configure VS Code settings (version, headless, launch args)
    - Configure test execution settings (timeout, retries, parallel, bail)
    - Configure coverage settings (enabled, thresholds, exclusions)
    - Configure artifact settings (screenshots, logs, videos, output directory)
    - _Requirements: 14.7_

  - [x] 11.4 Create test data generator utilities
    - Enhance `tests/e2e/fixtures/test-data.ts` with TestDataGenerator
    - Implement generateQueueName() with unique identifiers
    - Implement generateMessage() with configurable size and attributes
    - Implement generateMessages() for bulk message creation
    - Implement random data helpers (randomString, randomNumber, randomBoolean)
    - _Requirements: 10.9_

  - [x] 11.5 Add VS Code debug configuration for E2E tests
    - Create debug configuration in `.vscode/launch.json`
    - Configure attach mode for Extension Host debugging
    - Add breakpoint support for test files
    - Document debugging workflow in test documentation
    - _Requirements: 14.7_

  - [x] 11.6 Create test writing guidelines documentation
    - Document test organization structure and naming conventions
    - Document page object pattern usage
    - Document fixture and helper usage
    - Document best practices for reliable tests (explicit waits, test isolation)
    - Document debugging techniques for failed tests
    - Document how to run tests locally and in CI
    - _Requirements: 14.3, 14.4, 14.5, 14.6_

  - [x] 11.7 Add TypeScript configuration for tests
    - Create `tsconfig.test.json` for test files
    - Configure TypeScript compiler options for tests
    - Include test directories in compilation
    - Configure module resolution for test utilities
    - _Requirements: 1.3_

- [x] 12. Final checkpoint - Verify complete test suite
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- The implementation follows the 6-phase roadmap: Foundation → Core Functionality → Webview Testing → Error Handling → CI/CD Integration → Optimization
- All code examples use TypeScript as specified in the design document
- Tests use Mocha as the test framework with Chai for assertions
- LocalStack provides isolated AWS environment without requiring real credentials
- Page objects encapsulate webview interactions for maintainability
- Explicit waits and retry logic prevent flaky tests
- CI/CD integration enables automated testing on every commit
