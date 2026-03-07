# Requirements Document

## Introduction

This document specifies the requirements for adding comprehensive end-to-end (E2E) test coverage to the VS Code SQS Management Tool extension. The extension currently has minimal Jest unit tests and relies on manual testing through the Extension Development Host. This feature will introduce automated E2E tests using @vscode/test-electron to verify extension activation, command execution, tree view interactions, webview functionality, and AWS integration with LocalStack.

The E2E test suite will provide confidence in the extension's behavior across different scenarios, enable regression testing, and support continuous integration workflows.

## Glossary

- **Extension**: The VS Code SQS Management Tool extension
- **Test_Runner**: The @vscode/test-electron test execution framework
- **LocalStack**: A local AWS cloud stack for testing AWS integrations
- **Tree_View**: The VS Code sidebar view displaying SQS queues
- **Webview**: The embedded Svelte UI panel for queue management
- **Extension_Host**: The VS Code process that runs extensions
- **Test_Workspace**: A temporary VS Code workspace created for testing
- **Test_Fixture**: Predefined test data and helper functions
- **Page_Object**: A class encapsulating webview UI interactions
- **CI_Pipeline**: Continuous Integration automated build and test workflow
- **Coverage_Report**: A report showing which code paths are tested
- **VSCode_API**: The VS Code extension API for interacting with the editor

## Requirements

### Requirement 1: Test Framework Setup

**User Story:** As a developer, I want a properly configured E2E test framework, so that I can write and execute automated tests for the extension.

#### Acceptance Criteria

1. THE Test_Runner SHALL use @vscode/test-electron as the test execution framework
2. THE Test_Runner SHALL use @vscode/test-cli for running tests from the command line
3. THE Test_Runner SHALL support TypeScript test files without requiring pre-compilation
4. THE Test_Runner SHALL create isolated Test_Workspace instances for each test suite
5. THE Test_Runner SHALL clean up Test_Workspace instances after test completion
6. THE Test_Runner SHALL configure appropriate timeouts for extension activation (minimum 30 seconds)
7. WHERE test execution fails, THE Test_Runner SHALL capture screenshots and logs
8. THE Test_Runner SHALL support running tests in headless mode for CI environments
9. THE Test_Runner SHALL support running tests in headed mode for local development

### Requirement 2: LocalStack Integration

**User Story:** As a developer, I want LocalStack integration for AWS mocking, so that tests can interact with SQS without requiring real AWS credentials.

#### Acceptance Criteria

1. THE Test_Fixture SHALL start LocalStack before test execution begins
2. THE Test_Fixture SHALL configure LocalStack to expose SQS on a known port
3. THE Test_Fixture SHALL create test queues in LocalStack during setup
4. THE Test_Fixture SHALL configure the Extension to use LocalStack endpoints
5. THE Test_Fixture SHALL clean up LocalStack resources after test completion
6. WHEN LocalStack fails to start, THE Test_Runner SHALL fail tests with a descriptive error message
7. THE Test_Fixture SHALL support creating queues with Dead Letter Queue (DLQ) configurations
8. THE Test_Fixture SHALL support creating queues with various attribute configurations (visibility timeout, message retention, etc.)
9. FOR ALL test queues, THE Test_Fixture SHALL use unique queue names to prevent conflicts

### Requirement 3: Extension Activation Testing

**User Story:** As a developer, I want to test extension activation, so that I can verify the extension loads correctly in VS Code.

#### Acceptance Criteria

1. WHEN the Extension is activated, THE Test_Runner SHALL verify activation completes within the timeout period
2. WHEN the Extension is activated, THE Test_Runner SHALL verify all registered commands are available
3. WHEN the Extension is activated, THE Test_Runner SHALL verify the Tree_View is registered and visible
4. WHEN the Extension is activated, THE Test_Runner SHALL verify no errors are logged to the Extension_Host console
5. THE Test_Runner SHALL verify the Extension activates on the correct activation events
6. WHEN AWS credentials are not configured, THE Extension SHALL activate without errors
7. WHEN AWS credentials are configured, THE Extension SHALL load queue data into the Tree_View

