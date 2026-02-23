# Requirements Document

## Introduction

This feature adds comprehensive end-to-end tests using Playwright to verify the SQS Management Tool frontend UI works correctly across all major user flows. The tests will catch regressions before they reach production and ensure the UI behaves as expected across different scenarios including queue management, message operations, DLQ operations, settings, polling behavior, and tab switching consistency.

## Glossary

- **SQS Management Tool**: The web application for managing AWS SQS queues, messages, and dead-letter queues
- **Playwright**: A Node.js library for browser automation and E2E testing
- **E2E Test**: End-to-end test that simulates real user interactions with the UI
- **Queue**: An AWS SQS queue configuration displayed in the sidebar
- **Message**: An SQS message displayed in the message viewer
- **DLQ**: Dead Letter Queue - a special queue for messages that failed processing
- **Redrive**: The operation of moving messages from a DLQ back to the original queue
- **Polling**: The automatic refresh of messages from the server at regular intervals

## Requirements

### Requirement 1: Queue Management Operations

**User Story:** As a user, I want to perform queue management operations, so that I can manage my SQS queues through the UI.

#### Acceptance Criteria

1. WHEN the application loads, THE UI SHALL display the queue list sidebar with available queues
2. WHEN the user clicks the "Add Queue" button, THE UI SHALL display a modal form for queue configuration
3. WHEN valid queue configuration is submitted, THE QueueList SHALL update to include the new queue
4. WHEN the user selects a queue from the list, THE UI SHALL display the queue details in the main content area
5. WHEN the user clicks the "Remove Queue" button, THE QueueList SHALL remove the selected queue
6. IF an error occurs during queue operation, THE UI SHALL display an error toast notification

### Requirement 2: Message Operations

**User Story:** As a user, I want to send, receive, and delete messages, so that I can interact with SQS queues.

#### Acceptance Criteria

1. WHEN the user clicks the "Send Message" button, THE MessageComposer SHALL accept message body input
2. WHEN a valid message is submitted, THE MessageTable SHALL display the new message
3. WHEN the user clicks the "Receive Messages" button, THE MessageViewer SHALL load messages from the selected queue
4. WHEN messages are displayed, THE MessageTable SHALL show message details including body, MD5, and timestamp
5. WHEN the user selects a message and clicks "Delete", THE MessageTable SHALL remove the deleted message
6. IF message operation fails, THE UI SHALL display an error toast notification

### Requirement 3: DLQ Operations

**User Story:** As a user, I want to view and manage DLQ messages, so that I can troubleshoot failed messages.

#### Acceptance Criteria

1. WHEN a queue has a DLQ configured, THE UI SHALL display a "Dead Letter Queue" section
2. WHEN the user clicks "View DLQ Messages", THE MessageViewer SHALL load messages from the DLQ
3. WHEN messages are displayed from DLQ, THE UI SHALL indicate they are from the DLQ
4. WHEN the user selects DLQ messages and clicks "Redrive", THE RedrivePanel SHALL initiate the redrive operation
5. WHEN redrive completes successfully, THE UI SHALL show a success notification
6. IF DLQ operation fails, THE UI SHALL display an error toast notification

### Requirement 4: Settings Configuration

**User Story:** As a user, I want to configure AWS settings, so that I can connect to different AWS environments.

#### Acceptance Criteria

1. WHEN the user clicks the "Settings" button, THE SettingsPanel SHALL open in a modal
2. WHEN the settings modal opens, THE UI SHALL display AWS profile configuration fields
3. WHEN valid credentials are provided and "Test Connection" is clicked, THE UI SHALL show connection status
4. WHEN settings are saved, THE AppStore SHALL persist the configuration
5. IF credential test fails, THE UI SHALL display an error message in the settings panel
6. WHERE multiple profiles exist, THE SettingsPanel SHALL allow profile selection

### Requirement 5: Polling Behavior

**User Story:** As a user, I want automatic message polling, so that I can see new messages without manual refresh.

#### Acceptance Criteria

1. WHEN polling is enabled, THE MessageViewer SHALL automatically fetch messages at configured intervals
2. WHEN new messages arrive, THE MessageTable SHALL update to display the new messages
3. WHEN polling is disabled, THE MessageViewer SHALL stop automatic message fetching
4. WHILE polling is active, THE UI SHALL display a polling indicator
5. IF polling fails, THE UI SHALL log the error and continue attempting to poll

### Requirement 6: View Mode Consistency

**User Story:** As a user, I want consistent view modes across tabs, so that I can maintain my preferred display format.

#### Acceptance Criteria

1. WHEN the user switches between Cards and Table view, THE UI SHALL maintain the selected view mode
2. WHEN the user switches between Main Queue and DLQ tabs, THE UI SHALL preserve the current view mode
3. WHEN a different queue is selected, THE UI SHALL maintain the last used view mode
4. IF view mode is invalid, THE UI SHALL default to Cards view

### Requirement 7: Error Handling and Validation

**User Story:** As a user, I want clear error messages, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN an API call fails, THE UI SHALL display a descriptive error message
2. WHEN invalid input is provided, THE UI SHALL validate and show field-specific error messages
3. IF network connectivity is lost, THE UI SHALL display a connection error notification
4. WHEN an unexpected error occurs, THE UI SHALL log the error and show a user-friendly message
5. IF a required field is missing, THE UI SHALL prevent submission and highlight the missing field

### Requirement 8: Visual Regression Testing

**User Story:** As a developer, I want visual regression tests, so that I can catch UI layout issues early.

#### Acceptance Criteria

1. WHEN tests run, THE Playwright SHALL capture screenshots of key UI states
2. WHEN visual regression is enabled, THE UI SHALL compare screenshots against baselines
3. IF visual differences exceed threshold, THE test SHALL fail and report the differences
4. WHERE UI elements have dynamic content, THE test SHALL ignore variable regions
5. WHEN new features are added, THE test suite SHALL include visual checks for new components

### Requirement 9: CI/CD Integration

**User Story:** As a developer, I want E2E tests in CI/CD, so that I can catch regressions before merging.

#### Acceptance Criteria

1. WHEN a pull request is opened, THE CI pipeline SHALL run E2E tests
2. WHEN E2E tests fail, THE CI pipeline SHALL block merge and show test results
3. WHEN E2E tests pass, THE CI pipeline SHALL allow merge
4. WHERE headless mode is available, THE tests SHALL run in headless mode for speed
5. WHEN tests complete, THE CI pipeline SHALL generate and publish test reports

### Requirement 10: Test Infrastructure

**User Story:** As a developer, I want a robust test infrastructure, so that I can write and maintain tests efficiently.

#### Acceptance Criteria

1. WHEN tests are created, THE Playwright SHALL be configured for Svelte applications
2. WHEN tests run, THE test runner SHALL provide clear pass/fail output
3. WHERE tests fail, THE test runner SHALL provide detailed error messages and stack traces
4. WHEN debugging is needed, THE test recorder SHALL capture user interactions
5. IF test dependencies need updating, THE package.json SHALL include Playwright dependencies