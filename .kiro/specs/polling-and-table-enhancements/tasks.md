# Implementation Plan: Polling and Table Enhancements

## Overview

This implementation plan converts the polling functionality and table-based message display from the Svelte web UI to the VS Code extension's webview using vanilla HTML/CSS/JavaScript. The implementation follows the 10-phase checklist from the design document, with each task building incrementally on previous work. All code will be added to two existing files: `extension.ts` (~400 lines) and `main.js` (~500 lines).

## Tasks

- [x] 1. Set up HTML structure and CSS in extension.ts
  - Add polling controls section (visibility timeout, wait time, peek mode inputs)
  - Add progress bar container with fill and text elements
  - Add info banner explaining the three polling modes
  - Add bulk actions bar with selection count and action buttons
  - Add confirmation dialog structure
  - Add message details panel structure
  - Add pagination controls (Previous, Next, page size selector)
  - Update message table to include checkbox column in header and rows
  - Add CSS for all new components using VS Code theme variables
  - _Requirements: 1.1, 1.2, 3.1, 5.1, 6.1, 7.1, 7.2, 7.3, 8.1, 8.2, 10.2, 10.3, 10.4, 10.5, 12.2, 16.1-16.10_

- [x] 2. Initialize state management in main.js
  - [x] 2.1 Add pollingState object with all required properties
    - Create pollingState with: active, progress, count, startTime, intervalId, seenMessageIds, messages
    - _Requirements: 5.2, 5.3, 5.5, 6.4_

  - [x] 2.2 Add selection state variables
    - Create selectedMessageIds Set for tracking selected messages
    - _Requirements: 1.4, 2.3_

  - [x] 2.3 Add pagination state variables
    - Create currentPage (default 1) and pageSize (default 10) variables
    - _Requirements: 10.2, 10.6_

  - [x] 2.4 Add message details and tab state variables
    - Create selectedMessage variable for details panel
    - Create activeTab variable (default 'queue')
    - _Requirements: 12.1, 19.7_

- [x] 3. Implement polling functionality in main.js
  - [x] 3.1 Implement pollForMessages() function
    - Initialize polling state (active=true, progress=0, count=0, seenMessageIds=new Set())
    - Set up progress interval to update every second
    - Show progress bar and stop button, disable poll/receive buttons
    - Implement polling loop with 120-second duration
    - Make API calls with 100ms delay between calls
    - Deduplicate messages by messageId using seenMessageIds Set
    - Accumulate messages and update UI in real-time
    - Stop at 100 messages maximum
    - Clean up on completion (clear interval, set progress to 100%)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.12, 6.4, 6.5, 9.3_

  - [ ]* 3.2 Write property test for pollForMessages
    - **Property 1: Message Deduplication During Polling**
    - **Property 12: Polling Duration**
    - **Property 13: Real-Time Message Accumulation**
    - **Property 14: Polling Stop Limit**
    - **Property 15: Progress Calculation**
    - **Property 16: Progress Completion**
    - **Validates: Requirements 5.2, 5.4, 5.5, 5.6, 5.7, 5.12, 6.4, 6.5, 9.3_

  - [x] 3.3 Implement stopPolling() function
    - Set pollingState.active to false
    - Clear progress interval
    - _Requirements: 5.10_

  - [ ]* 3.4 Write property test for stopPolling
    - **Property 17: Manual Polling Stop**
    - **Validates: Requirements 5.10**

  - [x] 3.5 Implement updateProgressBar() function
    - Update progress fill width based on pollingState.progress
    - Update progress text with format "Polling for messages... X% complete (Y found so far)"
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 3.6 Write property test for updateProgressBar
    - **Property 15: Progress Calculation**
    - **Property 23: Message Count Real-Time Update**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 11.3**