### Requirement 4: Command Execution Testing

**User Story:** As a developer, I want to test command execution, so that I can verify all extension commands work correctly.

#### Acceptance Criteria

1. WHEN "sqs-management-tool.refreshQueues" is executed, THE Extension SHALL reload queue data from AWS
2. WHEN "sqs-management-tool.selectQueue" is executed with a queue URL, THE Extension SHALL open a Webview for that queue
3. WHEN "sqs-management-tool.selectAwsProfile" is executed, THE Extension SHALL display a profile selection dialog
4. WHEN "sqs-management-tool.addQueue" is executed, THE Extension SHALL display a queue URL input dialog
5. WHEN "sqs-management-tool.removeQueue" is executed, THE Extension SHALL remove the queue from the Tree_View
6. WHEN "sqs-management-tool.copyQueueUrl" is executed, THE Extension SHALL copy the queue URL to the clipboard
7. WHEN "sqs-management-tool.exportQueues" is executed, THE Extension SHALL save queue configurations to a file
8. WHEN "sqs-management-tool.importQueues" is executed, THE Extension SHALL load queue configurations from a file
9. FOR ALL commands, WHEN execution fails, THE Extension SHALL display an error message to the user

### Requirement 5: Tree View Interaction Testing

**User Story:** As a developer, I want to test tree view interactions, so that I can verify the queue list displays and updates correctly.

#### Acceptance Criteria

1. WHEN queues exist in LocalStack, THE Tree_View SHALL display all configured queues
2. WHEN a queue is clicked in the Tree_View, THE Extension SHALL open a Webview for that queue
3. WHEN the refresh button is clicked, THE Tree_View SHALL reload queue data
4. WHEN a queue is added, THE Tree_View SHALL display the new queue without requiring manual refresh
5. WHEN a queue is removed, THE Tree_View SHALL remove the queue from the display
6. WHEN queue attributes are refreshed, THE Tree_View SHALL update the displayed queue information
7. THE Tree_View SHALL display queue names correctly
8. THE Tree_View SHALL display queue message counts as badges or decorations
9. WHEN no queues are configured, THE Tree_View SHALL display an appropriate empty state message

### Requirement 6: Webview Functionality Testing

**User Story:** As a developer, I want to test webview functionality, so that I can verify the Svelte UI works correctly within VS Code.

#### Acceptance Criteria

1. WHEN a queue is selected, THE Extension SHALL create a Webview with the correct title
2. WHEN the Webview loads, THE Webview SHALL display the Queue Info tab by default
3. WHEN the Webview loads, THE Webview SHALL display queue attributes (message count, in-flight count, etc.)
4. WHEN the Main Queue tab is clicked, THE Webview SHALL switch to the message list view
5. WHEN the DLQ tab is clicked and a DLQ exists, THE Webview SHALL switch to the DLQ message list view
6. WHEN the DLQ tab is clicked and no DLQ exists, THE Webview SHALL display the tab as disabled
7. THE Webview SHALL support communication between the Extension and the Svelte UI via postMessage
8. WHEN the Webview is closed, THE Extension SHALL clean up resources and event listeners
9. WHEN multiple queues are opened, THE Extension SHALL create separate Webview instances for each queue

### Requirement 7: Message Polling Testing

**User Story:** As a developer, I want to test message polling, so that I can verify messages are retrieved and displayed correctly.

#### Acceptance Criteria

