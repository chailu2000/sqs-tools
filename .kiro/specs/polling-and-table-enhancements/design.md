# Design Document: Polling and Table Enhancements

## Overview

This design document specifies the implementation of polling functionality and table-based message display for the VS Code SQS Management Tool extension. The feature ports existing functionality from the Svelte web UI to the VS Code extension's webview using vanilla HTML/CSS/JavaScript.

### Goals

- Implement continuous polling for messages (120-second duration like AWS Console)
- Add table-based message display with checkboxes for bulk operations
- Support bulk delete and redrive operations
- Provide real-time progress feedback during polling
- Maintain feature parity with the Svelte frontend
- Maximize code reuse from the reference implementation

### Non-Goals

- Rewriting the backend API (uses existing endpoints)
- Changing the extension's tree view or queue management
- Implementing new SQS operations beyond what exists in the frontend
- Supporting custom polling durations (fixed at 120 seconds)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              extension.ts (Backend)                     │ │
│  │  - Message handlers (postMessage receivers)            │ │
│  │  - API calls to backend server                         │ │
│  │  - Webview HTML generation                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ▲                                  │
│                           │ postMessage API                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Webview (Frontend)                         │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  main.js (State Management & UI Logic)           │  │ │
│  │  │  - Polling controller                             │  │ │
│  │  │  - Selection state                                │  │ │
│  │  │  - Pagination logic                               │  │ │
│  │  │  - Message deduplication                          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  HTML/CSS (UI Components)                         │  │ │
│  │  │  - Message table                                  │  │ │
│  │  │  - Bulk actions bar                               │  │ │
│  │  │  - Polling controls                               │  │ │
│  │  │  - Progress bar                                   │  │ │
│  │  │  - Message details panel                          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP
                           ▼
              ┌──────────────────────────┐
              │   Backend Server         │
              │   (localhost:8080)       │
              │   - AWS SQS SDK calls    │
              └──────────────────────────┘
```


### Communication Flow

1. **User Action** → Webview (main.js)
2. **Webview** → Extension Host (postMessage)
3. **Extension Host** → Backend Server (HTTP)
4. **Backend Server** → AWS SQS (SDK)
5. **Response** flows back through the same chain

### State Management Strategy

The webview maintains local state in JavaScript variables with manual DOM updates:

- `messages`: Array of main queue messages
- `dlqMessages`: Array of DLQ messages
- `selectedMessageIds`: Set of selected message IDs
- `pollingState`: Object tracking polling status
- `paginationState`: Object tracking current page and page size
- `activeTab`: Current tab ('queue', 'main', 'dlq')
- `selectedMessage`: Currently expanded message for details panel

## Components and Interfaces

### 1. Polling Controller Component

**Purpose**: Manages continuous message polling with progress tracking

**State**:
```javascript
const pollingState = {
  active: false,           // Is polling currently running
  progress: 0,             // Percentage complete (0-100)
  count: 0,                // Number of API calls made
  startTime: null,         // Timestamp when polling started
  intervalId: null,        // setInterval ID for progress updates
  seenMessageIds: new Set() // For deduplication
};
```

**Methods**:
- `startPolling()`: Initiates continuous polling
- `stopPolling()`: Stops polling immediately
- `updateProgress()`: Updates progress bar (called every second)
- `receiveOnce()`: Single batch receive operation

**UI Elements**:
- "Poll for Messages" button (primary blue)
- "Receive Once" button (secondary gray)
- "Stop" button (danger red, shown only during polling)
- Progress bar with gradient fill
- Progress text showing percentage and message count


### 2. Message Table Component

**Purpose**: Displays messages in a table format with selection capabilities

**Structure**:
```html
<table class="message-table">
  <thead>
    <tr>
      <th><input type="checkbox" id="select-all" /></th>
      <th>Message ID</th>
      <th>Body Preview</th>
      <th>Timestamp</th>
      <th>Receive Count</th>
      <th>Attributes</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- Message rows generated dynamically -->
  </tbody>
</table>
```

**Row Structure**:
```html
<tr class="message-row" data-message-id="{messageId}" data-receipt-handle="{receiptHandle}">
  <td><input type="checkbox" class="message-checkbox" /></td>
  <td class="message-id">{truncated messageId}</td>
  <td class="body-preview">{truncated body}</td>
  <td class="timestamp">{formatted timestamp}</td>
  <td class="receive-count">{count}</td>
  <td class="attributes-count">{attribute count}</td>
  <td class="actions">
    <button class="delete-btn">🗑️</button>
  </td>
</tr>
```

**Styling**:
- Selected rows: `background-color: var(--vscode-list-activeSelectionBackground)`
- Hover effect: `background-color: var(--vscode-list-hoverBackground)`
- Borders: `border-color: var(--vscode-editorGroup-border)`


### 3. Bulk Actions Bar Component

**Purpose**: Provides bulk operations for selected messages

**Structure**:
```html
<div class="bulk-actions-bar" style="display: none;">
  <span class="selection-count">X selected</span>
  <button class="btn-danger" id="delete-selected">Delete Selected</button>
  <button class="btn-primary" id="redrive-selected" style="display: none;">Redrive Selected</button>
  <button class="btn-secondary" id="clear-selection">Clear Selection</button>
</div>
```

**Visibility Logic**:
- Show when `selectedMessageIds.size > 0`
- Hide when `selectedMessageIds.size === 0`
- "Redrive Selected" button only visible when `activeTab === 'dlq'`

**Styling**:
```css
.bulk-actions-bar {
  background-color: var(--vscode-editorWidget-background);
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.selection-count {
  font-weight: 600;
  color: var(--vscode-textLink-foreground);
}
```

### 4. Confirmation Dialog Component

**Purpose**: Confirms destructive actions before execution

**Structure**:
```html
<div class="confirm-dialog" style="display: none;">
  <div class="confirm-content">
    <p class="confirm-message">{confirmation message}</p>
    <div class="confirm-actions">
      <button class="btn-danger" id="confirm-action">Delete</button>
      <button class="btn-secondary" id="cancel-action">Cancel</button>
    </div>
  </div>
</div>
```

**Types**:
1. Single message delete: "Delete message {messageId}?"
2. Bulk delete: "Delete {count} selected message(s)?"
3. Bulk redrive: "Redrive {count} selected message(s)?"

**Styling**:
```css
.confirm-dialog {
  background-color: var(--vscode-inputValidation-warningBackground);
  border-left: 4px solid var(--vscode-editorWarning-foreground);
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}
```


### 5. Message Details Panel Component

**Purpose**: Displays full message details when a row is clicked

**Structure**:
```html
<div class="message-details-panel" style="display: none;">
  <div class="details-header">
    <h3>Message Details</h3>
    <button class="btn-close">×</button>
  </div>
  <div class="details-content">
    <div class="detail-row">
      <strong>Message ID:</strong>
      <span>{messageId}</span>
    </div>
    <div class="detail-row">
      <strong>Receipt Handle:</strong>
      <span class="monospace">{receiptHandle}</span>
    </div>
    <div class="detail-row" id="message-attributes-section" style="display: none;">
      <strong>Message Attributes:</strong>
      <div class="attributes">
        <!-- Attribute badges -->
      </div>
    </div>
    <div class="detail-row">
      <strong>Body:</strong>
      <pre class="body-content">{body}</pre>
    </div>
  </div>
</div>
```

**Behavior**:
- Opens when user clicks a message row (excluding checkbox and action buttons)
- Closes when user clicks the × button
- Closes when user switches tabs or queues
- Updates content when user clicks a different message row

**Styling**:
```css
.message-details-panel {
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-editorGroup-border);
  border-radius: 4px;
  padding: 16px;
  margin-top: 16px;
  box-shadow: 0 2px 4px var(--vscode-widget-shadow);
}