- [x] 4. Checkpoint - Verify polling implementation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement selection functionality in main.js
  - [ ] 5.1 Implement toggleMessageSelection() function
    - Toggle message ID in selectedMessageIds Set
    - Update message table to reflect selection state
    - Update bulk actions bar visibility
    - _Requirements: 1.4, 2.3_

  - [ ]* 5.2 Write property test for toggleMessageSelection
    - **Property 3: Selection State Toggle**
    - **Validates: Requirements 1.4, 2.3**

  - [ ] 5.3 Implement toggleSelectAll() function
    - Check if all messages on current page are selected
    - If all selected, deselect all; otherwise select all
    - Update message table and bulk actions bar
    - _Requirements: 2.1, 2.2_

  - [ ]* 5.4 Write property test for toggleSelectAll
    - **Property 4: Select All Consistency**
    - **Validates: Requirements 2.1, 2.2**

  - [ ] 5.5 Implement clearSelection() function
    - Clear selectedMessageIds Set
    - Update message table and bulk actions bar
    - _Requirements: 3.8_

  - [ ] 5.6 Add selection state persistence across pages
    - Ensure selectedMessageIds Set is maintained when changing pages
    - Update checkbox states based on selectedMessageIds when rendering new page
    - _Requirements: 2.5_

  - [ ]* 5.7 Write property test for selection persistence
    - **Property 6: Selection Persistence Across Pages**
    - **Validates: Requirements 2.5**

  - [ ] 5.8 Add selection clearing on context changes
    - Clear selections when switching tabs
    - Clear selections when switching queues
    - _Requirements: 2.6, 2.7_

  - [ ]* 5.9 Write property test for context change clearing
    - **Property 7: Context Change Clears Selection**
    - **Validates: Requirements 2.6, 2.7, 10.7, 10.8, 19.1, 19.2, 19.3**

- [ ] 6. Implement bulk actions in main.js
  - [ ] 6.1 Implement updateBulkActionsBar() function
    - Show bar if selectedMessageIds.size > 0, hide otherwise
    - Update selection count text
    - Show/hide redrive button based on activeTab === 'dlq'
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [ ]* 6.2 Write property test for updateBulkActionsBar
    - **Property 8: Bulk Actions Bar Visibility**
    - **Property 9: Selection Count Display**
    - **Property 10: Conditional Redrive Button**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.6, 13.5**

  - [ ] 6.3 Implement deleteSelected() function
    - Show confirmation dialog with message count
    - Set up confirmation handler to send bulkDeleteMessages postMessage
    - Include receipt handles for all selected messages
    - _Requirements: 3.4, 3.7_

  - [ ]* 6.4 Write property test for deleteSelected
    - **Property 11: Confirmation Dialog Display**
    - **Validates: Requirements 3.7, 3.9, 4.1**

  - [ ] 6.5 Implement redriveSelected() function
    - Check activeTab === 'dlq'
    - Show confirmation dialog with message count
    - Set up confirmation handler to send bulkRedriveMessages postMessage
    - Include full message objects for all selected messages
    - _Requirements: 3.6, 3.9, 13.6_

  - [ ]* 6.6 Write property test for redriveSelected
    - **Property 28: Redrive Operation**
    - **Validates: Requirements 13.6, 13.7**

  - [ ] 6.7 Add confirmation dialog logic
    - Show dialog on delete/redrive actions
    - Handle confirm button click to execute operation
    - Handle cancel button click to close dialog
    - _Requirements: 4.1, 4.3, 4.6_

- [ ] 7. Checkpoint - Verify selection and bulk actions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement pagination in main.js
  - [ ] 8.1 Implement getPaginatedMessages() function
    - Get current message list based on activeTab
    - Calculate start index: (currentPage - 1) * pageSize
    - Return slice of messages for current page
    - _Requirements: 10.1, 10.2_

  - [ ] 8.2 Implement getTotalPages() function
    - Get current message list based on activeTab
    - Return Math.ceil(messages.length / pageSize)
    - _Requirements: 10.4_

  - [ ] 8.3 Implement updatePaginationControls() function
    - Show controls only if total messages > pageSize
    - Disable Previous button when currentPage === 1
    - Disable Next button when currentPage === totalPages
    - Update page indicator text
    - _Requirements: 10.1, 10.4, 10.9, 10.10_

  - [ ]* 8.4 Write property test for pagination controls
    - **Property 19: Pagination Visibility**
    - **Property 20: Page Navigation Boundaries**
    - **Validates: Requirements 10.1, 10.9, 10.10**

  - [ ] 8.5 Implement goToPage() function
    - Validate page number is within bounds
    - Update currentPage
    - Update message table and pagination controls
    - _Requirements: 10.3_

  - [ ] 8.6 Implement changePageSize() function
    - Update pageSize
    - Reset currentPage to 1
    - Update message table and pagination controls
    - _Requirements: 10.5, 10.6_

  - [ ]* 8.7 Write property test for page size change
    - **Property 21: Page Size Change Reset**
    - **Validates: Requirements 10.6**

  - [ ] 8.8 Add pagination reset on context changes
    - Reset to page 1 when switching tabs
    - Reset to page 1 when switching queues
    - _Requirements: 10.7, 10.8_

