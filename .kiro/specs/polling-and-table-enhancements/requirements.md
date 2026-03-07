# Requirements Document

## Introduction

This document specifies requirements for enhancing the VS Code SQS Management Tool extension with polling functionality and table-based message display. The feature ports existing functionality from a working Svelte web UI (frontend/) to the VS Code extension's webview, which uses vanilla HTML/CSS/JavaScript. The goal is to achieve feature parity with the web UI while adapting to VS Code's webview architecture and postMessage communication pattern.

## Glossary

- **Extension**: The VS Code SQS Management Tool extension
- **Webview**: The VS Code webview panel that displays queue details and messages
- **Frontend**: The existing Svelte-based web UI implementation (reference implementation)
- **Message_Table**: The table component that displays SQS messages with checkboxes and actions
- **Polling_Controller**: The component that manages continuous message polling operations
- **Bulk_Actions_Bar**: The UI element that appears when messages are selected, showing bulk operation options
- **DLQ**: Dead Letter Queue - a queue that stores messages that failed processing
- **Peek_Mode**: A mode where messages are immediately made available again by resetting visibility timeout to 0
- **Visibility_Timeout**: The duration (in seconds) that a message is hidden from other consumers after being received
- **Wait_Time**: The duration (in seconds) that the receive call waits for messages (long polling)
- **Message_Deduplication**: The process of filtering out duplicate messages by message ID
- **Confirmation_Dialog**: A UI element that appears above the table to confirm destructive actions
- **Progress_Bar**: A visual indicator showing polling progress and message count
- **Info_Banner**: A green informational banner explaining the three polling modes
- **Pagination_Controls**: UI elements for navigating through pages of messages
- **Message_Details_Panel**: An expandable panel below the table showing full message details

## Requirements

### Requirement 1: Table-Based Message Display

**User Story:** As a developer, I want to view SQS messages in a table format with checkboxes, so that I can efficiently scan and select multiple messages for bulk operations.

#### Acceptance Criteria

1. THE Message_Table SHALL display messages in a table with columns: Checkbox, Message ID, Body Preview, Timestamp, Receive Count, Attributes, Actions
2. THE Message_Table SHALL include a "Select All" checkbox in the table header
3. WHEN a user clicks a message row (excluding the checkbox), THE Webview SHALL expand a Message_Details_Panel below the table
4. WHEN a user clicks a checkbox, THE Webview SHALL toggle the selection state of that message
5. WHEN a message is selected, THE Message_Table SHALL highlight the row with a background color
6. THE Message_Table SHALL truncate the Body Preview column to 50 characters
7. THE Message_Table SHALL format the Timestamp column using the SentTimestamp attribute
8. THE Message_Table SHALL display the ApproximateReceiveCount in the Receive Count column
9. THE Message_Table SHALL display the count of message attributes in the Attributes column
10. THE Actions column SHALL contain only a delete icon (trash emoji or symbol)

### Requirement 2: Checkbox Selection Behavior

**User Story:** As a developer, I want to select individual messages or all messages at once, so that I can perform bulk operations efficiently.

#### Acceptance Criteria

1. WHEN a user clicks the "Select All" checkbox, THE Webview SHALL select all messages on the current page
2. WHEN all messages on the current page are selected, THE "Select All" checkbox SHALL display as checked
3. WHEN a user clicks a message checkbox, THE Webview SHALL toggle selection for that message only
4. WHEN a user clicks a message row (not the checkbox), THE Webview SHALL NOT toggle selection
5. THE Webview SHALL maintain selection state when switching between pages
6. WHEN a user switches tabs, THE Webview SHALL clear all selections
7. WHEN a user switches queues, THE Webview SHALL clear all selections

### Requirement 3: Bulk Actions Bar

**User Story:** As a developer, I want to perform bulk operations on selected messages, so that I can efficiently manage multiple messages at once.

#### Acceptance Criteria