1. WHEN the Poll button is clicked, THE Webview SHALL start polling for messages with a 120-second duration
2. WHILE polling is active, THE Webview SHALL display a progress bar showing elapsed time and percentage
3. WHILE polling is active, THE Webview SHALL display the count of messages found
4. WHEN messages are received during polling, THE Webview SHALL add them to the message table
5. WHEN duplicate messages are received, THE Webview SHALL deduplicate by message ID
6. WHEN the Stop button is clicked during polling, THE Webview SHALL stop polling immediately
7. WHEN polling completes after 120 seconds, THE Webview SHALL stop automatically
8. WHEN the user switches tabs during polling, THE Webview SHALL stop polling silently
9. WHEN polling encounters an error, THE Webview SHALL display an error message and stop polling

### Requirement 8: Message Operations Testing

**User Story:** As a developer, I want to test message operations, so that I can verify message selection, deletion, and details display work correctly.

#### Acceptance Criteria

1. WHEN a message row is clicked, THE Webview SHALL display the message details panel below the table
2. WHEN a message checkbox is clicked, THE Webview SHALL select the message and display the bulk actions bar
3. WHEN multiple message checkboxes are clicked, THE Webview SHALL select all checked messages
4. WHEN the select-all checkbox is clicked, THE Webview SHALL select all messages on the current page
5. WHEN the Delete button is clicked for a single message, THE Webview SHALL display a confirmation dialog
6. WHEN the bulk Delete button is clicked, THE Webview SHALL display a confirmation dialog with the count of selected messages
7. WHEN message deletion is confirmed, THE Extension SHALL delete the messages from SQS
8. WHEN message deletion succeeds, THE Webview SHALL remove the deleted messages from the table
9. WHEN message deletion fails, THE Webview SHALL display an error message
10. WHEN the message details panel is open, THE Webview SHALL display the message ID, receipt handle, attributes, and body
11. WHEN the close button is clicked on the message details panel, THE Webview SHALL close the panel

### Requirement 9: DLQ Operations Testing

**User Story:** As a developer, I want to test DLQ operations, so that I can verify dead letter queue message handling works correctly.

#### Acceptance Criteria

1. WHEN a queue has a configured DLQ, THE Webview SHALL enable the DLQ tab
2. WHEN the DLQ tab is opened, THE Webview SHALL load messages from the DLQ
3. WHEN DLQ messages are selected, THE Webview SHALL display a "Redrive Selected" button
4. WHEN the Redrive button is clicked, THE Extension SHALL move selected messages from the DLQ to the main queue
5. WHEN redrive succeeds, THE Webview SHALL remove the redriven messages from the DLQ table
6. WHEN redrive fails, THE Webview SHALL display an error message
7. THE Webview SHALL display the DLQ message count in the tab badge
8. WHEN a queue has no DLQ configured, THE Webview SHALL disable the DLQ tab

### Requirement 10: Test Fixtures and Helpers

**User Story:** As a developer, I want reusable test fixtures and helpers, so that I can write tests efficiently without duplicating code.

#### Acceptance Criteria

1. THE Test_Fixture SHALL provide a function to create test queues with configurable attributes
2. THE Test_Fixture SHALL provide a function to send test messages to queues
3. THE Test_Fixture SHALL provide a function to configure AWS credentials for LocalStack
4. THE Test_Fixture SHALL provide a function to wait for the Extension to activate
5. THE Test_Fixture SHALL provide a function to open a queue in the Webview
6. THE Test_Fixture SHALL provide a function to interact with Webview elements via postMessage
7. THE Page_Object SHALL encapsulate Webview UI interactions (clicking buttons, selecting messages, etc.)
8. THE Page_Object SHALL provide methods for common assertions (message count, tab state, etc.)
9. THE Test_Fixture SHALL provide a function to generate random test data (queue names, message bodies, etc.)
10. THE Test_Fixture SHALL provide a function to clean up all test resources after test completion

### Requirement 11: Error Handling Testing

**User Story:** As a developer, I want to test error handling, so that I can verify the extension handles failures gracefully.

#### Acceptance Criteria