- [ ] 9. Implement message details panel in main.js
  - [ ] 9.1 Implement openMessageDetails() function
    - Set selectedMessage to clicked message
    - Update panel content: message ID, receipt handle, body
    - Render message attributes if they exist
    - Show panel
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 9.2 Write property test for openMessageDetails
    - **Property 5: Row Click Behavior**
    - **Property 24: Message Details Panel Content**
    - **Validates: Requirements 1.3, 2.4, 12.3, 12.4, 12.5, 12.6, 12.7**

  - [ ] 9.3 Implement closeMessageDetails() function
    - Set selectedMessage to null
    - Hide panel
    - _Requirements: 12.10_

  - [ ] 9.4 Add row click handler
    - Attach click listener to message rows
    - Exclude checkbox and action button clicks
    - Call openMessageDetails() with message data
    - _Requirements: 1.3, 2.4_

  - [ ] 9.5 Add message details panel update logic
    - When clicking different row, update panel content without closing
    - _Requirements: 12.11_

  - [ ]* 9.6 Write property test for panel update
    - **Property 26: Message Details Panel Update**
    - **Validates: Requirements 12.11**

  - [ ] 9.7 Add auto-close on context changes
    - Close panel when switching tabs
    - Close panel when switching queues
    - _Requirements: 12.12, 12.13_

  - [ ]* 9.8 Write property test for panel closing
    - **Property 25: Message Details Panel Closing**
    - **Validates: Requirements 12.10, 12.12, 12.13**

- [ ] 10. Implement tab switching in main.js
  - [ ] 10.1 Implement switchTab() function
    - Update activeTab variable
    - Reset currentPage to 1
    - Clear all selections
    - Close message details panel
    - Stop polling if active (silently)
    - Update tab UI (active class)
    - Show/hide tab content
    - Load data if needed
    - _Requirements: 2.6, 10.7, 12.12, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [ ]* 10.2 Write property test for switchTab
    - **Property 7: Context Change Clears Selection**
    - **Property 18: Tab Switch Stops Polling**
    - **Validates: Requirements 2.6, 5.11, 10.7, 12.12, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6**

  - [ ] 10.3 Add tab event listeners
    - Attach click listeners to all tab buttons
    - Call switchTab() with appropriate tab name
    - _Requirements: 19.7_

- [ ] 11. Checkpoint - Verify UI interactions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement extension backend handlers in extension.ts
  - [ ] 12.1 Add bulkDeleteMessages message handler
    - Receive receiptHandles array from webview
    - Use Promise.allSettled to delete all messages
    - Count successes and failures
    - Send bulkDeleteResult postMessage with counts
    - Show VS Code notification with result
    - _Requirements: 3.4, 3.5, 4.5, 4.7_

  - [ ]* 12.2 Write unit test for bulkDeleteMessages handler
    - Test successful bulk delete
    - Test partial failure (some succeed, some fail)
    - Test complete failure
    - _Requirements: 3.4, 3.5, 4.7, 4.8_

  - [ ] 12.3 Add bulkRedriveMessages message handler
    - Receive messages array from webview
    - Use Promise.allSettled to redrive all messages
    - Count successes and failures
    - Send bulkRedriveResult postMessage with counts
    - Show VS Code notification with result
    - _Requirements: 13.6, 13.7, 13.8_

  - [ ]* 12.4 Write unit test for bulkRedriveMessages handler
    - Test successful bulk redrive
    - Test partial failure
    - Test complete failure
    - _Requirements: 13.6, 13.7, 13.8_

  - [ ] 12.5 Update existing message handlers if needed
    - Ensure fetchMessages and fetchDLQMessages work with polling
    - Ensure deleteMessage works with confirmation dialog
    - _Requirements: 5.3, 9.1_

