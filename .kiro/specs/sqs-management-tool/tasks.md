# Implementation Plan: SQS Management Tool

## Overview

This implementation plan breaks down the SQS Management Tool into discrete coding tasks. The tool consists of a Spring Boot backend that interfaces with AWS SQS APIs and a Svelte 5 frontend. The implementation follows an incremental approach, building core functionality first, then adding features progressively.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create Spring Boot 4.0.x project with Gradle (Java 21 or 23) with required dependencies:
    - Spring Web
    - Spring Data JPA
    - SQLite JDBC driver (3.46.x)
    - AWS SDK for Java v2 (2.x - sqs module)
    - Jackson (included with Spring Boot 4)
    - jqwik (1.9.x) for property-based testing
    - JUnit 5 and Mockito (included with Spring Boot 4)
  - Use Gradle Kotlin DSL (build.gradle.kts) for better IDE support
  - Create Svelte 5 project with Vite 6.x and TypeScript 5.x
  - Add frontend dependencies:
    - Vitest 2.x for testing
    - @testing-library/svelte 5.x for component testing
    - Prism.js 1.29.x for JSON syntax highlighting
  - Configure CORS in Spring Boot to allow frontend requests
  - Set up basic project directory structure for both backend and frontend
  - Configure Spring Data JPA to use SQLite with Hibernate 6.x dialect
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2. Implement AWS credentials and client management
  - [x] 2.1 Create CredentialsProvider component
    - Implement credential resolution from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
    - Implement credential resolution from AWS CLI profiles
    - Implement priority logic (environment variables take precedence over profiles)
    - Add credential validation method
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  
  - [ ]* 2.2 Write property test for credential resolution priority
    - **Property: Credential Resolution Priority**
    - **Validates: Requirements 2.3**
  
  - [x] 2.3 Create SQSClientFactory component
    - Implement SQS client creation with region configuration
    - Add client caching per region
    - Integrate with CredentialsProvider
    - _Requirements: 11.4_
  
  - [ ]* 2.4 Write unit tests for SQSClientFactory
    - Test client creation for different regions
    - Test client caching behavior
    - _Requirements: 11.4_

- [x] 3. Implement configuration persistence with SQLite
  - [x] 3.1 Create database entities and repositories
    - Create QueueEntity JPA entity with fields matching QueueConfiguration
    - Create PreferenceEntity JPA entity for key-value preferences
    - Create QueueRepository extending JpaRepository
    - Create PreferenceRepository extending JpaRepository
    - Configure SQLite database file location (cross-platform path)
    - _Requirements: 12.1, 12.2, 12.3, 14.3_
  
  - [x] 3.2 Create ConfigurationService
    - Implement save queue configuration to database
    - Implement load queue configurations from database
    - Implement remove queue configuration
    - Implement update queue configuration
    - Add transaction management for data integrity
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6, 12.7_
  
  - [ ]* 3.3 Write property test for configuration persistence round-trip
    - **Property 2: Queue Configuration Persistence Round-Trip**
    - **Validates: Requirements 1.4, 1.5, 12.1, 12.2, 12.3**
  
  - [ ]* 3.4 Write property test for configuration removal
    - **Property 21: Queue Configuration Removal**
    - **Validates: Requirements 12.5**
  
  - [ ]* 3.5 Write property test for configuration update
    - **Property 22: Queue Configuration Update**
    - **Validates: Requirements 12.6, 12.7**
  
  - [ ]* 3.6 Write unit tests for database operations
    - Test concurrent queue additions
    - Test duplicate queue URL handling
    - Test database constraint violations
    - _Requirements: 12.1, 12.5, 12.6_

- [x] 4. Implement queue management service layer
  - [x] 4.1 Create QueueService
    - Implement resolveQueueUrl method (handles both queue names and URLs)
    - Implement getQueueAttributes method
    - Implement extractDlqFromAttributes method (parse RedrivePolicy JSON)
    - Add error handling for QueueDoesNotExist and AccessDenied exceptions
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 3.1, 3.4, 3.5_
  
  - [ ]* 4.2 Write property test for queue identifier resolution
    - **Property 1: Queue Identifier Resolution**
    - **Validates: Requirements 1.1, 1.2**
  
  - [ ]* 4.3 Write property test for queue attribute retrieval
    - **Property 3: Queue Attribute Retrieval**
    - **Validates: Requirements 1.6**
  
  - [ ]* 4.4 Write property test for DLQ extraction
    - **Property 4: DLQ Extraction from Attributes**
    - **Validates: Requirements 1.7, 3.1, 3.4**
  
  - [ ]* 4.5 Write unit tests for error scenarios
    - Test queue not found error handling
    - Test access denied error handling
    - Test invalid queue URL format
    - _Requirements: 1.3, 13.1, 13.4_

