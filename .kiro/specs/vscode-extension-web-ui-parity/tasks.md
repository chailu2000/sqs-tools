# Implementation Plan: VS Code Extension Web UI Parity

## Overview

This implementation plan enhances the VS Code SQS Management Tool extension to achieve visual and functional parity with the web UI. The work focuses on improving styling, adding loading state indicators, enhancing visual feedback, and maintaining full VS Code theme compatibility. All changes will be made to the existing webview-based architecture without modifying the core extension functionality.

## Tasks

- [x] 1. Set up CSS foundation and theme integration
  - [x] 1.1 Add header bar HTML structure and CSS styling to extension.ts
    - Add header bar div with queue name title to getWebviewContent()
    - Implement blue background with white text using VS Code theme variables
    - Add padding and shadow styling consistent with web UI design
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 1.2 Update all existing CSS to use VS Code theme variables
    - Replace hardcoded colors with var(--vscode-*) theme variables
    - Ensure compatibility with both light and dark themes
    - Apply theme variables to backgrounds, foregrounds, and borders
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 1.3 Implement consistent button styling system
    - Create base .vscode-button class with consistent padding (0.5rem vertical, 1rem horizontal)
    - Add border-radius (4px) to all buttons
    - Implement hover, active, and disabled states
    - Create button type variations (primary, secondary, danger)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 1.4 Enhance form control styling (inputs, textareas, selects)
    - Create .vscode-input class with theme variable styling
    - Implement focus states with border highlights
    - Add consistent padding for comfortable interaction
    - Apply styling to text inputs, number inputs, textareas, and select dropdowns
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [x] 1.5 Implement custom checkbox styling
    - Style checkboxes to be visually distinct and easy to click
    - Add visual feedback for checked state
    - Ensure proper spacing between checkboxes and labels
    - Use theme variables for colors and borders
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 2. Enhance tab navigation and view mode controls
  - [x] 2.1 Update tab navigation CSS with enhanced styling
    - Add hover states for inactive tabs
    - Implement active tab highlighting with distinct background
    - Add bottom border that connects to content area
    - Ensure consistent spacing and padding for tab headers
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 2.2 Implement view mode toggle button enhancements
    - Create .view-toggle-group container for grouped button appearance
    - Add .view-toggle-button class with base styling
    - Implement .view-toggle-button.active class for active state highlighting
    - Add hover states for visual feedback
    - Position toggle consistently in both Main Queue and DLQ tabs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 2.3 Add view mode state management in main.js
    - Create messageViewMode and dlqViewMode state variables
    - Implement setViewMode() function to update active button states
    - Implement updateViewModeButtons() to add/remove 'active' class
    - Wire up view mode buttons to state management functions
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Improve content display components
  - [x] 3.1 Enhance queue information table styling
    - Implement two-column table layout for queue attributes
    - Add alternating row colors using :nth-child(even)
    - Apply theme variables for borders and backgrounds
    - Add proper spacing and padding between cells
    - Create visually distinct section for DLQ information with warning colors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 3.2 Enhance message card styling for card view
    - Add rounded corners (4px border-radius) to .message-item
    - Implement subtle shadows or borders for visual separation
    - Update message ID styling with distinct color and bold font weight
    - Improve spacing between card elements
    - Position action buttons consistently in top-right or bottom-right corner
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 3.3 Enhance message table styling for table view
    - Add consistent border styling to .message-table
    - Implement header row styling with bold text and distinct background
    - Add alternating row colors for better readability
    - Style action buttons consistently with other extension buttons
    - Limit message body height and add scrolling for long content
    - Ensure column alignment and proper spacing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 3.4 Implement error, warning, and info message styling
    - Create CSS classes for error messages (red using theme variables)
    - Create CSS classes for warning messages (orange/yellow using theme variables)
    - Create CSS classes for info messages (blue using theme variables)
    - Add appropriate background colors for message sections
    - Ensure sufficient contrast for readability
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 4. Checkpoint - Verify styling changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement loading state management
  - [x] 5.1 Add loading state tracking to main.js
    - Create loadingStates object to track all operation states
    - Add state properties: sendMessage, receiveMessages, deleteMessage, purgeQueue, redriveDLQ, changeVisibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 5.2 Implement setButtonLoading() helper function
    - Create function to update button text and disabled state
    - Accept parameters: buttonId, isLoading, loadingText, defaultText
    - Handle cases where button element doesn't exist
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 5.3 Integrate loading states with send message operation
    - Set loading state before sending postMessage
    - Update Send button to display "Sending..." text
    - Disable button during operation
    - Clear loading state on response
    - _Requirements: 5.1, 5.6_
  
  - [x] 5.4 Integrate loading states with receive messages operation
    - Set loading state before sending postMessage
    - Update Receive button to display "Loading..." text
    - Disable button during operation
    - Clear loading state on response
    - _Requirements: 5.2, 5.6_
  
  - [x] 5.5 Integrate loading states with delete operation
    - Set loading state before sending postMessage
    - Update Delete button to display "Deleting..." text
    - Disable button during operation
    - Clear loading state on response
    - _Requirements: 5.3, 5.6_
  
  - [x] 5.6 Integrate loading states with purge operation
    - Set loading state before sending postMessage
    - Update Purge button to display "Purging..." text
    - Disable button during operation
    - Clear loading state on response
    - _Requirements: 5.5, 5.6_
  
  - [x] 5.7 Integrate loading states with redrive operation
    - Set loading state before sending postMessage
    - Update Redrive button to display "Redriving..." text
    - Disable button during operation
    - Clear loading state on response
    - _Requirements: 5.4, 5.6_