.btn-close {
  background-color: var(--vscode-errorForeground);
  color: var(--vscode-editor-background);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
}

.body-content {
  background-color: var(--vscode-editorWidget-background);
  padding: 12px;
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family);
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-all;
}
```


### 6. Pagination Controls Component

**Purpose**: Enables navigation through pages of messages

**Structure**:
```html
<div class="pagination-controls" style="display: none;">
  <button id="prev-page" class="btn-secondary">Previous</button>
  <span class="page-indicator">Page {current} of {total}</span>
  <button id="next-page" class="btn-secondary">Next</button>
  <select id="page-size" class="vscode-input">
    <option value="10">10 per page</option>
    <option value="25">25 per page</option>
    <option value="50">50 per page</option>
  </select>
</div>
```

**State**:
```javascript
const paginationState = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0
};
```

**Visibility Logic**:
- Show when `totalMessages > pageSize`
- Hide when `totalMessages <= pageSize`

**Behavior**:
- Previous button disabled when `currentPage === 1`
- Next button disabled when `currentPage === totalPages`
- Changing page size resets to page 1
- Switching tabs resets to page 1
- Switching queues resets to page 1

### 7. Progress Bar Component

**Purpose**: Shows real-time polling progress

**Structure**:
```html
<div class="progress-container" style="display: none;">
  <div class="progress-bar">
    <div class="progress-fill" style="width: 0%"></div>
  </div>
  <div class="progress-text">
    Polling for messages... 0% complete (0 found so far)
  </div>
</div>
```

**Styling**:
```css
.progress-bar {
  width: 100%;
  height: 24px;
  background-color: var(--vscode-progressBar-background);
  border-radius: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--vscode-button-background), 
    var(--vscode-button-hoverBackground));
  transition: width 0.3s ease;
  border-radius: 12px;
}
```

**Update Logic**:
- Progress = (elapsed time / 120 seconds) * 100
- Updates every 1 second via setInterval
- Text format: "Polling for messages... X% complete (Y found so far)"


### 8. Info Banner Component

**Purpose**: Explains the three polling modes

**Structure**:
```html
<div class="info-banner">
  💡 <strong>Poll for Messages:</strong> Continuously receives for up to 120s (like AWS Console). 
  <strong>Receive Once:</strong> Gets a single batch. 
  Messages are deduplicated by ID. 
  <strong>Peek Mode:</strong> Immediately resets visibility timeout to 0.