1. WHEN LocalStack is unavailable, THE Extension SHALL display an error message indicating connection failure
2. WHEN a queue URL is invalid, THE Extension SHALL display an error message and not add the queue
3. WHEN AWS credentials are invalid, THE Extension SHALL display an authentication error
4. WHEN a queue is deleted in AWS but still in the Tree_View, THE Extension SHALL handle the missing queue gracefully
5. WHEN message polling fails due to network error, THE Webview SHALL display an error message
6. WHEN message deletion fails, THE Webview SHALL display an error message and not remove messages from the table
7. WHEN the Webview fails to load, THE Extension SHALL log an error and display a fallback message
8. WHEN postMessage communication fails, THE Extension SHALL log an error and handle the failure gracefully

### Requirement 12: CI/CD Integration

**User Story:** As a developer, I want CI/CD integration, so that E2E tests run automatically on every commit and pull request.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL install all required dependencies including @vscode/test-electron
2. THE CI_Pipeline SHALL start LocalStack before running tests
3. THE CI_Pipeline SHALL execute all E2E tests in headless mode
4. THE CI_Pipeline SHALL fail the build if any E2E test fails
5. THE CI_Pipeline SHALL upload test artifacts (screenshots, logs, videos) when tests fail
6. THE CI_Pipeline SHALL generate and upload a Coverage_Report
7. THE CI_Pipeline SHALL run tests on multiple platforms (Linux, macOS, Windows)
8. THE CI_Pipeline SHALL cache dependencies to improve build performance
9. WHEN tests fail in CI, THE CI_Pipeline SHALL provide clear error messages and links to artifacts

### Requirement 13: Test Coverage Reporting

**User Story:** As a developer, I want test coverage reporting, so that I can identify untested code paths.

#### Acceptance Criteria

1. THE Test_Runner SHALL collect code coverage data during test execution
2. THE Test_Runner SHALL generate a Coverage_Report in HTML format
3. THE Test_Runner SHALL generate a Coverage_Report in JSON format for CI integration
4. THE Coverage_Report SHALL show line coverage, branch coverage, and function coverage
5. THE Coverage_Report SHALL highlight uncovered code paths
6. THE Test_Runner SHALL support a minimum coverage threshold configuration
7. WHEN coverage falls below the threshold, THE Test_Runner SHALL fail the test run
8. THE Coverage_Report SHALL exclude test files and node_modules from coverage calculations

### Requirement 14: Test Organization and Structure

**User Story:** As a developer, I want well-organized test files, so that I can easily find and maintain tests.

#### Acceptance Criteria

1. THE Test_Runner SHALL organize tests in a `tests/e2e/` directory
2. THE Test_Runner SHALL support test files with `.test.ts` or `.spec.ts` extensions
3. THE Test_Runner SHALL organize tests by feature area (activation, commands, tree-view, webview, etc.)
4. THE Test_Runner SHALL place Page_Object classes in a `tests/e2e/pages/` directory
5. THE Test_Runner SHALL place Test_Fixture functions in a `tests/e2e/fixtures/` directory
6. THE Test_Runner SHALL place test utilities in a `tests/e2e/utils/` directory
7. THE Test_Runner SHALL support test configuration files for environment-specific settings
8. THE Test_Runner SHALL support test data files for fixtures and mock data

### Requirement 15: Performance and Reliability

**User Story:** As a developer, I want reliable and performant tests, so that the test suite runs quickly and consistently.

#### Acceptance Criteria

1. THE Test_Runner SHALL complete the full E2E test suite in under 10 minutes
2. THE Test_Runner SHALL support parallel test execution where tests are independent
3. THE Test_Runner SHALL implement appropriate wait strategies to avoid flaky tests
4. THE Test_Runner SHALL retry failed tests up to 2 times in CI environments
5. THE Test_Runner SHALL use explicit waits instead of fixed sleep delays
6. THE Test_Runner SHALL clean up resources between tests to prevent state leakage
7. THE Test_Runner SHALL support test isolation to prevent tests from affecting each other
8. WHEN a test times out, THE Test_Runner SHALL provide diagnostic information about the timeout