- [ ] 13. Implement message table rendering in main.js
  - [ ] 13.1 Implement renderMessageRows() function
    - Get paginated messages
    - Clear table body
    - Create row for each message with all columns
    - Add checkbox with selection state
    - Add truncated message ID (20 chars)
    - Add truncated body preview (50 chars)
    - Add formatted timestamp
    - Add receive count
    - Add attribute count
    - Add delete button
    - Apply selected class if message is selected
    - Attach event listeners to checkboxes and rows
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 13.2 Write property test for renderMessageRows
    - **Property 2: Body Preview Truncation**
    - **Property 22: Message Count Display**
    - **Validates: Requirements 1.6, 11.1, 11.4**

  - [ ] 13.3 Implement updateMessageTable() function
    - Call renderMessageRows() with current messages
    - Update pagination controls
    - Update message count display
    - Update bulk actions bar
    - _Requirements: 5.6, 11.1, 11.3_

  - [ ] 13.4 Add message count display logic
    - Calculate showing count (messages on current page)
    - Calculate total count (all messages)
    - Update count text in format "Showing X of Y received"
    - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [ ] 14. Implement DLQ feature parity in main.js
  - [ ] 14.1 Ensure DLQ tab uses same table structure
    - Use same renderMessageRows() function for DLQ messages
    - Use same polling controls for DLQ
    - _Requirements: 13.1, 13.2_

  - [ ] 14.2 Ensure DLQ tab supports all operations
    - Polling (pollForMessages with activeTab check)
    - Receive once (fetchDLQMessages)
    - Selection (same selection functions)
    - Pagination (same pagination functions)
    - Message details (same details panel)
    - _Requirements: 13.3, 13.4_

  - [ ]* 14.3 Write property test for DLQ feature parity
    - **Property 27: DLQ Feature Parity**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

  - [ ] 14.4 Add redrive button visibility logic
    - Show "Redrive Selected" button only when activeTab === 'dlq'
    - _Requirements: 3.6, 13.5_

- [ ] 15. Implement utility functions in main.js
  - [ ] 15.1 Implement truncate() function
    - Return text.substring(0, length) + '...' if text.length > length
    - _Requirements: 1.6_

  - [ ] 15.2 Implement formatTimestamp() function
    - Convert SentTimestamp to Date and format with toLocaleString()
    - _Requirements: 1.7_

  - [ ] 15.3 Implement escapeHtml() function
    - Create div element, set textContent, return innerHTML
    - Use for all user-generated content to prevent XSS
    - _Requirements: 1.6, 12.7_

  - [ ] 15.4 Implement displayError() function
    - Show error container with message
    - Use red background color
    - Auto-hide after 10 seconds
    - _Requirements: 4.8, 9.5, 13.8, 18.2, 18.5, 18.7, 18.9_

  - [ ]* 15.5 Write property test for error messages
    - **Property 31: Operation Feedback Messages**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8**

  - [ ] 15.6 Implement displaySuccess() function
    - Show success container with message
    - Use green background color
    - Auto-hide after 5 seconds
    - _Requirements: 4.7, 13.7, 18.1, 18.3, 18.6, 18.8_

- [ ] 16. Implement loading states in main.js
  - [ ] 16.1 Add loading state for "Receive Once" button
    - Disable button and show "Loading..." text during operation
    - Re-enable and restore text on completion
    - _Requirements: 9.6, 9.7, 17.2_

  - [ ] 16.2 Add loading state for "Poll for Messages" button
    - Disable button and show "Polling... (X calls)" text during operation
    - Re-enable and restore text on completion
    - _Requirements: 17.3_

  - [ ] 16.3 Add loading state for delete operations
    - Show "Deleting..." text on delete button during operation
    - _Requirements: 17.4_

  - [ ] 16.4 Add loading state for redrive operations
    - Show "Processing..." text on redrive button during operation
    - _Requirements: 17.5_

  - [ ]* 16.5 Write property test for loading states
    - **Property 30: Button Loading States**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7**