</div>
```

**Styling**:
```css
.info-banner {
  background-color: var(--vscode-editorInfo-background);
  color: var(--vscode-editorInfo-foreground);
  border-left: 4px solid var(--vscode-editorInfo-foreground);
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.info-banner strong {
  font-weight: 600;
}
```

## Data Models

### Message Model

```typescript
interface Message {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes: {
    SentTimestamp: string;
    ApproximateReceiveCount: string;
    ApproximateFirstReceiveTimestamp?: string;
    SenderId?: string;
  };
  messageAttributes?: {
    [key: string]: {
      stringValue?: string;
      binaryValue?: string;
      dataType: string;
    };
  };
}
```

### Polling State Model

```typescript
interface PollingState {
  active: boolean;
  progress: number;        // 0-100
  count: number;           // Number of API calls
  startTime: number | null; // Timestamp
  intervalId: number | null; // setInterval ID
  seenMessageIds: Set<string>;
  messages: Message[];
}
```

### Selection State Model

```typescript
interface SelectionState {
  selectedMessageIds: Set<string>;
  allSelected: boolean;
}
```

### Pagination State Model

```typescript
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, I'll analyze each acceptance criterion for testability.


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

1. **Redundant**: 6.5 (polling completes at 100%) is the same as 5.12
2. **Redundant**: 12.1 (clicking row expands panel) is the same as 1.3
3. **Redundant**: 13.5 (DLQ redrive button) is the same as 3.6

Additionally, many properties can be combined:
- Tab switching behaviors (2.6, 10.7, 12.12, 19.1-19.3) can be combined into one comprehensive property
- Queue switching behaviors (2.7, 10.8, 12.13) can be combined
- Pagination reset behaviors (10.6, 10.7, 10.8) overlap and can be consolidated
- Button loading states (17.1-17.8) follow the same pattern and can be combined
- Error/success message display (18.1-18.9) follow the same pattern and can be combined

The following properties provide unique validation value and will be included:

**Core Table Display Properties**:
- Message table structure and column display
- Row selection and highlighting
- Body truncation and formatting
- Timestamp formatting

**Selection Properties**:
- Select all functionality
- Individual selection toggle
- Selection state persistence across pages
- Selection clearing on context changes

**Bulk Actions Properties**:
- Bulk actions bar visibility
- Selection count display
- Conditional button visibility (DLQ redrive)

**Polling Properties**:
- Continuous polling duration
- Message deduplication
- Real-time accumulation
- Progress tracking
- Stop functionality

**Pagination Properties**:
- Pagination visibility
- Page navigation
- Page size changes
- Pagination reset on context changes

**Message Details Properties**:
- Panel expansion on row click
- Panel content display
- Panel closing behavior

**DLQ Integration Properties**:
- Feature parity between main and DLQ tabs
- Redrive functionality

Now I'll write the consolidated correctness properties:


### Property 1: Message Deduplication During Polling

*For any* polling operation, if the same message ID is received multiple times across different API calls, the final message list should contain that message ID exactly once.

**Validates: Requirements 5.5, 9.3**

### Property 2: Body Preview Truncation

*For any* message with a body longer than 50 characters, the body preview column should display exactly 50 characters followed by "...".

**Validates: Requirements 1.6**

### Property 3: Selection State Toggle

*For any* message checkbox, clicking it should toggle the selection state of that message only, without affecting the selection state of any other message.

**Validates: Requirements 1.4, 2.3**

### Property 4: Select All Consistency

*For any* page of messages, when all messages on that page are individually selected, the "Select All" checkbox should display as checked; conversely, when the "Select All" checkbox is checked, all messages on the current page should be selected.

**Validates: Requirements 2.1, 2.2**

### Property 5: Row Click Behavior

*For any* message row, clicking the row area (excluding checkbox and action buttons) should expand the message details panel without toggling the selection state.

**Validates: Requirements 1.3, 2.4**

### Property 6: Selection Persistence Across Pages

*For any* set of selected messages, navigating between pages should preserve the selection state of all messages (selected messages remain selected even when not visible on the current page).

**Validates: Requirements 2.5**

### Property 7: Context Change Clears Selection

*For any* context change (switching tabs or switching queues), all message selections should be cleared and the selection set should become empty.

**Validates: Requirements 2.6, 2.7, 10.7, 10.8, 19.1, 19.2, 19.3**

### Property 8: Bulk Actions Bar Visibility

*For any* selection state, the bulk actions bar should be visible if and only if at least one message is selected (selectedMessageIds.size > 0).

**Validates: Requirements 3.1, 3.2**

### Property 9: Selection Count Display

*For any* number of selected messages, the bulk actions bar should display the count in the format "X selected" where X equals the size of the selectedMessageIds set.

**Validates: Requirements 3.3**

### Property 10: Conditional Redrive Button

*For any* tab state, the "Redrive Selected" button should be visible in the bulk actions bar if and only if the active tab is "dlq".

**Validates: Requirements 3.6, 13.5**

### Property 11: Confirmation Dialog Display

*For any* destructive action (delete or redrive), clicking the action button should display a confirmation dialog before executing the operation.

**Validates: Requirements 3.7, 3.9, 4.1**

### Property 12: Polling Duration

*For any* polling operation that is not manually stopped, the polling should continue for approximately 120 seconds (±1 second tolerance) before automatically completing.

**Validates: Requirements 5.2**

### Property 13: Real-Time Message Accumulation

*For any* polling operation, as new messages are received from each API call, they should be immediately added to the message list and the UI should update to reflect the new messages without waiting for polling to complete.

**Validates: Requirements 5.4, 5.6**

### Property 14: Polling Stop Limit

*For any* polling operation, if 100 unique messages are accumulated, the polling should stop immediately even if the 120-second duration has not elapsed.

**Validates: Requirements 5.7**

### Property 15: Progress Calculation

*For any* point during polling, the progress percentage should equal (elapsed time in seconds / 120) * 100, rounded to the nearest integer.

**Validates: Requirements 6.4**

### Property 16: Progress Completion

*For any* polling operation that completes naturally (not stopped early), the final progress value should be 100%.

**Validates: Requirements 5.12, 6.5**

### Property 17: Manual Polling Stop

*For any* active polling operation, clicking the "Stop" button should immediately set the polling state to inactive and stop making further API calls.

**Validates: Requirements 5.10**

### Property 18: Tab Switch Stops Polling

*For any* active polling operation, switching to a different tab should silently stop the polling without displaying an error.

**Validates: Requirements 5.11, 19.4**

### Property 19: Pagination Visibility

*For any* message list, the pagination controls should be visible if and only if the total number of messages exceeds the current page size.

**Validates: Requirements 10.1**

### Property 20: Page Navigation Boundaries

*For any* pagination state, the "Previous" button should be disabled when currentPage equals 1, and the "Next" button should be disabled when currentPage equals totalPages.

**Validates: Requirements 10.9, 10.10**

### Property 21: Page Size Change Reset

*For any* page size change, the current page should be reset to 1.

**Validates: Requirements 10.6**

### Property 22: Message Count Display

*For any* message list state, the message count should display "Showing X of Y received" where X is the number of messages on the current page and Y is the total number of messages in the array.

**Validates: Requirements 11.1, 11.4**

### Property 23: Message Count Real-Time Update

*For any* polling operation, the message count display should update immediately each time new messages are added to the list.

**Validates: Requirements 11.3**

### Property 24: Message Details Panel Content

*For any* message, when the details panel is opened for that message, the panel should display the complete message ID, receipt handle, all message attributes (if any), and the full message body without truncation.

**Validates: Requirements 12.3, 12.4, 12.5, 12.6, 12.7**

### Property 25: Message Details Panel Closing

*For any* open message details panel, clicking the close button (×) should hide the panel; additionally, switching tabs or queues should automatically close the panel.

**Validates: Requirements 12.10, 12.12, 12.13**

### Property 26: Message Details Panel Update

*For any* open message details panel, clicking a different message row should update the panel content to display the details of the newly selected message without closing and reopening the panel.

**Validates: Requirements 12.11**

### Property 27: DLQ Feature Parity

*For any* operation available on the main queue tab (polling, receive once, selection, pagination, message details), the same operation should be available and function identically on the DLQ tab.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 28: Redrive Operation

*For any* set of selected messages in the DLQ tab, clicking "Redrive Selected" and confirming should send those messages to the main queue via the backend API and refresh both the DLQ and main queue message lists.

**Validates: Requirements 13.6, 13.7**

### Property 29: Queue Info Auto-Load

*For any* queue selection from the tree view, the webview should default to the Queue Info tab and automatically fetch and display the queue attributes without requiring user interaction.

**Validates: Requirements 14.1, 14.2, 14.3**

### Property 30: Button Loading States

*For any* asynchronous operation (send, receive, delete, redrive, purge), the corresponding button should display a loading state (disabled with loading text) while the operation is in progress, and return to its default state when the operation completes or fails.

**Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7**

### Property 31: Operation Feedback Messages

*For any* operation that completes, the webview should display a success message (green background) if the operation succeeded, or an error message (red background) if the operation failed, with the success message auto-dismissing after 5 seconds.

**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8**


## Error Handling

### Error Categories

1. **Network Errors**
   - Backend server unreachable
   - API request timeout
   - Connection refused

2. **API Errors**
   - AWS SQS service errors (throttling, permissions)
   - Invalid queue configuration
   - Message not found (already deleted)

3. **Validation Errors**
   - Invalid input parameters
   - Empty message body
   - Invalid visibility timeout range

4. **State Errors**
   - Polling interrupted by tab switch
   - Message deleted while details panel open
   - Queue deleted while webview open

### Error Handling Strategies

#### Network Errors

```javascript
async function fetchMessages() {
  try {
    vscode.postMessage({ command: 'fetchMessages', queueId, ... });
  } catch (error) {
    displayError('Failed to connect to backend server. Please ensure the server is running.');
  }
}
```

**Recovery**: Display error message, allow user to retry

#### API Errors

```javascript
window.addEventListener('message', event => {
  if (event.data.command === 'messagesLoaded') {
    if (event.data.error) {
      displayError(`Failed to load messages: ${event.data.error}`);
      // Stop polling if active
      if (pollingState.active) {
        stopPolling();
      }
    }
  }
});
```

**Recovery**: Display error message, stop polling if active, allow user to retry

#### Polling Interruption

```javascript
function switchTab(newTab) {
  // Silently stop polling without error message
  if (pollingState.active) {
    pollingState.active = false;
    clearInterval(pollingState.intervalId);
  }
  activeTab = newTab;
  // ... rest of tab switch logic
}
```

**Recovery**: Silent stop, no error message (expected behavior)

#### Message Deletion During Details View

```javascript
function handleDeleteSuccess(receiptHandle) {
  // Remove from message list
  messages = messages.filter(m => m.receiptHandle !== receiptHandle);
  
  // Close details panel if showing deleted message
  if (selectedMessage && selectedMessage.receiptHandle === receiptHandle) {
    selectedMessage = null;
    hideDetailsPanel();
  }
  
  updateMessageTable();
}
```

**Recovery**: Close details panel, update table

### Error Message Display

All error messages should:
- Use red background (`var(--vscode-inputValidation-errorBackground)`)
- Include error icon or emoji
- Provide actionable information
- Remain visible until dismissed or new operation starts

Success messages should:
- Use green background (`var(--vscode-editorInfo-background)`)
- Include success icon or emoji
- Auto-dismiss after 5 seconds
- Be dismissible by user


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific UI interactions (button clicks, checkbox toggles)
- Edge cases (empty message lists, single message, exactly 100 messages)
- Error conditions (network failures, API errors)
- Integration points (postMessage communication)

**Property-Based Tests** focus on:
- Universal properties across all inputs (deduplication, truncation)
- State consistency (selection state, pagination state)
- Timing properties (polling duration, progress calculation)
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: polling-and-table-enhancements, Property {number}: {property_text}`

**Example Property Test**:

```javascript
// Feature: polling-and-table-enhancements, Property 1: Message Deduplication During Polling
test('messages are deduplicated by message ID', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        messageId: fc.string(),
        receiptHandle: fc.string(),
        body: fc.string()
      })),
      (messages) => {
        // Simulate receiving messages with duplicates
        const messagesWithDuplicates = [...messages, ...messages.slice(0, 3)];
        
        // Apply deduplication logic
        const deduplicated = deduplicateMessages(messagesWithDuplicates);
        
        // Verify each message ID appears exactly once
        const messageIds = deduplicated.map(m => m.messageId);
        const uniqueIds = new Set(messageIds);
        
        return messageIds.length === uniqueIds.size;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Test Categories**:

1. **Component Rendering Tests**
   - Table structure is correct
   - Buttons are present with correct classes
   - Input fields have correct attributes

2. **Interaction Tests**
   - Clicking checkboxes toggles selection
   - Clicking rows opens details panel
   - Clicking buttons triggers correct actions

3. **State Management Tests**
   - Selection state updates correctly
   - Pagination state updates correctly
   - Polling state updates correctly

4. **Integration Tests**
   - postMessage calls are made with correct parameters
   - Message handlers update UI correctly
   - Error responses are handled correctly

**Example Unit Test**:

```javascript
test('clicking select all checkbox selects all messages on current page', () => {
  // Setup: Render table with 15 messages, page size 10
  const messages = generateMessages(15);
  renderMessageTable(messages, { pageSize: 10, currentPage: 1 });
  
  // Action: Click select all checkbox
  const selectAllCheckbox = document.getElementById('select-all');
  selectAllCheckbox.click();
  
  // Assert: All 10 messages on page 1 are selected
  const selectedCount = document.querySelectorAll('.message-checkbox:checked').length;
  expect(selectedCount).toBe(10);
  
  // Assert: Selection state contains 10 message IDs
  expect(selectedMessageIds.size).toBe(10);
});
```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Function Coverage**: Minimum 85%
- **Property Coverage**: 100% (all 31 properties must have tests)

### Testing Tools

- **Unit Testing**: Vitest or Jest
- **Property Testing**: fast-check
- **DOM Testing**: @testing-library/dom or jsdom
- **E2E Testing**: Playwright (for full extension testing)


## Implementation Details

### Code Conversion Guidelines: Svelte to Vanilla JavaScript

This section provides specific guidance on converting the Svelte frontend code to vanilla JavaScript for the VS Code webview.

#### 1. State Management Conversion

**Svelte (MessageTable.svelte)**:
```svelte
<script lang="ts">
  let loading = $state(false);
  let messages = $state<Message[]>([]);
  let selectedMessageIds = $state(new Set<string>());
  let polling = $state(false);
  let pollProgress = $state(0);
</script>
```

**Vanilla JavaScript (main.js)**:
```javascript
// State variables
let loading = false;
let messages = [];
let selectedMessageIds = new Set();
let polling = false;
let pollProgress = 0;

// Manual DOM update functions
function setLoading(value) {
  loading = value;
  updateLoadingUI();
}

function setMessages(newMessages) {
  messages = newMessages;
  updateMessageTable();
}

function updatePollingState(active, progress) {
  polling = active;
  pollProgress = progress;
  updatePollingUI();
}
```

#### 2. Derived State Conversion

**Svelte**:
```svelte
const paginatedMessages = $derived.by(() => {
  const start = (currentPage - 1) * pageSize;
  return messages.slice(start, start + pageSize);
});

const totalPages = $derived.by(() => {
  return Math.ceil(messages.length / pageSize);
});
```

**Vanilla JavaScript**:
```javascript
function getPaginatedMessages() {
  const start = (currentPage - 1) * pageSize;
  return messages.slice(start, start + pageSize);
}

function getTotalPages() {
  return Math.ceil(messages.length / pageSize);
}

// Call these functions whenever you need the derived values
function updateMessageTable() {
  const paginated = getPaginatedMessages();
  const total = getTotalPages();
  renderMessageRows(paginated);
  updatePaginationControls(currentPage, total);
}
```

#### 3. Effect Conversion

**Svelte**:
```svelte
$effect(() => {
  if (store.selectedQueue) {
    currentPage = 1;
    loadMessages();
  }
});
```

**Vanilla JavaScript**:
```javascript
// Use event listeners or explicit function calls
function onQueueSelected(queue) {
  currentQueue = queue;
  currentPage = 1;
  loadMessages();
}

// Or watch for postMessage events
window.addEventListener('message', event => {
  if (event.data.command === 'setQueueId') {
    onQueueSelected(event.data.queueId);
  }
});
```


#### 4. Event Handler Conversion

**Svelte**:
```svelte
<button onclick={pollForMessages}>Poll for Messages</button>
<button onclick={stopPolling}>Stop</button>
```

**Vanilla JavaScript**:
```javascript
// Add event listeners after DOM is ready
document.getElementById('poll-button').addEventListener('click', pollForMessages);
document.getElementById('stop-button').addEventListener('click', stopPolling);

// Or use event delegation for dynamic elements
document.getElementById('messages-container').addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const receiptHandle = event.target.dataset.receiptHandle;
    deleteMessage(receiptHandle);
  }
});
```

#### 5. Conditional Rendering Conversion

**Svelte**:
```svelte
{#if polling}
  <div class="progress-container">
    <div class="progress-bar">
      <div class="progress-fill" style="width: {pollProgress}%"></div>
    </div>
  </div>
{/if}

{#if error}
  <div class="error">{error}</div>
{/if}
```

**Vanilla JavaScript**:
```javascript
function updatePollingUI() {
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  if (polling) {
    progressContainer.style.display = 'block';
    progressFill.style.width = `${pollProgress}%`;
    progressText.textContent = `Polling for messages... ${Math.round(pollProgress)}% complete (${messages.length} found so far)`;
  } else {
    progressContainer.style.display = 'none';
  }
}

function displayError(errorMessage) {
  const errorContainer = document.getElementById('error-container');
  if (errorMessage) {
    errorContainer.style.display = 'block';
    errorContainer.textContent = errorMessage;
  } else {
    errorContainer.style.display = 'none';
  }
}
```

#### 6. Loop Rendering Conversion

**Svelte**:
```svelte
{#each paginatedMessages as message (message.messageId)}
  <tr class:selected={store.selectedMessageIds.has(message.messageId)}>
    <td><input type="checkbox" checked={store.selectedMessageIds.has(message.messageId)} /></td>
    <td>{message.messageId}</td>
    <td>{truncate(message.body, 50)}</td>
  </tr>
{/each}
```

**Vanilla JavaScript**:
```javascript
function renderMessageRows(messages) {
  const tbody = document.querySelector('#message-table tbody');
  tbody.innerHTML = '';
  
  messages.forEach(message => {
    const row = document.createElement('tr');
    row.dataset.messageId = message.messageId;
    row.dataset.receiptHandle = message.receiptHandle;
    
    if (selectedMessageIds.has(message.messageId)) {
      row.classList.add('selected');
    }
    
    row.innerHTML = `
      <td><input type="checkbox" class="message-checkbox" ${selectedMessageIds.has(message.messageId) ? 'checked' : ''} /></td>
      <td class="message-id">${escapeHtml(truncate(message.messageId, 20))}</td>
      <td class="body-preview">${escapeHtml(truncate(message.body, 50))}</td>
      <td>${formatTimestamp(message.attributes.SentTimestamp)}</td>
      <td class="receive-count">${message.attributes.ApproximateReceiveCount || '0'}</td>
      <td>${Object.keys(message.messageAttributes || {}).length}</td>
      <td class="actions">
        <button class="delete-btn" data-receipt-handle="${message.receiptHandle}">🗑️</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add event listeners to checkboxes
  tbody.querySelectorAll('.message-checkbox').forEach((checkbox, index) => {
    checkbox.addEventListener('change', () => {
      toggleMessageSelection(messages[index].messageId);
    });
  });
  
  // Add event listener to rows for details panel
  tbody.querySelectorAll('tr').forEach((row, index) => {
    row.addEventListener('click', (event) => {
      // Don't open details if clicking checkbox or action button
      if (event.target.type === 'checkbox' || event.target.classList.contains('delete-btn')) {
        return;
      }
      openMessageDetails(messages[index]);
    });
  });
}
```


#### 7. Polling Logic Conversion

**Svelte (MessageTable.svelte lines 95-250)**:
```svelte
async function pollForMessages() {
  try {
    polling = true;
    pollCount = 0;
    pollProgress = 0;
    
    let allMessages: Message[] = [];
    let seenMessageIds = new Set<string>();
    const startTime = Date.now();
    const maxDuration = pollDuration * 1000;
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      pollProgress = Math.min((elapsed / maxDuration) * 100, 100);
    }, 1000);
    
    while (polling && Date.now() - startTime < maxDuration) {
      pollCount++;
      const batch = await api.receiveMessages(store.selectedQueue.id, {...});
      
      const newMessages = batch.filter(msg => {
        if (seenMessageIds.has(msg.messageId)) return false;
        seenMessageIds.add(msg.messageId);
        return true;
      });
      
      if (newMessages.length > 0) {
        allMessages = [...allMessages, ...newMessages];
        store.setMessages(allMessages);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    clearInterval(progressInterval);
    pollProgress = 100;
  } finally {
    polling = false;
  }
}
```

**Vanilla JavaScript (main.js)**:
```javascript
async function pollForMessages() {
  try {
    pollingState.active = true;
    pollingState.count = 0;
    pollingState.progress = 0;
    pollingState.seenMessageIds = new Set();
    pollingState.messages = [];
    
    const startTime = Date.now();
    const maxDuration = 120 * 1000; // 120 seconds
    
    // Update progress every second
    pollingState.intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      pollingState.progress = Math.min((elapsed / maxDuration) * 100, 100);
      updateProgressBar();
    }, 1000);
    
    // Show progress bar and stop button
    document.getElementById('progress-container').style.display = 'block';
    document.getElementById('stop-button').style.display = 'inline-block';
    document.getElementById('poll-button').disabled = true;
    document.getElementById('receive-once-button').disabled = true;
    
    // Polling loop
    while (pollingState.active && Date.now() - startTime < maxDuration) {
      pollingState.count++;
      
      // Update button text
      document.getElementById('poll-button').textContent = `Polling... (${pollingState.count} calls)`;
      
      // Request messages from extension
      vscode.postMessage({
        command: activeTab === 'main' ? 'fetchMessages' : 'fetchDLQMessages',
        queueId: currentQueueId,
        maxMessages: 10,
        visibilityTimeout: parseInt(document.getElementById('visibility-timeout').value),
        waitTimeSeconds: 20,
        peek: document.getElementById('peek-mode').checked
      });
      
      // Wait for response (handled in message listener)
      await new Promise(resolve => {
        const handler = (event) => {
          if (event.data.command === 'messagesLoaded' || event.data.command === 'dlqMessagesLoaded') {
            window.removeEventListener('message', handler);
            
            if (!event.data.error) {
              const batch = event.data.messages;
              
              // Deduplicate
              const newMessages = batch.filter(msg => {
                if (pollingState.seenMessageIds.has(msg.messageId)) {
                  return false;
                }
                pollingState.seenMessageIds.add(msg.messageId);
                return true;
              });
              
              // Add to accumulated messages
              if (newMessages.length > 0) {
                pollingState.messages = [...pollingState.messages, ...newMessages];
                
                // Update UI immediately
                if (activeTab === 'main') {
                  messages = pollingState.messages;
                } else {
                  dlqMessages = pollingState.messages;
                }
                updateMessageTable();
                updateMessageCount();
              }
              
              // Stop if we hit 100 messages
              if (pollingState.messages.length >= 100) {
                pollingState.active = false;
              }
            }
            
            resolve();
          }
        };
        window.addEventListener('message', handler);
      });
      
      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Cleanup
    clearInterval(pollingState.intervalId);
    pollingState.progress = 100;
    updateProgressBar();
    
    if (pollingState.messages.length === 0) {
      displayError('No messages found in the queue');
    }
    
  } catch (error) {
    displayError(`Failed to poll messages: ${error.message}`);
  } finally {
    pollingState.active = false;
    pollingState.count = 0;
    
    // Hide progress bar and stop button
    setTimeout(() => {
      document.getElementById('progress-container').style.display = 'none';
    }, 2000); // Keep visible for 2 seconds to show 100%
    
    document.getElementById('stop-button').style.display = 'none';
    document.getElementById('poll-button').disabled = false;
    document.getElementById('poll-button').textContent = '🔄 Poll for Messages';
    document.getElementById('receive-once-button').disabled = false;
  }
}