1. WHEN one or more messages are selected, THE Bulk_Actions_Bar SHALL appear above the Message_Table
2. WHEN no messages are selected, THE Bulk_Actions_Bar SHALL be hidden
3. THE Bulk_Actions_Bar SHALL display the count of selected messages in the format "X selected"
4. THE Bulk_Actions_Bar SHALL include a "Delete Selected" button
5. THE Bulk_Actions_Bar SHALL include a "Clear Selection" button
6. WHERE the active tab is DLQ, THE Bulk_Actions_Bar SHALL include a "Redrive Selected" button
7. WHEN a user clicks "Delete Selected", THE Webview SHALL display a Confirmation_Dialog
8. WHEN a user clicks "Clear Selection", THE Webview SHALL deselect all messages
9. WHEN a user clicks "Redrive Selected" in the DLQ tab, THE Webview SHALL display a Confirmation_Dialog

### Requirement 4: Delete Confirmation Dialog

**User Story:** As a developer, I want to confirm destructive actions before they execute, so that I can avoid accidentally deleting messages.

#### Acceptance Criteria

1. WHEN a user initiates a delete action, THE Confirmation_Dialog SHALL appear above the Message_Table
2. THE Confirmation_Dialog SHALL display the message ID of the message being deleted
3. THE Confirmation_Dialog SHALL include a "Delete" button and a "Cancel" button
4. WHEN a user clicks the delete icon in the Actions column, THE Webview SHALL select the corresponding row
5. WHEN a user clicks "Delete" in the Confirmation_Dialog, THE Extension SHALL delete the message via the backend API
6. WHEN a user clicks "Cancel" in the Confirmation_Dialog, THE Webview SHALL close the dialog without deleting
7. WHEN a delete operation succeeds, THE Webview SHALL display a success message and refresh the message list
8. WHEN a delete operation fails, THE Webview SHALL display an error message

### Requirement 5: Continuous Polling Implementation

**User Story:** As a developer, I want to continuously poll for messages over a fixed duration, so that I can accumulate messages in real-time like the AWS Console.

#### Acceptance Criteria

1. THE Polling_Controller SHALL provide two buttons: "Poll for Messages" (primary blue) and "Receive Once" (secondary gray)
2. WHEN a user clicks "Poll for Messages", THE Polling_Controller SHALL continuously poll for 120 seconds
3. WHEN polling is active, THE Polling_Controller SHALL make repeated API calls with 100ms delay between calls
4. WHEN polling is active, THE Polling_Controller SHALL accumulate messages in real-time
5. THE Polling_Controller SHALL deduplicate messages by message ID across all polling iterations
6. WHEN polling is active, THE Polling_Controller SHALL update the Message_Table as new messages arrive
7. WHEN polling is active, THE Polling_Controller SHALL stop at 100 messages maximum
8. WHEN polling is active, THE Polling_Controller SHALL display a Progress_Bar showing percentage complete and message count
9. WHEN polling is active, THE Polling_Controller SHALL display a "Stop" button (red)
10. WHEN a user clicks "Stop", THE Polling_Controller SHALL immediately stop polling
11. WHEN a user switches tabs during polling, THE Polling_Controller SHALL silently stop polling
12. WHEN polling completes, THE Polling_Controller SHALL set progress to 100%

### Requirement 6: Polling Progress Display

**User Story:** As a developer, I want to see real-time progress during polling, so that I know how many messages have been found and how much time remains.

#### Acceptance Criteria

1. WHEN polling is active, THE Progress_Bar SHALL display a visual progress indicator
2. THE Progress_Bar SHALL update every second to reflect elapsed time
3. THE Progress_Bar SHALL display text in the format "Polling for messages... X% complete (Y found so far)"
4. THE Progress_Bar SHALL calculate percentage as (elapsed time / 120 seconds) * 100
5. WHEN polling completes, THE Progress_Bar SHALL display 100% completion
6. WHEN polling stops early, THE Progress_Bar SHALL be hidden
7. THE Progress_Bar SHALL use a gradient fill (blue to darker blue) for visual appeal

### Requirement 7: Polling Control Inputs

**User Story:** As a developer, I want to configure polling parameters, so that I can control message visibility and wait times.

