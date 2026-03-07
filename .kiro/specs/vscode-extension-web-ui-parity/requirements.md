# Requirements Document

## Introduction

This document specifies the requirements for enhancing the VS Code extension to achieve visual and functional parity with the web UI. The VS Code extension currently provides core SQS queue management functionality but lacks the polished styling and user experience features present in the web UI. This enhancement will improve the extension's visual presentation while maintaining compatibility with VS Code's theming system and ensuring all existing functionality remains intact.

## Glossary

- **Extension**: The VS Code SQS Management Tool extension
- **Webview**: The VS Code webview panel that displays queue details and messages
- **Web_UI**: The Svelte-based web application for SQS management
- **Theme_Variable**: VS Code CSS custom properties (var(--vscode-*)) used for theming
- **View_Mode**: The display format for messages (card or table)
- **Header_Bar**: The blue navigation bar at the top of the web UI
- **DLQ**: Dead Letter Queue
- **Message_Attribute**: Key-value metadata attached to SQS messages

## Requirements

### Requirement 1: Header Bar Styling

**User Story:** As a user, I want a visually distinct header bar in the extension, so that I can easily identify the navigation area and have a consistent experience with the web UI.

#### Acceptance Criteria

1. THE Extension SHALL render a header bar with a blue background color that respects VS Code theme variables
2. THE Header_Bar SHALL contain the queue name as a title element
3. THE Header_Bar SHALL use white text color for contrast against the blue background
4. THE Header_Bar SHALL include padding and shadow styling consistent with the Web_UI design
5. WHEN the VS Code theme is dark mode, THE Header_Bar SHALL adjust colors using Theme_Variable values to maintain readability

### Requirement 2: View Mode Toggle Enhancement

**User Story:** As a user, I want improved view mode toggle buttons, so that I can easily switch between card and table views with clear visual feedback.

#### Acceptance Criteria

1. THE View_Mode toggle buttons SHALL be styled with a grouped button appearance
2. WHEN a View_Mode button is active, THE Extension SHALL highlight it with a distinct background color
3. THE View_Mode toggle buttons SHALL include hover states that provide visual feedback
4. THE View_Mode toggle buttons SHALL use Theme_Variable values for all colors
5. THE View_Mode toggle buttons SHALL display icons or text labels matching the Web_UI design
6. THE View_Mode toggle SHALL be positioned consistently in both Main Queue and DLQ tabs

### Requirement 3: Queue Information Layout

**User Story:** As a user, I want a well-organized queue information display, so that I can quickly understand queue properties and metrics.

#### Acceptance Criteria

1. THE Queue Info tab SHALL display queue attributes in a two-column table layout
2. THE Queue Info table SHALL use alternating row colors for improved readability
3. THE Queue Info table SHALL apply Theme_Variable values for borders and backgrounds
4. THE Queue Info table SHALL include proper spacing and padding between cells
5. WHEN DLQ information exists, THE Extension SHALL display it in a visually distinct section with warning colors

### Requirement 4: Message Table Enhancements

**User Story:** As a user, I want an improved message table view, so that I can efficiently scan and manage multiple messages.

#### Acceptance Criteria

1. THE Message table SHALL use consistent border styling with Theme_Variable values
2. THE Message table SHALL include header row styling with bold text and distinct background
3. THE Message table SHALL apply alternating row colors for better readability
4. THE Message table action buttons SHALL be styled consistently with other buttons in the Extension
5. THE Message table SHALL limit message body height and provide scrolling for long content
6. WHEN messages are displayed in table view, THE Extension SHALL maintain column alignment and proper spacing

### Requirement 5: Loading State Indicators

**User Story:** As a user, I want to see loading indicators on buttons during operations, so that I understand when the system is processing my request.

#### Acceptance Criteria

1. WHEN a message send operation is in progress, THE Send button SHALL display "Sending..." text
2. WHEN a message receive operation is in progress, THE Receive button SHALL display "Loading..." text
3. WHEN a delete operation is in progress, THE Delete button SHALL display "Deleting..." text
4. WHEN a redrive operation is in progress, THE Redrive button SHALL display "Redriving..." text
5. WHEN a purge operation is in progress, THE Purge button SHALL display "Purging..." text
6. WHEN an operation is in progress, THE corresponding button SHALL be disabled to prevent duplicate requests

### Requirement 6: DLQ Tab Badge Indicator

**User Story:** As a user, I want a visual indicator on the DLQ tab when messages exist, so that I can quickly identify when the dead letter queue requires attention.

#### Acceptance Criteria

1. WHEN DLQ messages exist, THE DLQ tab label SHALL display a badge with the message count
2. THE DLQ badge SHALL use a warning color (orange or red) to draw attention
3. THE DLQ badge SHALL be styled as a small circular or rounded rectangle element
4. WHEN the DLQ is empty, THE DLQ tab SHALL display without a badge
5. THE DLQ badge SHALL update automatically when messages are redriven or deleted

### Requirement 7: Message Attributes UI Enhancement

**User Story:** As a user, I want an improved interface for adding message attributes, so that I can easily attach metadata to messages I send.

#### Acceptance Criteria