function stopPolling() {
  pollingState.active = false;
  clearInterval(pollingState.intervalId);
}

function updateProgressBar() {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  progressFill.style.width = `${pollingState.progress}%`;
  progressText.textContent = `Polling for messages... ${Math.round(pollingState.progress)}% complete (${pollingState.messages.length} found so far)`;
}
```


#### 8. CSS Conversion: Svelte to VS Code Theme Variables

**Svelte CSS**:
```css
.tabs button.active {
  background: #2196f3;
  color: white;
}

.error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #f44336;
}

.progress-fill {
  background: linear-gradient(90deg, #2196f3, #1976d2);
}
```

**VS Code Webview CSS**:
```css
.tabs button.active {
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.error {
  background-color: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-errorForeground);
  border-left: 4px solid var(--vscode-errorForeground);
}

.progress-fill {
  background: linear-gradient(90deg, 
    var(--vscode-button-background), 
    var(--vscode-button-hoverBackground));
}
```

**Complete Theme Variable Mapping**:

| Svelte Color | VS Code Variable | Usage |
|--------------|------------------|-------|
| `#2196f3` (blue) | `var(--vscode-button-background)` | Primary buttons, active tabs |
| `#f44336` (red) | `var(--vscode-errorForeground)` | Danger buttons, errors |
| `#757575` (gray) | `var(--vscode-button-secondaryBackground)` | Secondary buttons |
| `#fff` (white) | `var(--vscode-editor-background)` | Main background |
| `#f5f5f5` (light gray) | `var(--vscode-input-background)` | Input fields, table rows |
| `#ddd` (border) | `var(--vscode-editorGroup-border)` | Borders, dividers |
| `#e3f2fd` (light blue) | `var(--vscode-list-activeSelectionBackground)` | Selected rows |
| `#e8f5e9` (light green) | `var(--vscode-editorInfo-background)` | Success messages, info banner |
| `#ffebee` (light red) | `var(--vscode-inputValidation-errorBackground)` | Error messages |
| `#fff3e0` (light orange) | `var(--vscode-inputValidation-warningBackground)` | Confirmation dialogs |

### File Modification Strategy

#### extension.ts Modifications

**New Message Handlers to Add**:

```typescript
case 'pollMessages':
  // Note: Polling logic is handled in webview
  // Extension just responds to individual fetch requests
  // No special polling handler needed
  break;

case 'bulkDeleteMessages':
  console.log(`Extension received bulkDeleteMessages for ${message.receiptHandles.length} messages`);
  try {
    const results = await Promise.allSettled(
      message.receiptHandles.map(handle => 
        deleteMessage(message.queueId, handle)
      )
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    panel.webview.postMessage({ 
      command: 'bulkDeleteResult', 
      success: failureCount === 0,
      successCount,
      failureCount
    });
    
    if (failureCount === 0) {
      vscode.window.showInformationMessage(`Successfully deleted ${successCount} message(s)`);
    } else {
      vscode.window.showWarningMessage(`Deleted ${successCount} message(s), ${failureCount} failed`);
    }
  } catch (error: any) {
    panel.webview.postMessage({ 
      command: 'bulkDeleteResult', 
      success: false, 
      error: error.message 
    });
  }
  break;

case 'bulkRedriveMessages':
  console.log(`Extension received bulkRedriveMessages for ${message.messages.length} messages`);
  try {
    const results = await Promise.allSettled(
      message.messages.map(msg => 
        redriveSingleDLQMessage(message.queueId, msg.receiptHandle)
      )
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    panel.webview.postMessage({ 
      command: 'bulkRedriveResult', 
      success: failureCount === 0,
      successCount,
      failureCount
    });
    
    if (failureCount === 0) {
      vscode.window.showInformationMessage(`Successfully redriven ${successCount} message(s)`);
    } else {
      vscode.window.showWarningMessage(`Redriven ${successCount} message(s), ${failureCount} failed`);
    }
  } catch (error: any) {
    panel.webview.postMessage({ 
      command: 'bulkRedriveResult', 
      success: false, 
      error: error.message 
    });
  }
  break;
```

**HTML Template Additions**:

Add the following HTML sections to the webview template in `getWebviewContent()`:

1. Polling controls (visibility, wait time, peek mode inputs)
2. Progress bar container
3. Info banner
4. Bulk actions bar
5. Message details panel
6. Pagination controls

(See Components section above for complete HTML structure)


#### main.js Modifications

**New State Variables**:
```javascript
// Polling state
const pollingState = {
  active: false,
  progress: 0,
  count: 0,
  startTime: null,
  intervalId: null,
  seenMessageIds: new Set(),
  messages: []
};

// Selection state
let selectedMessageIds = new Set();

// Pagination state
let currentPage = 1;
let pageSize = 10;

// Message details
let selectedMessage = null;

// Active tab
let activeTab = 'queue'; // 'queue', 'main', 'dlq'
```

**New Functions to Add**:
```javascript
// Polling functions
async function pollForMessages() { /* See polling logic above */ }
function stopPolling() { /* See above */ }
function updateProgressBar() { /* See above */ }

// Selection functions
function toggleMessageSelection(messageId) {
  if (selectedMessageIds.has(messageId)) {
    selectedMessageIds.delete(messageId);
  } else {
    selectedMessageIds.add(messageId);
  }
  updateMessageTable();
  updateBulkActionsBar();
}

function toggleSelectAll() {
  const paginated = getPaginatedMessages();
  const allSelected = paginated.every(m => selectedMessageIds.has(m.messageId));
  
  if (allSelected) {
    paginated.forEach(m => selectedMessageIds.delete(m.messageId));
  } else {
    paginated.forEach(m => selectedMessageIds.add(m.messageId));
  }
  
  updateMessageTable();
  updateBulkActionsBar();
}

function clearSelection() {
  selectedMessageIds.clear();
  updateMessageTable();
  updateBulkActionsBar();
}

// Bulk actions functions
function updateBulkActionsBar() {
  const bar = document.getElementById('bulk-actions-bar');
  const count = document.getElementById('selection-count');
  const redriveBtn = document.getElementById('redrive-selected');
  
  if (selectedMessageIds.size > 0) {
    bar.style.display = 'flex';
    count.textContent = `${selectedMessageIds.size} selected`;
    
    // Show redrive button only on DLQ tab
    if (activeTab === 'dlq') {
      redriveBtn.style.display = 'inline-block';
    } else {
      redriveBtn.style.display = 'none';
    }
  } else {
    bar.style.display = 'none';
  }
}

async function deleteSelected() {
  if (selectedMessageIds.size === 0) return;
  
  // Show confirmation dialog
  document.getElementById('confirm-dialog').style.display = 'block';
  document.getElementById('confirm-message').textContent = 
    `Delete ${selectedMessageIds.size} selected message(s)?`;
  
  // Set up confirmation handler
  document.getElementById('confirm-delete-btn').onclick = async () => {
    const messagesToDelete = (activeTab === 'main' ? messages : dlqMessages)
      .filter(m => selectedMessageIds.has(m.messageId));
    
    const receiptHandles = messagesToDelete.map(m => m.receiptHandle);
    
    vscode.postMessage({
      command: 'bulkDeleteMessages',
      queueId: currentQueueId,
      receiptHandles: receiptHandles
    });
    
    document.getElementById('confirm-dialog').style.display = 'none';
  };
}

async function redriveSelected() {
  if (selectedMessageIds.size === 0 || activeTab !== 'dlq') return;
  
  // Show confirmation dialog
  document.getElementById('confirm-dialog').style.display = 'block';
  document.getElementById('confirm-message').textContent = 
    `Redrive ${selectedMessageIds.size} selected message(s)?`;
  
  // Set up confirmation handler
  document.getElementById('confirm-redrive-btn').onclick = async () => {
    const messagesToRedrive = dlqMessages
      .filter(m => selectedMessageIds.has(m.messageId));
    
    vscode.postMessage({
      command: 'bulkRedriveMessages',
      queueId: currentQueueId,
      messages: messagesToRedrive
    });
    
    document.getElementById('confirm-dialog').style.display = 'none';
  };
}

// Pagination functions
function getPaginatedMessages() {
  const messageList = activeTab === 'main' ? messages : dlqMessages;
  const start = (currentPage - 1) * pageSize;
  return messageList.slice(start, start + pageSize);
}

function getTotalPages() {
  const messageList = activeTab === 'main' ? messages : dlqMessages;
  return Math.ceil(messageList.length / pageSize);
}

function updatePaginationControls() {
  const controls = document.getElementById('pagination-controls');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageIndicator = document.getElementById('page-indicator');
  
  const totalPages = getTotalPages();
  const messageList = activeTab === 'main' ? messages : dlqMessages;
  
  // Show/hide pagination
  if (messageList.length > pageSize) {
    controls.style.display = 'flex';
  } else {
    controls.style.display = 'none';
    return;
  }
  
  // Update button states
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
  
  // Update page indicator
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
}

function goToPage(page) {
  const totalPages = getTotalPages();
  currentPage = Math.max(1, Math.min(page, totalPages));
  updateMessageTable();
  updatePaginationControls();
}

function changePageSize(newSize) {
  pageSize = newSize;
  currentPage = 1;
  updateMessageTable();
  updatePaginationControls();
}

// Message details functions
function openMessageDetails(message) {
  selectedMessage = message;
  const panel = document.getElementById('message-details-panel');
  
  // Update content
  document.getElementById('detail-message-id').textContent = message.messageId;
  document.getElementById('detail-receipt-handle').textContent = message.receiptHandle;
  document.getElementById('detail-body').textContent = message.body;
  
  // Update attributes
  const attrsSection = document.getElementById('detail-attributes-section');
  const attrsContainer = document.getElementById('detail-attributes');
  
  if (message.messageAttributes && Object.keys(message.messageAttributes).length > 0) {
    attrsSection.style.display = 'block';
    attrsContainer.innerHTML = '';
    
    Object.entries(message.messageAttributes).forEach(([key, value]) => {
      const badge = document.createElement('div');
      badge.className = 'attribute-badge';
      badge.innerHTML = `<span class="attr-key">${escapeHtml(key)}:</span> <span class="attr-value">${escapeHtml(value.stringValue || value.binaryValue || 'N/A')}</span>`;
      attrsContainer.appendChild(badge);
    });
  } else {
    attrsSection.style.display = 'none';
  }
  
  // Show panel
  panel.style.display = 'block';
}

function closeMessageDetails() {
  selectedMessage = null;
  document.getElementById('message-details-panel').style.display = 'none';
}

// Tab switching
function switchTab(tab) {
  activeTab = tab;
  currentPage = 1;
  clearSelection();
  closeMessageDetails();
  
  // Stop polling if active
  if (pollingState.active) {
    stopPolling();
  }
  
  // Update tab UI
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${tab}`).classList.add('active');
  
  // Show/hide tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  document.getElementById(`${tab}-tab-content`).style.display = 'block';
  
  // Load data if needed
  if (tab === 'main' && messages.length === 0) {
    fetchMessages();
  } else if (tab === 'dlq' && dlqMessages.length === 0) {
    fetchDLQMessages();
  }
}