- [-] 5. Implement message operations service layer
  - [x] 5.1 Create MessageService
    - Implement receiveMessages method with configurable parameters (maxMessages, visibilityTimeout, waitTimeSeconds)
    - Implement sendMessage method with message attributes and delay seconds
    - Implement deleteMessage method using receipt handle
    - Implement changeMessageVisibility method
    - Implement purgeQueue method
    - Add JSON parsing and pretty-printing for message bodies
    - Handle PurgeQueueInProgress exception with appropriate error message
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 6.2, 6.3, 6.7, 7.1, 7.4, 7.7, 9.2, 9.6, 10.2, 15.1, 15.3_
  
  - [ ]* 5.2 Write property test for message field completeness
    - **Property 8: Message Field Completeness**
    - **Validates: Requirements 4.2, 7.3**
  
  - [ ]* 5.3 Write property test for JSON formatting round-trip
    - **Property 9: JSON Message Formatting Round-Trip**
    - **Validates: Requirements 4.4, 4.5, 15.1, 15.3, 15.5**
  
  - [ ]* 5.4 Write property test for visibility timeout parameter passing
    - **Property 10: Visibility Timeout Parameter Passing**
    - **Validates: Requirements 4.6, 7.1**
  
  - [ ]* 5.5 Write property test for message send with attributes
    - **Property 12: Message Send with Attributes**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  
  - [ ]* 5.6 Write property test for message send with delay
    - **Property 14: Message Send with Delay**
    - **Validates: Requirements 6.7**
  
  - [ ]* 5.7 Write property test for visibility timeout range validation
    - **Property 20: Visibility Timeout Range Validation**
    - **Validates: Requirements 10.3**
  
  - [ ]* 5.8 Write unit tests for edge cases
    - Test empty message body handling
    - Test non-JSON message body handling
    - Test purge rate limit error handling
    - _Requirements: 4.5, 9.6, 15.3_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement redrive operations service layer
  - [x] 7.1 Create RedriveService
    - Implement redrive operation: receive from DLQ, send to main queue, delete from DLQ
    - Add transactional behavior (only delete from DLQ if send succeeds)
    - Track operation progress (processed count, success count, failure count)
    - Collect and return error details for failed messages
    - Support both single message and batch redrive operations
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ]* 7.2 Write property test for redrive transactional behavior
    - **Property 17: Redrive Operation Transactional Behavior**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**
  
  - [ ]* 7.3 Write unit tests for redrive scenarios
    - Test successful redrive operation
    - Test partial failure (some messages succeed, some fail)
    - Test complete failure scenario
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 8. Implement REST controllers
  - [x] 8.1 Create QueueController
    - POST /api/queues - Add queue by name or URL
    - GET /api/queues - Get all saved queues
    - GET /api/queues/{queueId} - Get queue details
    - DELETE /api/queues/{queueId} - Remove saved queue
    - POST /api/queues/{queueId}/purge - Purge queue
    - Add request validation and error handling
    - Return appropriate HTTP status codes
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 9.2, 9.3, 9.4, 12.5_
  
  - [x] 8.2 Create MessageController
    - GET /api/queues/{queueId}/messages - Receive messages with query parameters
    - POST /api/queues/{queueId}/messages - Send message
    - DELETE /api/queues/{queueId}/messages/{receiptHandle} - Delete message
    - PATCH /api/queues/{queueId}/messages/{receiptHandle}/visibility - Change visibility
    - Add request validation and error handling
    - _Requirements: 4.1, 4.2, 6.2, 6.4, 6.5, 7.4, 7.5, 7.6, 10.2, 10.4, 10.5_
  
  - [x] 8.3 Create RedriveController
    - POST /api/queues/{queueId}/redrive - Redrive messages from DLQ
    - Return operation results with counts and errors
    - _Requirements: 8.1, 8.6_
  
  - [x] 8.4 Create ConfigController
    - GET /api/config/profiles - Get available AWS profiles
    - POST /api/config/profile - Set active AWS profile
    - GET /api/config/test-credentials - Test AWS credentials
    - _Requirements: 2.5, 2.6_
  
  - [ ]* 8.5 Write integration tests for REST endpoints
    - Test queue addition flow end-to-end
    - Test message send and receive flow
    - Test redrive operation flow
    - _Requirements: 1.1, 1.2, 4.1, 6.2, 8.2_

- [-] 9. Implement global error handling
  - [x] 9.1 Create GlobalExceptionHandler
    - Handle AWS SDK exceptions (QueueDoesNotExist, AccessDenied, etc.)
    - Handle validation exceptions
    - Handle authentication exceptions
    - Return standardized error responses with error code, message, and details
    - Map exceptions to appropriate HTTP status codes
    - Log detailed error information for debugging
    - Redact sensitive information from error messages
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ]* 9.2 Write property test for error response completeness
    - **Property 5: Error Response Completeness**
    - **Validates: Requirements 1.3, 2.4, 6.5, 7.6, 9.4, 10.5, 13.1, 13.3**
  
  - [ ]* 9.3 Write unit tests for specific error scenarios
    - Test queue not found error response
    - Test authentication failure error response
    - Test network timeout error response
    - _Requirements: 13.3, 13.4, 13.5_

