# Manual Testing Guide - Interactive Features Checkpoint

This guide helps you manually verify the interactive features implemented in tasks 5-7 of the VS Code Extension Web UI Parity spec.

## Prerequisites

1. Open VS Code with the SQS Management Tool extension installed
2. Have an AWS profile configured with access to SQS queues
3. Have at least one SQS queue available for testing

## Test Setup

1. Open the VS Code extension
2. Select an AWS profile using the command palette: `SQS Management Tool: Select AWS Profile`
3. Click on a queue in the SQS Queues sidebar to open the queue management panel

---

## Feature 1: Loading State Management (Task 5)

### Test 1.1: Send Message Loading State

**Steps:**
1. Navigate to the "Main Queue" tab
2. Enter a message body in the text area
3. Click the "Send Message" button
4. **Observe:** Button should immediately change to "Sending..." and become disabled
5. **Observe:** After the operation completes, button should return to "Send Message" and become enabled
6. **Expected:** Message body should be cleared, and a success notification should appear

**Pass Criteria:**
- ✅ Button shows "Sending..." during operation
- ✅ Button is disabled during operation
- ✅ Button returns to normal state after completion
- ✅ No duplicate sends are possible while loading

### Test 1.2: Receive Messages Loading State

**Steps:**
1. In the "Main Queue" tab, click "Receive Messages"
2. **Observe:** Button should change to "Loading..." and become disabled
3. **Observe:** After messages load, button should return to "Receive Messages"

**Pass Criteria:**
- ✅ Button shows "Loading..." during operation
- ✅ Button is disabled during operation
- ✅ Messages appear after loading completes

### Test 1.3: Delete Message Loading State

**Steps:**
1. Receive some messages first (if none are visible)
2. Click the "Delete" button on any message
3. **Observe:** Button should change to "Deleting..." and become disabled
4. **Observe:** After deletion, the message list should refresh

**Pass Criteria:**
- ✅ Button shows "Deleting..." during operation
- ✅ Button is disabled during operation
- ✅ Message is removed from the list after completion

### Test 1.4: Purge Queue Loading State

**Steps:**
1. In the "Main Queue" tab, click "Purge Queue"
2. Confirm the action in the dialog
3. **Observe:** Button should change to "Purging..." and become disabled
4. **Observe:** After purge completes, button should return to "Purge Queue"

**Pass Criteria:**
- ✅ Button shows "Purging..." during operation
- ✅ Button is disabled during operation
- ✅ Messages are cleared after completion

### Test 1.5: Redrive DLQ Loading State

**Steps:**
1. Navigate to the "DLQ" tab (ensure your queue has a DLQ configured)
2. Click "Redrive All DLQ Messages"
3. **Observe:** Button should change to "Redriving..." and become disabled
4. **Observe:** After redrive completes, button should return to normal

**Pass Criteria:**
- ✅ Button shows "Redriving..." during operation
- ✅ Button is disabled during operation
- ✅ DLQ messages are moved to main queue

### Test 1.6: DLQ Receive Messages Loading State

**Steps:**
1. In the "DLQ" tab, click "Receive Messages"
2. **Observe:** Button should change to "Loading..." and become disabled
3. **Observe:** After messages load, button should return to "Receive Messages"

**Pass Criteria:**
- ✅ Button shows "Loading..." during operation
- ✅ Button is disabled during operation
- ✅ DLQ messages appear after loading completes

---

## Feature 2: DLQ Tab Badge Indicator (Task 6)

### Test 2.1: Badge Visibility with Messages

**Steps:**
1. Ensure your queue has a DLQ configured with at least one message
2. Navigate to the "DLQ" tab
3. Click "Receive Messages"
4. **Observe:** The DLQ tab label should show a badge with the message count

**Pass Criteria:**
- ✅ Badge appears next to "DLQ" text
- ✅ Badge shows the correct number of messages
- ✅ Badge has a warning color (orange or red)
- ✅ Badge is styled as a small circular or rounded element

### Test 2.2: Badge Hidden When Empty

**Steps:**
1. In the "DLQ" tab, delete all messages or redrive them
2. **Observe:** The badge should disappear when no messages remain

**Pass Criteria:**
- ✅ Badge is hidden when DLQ has 0 messages
- ✅ Badge reappears when messages are added

### Test 2.3: Badge Updates After Operations