// Utility functions
function truncate(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatTimestamp(timestamp) {
  return new Date(parseInt(timestamp)).toLocaleString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function displayError(message) {
  const errorContainer = document.getElementById('error-container');
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 10000);
}

function displaySuccess(message) {
  const successContainer = document.getElementById('success-container');
  successContainer.textContent = message;
  successContainer.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    successContainer.style.display = 'none';
  }, 5000);
}
```

**Event Listener Setup**:
```javascript
// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Polling controls
  document.getElementById('poll-button').addEventListener('click', pollForMessages);
  document.getElementById('stop-button').addEventListener('click', stopPolling);
  document.getElementById('receive-once-button').addEventListener('click', fetchMessages);
  
  // Selection controls
  document.getElementById('select-all').addEventListener('change', toggleSelectAll);
  document.getElementById('clear-selection').addEventListener('click', clearSelection);
  
  // Bulk actions
  document.getElementById('delete-selected').addEventListener('click', deleteSelected);
  document.getElementById('redrive-selected').addEventListener('click', redriveSelected);
  
  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('next-page').addEventListener('click', () => goToPage(currentPage + 1));
  document.getElementById('page-size').addEventListener('change', (e) => changePageSize(parseInt(e.target.value)));
  
  // Message details
  document.getElementById('close-details').addEventListener('click', closeMessageDetails);
  
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Confirmation dialog
  document.getElementById('cancel-confirm').addEventListener('click', () => {
    document.getElementById('confirm-dialog').style.display = 'none';
  });
});
```


### Implementation Checklist

#### Phase 1: HTML Structure (extension.ts)
- [ ] Add polling controls section (visibility, wait time, peek mode inputs)
- [ ] Add progress bar container with fill and text elements
- [ ] Add info banner with polling mode explanations
- [ ] Add bulk actions bar with selection count and action buttons
- [ ] Add confirmation dialog structure
- [ ] Add message details panel structure
- [ ] Add pagination controls
- [ ] Update message table to include checkbox column
- [ ] Add CSS for all new components using VS Code theme variables

#### Phase 2: State Management (main.js)
- [ ] Add pollingState object with all required properties
- [ ] Add selectedMessageIds Set
- [ ] Add pagination state variables (currentPage, pageSize)
- [ ] Add selectedMessage variable for details panel
- [ ] Add activeTab variable

#### Phase 3: Polling Implementation (main.js)
- [ ] Implement pollForMessages() function
- [ ] Implement stopPolling() function
- [ ] Implement updateProgressBar() function
- [ ] Add progress interval management
- [ ] Add message deduplication logic
- [ ] Add 100-message limit check
- [ ] Add real-time UI updates during polling

#### Phase 4: Selection Implementation (main.js)
- [ ] Implement toggleMessageSelection() function
- [ ] Implement toggleSelectAll() function
- [ ] Implement clearSelection() function
- [ ] Add selection state persistence across pages
- [ ] Add selection clearing on tab/queue switch

#### Phase 5: Bulk Actions Implementation (main.js)
- [ ] Implement updateBulkActionsBar() function
- [ ] Implement deleteSelected() function
- [ ] Implement redriveSelected() function
- [ ] Add confirmation dialog logic
- [ ] Add conditional redrive button visibility

#### Phase 6: Pagination Implementation (main.js)
- [ ] Implement getPaginatedMessages() function
- [ ] Implement getTotalPages() function
- [ ] Implement updatePaginationControls() function
- [ ] Implement goToPage() function
- [ ] Implement changePageSize() function
- [ ] Add pagination visibility logic

#### Phase 7: Message Details Implementation (main.js)
- [ ] Implement openMessageDetails() function
- [ ] Implement closeMessageDetails() function
- [ ] Add row click handler (excluding checkbox and actions)
- [ ] Add attribute rendering logic
- [ ] Add auto-close on tab/queue switch

#### Phase 8: Tab Switching Implementation (main.js)
- [ ] Implement switchTab() function
- [ ] Add tab state management
- [ ] Add polling stop on tab switch
- [ ] Add selection clearing on tab switch
- [ ] Add details panel closing on tab switch
- [ ] Add pagination reset on tab switch

#### Phase 9: Extension Backend (extension.ts)
- [ ] Add bulkDeleteMessages message handler
- [ ] Add bulkRedriveMessages message handler
- [ ] Update existing message handlers if needed
- [ ] Add error handling for bulk operations

#### Phase 10: Testing
- [ ] Write unit tests for all new functions
- [ ] Write property-based tests for all 31 properties
- [ ] Test polling duration accuracy
- [ ] Test message deduplication
- [ ] Test selection state management
- [ ] Test pagination logic
- [ ] Test bulk operations
- [ ] Test error handling
- [ ] Test theme support (light and dark)
- [ ] Manual testing with real SQS queues


## Performance Considerations

### Polling Performance

**Challenge**: Making repeated API calls every ~100ms for 120 seconds could result in ~1200 API calls.

**Optimization**:
- Use long polling (waitTimeSeconds=20) to reduce the number of calls
- Expected calls: ~6-7 per 120 seconds instead of 1200
- Each call waits up to 20 seconds for messages before returning

**Memory Management**:
- Limit accumulated messages to 100 maximum
- Clear seenMessageIds Set after polling completes
- Use Set for O(1) deduplication lookups

### DOM Rendering Performance

**Challenge**: Re-rendering large message tables can be slow.

**Optimization**:
- Use pagination to limit rendered rows (10-50 per page)
- Use event delegation for row click handlers instead of individual listeners
- Batch DOM updates during polling (update every 100ms, not per message)
- Use DocumentFragment for building table rows before appending

**Example**:
```javascript
function renderMessageRows(messages) {
  const fragment = document.createDocumentFragment();
  
  messages.forEach(message => {
    const row = createMessageRow(message);
    fragment.appendChild(row);
  });
  
  const tbody = document.querySelector('#message-table tbody');
  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}