- [ ] 10. Checkpoint - Ensure backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 11. Implement frontend API client
  - [x] 11.1 Create ApiClient service
    - Implement wrapper methods for all backend API endpoints
    - Add error handling and response parsing
    - Implement loading state management
    - Add request retry logic for transient errors
    - _Requirements: 11.5, 13.2, 13.7_
  
  - [ ]* 11.2 Write unit tests for ApiClient
    - Test successful API calls
    - Test error handling
    - Test retry logic
    - _Requirements: 11.5, 13.2_

- [x] 12. Implement frontend state management
  - [x] 12.1 Create stores for application state
    - Create queue list store using Svelte 5 $state rune
    - Create selected queue store
    - Create messages store
    - Create loading states store
    - Create error messages store
    - Add derived states using $derived rune (filtered messages, DLQ status)
    - _Requirements: 11.2_
  
  - [ ]* 12.2 Write unit tests for state management
    - Test state updates
    - Test derived state calculations
    - _Requirements: 11.2_

- [-] 13. Implement QueueList component
  - [x] 13.1 Create QueueList component
    - Display all saved queues with names and basic attributes
    - Add "Add Queue" button and form (input for queue name/URL, region selector)
    - Add "Remove Queue" button for each queue
    - Highlight selected queue
    - Handle queue selection (update selected queue store)
    - Call ApiClient to add/remove queues
    - Display loading states during operations
    - _Requirements: 1.1, 1.2, 12.4, 12.5_
  
  - [ ]* 13.2 Write component tests for QueueList
    - Test queue list rendering
    - Test add queue interaction
    - Test remove queue interaction
    - Test queue selection
    - _Requirements: 1.1, 1.2, 12.4, 12.5_

- [x] 14. Implement QueueDetails component
  - [x] 14.1 Create QueueDetails component
    - Display detailed queue attributes (message counts, timeouts, retention)
    - Display DLQ information if configured
    - Add "Purge Queue" button with confirmation dialog
    - Handle purge operation with error handling
    - Display queue metrics
    - _Requirements: 1.6, 1.7, 3.2, 9.1, 9.5_
  
  - [ ]* 14.2 Write component tests for QueueDetails
    - Test queue details rendering
    - Test purge confirmation dialog
    - Test purge operation
    - _Requirements: 1.6, 9.1, 9.5_

- [x] 15. Implement MessageViewer component
  - [x] 15.1 Create MessageViewer component
    - Display list of messages with message ID, body, and attributes
    - Implement JSON pretty-printing with syntax highlighting
    - Add toggle between raw and formatted views
    - Display message attributes in readable format
    - Add "Delete Message" button for each message
    - Add "Change Visibility" button with timeout input
    - Implement pagination controls
    - Handle empty state when no messages available
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 7.4, 7.5, 10.1, 10.6, 15.1, 15.2, 15.3, 15.4, 15.6_
  
  - [ ]* 15.2 Write property test for message search filtering
    - **Property 11: Message Search Filtering**
    - **Validates: Requirements 5.2, 5.3**
  
  - [ ]* 15.3 Write component tests for MessageViewer
    - Test message list rendering
    - Test JSON formatting display
    - Test delete message interaction
    - Test change visibility interaction
    - Test pagination
    - _Requirements: 4.2, 4.4, 7.4, 10.1_

- [x] 16. Implement message search and filtering
  - [x] 16.1 Add search functionality to MessageViewer
    - Add search input field
    - Implement client-side filtering by message body content
    - Implement filtering by message attributes
    - Update displayed messages in real-time as filter changes
    - Display "no matches" message when filter returns empty results
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 16.2 Write component tests for search functionality
    - Test search input interaction
    - Test filtering by body content
    - Test filtering by attributes
    - Test empty results display
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 17. Implement MessageComposer component
  - [x] 17.1 Create MessageComposer component
    - Add text area for message body
    - Add JSON validation toggle and validation logic
    - Add message attributes editor (key-value pairs)
    - Add delay seconds input field
    - Add "Send Message" button
    - Validate JSON format before sending if JSON toggle is enabled
    - Display success confirmation with message ID
    - Display error messages on failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 17.2 Write property test for JSON validation before send
    - **Property 13: JSON Validation Before Send**
    - **Validates: Requirements 6.6**
  
  - [ ]* 17.3 Write component tests for MessageComposer
    - Test message composition
    - Test JSON validation
    - Test message attributes editor
    - Test send message interaction
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [x] 18. Implement RedrivePanel component
  - [x] 18.1 Create RedrivePanel component
    - Display DLQ message count
    - Add "Redrive Single Message" button
    - Add "Redrive All Messages" button with confirmation
    - Display redrive progress during operation
    - Display operation results (success count, failure count, errors)
    - Handle cases where no DLQ is configured
    - _Requirements: 8.1, 8.6, 8.7_
  
  - [ ]* 18.2 Write component tests for RedrivePanel
    - Test redrive single message interaction
    - Test redrive all messages interaction
    - Test progress display
    - Test results display
    - _Requirements: 8.1, 8.6, 8.7_