#### Acceptance Criteria

1. THE Polling_Controller SHALL provide a "Visibility (s)" input field with range 0-43200
2. THE Polling_Controller SHALL provide a "Wait Time (s)" input field with range 0-20
3. THE Polling_Controller SHALL provide a "Peek Mode" checkbox
4. WHEN Peek Mode is enabled, THE Extension SHALL immediately reset visibility timeout to 0 after receiving messages
5. THE Polling_Controller SHALL use the configured Visibility value for all receive operations
6. THE Polling_Controller SHALL use the configured Wait Time value for all receive operations
7. THE Polling_Controller SHALL default Visibility to 0 seconds (as this is a queue management tool, not a message consumer)
8. THE Polling_Controller SHALL default Wait Time to 20 seconds
9. THE Polling_Controller SHALL default Peek Mode to enabled

### Requirement 8: Informational Banner

**User Story:** As a developer, I want to understand the three polling modes, so that I can choose the appropriate mode for my use case.

#### Acceptance Criteria

1. THE Info_Banner SHALL display above the Message_Table
2. THE Info_Banner SHALL use a green background color
3. THE Info_Banner SHALL display the text: "💡 Poll for Messages: Continuously receives for up to 120s (like AWS Console). Receive Once: Gets a single batch. Messages are deduplicated by ID. Peek Mode: Immediately resets visibility timeout to 0."
4. THE Info_Banner SHALL be visible at all times when viewing the Main Queue or DLQ tabs
5. THE Info_Banner SHALL use bold text for the mode names

### Requirement 9: Receive Once Functionality

**User Story:** As a developer, I want to receive a single batch of messages, so that I can quickly check for new messages without continuous polling.

#### Acceptance Criteria

1. WHEN a user clicks "Receive Once", THE Extension SHALL make a single API call to receive messages
2. THE Extension SHALL use the configured maxMessages, visibilityTimeout, and waitTimeSeconds parameters
3. THE Extension SHALL deduplicate messages by message ID within the received batch
4. WHEN the receive operation completes, THE Webview SHALL update the Message_Table with the received messages
5. WHEN the receive operation fails, THE Webview SHALL display an error message
6. THE "Receive Once" button SHALL be disabled during polling operations
7. THE "Receive Once" button SHALL display "Loading..." text while the operation is in progress

### Requirement 10: Pagination Implementation

**User Story:** As a developer, I want to navigate through pages of messages, so that I can view large message sets without overwhelming the UI.

#### Acceptance Criteria

1. THE Pagination_Controls SHALL display only when the total message count exceeds the page size
2. THE Pagination_Controls SHALL default to 10 messages per page
3. THE Pagination_Controls SHALL include "Previous" and "Next" buttons
4. THE Pagination_Controls SHALL display a page indicator in the format "Page X of Y"
5. THE Pagination_Controls SHALL include a page size selector with options: 10, 25, 50
6. WHEN a user changes the page size, THE Webview SHALL reset to page 1
7. WHEN a user switches tabs, THE Webview SHALL reset to page 1
8. WHEN a user switches queues, THE Webview SHALL reset to page 1
9. THE "Previous" button SHALL be disabled when on page 1
10. THE "Next" button SHALL be disabled when on the last page

### Requirement 11: Message Count Display

**User Story:** As a developer, I want to see how many messages are currently displayed, so that I understand the scope of the data I'm viewing.

#### Acceptance Criteria

1. THE Webview SHALL display a message count in the format "Showing X of Y received"
2. THE message count SHALL appear in the top right of the controls section
3. THE message count SHALL update in real-time during polling
4. THE message count SHALL reflect the total number of messages received, not just the current page
5. WHEN no messages are received, THE message count SHALL display "Showing 0 of 0 received"

### Requirement 12: Message Details Panel

**User Story:** As a developer, I want to view full message details when I click on a message row, so that I can inspect message content, attributes, and receipt handle without truncation.

#### Acceptance Criteria