```

### Selection State Performance

**Challenge**: Checking selection state for every row on every render.

**Optimization**:
- Use Set for O(1) lookups: `selectedMessageIds.has(messageId)`
- Avoid array methods like `includes()` which are O(n)

### Progress Bar Updates

**Challenge**: Updating progress every second could cause unnecessary reflows.

**Optimization**:
- Use CSS transitions for smooth progress bar animation
- Only update text content when percentage changes
- Use `requestAnimationFrame` for smoother updates if needed

## Security Considerations

### Input Validation

**Visibility Timeout**:
- Range: 0-43200 seconds
- Validate in webview before sending to extension
- Extension should also validate before API call

**Wait Time**:
- Range: 0-20 seconds
- Validate in webview before sending to extension

**Message Body**:
- No size limit validation in webview (AWS enforces 256KB limit)
- Sanitize HTML when displaying in UI (use `escapeHtml()`)

### XSS Prevention

**Message Content**:
- Always escape HTML when rendering message bodies
- Use `textContent` instead of `innerHTML` when possible
- Sanitize message attributes before rendering

**Example**:
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Usage
row.innerHTML = `<td>${escapeHtml(message.body)}</td>`;
```

### postMessage Security

**Message Validation**:
- Validate message structure in extension before processing
- Check for required fields (queueId, command, etc.)
- Validate data types