- [x] 6. Implement DLQ tab badge indicator
  - [x] 6.1 Add DLQ badge HTML to tab label in extension.ts
    - Add span element with class "dlq-badge" and id "dlq-badge"
    - Set initial display to none
    - Position badge next to DLQ tab label text
    - _Requirements: 6.1, 6.4_
  
  - [x] 6.2 Implement DLQ badge CSS styling
    - Create .dlq-badge class with warning color (orange or red)
    - Style as small circular or rounded rectangle element
    - Use theme variables for colors
    - Add appropriate padding and font sizing
    - _Requirements: 6.2, 6.3_
  
  - [x] 6.3 Add updateDLQBadge() function to main.js
    - Accept count parameter
    - Show badge and update count when count > 0
    - Hide badge when count is 0
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [x] 6.4 Integrate badge updates with DLQ message operations
    - Call updateDLQBadge() when DLQ messages are loaded
    - Update badge after redrive operations complete
    - Update badge after delete operations complete
    - _Requirements: 6.5_

- [x] 7. Implement message attributes UI
  - [x] 7.1 Add message attributes HTML section to extension.ts
    - Create .message-attributes-section container
    - Add attributes-list div for displaying added attributes
    - Add input fields for key and value
    - Add "Add Attribute" button with green styling
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [x] 7.2 Implement message attributes CSS styling
    - Style .message-attributes-section container
    - Create .attribute-input-row with flexbox layout
    - Style .add-button with green background using theme variables
    - Create .attribute-item class for displaying attributes
    - Add styling for remove buttons
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 7.3 Add attribute management functions to main.js
    - Create messageAttributes object to store key-value pairs
    - Implement addAttribute() function with uniqueness validation
    - Implement removeAttribute() function
    - Implement renderAttributes() function to update display
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [x] 7.4 Integrate attributes with send message operation
    - Update sendMessage handler to include messageAttributes
    - Clear attributes after successful send
    - _Requirements: 7.4_

- [x] 8. Checkpoint - Verify interactive features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement responsive layout improvements
  - [x] 9.1 Add flexible layout CSS for panel width adaptation
    - Use flexbox and CSS Grid for responsive layouts
    - Ensure controls wrap appropriately on smaller screens
    - Maintain readability at narrow panel widths
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 9.2 Test and adjust layout at various panel sizes
    - Verify buttons remain accessible and clickable at all sizes
    - Prevent horizontal scrolling unless necessary for content
    - Adjust breakpoints if needed
    - _Requirements: 10.4, 10.5_

- [x] 10. Add missing utility functions
  - [x] 10.1 Implement escapeHtml() function in main.js
    - Create function to escape HTML special characters
    - Use for sanitizing user input before displaying
    - Apply to message bodies and attribute values
    - _Requirements: 8.6, 8.7_

- [x] 11. Final integration and testing
  - [x] 11.1 Test all features in light theme
    - Verify all colors and contrasts are appropriate
    - Check readability of all text elements
    - _Requirements: 8.6_
  
  - [x] 11.2 Test all features in dark theme
    - Verify all colors and contrasts are appropriate
    - Check readability of all text elements
    - _Requirements: 8.5, 8.6_
  
  - [x] 11.3 Verify all loading states work correctly
    - Test each operation's loading indicator
    - Ensure buttons are properly disabled during operations
    - Verify loading states clear on completion
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 11.4 Verify DLQ badge updates correctly
    - Test badge display with messages present
    - Test badge hiding when DLQ is empty
    - Test badge updates after operations
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [x] 11.5 Test message attributes functionality
    - Add and remove attributes
    - Verify uniqueness validation
    - Test sending messages with attributes
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 12. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All CSS changes are made in the `<style>` block within `getWebviewContent()` in `src/extension.ts`
- All JavaScript changes are made in `media/main.js`
- HTML structure changes are made in `getWebviewContent()` in `src/extension.ts`
- Use VS Code theme variables (var(--vscode-*)) for all colors to ensure theme compatibility
- Maintain existing functionality while enhancing visual presentation
- Test in both light and dark themes throughout implementation
- Each task references specific requirements for traceability