1. WHEN a user clicks a message row (excluding checkbox and action buttons), THE Message_Details_Panel SHALL expand below the Message_Table
2. THE Message_Details_Panel SHALL display a header with "Message Details" title and a close button (× in red circle)
3. THE Message_Details_Panel SHALL display "Message ID:" label followed by the full message ID
4. THE Message_Details_Panel SHALL display "Receipt Handle:" label followed by the full receipt handle in monospace font
5. THE Message_Details_Panel SHALL display "Message Attributes:" section if attributes exist
6. THE Message_Details_Panel SHALL display each message attribute as a key-value pair in a styled badge format
7. THE Message_Details_Panel SHALL display "Body:" label followed by the full message body in a code block with monospace font
8. THE Message_Details_Panel SHALL use a white background (light theme) or dark background (dark theme)
9. THE Message_Details_Panel SHALL include a border and shadow for visual separation
10. WHEN a user clicks the close button (×), THE Message_Details_Panel SHALL collapse and hide
11. WHEN a user clicks a different message row, THE Message_Details_Panel SHALL update to show the new message details
12. WHEN a user switches tabs, THE Message_Details_Panel SHALL close automatically
13. WHEN a user switches queues, THE Message_Details_Panel SHALL close automatically
14. THE Message_Details_Panel SHALL be applicable to both Main Queue and DLQ tabs
15. THE Message_Details_Panel SHALL preserve line breaks and formatting in the message body

### Requirement 13: DLQ Tab Integration

**User Story:** As a developer, I want to view and manage DLQ messages with the same table interface, so that I have a consistent experience across queue types.

#### Acceptance Criteria

1. THE DLQ tab SHALL use the same Message_Table structure as the Main Queue tab
2. THE DLQ tab SHALL support polling with the same Polling_Controller
3. THE DLQ tab SHALL support "Receive Once" functionality
4. THE DLQ tab SHALL support message selection and bulk actions
5. THE DLQ tab SHALL include a "Redrive Selected" button in the Bulk_Actions_Bar
6. WHEN a user clicks "Redrive Selected", THE Extension SHALL send selected messages to the main queue
7. WHEN a redrive operation succeeds, THE Webview SHALL display a success message and refresh both DLQ and main queue message lists
8. WHEN a redrive operation fails, THE Webview SHALL display an error message with details
9. THE DLQ tab badge SHALL display the current DLQ message count

### Requirement 14: Queue Info Tab Auto-Load

**User Story:** As a developer, I want queue information to load automatically when I select a queue, so that I don't have to manually switch tabs to see the data.

#### Acceptance Criteria

1. WHEN a user selects a queue from the tree view, THE Webview SHALL default to the Queue Info tab
2. WHEN the Queue Info tab is displayed, THE Extension SHALL automatically fetch and display queue attributes
3. THE Queue Info tab SHALL display queue attributes without requiring a tab switch
4. THE Queue Info tab SHALL display queue URL, region, and all SQS attributes
5. WHEN queue attributes fail to load, THE Webview SHALL display an error message

### Requirement 15: Code Reuse from Frontend

**User Story:** As a developer implementing this feature, I want to maximize code reuse from the Svelte frontend, so that I can maintain consistency and reduce implementation time.

#### Acceptance Criteria

1. THE implementation SHALL copy HTML structure directly from MessageTable.svelte
2. THE implementation SHALL copy CSS styles directly from MessageTable.svelte
3. THE implementation SHALL convert Svelte $state variables to regular JavaScript variables with manual DOM updates
4. THE implementation SHALL convert Svelte $derived computations to JavaScript functions
5. THE implementation SHALL convert Svelte $effect blocks to event listeners
6. THE implementation SHALL adapt API calls from frontend/src/lib/api.ts to the postMessage pattern
7. THE implementation SHALL reference the polling logic from MessageTable.svelte lines 95-250
8. THE implementation SHALL use VS Code theme variables (var(--vscode-*)) for all colors
9. THE implementation SHALL support both dark and light themes
10. THE implementation SHALL maintain the same visual design as the Frontend

### Requirement 16: Styling and Theme Support