**Example**:
```typescript
panel.webview.onDidReceiveMessage(async message => {
  // Validate command
  if (typeof message.command !== 'string') {
    console.error('Invalid message: missing command');
    return;
  }
  
  // Validate queueId for queue-specific operations
  if (['fetchMessages', 'deleteMessage'].includes(message.command)) {
    if (typeof message.queueId !== 'string') {
      console.error('Invalid message: missing queueId');
      return;
    }
  }
  
  // Process message
  switch (message.command) {
    // ...
  }
});
```

## Accessibility Considerations

### Keyboard Navigation

**Requirements**:
- All interactive elements must be keyboard accessible
- Tab order should be logical (top to bottom, left to right)
- Focus indicators must be visible

**Implementation**:
- Use semantic HTML (`<button>`, `<input type="checkbox">`)
- Ensure custom checkboxes are keyboard accessible
- Add `tabindex` where needed
- Use `:focus` styles with VS Code theme variables

### Screen Reader Support

**Requirements**:
- All interactive elements must have accessible labels
- Table structure must be semantic
- Status messages must be announced

**Implementation**:
```html
<!-- Checkbox with label -->
<label>
  <input type="checkbox" id="peek-mode" />
  Peek Mode (keep available)
</label>

<!-- Button with aria-label -->
<button class="delete-btn" aria-label="Delete message">🗑️</button>

<!-- Table with proper headers -->
<table>
  <thead>
    <tr>
      <th scope="col">Message ID</th>
      <th scope="col">Body Preview</th>
    </tr>
  </thead>
</table>

<!-- Status messages with role -->
<div role="status" aria-live="polite" id="success-container"></div>
<div role="alert" aria-live="assertive" id="error-container"></div>
```