- [ ] 17. Add event listeners in main.js
  - [ ] 17.1 Add polling control event listeners
    - Poll button click → pollForMessages()
    - Stop button click → stopPolling()
    - Receive once button click → fetchMessages() or fetchDLQMessages()
    - _Requirements: 5.1, 5.9, 5.10, 9.1_

  - [ ] 17.2 Add selection control event listeners
    - Select all checkbox change → toggleSelectAll()
    - Clear selection button click → clearSelection()
    - _Requirements: 2.1, 3.8_

  - [ ] 17.3 Add bulk action event listeners
    - Delete selected button click → deleteSelected()
    - Redrive selected button click → redriveSelected()
    - _Requirements: 3.4, 3.6_

  - [ ] 17.4 Add pagination event listeners
    - Previous button click → goToPage(currentPage - 1)
    - Next button click → goToPage(currentPage + 1)
    - Page size select change → changePageSize(newSize)
    - _Requirements: 10.3, 10.5_

  - [ ] 17.5 Add message details event listeners
    - Close button click → closeMessageDetails()
    - _Requirements: 12.10_

  - [ ] 17.6 Add confirmation dialog event listeners
    - Cancel button click → hide dialog
    - _Requirements: 4.6_

- [ ] 18. Implement message handlers in main.js
  - [ ] 18.1 Add messagesLoaded handler
    - Update messages array with received messages
    - Update message table
    - Handle errors
    - _Requirements: 5.4, 5.6, 9.4_

  - [ ] 18.2 Add dlqMessagesLoaded handler
    - Update dlqMessages array with received messages
    - Update message table
    - Handle errors
    - _Requirements: 13.3_

  - [ ] 18.3 Add bulkDeleteResult handler
    - Display success or error message based on result
    - Refresh message list
    - Clear selections
    - _Requirements: 4.7, 4.8_

  - [ ] 18.4 Add bulkRedriveResult handler
    - Display success or error message based on result
    - Refresh both DLQ and main queue message lists
    - Clear selections
    - _Requirements: 13.7, 13.8_

- [ ] 19. Checkpoint - Verify complete integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Implement Queue Info auto-load in extension.ts
  - [ ] 20.1 Update queue selection handler
    - Default to Queue Info tab when queue is selected
    - Automatically fetch queue attributes
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ] 20.2 Add error handling for queue attributes
    - Display error message if fetch fails
    - _Requirements: 14.5_

- [ ] 21. Add comprehensive styling in extension.ts
  - [ ] 21.1 Add CSS for message table
    - Table structure, borders, spacing
    - Row hover effects
    - Selected row highlighting
    - Checkbox styling
    - _Requirements: 1.1, 1.5, 16.8, 16.9_

  - [ ] 21.2 Add CSS for polling controls
    - Button styles (primary, secondary, danger)
    - Input field styles
    - Progress bar styles with gradient
    - _Requirements: 5.1, 6.7, 7.1, 7.2, 7.3, 16.4, 16.5, 16.6_

  - [ ] 21.3 Add CSS for bulk actions bar
    - Bar layout and spacing
    - Selection count styling
    - Button arrangement
    - _Requirements: 3.1, 16.4, 16.5, 16.6_

  - [ ] 21.4 Add CSS for message details panel
    - Panel layout and spacing
    - Close button styling
    - Attribute badge styling
    - Body content styling with monospace font
    - _Requirements: 12.2, 12.4, 12.6, 12.7, 12.8, 12.9_

  - [ ] 21.5 Add CSS for pagination controls
    - Control layout and spacing
    - Button styles
    - Page indicator styling
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ] 21.6 Add CSS for info banner
    - Green background color
    - Border and padding
    - Bold text for mode names
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ] 21.7 Add CSS for confirmation dialog
    - Orange/warning background color
    - Border and padding
    - Button layout
    - _Requirements: 4.1, 4.3_

  - [ ] 21.8 Add CSS for error and success messages
    - Red background for errors
    - Green background for success
    - Auto-dismiss animation
    - _Requirements: 18.6, 18.7, 18.8, 18.9_

  - [ ] 21.9 Ensure dark and light theme support
    - Test all components in both themes
    - Verify all VS Code theme variables work correctly
    - _Requirements: 16.1, 16.2, 16.3_

- [ ] 22. Final checkpoint - Complete testing and verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Implementation should maximize code reuse from `frontend/src/lib/components/MessageTable.svelte`
- All styling must use VS Code theme variables for proper theme support
- Default visibility timeout to 0 seconds (peek mode for queue management)
- Fixed polling duration of 120 seconds (like AWS Console)
- Maximum 100 messages during polling