1. THE "Add Attribute" button SHALL be styled with a green background color using Theme_Variable values
2. THE Message attributes section SHALL display existing attributes in a list format
3. THE Message attributes section SHALL include remove buttons for each attribute
4. WHEN adding an attribute, THE Extension SHALL provide input fields for key and value
5. THE Message attributes section SHALL validate that attribute keys are unique before adding

### Requirement 8: Overall Theme Integration

**User Story:** As a user, I want the extension to respect my VS Code theme, so that it integrates seamlessly with my development environment.

#### Acceptance Criteria

1. THE Extension SHALL use Theme_Variable values for all background colors
2. THE Extension SHALL use Theme_Variable values for all foreground text colors
3. THE Extension SHALL use Theme_Variable values for all border colors
4. THE Extension SHALL use Theme_Variable values for all button colors
5. WHEN the VS Code theme changes, THE Extension SHALL automatically update colors without requiring a reload
6. THE Extension SHALL maintain readability in both light and dark themes
7. THE Extension SHALL use appropriate contrast ratios for accessibility compliance

### Requirement 9: Button Styling Consistency

**User Story:** As a user, I want consistent button styling throughout the extension, so that I have a cohesive and professional user experience.

#### Acceptance Criteria

1. THE Extension SHALL apply consistent padding to all buttons (0.5rem vertical, 1rem horizontal)
2. THE Extension SHALL apply consistent border-radius to all buttons (4px)
3. THE Extension SHALL provide hover states for all interactive buttons
4. THE Extension SHALL provide active/pressed states for all interactive buttons
5. THE Extension SHALL use appropriate colors for different button types (primary, secondary, danger)
6. THE Extension SHALL ensure buttons have sufficient contrast against their backgrounds

### Requirement 10: Responsive Layout Improvements

**User Story:** As a user, I want the extension layout to adapt to different panel sizes, so that I can use it effectively in various VS Code configurations.

#### Acceptance Criteria

1. THE Extension SHALL use flexible layouts that adapt to webview panel width
2. THE Extension SHALL maintain readability when the panel is resized to narrow widths
3. THE Extension SHALL wrap control elements appropriately on smaller screens
4. THE Extension SHALL ensure buttons remain accessible and clickable at all panel sizes
5. THE Extension SHALL prevent horizontal scrolling unless absolutely necessary for content display

### Requirement 11: Tab Navigation Styling

**User Story:** As a user, I want clear visual feedback on tab navigation, so that I always know which tab is currently active.

#### Acceptance Criteria

1. THE Active tab SHALL have a distinct background color using Theme_Variable values
2. THE Active tab SHALL have a bottom border that matches the content area background
3. THE Inactive tabs SHALL have a subtle hover effect when the cursor is over them
4. THE Tab headers SHALL use consistent spacing and padding
5. THE Tab headers SHALL align properly with the content area below them

### Requirement 12: Control Input Styling

**User Story:** As a user, I want consistently styled input controls, so that the interface feels polished and professional.

#### Acceptance Criteria

1. THE Extension SHALL style all text inputs with Theme_Variable values for background and border
2. THE Extension SHALL style all number inputs with Theme_Variable values for background and border
3. THE Extension SHALL style all select dropdowns with Theme_Variable values for background and border
4. THE Extension SHALL style all textareas with Theme_Variable values for background and border
5. THE Extension SHALL provide focus states for all input controls
6. THE Extension SHALL ensure input controls have sufficient padding for comfortable interaction

### Requirement 13: Message Card Styling

**User Story:** As a user, I want visually appealing message cards in card view, so that I can easily distinguish between different messages.

#### Acceptance Criteria

1. THE Message cards SHALL have rounded corners (4px border-radius)
2. THE Message cards SHALL have subtle shadows or borders for visual separation
3. THE Message cards SHALL use Theme_Variable values for background colors
4. THE Message cards SHALL include proper spacing between card elements
5. THE Message cards SHALL display message ID in a distinct color or font weight
6. THE Message cards SHALL position action buttons consistently in the top-right or bottom-right corner

### Requirement 14: Error and Warning Display

**User Story:** As a user, I want clear visual indicators for errors and warnings, so that I can quickly identify and address issues.

#### Acceptance Criteria

1. THE Extension SHALL display error messages in red using Theme_Variable values
2. THE Extension SHALL display warning messages in orange/yellow using Theme_Variable values
3. THE Extension SHALL display info messages in blue using Theme_Variable values
4. THE Extension SHALL use appropriate background colors for error/warning/info sections
5. THE Extension SHALL ensure error and warning text has sufficient contrast for readability

### Requirement 15: Checkbox and Form Control Styling

**User Story:** As a user, I want styled checkboxes and form controls, so that the interface matches modern web UI standards.

#### Acceptance Criteria

1. THE Extension SHALL style checkboxes to be visually distinct and easy to click
2. THE Extension SHALL provide visual feedback when checkboxes are checked
3. THE Extension SHALL style checkbox labels with appropriate spacing
4. THE Extension SHALL ensure form controls align properly with their labels
5. THE Extension SHALL use Theme_Variable values for checkbox colors and borders