### Color Contrast

**Requirements**:
- All text must meet WCAG AA contrast ratios (4.5:1 for normal text)
- Don't rely on color alone to convey information

**Implementation**:
- Use VS Code theme variables (automatically meet contrast requirements)
- Add icons in addition to color for status (✓ for success, ✗ for error)
- Ensure selected rows have both color and visual indicator

## Deployment Considerations

### Version Compatibility

**VS Code Version**:
- Minimum version: 1.60.0 (for webview API features)
- Test with multiple VS Code versions

**Node.js Version**:
- Minimum version: 14.x (for extension host)
- Use compatible JavaScript features (no optional chaining in older versions)

### Extension Size

**Optimization**:
- No external dependencies in webview (vanilla JavaScript only)
- Minify CSS if needed
- Keep HTML template size reasonable

### Update Strategy

**Breaking Changes**:
- This feature adds new UI but doesn't change existing functionality
- Existing queue management features remain unchanged
- No migration needed for existing users

**Rollout**:
- Can be released as a minor version update
- Document new features in changelog
- Provide screenshots/GIFs in documentation

## Future Enhancements

### Potential Improvements

1. **Configurable Polling Duration**
   - Allow users to set custom polling duration (30s, 60s, 120s, 300s)
   - Store preference in VS Code settings

2. **Message Filtering**
   - Add client-side filtering by message attributes
   - Add regex search for message body

3. **Export Messages**
   - Export selected messages to JSON file
   - Export all messages to CSV

4. **Message Editing**
   - Edit message attributes before redriving
   - Edit message body before redriving

5. **Batch Size Configuration**
   - Allow users to configure messages per API call (1-10)
   - Allow users to configure max accumulated messages (10-1000)

6. **Polling Presets**
   - Save polling configurations as presets
   - Quick access to common configurations

7. **Message Statistics**
   - Show statistics during polling (messages/second, average size)
   - Show deduplication statistics (duplicates found)

8. **Keyboard Shortcuts**
   - Add keyboard shortcuts for common actions
   - Ctrl+A to select all, Delete to delete selected, etc.

These enhancements are out of scope for the current implementation but could be added in future iterations based on user feedback.

