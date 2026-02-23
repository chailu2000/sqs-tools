# SQS Management Tool - Improvements & Fixes

## Completed Features

### ✅ 1. Jackson Serialization Error
**Issue**: Error when sending messages with attributes: `Type definition error: [simple type, class software.amazon.awssdk.services.sqs.model.MessageAttributeValue]`

**Fix**: Created `MessageAttributeDto` to replace AWS SDK types in the API layer. The controller now converts between DTO and AWS SDK types.

**Status**: Fixed in commit 60bf4ac

---

### ✅ 2. Queue Attributes Display
**Issue**: Queue details only showing URL, region, and DLQ info. Other attributes showing "N/A"

**Fix**: Updated QueueDetails component to read from `attributes` map with correct AWS attribute names (e.g., `ApproximateNumberOfMessages`, `VisibilityTimeout`)

**Status**: Fixed - attributes now display correctly

---

### ✅ 3. Message Search Filtering
**Issue**: Search box not filtering messages

**Fix**: Changed `$derived()` to `$derived.by()` in store for proper Svelte 5 reactive values

**Status**: Fixed - search now works correctly

---

### ✅ 4. Table-Based View with DLQ Support
**Implemented**:
- Created MessageTable component with tabs for Main Queue and DLQ
- Added view mode toggle in header (Cards 📋 / Table 📊)
- Implemented pagination (10/25/50 messages per page)
- Added row selection with checkboxes
- Bulk actions: Delete selected, Redrive selected (for DLQ)
- Click row to show full message details below table
- DLQ message fetching endpoint: `GET /api/queues/{queueId}/dlq/messages`
- Selective redrive endpoint: `POST /api/queues/{queueId}/redrive/selective`

**Backend Changes**:
- Added `receiveDlqMessages()` in QueueController
- Added `redriveSelectedMessages()` in RedriveService
- Added selective redrive endpoint in RedriveController

**Frontend Changes**:
- New MessageTable.svelte component
- Updated App.svelte with view mode toggle
- Updated store with viewMode, activeTab, dlqMessages, selectedMessageIds
- Updated API client with receiveDlqMessages() and redriveSelectedMessages()

**Status**: Completed in commit c6ce1f3

---

## Current Features

### Message Management
- ✅ Send messages with attributes and delay
- ✅ Receive messages from main queue
- ✅ Receive messages from DLQ
- ✅ Delete individual messages
- ✅ Delete multiple selected messages (bulk)
- ✅ Change message visibility timeout
- ✅ Search/filter messages by body or attributes
- ✅ View messages in card format (original)
- ✅ View messages in table format (new)

### DLQ Operations
- ✅ Redrive single message
- ✅ Redrive all messages
- ✅ Redrive selected messages by ID (new)
- ✅ View DLQ messages in separate tab (new)

### Queue Management
- ✅ Add queue by URL or name
- ✅ List all saved queues
- ✅ View queue attributes (message counts, timeouts, retention)
- ✅ Purge queue
- ✅ Remove queue from saved list

### UI Features
- ✅ Card-based message view
- ✅ Table-based message view with pagination (new)
- ✅ Tab switching between main queue and DLQ (new)
- ✅ View mode toggle (cards/table) (new)
- ✅ JSON syntax highlighting
- ✅ Dark mode support
- ✅ Responsive design

---

## Testing Recommendations

1. **Test Table View**:
   - Switch between Cards and Table views
   - Test pagination with different page sizes
   - Select multiple messages and delete
   - Click rows to view message details

2. **Test DLQ Tab**:
   - Switch to DLQ tab
   - Receive DLQ messages
   - Select messages and redrive
   - Verify messages move back to main queue

3. **Test Selective Redrive**:
   - Send messages to main queue
   - Let them fail to DLQ (or manually move)
   - Select specific messages in DLQ tab
   - Click "Redrive Selected"
   - Verify only selected messages are redriven

---

## Known Limitations

1. **Selective Redrive**: Messages must be visible in the DLQ to be redriven. If a message is not currently visible (due to visibility timeout), it cannot be selected for redrive.

2. **Message Visibility**: When receiving messages, they become invisible to other consumers for the visibility timeout period.

---

## Future Enhancements (Optional)

- Add message preview mode (view without receiving)
- Add message filtering by attributes
- Add export messages to JSON/CSV
- Add message replay functionality
- Add queue metrics dashboard
- Add CloudWatch integration for monitoring