**Steps:**
1. Start with DLQ messages visible (badge showing count)
2. Click "Delete" on one message
3. **Observe:** Badge count should decrease by 1
4. Click "Redrive" on another message
5. **Observe:** Badge count should decrease by 1 again

**Pass Criteria:**
- ✅ Badge count updates after delete operations
- ✅ Badge count updates after redrive operations
- ✅ Badge disappears when last message is removed

---

## Feature 3: Message Attributes UI (Task 7)

### Test 3.1: Add Message Attributes

**Steps:**
1. Navigate to the "Main Queue" tab
2. Scroll to the "Message Attributes" section
3. Enter a key (e.g., "Priority") in the Key field
4. Enter a value (e.g., "High") in the Value field
5. Click "Add Attribute"
6. **Observe:** The attribute should appear in the list above the input fields

**Pass Criteria:**
- ✅ Attribute appears in the list with key and value
- ✅ Input fields are cleared after adding
- ✅ "Add Attribute" button has green styling

### Test 3.2: Remove Message Attributes

**Steps:**
1. Add an attribute (follow Test 3.1)
2. Click the "Remove" button next to the attribute
3. **Observe:** The attribute should disappear from the list

**Pass Criteria:**
- ✅ Attribute is removed from the list
- ✅ Remove button is visible and functional

### Test 3.3: Attribute Uniqueness Validation

**Steps:**
1. Add an attribute with key "Test" and value "Value1"
2. Try to add another attribute with the same key "Test" and value "Value2"
3. **Observe:** An error message should appear

**Pass Criteria:**
- ✅ Error message appears: "Attribute key already exists."
- ✅ Duplicate attribute is not added to the list

### Test 3.4: Empty Key Validation

**Steps:**
1. Leave the Key field empty
2. Enter a value in the Value field
3. Click "Add Attribute"
4. **Observe:** An error message should appear

**Pass Criteria:**
- ✅ Error message appears: "Attribute key cannot be empty."
- ✅ No attribute is added to the list

### Test 3.5: Send Message with Attributes

**Steps:**
1. Add 2-3 attributes (e.g., "Priority": "High", "Source": "Test", "Version": "1.0")
2. Enter a message body
3. Click "Send Message"
4. **Observe:** Message should be sent successfully
5. **Observe:** Attributes list should be cleared after successful send

**Pass Criteria:**
- ✅ Message is sent with attributes (verify in AWS Console if possible)
- ✅ Attributes list is cleared after send
- ✅ Success notification appears

### Test 3.6: Multiple Attributes Management

**Steps:**
1. Add 5 different attributes
2. Remove the 2nd and 4th attributes
3. Add 2 more attributes
4. **Observe:** The list should correctly show all remaining attributes

**Pass Criteria:**
- ✅ All attributes are displayed correctly
- ✅ Remove operations work for any attribute
- ✅ Add operations work after removals

---

## Visual Verification Checklist

### Styling Checks

- [ ] Header bar has blue background with white text
- [ ] View mode toggle buttons show active state clearly
- [ ] DLQ badge has warning color (orange/red)
- [ ] "Add Attribute" button has green background
- [ ] All buttons have consistent styling (padding, border-radius)
- [ ] Loading states are visually clear
- [ ] Attribute items have proper spacing and layout

### Theme Compatibility

- [ ] Test in VS Code Light theme - all colors are readable
- [ ] Test in VS Code Dark theme - all colors are readable
- [ ] Switch themes while extension is open - colors update automatically

---

## Troubleshooting

### If loading states don't work:
- Check browser console for JavaScript errors
- Verify button IDs match between HTML and JavaScript
- Ensure postMessage responses are being received

### If DLQ badge doesn't appear:
- Verify your queue has a DLQ configured
- Check that DLQ messages are actually being received
- Inspect the badge element in the DOM (should have id="dlq-badge")

### If message attributes don't work:
- Check browser console for errors
- Verify the attributes section HTML is present
- Ensure input field IDs match JavaScript selectors

---

## Completion Criteria

All tests should pass with ✅ marks. If any test fails:
1. Document the specific failure
2. Check the implementation in `media/main.js` and `src/extension.ts`
3. Report the issue with details about what was expected vs. what happened

---

## Notes

- This is a manual testing guide because the VS Code extension doesn't have automated UI tests
- Some tests require AWS resources (SQS queues, DLQ configuration)
- Visual verification is subjective but should follow the design specifications
- All functionality should work in both light and dark VS Code themes