**User Story:** As a developer, I want the extension UI to match VS Code's theme, so that it feels native to the editor environment.

#### Acceptance Criteria

1. THE Webview SHALL use VS Code theme variables for all colors
2. THE Webview SHALL support dark theme with appropriate color adjustments
3. THE Webview SHALL support light theme with appropriate color adjustments
4. THE Webview SHALL use var(--vscode-button-background) for primary buttons
5. THE Webview SHALL use var(--vscode-button-secondaryBackground) for secondary buttons
6. THE Webview SHALL use var(--vscode-errorForeground) for danger buttons
7. THE Webview SHALL use var(--vscode-editor-background) for the main background
8. THE Webview SHALL use var(--vscode-editorGroup-border) for table borders
9. THE Webview SHALL use var(--vscode-list-hoverBackground) for row hover effects
10. THE Webview SHALL use var(--vscode-input-background) for input fields

### Requirement 17: Loading States

**User Story:** As a developer, I want to see loading indicators during operations, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHEN a message operation is in progress, THE corresponding button SHALL display a loading state
2. THE "Receive Once" button SHALL display "Loading..." text during receive operations
3. THE "Poll for Messages" button SHALL display "Polling... (X calls)" text during polling
4. THE "Delete" button SHALL display "Deleting..." text during delete operations
5. THE "Redrive Selected" button SHALL display "Processing..." text during redrive operations
6. WHEN an operation is in progress, THE corresponding button SHALL be disabled
7. WHEN an operation completes, THE button SHALL return to its default state
8. WHEN an operation fails, THE button SHALL return to its default state

### Requirement 18: Error and Success Messages

**User Story:** As a developer, I want to see clear feedback after operations, so that I know whether they succeeded or failed.

#### Acceptance Criteria

1. WHEN a message is deleted successfully, THE Webview SHALL display "Message deleted successfully" in a success banner
2. WHEN a message deletion fails, THE Webview SHALL display an error message with the failure reason
3. WHEN messages are redriven successfully, THE Webview SHALL display "Successfully redriven X message(s)" in a success banner
4. WHEN a redrive operation fails, THE Webview SHALL display an error message with the failure reason
5. WHEN polling finds no messages, THE Webview SHALL display "No messages found in the queue" in an error banner
6. THE success banner SHALL use a green background color
7. THE error banner SHALL use a red background color
8. THE success banner SHALL auto-dismiss after 5 seconds
9. THE error banner SHALL remain visible until dismissed or a new operation starts

### Requirement 19: Tab Switching Behavior

**User Story:** As a developer, I want consistent behavior when switching between tabs, so that I have a predictable experience.

#### Acceptance Criteria

1. WHEN a user switches from Main Queue to DLQ tab, THE Webview SHALL clear all selections
2. WHEN a user switches from DLQ to Main Queue tab, THE Webview SHALL clear all selections
3. WHEN a user switches to Queue Info tab, THE Webview SHALL clear all selections
4. WHEN a user switches tabs during polling, THE Polling_Controller SHALL silently stop polling
5. WHEN a user switches tabs, THE Webview SHALL reset pagination to page 1
6. WHEN a user switches tabs, THE Webview SHALL close any open Message_Details_Panel
7. THE active tab SHALL be visually indicated with a blue background and white text

### Requirement 20: File Modifications

**User Story:** As a developer implementing this feature, I want to know which files to modify, so that I can scope the implementation correctly.

#### Acceptance Criteria

1. THE implementation SHALL modify vscode-extension/sqs-management-tool/src/extension.ts
2. THE implementation SHALL modify vscode-extension/sqs-management-tool/media/main.js
3. THE implementation SHALL add new message handlers to extension.ts for polling operations
4. THE implementation SHALL add new event listeners to main.js for table interactions
5. THE implementation SHALL preserve existing functionality in both files
6. THE implementation SHALL maintain backward compatibility with existing queue management features
7. THE implementation SHALL add CSS styles to the webview HTML template in extension.ts
8. THE implementation SHALL ensure all new code follows the existing code style and conventions