- [x] 19. Implement SettingsPanel component
  - [x] 19.1 Create SettingsPanel component
    - Display available AWS profiles in dropdown
    - Add profile selection functionality
    - Display current credential status (valid/invalid, account ID, method)
    - Add "Test Credentials" button
    - Display credential test results
    - _Requirements: 2.5, 2.6_
  
  - [ ]* 19.2 Write component tests for SettingsPanel
    - Test profile selection
    - Test credential status display
    - Test credential testing
    - _Requirements: 2.5, 2.6_

- [x] 20. Implement main application layout and routing
  - [x] 20.1 Create main App component
    - Set up application layout (sidebar with queue list, main content area)
    - Wire together all components (QueueList, QueueDetails, MessageViewer, etc.)
    - Implement component visibility logic based on selected queue
    - Add global error notification component (toast/snackbar)
    - Add global loading indicator
    - _Requirements: 11.2, 13.2, 13.7_
  
  - [ ]* 20.2 Write integration tests for main application
    - Test complete user flows (add queue, view messages, send message)
    - Test error notification display
    - Test loading states
    - _Requirements: 11.2, 13.2, 13.7_

- [ ] 21. Checkpoint - Ensure frontend tests pass
  - Ensure all frontend tests pass, ask the user if questions arise.

- [ ] 22. Implement application packaging and startup
  - [ ] 22.1 Create application packaging configuration
    - Configure Spring Boot Gradle plugin to build executable JAR
    - Configure frontend build process (Vite build)
    - Create startup script for Windows (.bat file)
    - Create startup script for macOS (.sh file)
    - Configure backend to serve frontend static files
    - Set backend to display access URL on startup
    - _Requirements: 11.6, 11.7, 14.1, 14.2, 14.6_
  
  - [ ]* 22.2 Test application packaging
    - Test JAR execution on Windows
    - Test JAR execution on macOS
    - Test startup scripts
    - Verify frontend is served correctly
    - _Requirements: 11.6, 14.1, 14.2_

- [ ] 23. Add cross-platform compatibility verification
  - [ ] 23.1 Verify cross-platform database and file path handling
    - Test SQLite database creation on Windows
    - Test SQLite database creation on macOS
    - Verify database file location uses cross-platform paths
    - Verify AWS credentials access on both platforms
    - _Requirements: 14.3, 14.4_
  
  - [ ]* 23.2 Write property test for cross-platform file paths
    - **Property 23: Cross-Platform File Path Handling**
    - **Validates: Requirements 14.3**

- [ ] 24. Implement remaining property tests
  - [ ]* 24.1 Write property test for credential validation before operations
    - **Property 6: Credential Validation Before Operations**
    - **Validates: Requirements 2.6**
  
  - [ ]* 24.2 Write property test for DLQ message access
    - **Property 7: DLQ Message Access**
    - **Validates: Requirements 3.3, 3.5**
  
  - [ ]* 24.3 Write property test for message deletion with receipt handle
    - **Property 15: Message Deletion with Receipt Handle**
    - **Validates: Requirements 7.4**
  
  - [ ]* 24.4 Write property test for batch message receive
    - **Property 16: Batch Message Receive**
    - **Validates: Requirements 7.7**
  
  - [ ]* 24.5 Write property test for purge queue API usage
    - **Property 18: Purge Queue API Usage**
    - **Validates: Requirements 9.2, 9.3**
  
  - [ ]* 24.6 Write property test for change visibility API usage
    - **Property 19: Change Visibility API Usage**
    - **Validates: Requirements 10.2, 10.4**

- [ ] 25. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Create documentation
  - [ ] 26.1 Create README.md
    - Add project overview and features
    - Add installation instructions for Windows and macOS
    - Add usage instructions with screenshots
    - Add AWS permissions requirements
    - Add troubleshooting section
    - _Requirements: 14.6_
  
  - [ ] 26.2 Create CONTRIBUTING.md
    - Add development setup instructions
    - Add build and test instructions
    - Add code style guidelines
    - Add contribution workflow

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a backend-first approach, then frontend, then integration
- All 23 correctness properties from the design document are covered by property tests
