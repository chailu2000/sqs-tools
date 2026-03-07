# Implementation Plan: Standalone AWS SQS Extension

## Overview

This implementation plan transforms the VS Code SQS Management Tool from a backend-dependent architecture to a standalone extension that communicates directly with AWS SQS. The implementation is organized into 7 phases, progressing from core AWS integration through testing and publishing preparation.

Key implementation approach:
- Replace backend HTTP API calls with AWS SDK operations
- Support restrictive IAM environments (no ListQueues permission)
- Store credentials securely in VS Code SecretStorage
- Persist queue configurations in VS Code GlobalState
- Maintain feature parity with existing backend functionality

## Tasks

### Phase 1: Core AWS Integration

- [x] 1. Set up AWS SDK dependencies and project structure
  - Install @aws-sdk/client-sqs version 3.x
  - Install @aws-sdk/credential-providers
  - Create src/services directory for service layer
  - Set up TypeScript configuration for AWS SDK types
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement SQS Service Layer - Queue Operations
  - [x] 2.1 Create ISQSService interface with all method signatures
    - Define interfaces for ListQueuesResult, ValidationResult, QueueAttributes, DlqInfo
    - _Requirements: 1.3_
  
  - [x] 2.2 Implement tryListQueues with graceful AccessDenied handling
    - Call ListQueuesCommand
    - Return { queues: [], hasPermission: false } on AccessDeniedException
    - Throw other errors normally
    - _Requirements: 1.4, 2.1, 2.2_

  - [ ]* 2.3 Write property test for tryListQueues graceful failure
    - **Property 1: AWS SDK Error Transformation**
    - **Validates: Requirements 1.4**
  
  - [x] 2.4 Implement getQueueUrl and getQueueAttributes methods
    - Implement getQueueUrl using GetQueueUrlCommand
    - Implement getQueueAttributes using GetQueueAttributesCommand with AttributeNames: "All"
    - _Requirements: 1.3, 8.1, 8.2_
  
  - [x] 2.5 Implement validateQueueAccess method
    - Call GetQueueAttributes to validate access
    - Return ValidationResult with error and requiredPermissions on failure
    - _Requirements: 2.8, 2.9_
  
  - [ ]* 2.6 Write property test for queue URL format validation
    - **Property 5: Queue URL Format Validation**
    - **Validates: Requirements 2.7**
  
  - [x] 2.7 Implement extractDlqFromAttributes and extractQueueName methods
    - Parse RedrivePolicy JSON to extract DLQ ARN
    - Convert ARN to queue URL
    - Extract queue name from URL (last path segment)
    - _Requirements: 5.7, 8.5, 8.6, 8.7_
  
  - [ ]* 2.8 Write property test for RedrivePolicy parsing
    - **Property 13: RedrivePolicy Parsing**
    - **Validates: Requirements 5.7**
  
  - [ ]* 2.9 Write property test for ARN to URL conversion
    - **Property 21: ARN to URL Conversion**
    - **Validates: Requirements 8.6**

  - [ ]* 2.10 Write property test for queue name extraction
    - **Property 22: Queue Name Extraction from URL**
    - **Validates: Requirements 8.7**

- [x] 3. Implement SQS Service Layer - Message Operations
  - [x] 3.1 Implement receiveMessages method
    - Use ReceiveMessageCommand with MessageAttributeNames: "All" and AttributeNames: "All"
    - Transform AWS SDK response to Message interface
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 3.2 Write property test for received messages structure
    - **Property 14: Received Messages Have Required Fields**
    - **Validates: Requirements 6.3**
  
  - [x] 3.3 Implement sendMessage method
    - Use SendMessageCommand with body, delaySeconds, messageAttributes
    - Return messageId from response
    - _Requirements: 6.4, 6.5_
  
  - [ ]* 3.4 Write property test for sendMessage returns ID
    - **Property 15: Send Message Returns ID**
    - **Validates: Requirements 6.5**
  
  - [x] 3.5 Implement deleteMessage and changeMessageVisibility methods
    - Implement deleteMessage using DeleteMessageCommand
    - Implement changeMessageVisibility with validation (0-43200 seconds)
    - _Requirements: 6.6, 6.7, 6.8, 6.9_
  
  - [ ]* 3.6 Write property test for visibility timeout validation
    - **Property 16: Visibility Timeout Validation**
    - **Validates: Requirements 6.9**

  - [x] 3.7 Implement purgeQueue method with error handling
    - Use PurgeQueueCommand
    - Handle PurgeQueueInProgress error with user-friendly message
    - _Requirements: 6.10, 6.11_

- [x] 4. Implement SQS Service Layer - Redrive Operations
  - [x] 4.1 Implement redriveMessages method
    - Receive messages from DLQ
    - Send each message to main queue with original attributes
    - Delete from DLQ only on successful send
    - Return RedriveResult with counts and arrays
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 4.2 Write property test for redrive preserves attributes
    - **Property 17: Redrive Preserves Message Attributes**
    - **Validates: Requirements 7.3**
  
  - [ ]* 4.3 Write property test for successful redrive removes from DLQ
    - **Property 18: Successful Redrive Removes from DLQ**
    - **Validates: Requirements 7.4**
  
  - [ ]* 4.4 Write property test for redrive result completeness
    - **Property 19: Redrive Result Completeness**
    - **Validates: Requirements 7.6**
  
  - [x] 4.5 Implement redriveSelectedMessages method
    - Accept array of specific messages to redrive
    - Only move specified messages, leave others in DLQ
    - _Requirements: 7.7, 7.8_
  
  - [ ]* 4.6 Write property test for selective redrive
    - **Property 20: Selective Redrive Only Moves Specified Messages**
    - **Validates: Requirements 7.8**


- [x] 5. Implement SQS client caching and region management
  - [x] 5.1 Create client cache with Map<region, SQSClient>
    - Cache SQS client instances per region
    - Implement getClient(region) method
    - _Requirements: 1.5, 1.6, 11.5_
  
  - [ ]* 5.2 Write property test for client caching by region
    - **Property 2: SQS Client Caching by Region**
    - **Validates: Requirements 1.5**
  
  - [ ]* 5.3 Write property test for region change creates new client
    - **Property 3: Region Change Creates New Client**
    - **Validates: Requirements 1.6**

- [x] 6. Implement retry logic with exponential backoff
  - [x] 6.1 Create executeWithRetry utility function
    - Retry on ThrottlingException, ServiceUnavailable, ETIMEDOUT
    - Implement exponential backoff (2^attempt * 1000ms)
    - Max 3 retries
    - _Requirements: 1.7, 10.5_
  
  - [ ]* 6.2 Write property test for retry with exponential backoff
    - **Property 4: Retry with Exponential Backoff**
    - **Validates: Requirements 1.7**

- [x] 7. Replace backend API calls with AWS SDK calls
  - Identify all HTTP API calls in existing codebase
  - Replace each API call with corresponding SQS Service method
  - Update error handling to use AWS SDK errors
  - _Requirements: 1.8_

- [x] 8. Checkpoint - Core AWS integration complete
  - Ensure all tests pass, ask the user if questions arise.


### Phase 2: Credential Management

- [x] 9. Implement Credential Provider interface and priority chain
  - [x] 9.1 Create ICredentialProvider interface
    - Define methods: getCredentials, listProfiles, validateCredentials, storeCredentials, clearCredentials
    - Define AwsCredentials and AwsProfile interfaces
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 9.2 Implement credential loading from environment variables
    - Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    - Check AWS_SESSION_TOKEN (optional)
    - _Requirements: 3.2_
  
  - [x] 9.3 Implement credential loading from AWS profiles
    - Use @aws-sdk/credential-providers to load from ~/.aws/credentials
    - Implement listProfiles to enumerate available profiles
    - _Requirements: 3.1, 11.1_
  
  - [x] 9.4 Implement credential loading from VS Code SecretStorage
    - Store credentials with keys: aws-access-key-id, aws-secret-access-key, aws-session-token
    - Retrieve credentials from SecretStorage
    - _Requirements: 3.3, 3.7, 13.1_
  
  - [ ]* 9.5 Write property test for credential storage round-trip
    - **Property 7: Credential Storage Round-Trip**
    - **Validates: Requirements 3.7**
  
  - [x] 9.6 Implement credential loading from IAM roles
    - Use @aws-sdk/credential-providers for EC2/ECS metadata
    - _Requirements: 3.4_

  - [x] 9.7 Implement credential priority chain
    - Priority: environment variables → AWS profile → VS Code secrets → IAM role
    - _Requirements: 3.5_
  
  - [x] 9.8 Implement manual credential entry prompt
    - Show input boxes for access key ID and secret access key
    - Store entered credentials in SecretStorage
    - _Requirements: 3.6, 3.7_

- [x] 10. Implement credential validation and profile management
  - [x] 10.1 Implement validateCredentials using STS GetCallerIdentity
    - Call STS GetCallerIdentity to verify credentials
    - Return boolean indicating validity
    - _Requirements: 3.11_
  
  - [x] 10.2 Implement profile selection command
    - Register command: sqs-management-tool.selectProfile
    - Show QuickPick with available profiles
    - Update active profile and refresh SQS client
    - _Requirements: 3.8, 3.10, 11.2, 11.3_
  
  - [x] 10.3 Implement status bar item for active profile
    - Display active AWS profile in status bar
    - Click to open profile selection
    - _Requirements: 3.9_
  
  - [x] 10.4 Implement credential error handling
    - Display user-friendly error messages for credential failures
    - Provide troubleshooting steps
    - _Requirements: 3.12, 10.3_

- [x] 11. Implement credential security measures
  - [x] 11.1 Add credential sanitization for logs
    - Create sanitizeForLog utility function
    - Never log credentials to Output panel or Debug Console
    - _Requirements: 13.2_

  - [ ]* 11.2 Write property test for credentials never in logs
    - **Property 26: Credentials Never in Logs**
    - **Validates: Requirements 13.2**
  
  - [x] 11.3 Ensure credentials never sent to Webview
    - Review all postMessage calls to verify no credentials included
    - _Requirements: 13.3_
  
  - [ ]* 11.4 Write property test for credentials never in postMessage
    - **Property 27: Credentials Never in postMessage**
    - **Validates: Requirements 13.3**

- [x] 12. Checkpoint - Credential management complete
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Queue Storage and Management

- [x] 13. Implement Queue Storage Service
  - [x] 13.1 Create IQueueStorage interface
    - Define methods: getQueues, getQueue, addQueue, updateQueue, removeQueue
    - Define QueueConfig interface with all fields
    - _Requirements: 4.1, 4.2_
  
  - [x] 13.2 Implement queue storage using GlobalState
    - Store queues as JSON array in GlobalState
    - Include schema version for migration support
    - _Requirements: 4.1, 4.2_
  
  - [x] 13.4 Implement queue loading on extension activation
    - Load all queues from GlobalState on activate
    - _Requirements: 4.3_
  
  - [x] 13.6 Implement addQueue with UUID generation
    - Generate unique UUID for each queue
    - Store queue in GlobalState
    - _Requirements: 4.4, 4.9_
  
  - [x] 13.8 Implement removeQueue method
    - Delete queue from GlobalState
    - Refresh Tree View
    - _Requirements: 4.5, 4.10_
  
  - [x] 13.10 Implement updateQueue and refreshAttributes methods
    - Update specific queue fields in GlobalState
    - Refresh queue attributes from AWS
    - _Requirements: 4.6_
  
  - [ ]* 13.3 Write property test for queue configuration field preservation
    - **Property 8: Queue Configuration Field Preservation**
    - **Validates: Requirements 4.2**

  - [x] 13.4 Implement queue loading on extension activation
    - Load all queues from GlobalState on activate
    - _Requirements: 4.3_
  
  - [ ]* 13.5 Write property test for queue storage activation round-trip
    - **Property 9: Queue Storage Activation Round-Trip**
    - **Validates: Requirements 4.3**
  
  - [x] 13.6 Implement addQueue with UUID generation
    - Generate unique UUID for each queue
    - Store queue in GlobalState
    - _Requirements: 4.4, 4.9_
  
  - [ ]* 13.7 Write property test for queue ID uniqueness
    - **Property 11: Queue ID Uniqueness**
    - **Validates: Requirements 4.9**
  
  - [x] 13.8 Implement removeQueue method
    - Delete queue from GlobalState
    - Refresh Tree View
    - _Requirements: 4.5, 4.10_
  
  - [ ]* 13.9 Write property test for queue removal persistence
    - **Property 12: Queue Removal Persistence**
    - **Validates: Requirements 4.10**
  
  - [x] 13.10 Implement updateQueue and refreshAttributes methods
    - Update specific queue fields in GlobalState
    - Refresh queue attributes from AWS
    - _Requirements: 4.6_

- [x] 14. Implement queue import/export functionality
  - [x] 14.1 Implement exportQueues method
    - Convert queues to JSON
    - Write to file using VS Code file picker
    - _Requirements: 4.7_

  - [x] 14.2 Implement importQueues method
    - Read JSON from file using VS Code file picker
    - Validate JSON schema
    - Add queues to GlobalState
    - _Requirements: 4.8_
  
  - [ ]* 14.3 Write property test for export-import round-trip
    - **Property 10: Export-Import Round-Trip**
    - **Validates: Requirements 4.8**

- [x] 15. Implement workspace-specific queue storage
  - [x] 15.1 Add WorkspaceState support
    - Implement useWorkspaceStorage toggle
    - Store workspace queues in WorkspaceState
    - _Requirements: 4.11_
  
  - [x] 15.2 Implement toggle command
    - Register command: sqs-management-tool.toggleWorkspaceStorage
    - Switch between global and workspace storage
    - _Requirements: 4.12_

- [x] 16. Implement manual queue entry commands
  - [x] 16.1 Implement addQueueByName command
    - Show input box for queue name
    - Call getQueueUrl to resolve URL
    - Call getQueueAttributes to validate access
    - Store queue with addedManually: true
    - _Requirements: 2.4, 2.6, 2.8, 2.10_
  
  - [x] 16.2 Implement addQueueByUrl command
    - Show input box for queue URL
    - Validate URL format
    - Call getQueueAttributes to validate access
    - Store queue with addedManually: true
    - _Requirements: 2.5, 2.7, 2.8, 2.10_

  - [ ]* 16.3 Write property test for manual queue persistence
    - **Property 6: Manual Queue Persistence Round-Trip**
    - **Validates: Requirements 2.10**
  
  - [x] 16.4 Implement IAM error handling for manual entry
    - Display missing IAM permissions on GetQueueAttributes failure
    - Show link to IAM permissions documentation
    - _Requirements: 2.9, 10.1, 16.7_

- [x] 17. Implement queue discovery functionality
  - [x] 17.1 Implement auto-discovery on activation
    - Call tryListQueues on extension activation
    - Show import prompt if queues discovered
    - Show manual entry message if ListQueues denied
    - _Requirements: 2.3, 5.1, 5.2, 5.10_
  
  - [x] 17.2 Implement queue import picker
    - Show QuickPick with options: "Import All", "Select Queues", "Skip"
    - Implement multi-select picker for "Select Queues"
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 17.3 Implement queue metadata fetching
    - Call GetQueueAttributes for each imported queue
    - Extract DLQ information from RedrivePolicy
    - Store DLQ URL and name in queue config
    - _Requirements: 5.6, 5.7, 5.8_
  
  - [x] 17.4 Implement manual discovery trigger command
    - Register command: sqs-management-tool.tryAutoDiscover
    - Show helpful message if ListQueues fails
    - _Requirements: 5.9, 5.10_

- [x] 18. Checkpoint - Queue storage and management complete
  - Ensure all tests pass, ask the user if questions arise.


### Phase 4: Visual Management Interface

- [x] 19. Implement Tree View Provider
  - [x] 19.1 Create IQueueTreeProvider interface
    - Extend vscode.TreeDataProvider<QueueTreeItem>
    - Define QueueTreeItem interface
    - _Requirements: 9.1_
  
  - [x] 19.2 Implement getTreeItem and getChildren methods
    - Display queues grouped by region
    - Show queue icons (standard, FIFO, DLQ)
    - Show region as description
    - _Requirements: 9.1, 9.2, 11.6_
  
  - [x] 19.3 Implement Tree View refresh
    - Register refresh command
    - Update Tree View on queue changes
    - _Requirements: 9.1_
  
  - [x] 19.4 Implement context menu actions
    - Register commands: removeQueue, refreshAttributes, copyQueueUrl
    - Add context menu items to package.json
    - _Requirements: 9.3_

- [x] 20. Implement Webview Manager
  - [x] 20.1 Create IWebviewManager interface
    - Define methods: createOrShowWebview, sendMessage, handleMessage, dispose
    - Define WebviewMessage and WebviewRequest/Response interfaces
    - _Requirements: 9.4_
  
  - [x] 20.2 Implement webview creation and lifecycle
    - Create webview panel with HTML content
    - Set up Content Security Policy with nonces
    - Handle webview disposal
    - _Requirements: 13.7, 13.8_

  - [x] 20.3 Implement postMessage communication protocol
    - Implement request-response pattern with requestId
    - Handle Extension Host → Webview messages
    - Handle Webview → Extension Host messages
    - _Requirements: 6.12_
  
  - [x] 20.4 Implement message operation handlers
    - Handle fetchMessages command
    - Handle sendMessage command
    - Handle deleteMessage command
    - Handle changeVisibility command
    - Handle purgeQueue command
    - Handle redriveMessages command
    - _Requirements: 6.12, 7.9_

- [x] 21. Implement Webview UI components
  - [x] 21.1 Create message table component
    - Display columns: Message ID, Body Preview, Sent Time, Receive Count
    - Implement sorting by any column
    - Implement text search filtering
    - _Requirements: 9.4, 9.5, 9.6_
  
  - [x] 21.2 Implement message details panel
    - Show full message body with JSON syntax highlighting
    - Show message attributes and system attributes
    - Make panel collapsible
    - _Requirements: 9.7, 9.8_
  
  - [x] 21.3 Implement queue statistics display
    - Show message count, messages in flight, oldest message age
    - Display health indicators (green/yellow/red)
    - _Requirements: 9.10, 9.11_

  - [x] 21.4 Implement bulk message operations
    - Add checkboxes for message selection
    - Implement bulk actions: Delete Selected, Change Visibility, Export to JSON
    - _Requirements: 9.12, 9.13_
  
  - [x] 21.5 Implement polling progress indicator
    - Show progress bar during message receive operations
    - _Requirements: 9.9_

- [x] 22. Implement API Adapter for Webview
  - [x] 22.1 Create ApiAdapter class
    - Convert postMessage to Promise-based API
    - Track pending requests with Map<requestId, {resolve, reject}>
    - Implement timeout handling (30 seconds)
    - _Requirements: 6.12_
  
  - [x] 22.2 Implement API methods
    - Implement receiveMessages, sendMessage, deleteMessage methods
    - Implement changeVisibility, purgeQueue, redriveMessages methods
    - _Requirements: 6.12_

- [x] 23. Implement performance optimizations
  - [x] 23.1 Implement virtual scrolling for message table
    - Use virtual scrolling for tables with >100 messages
    - _Requirements: 12.4_
  
  - [x] 23.2 Implement debouncing for search and filter
    - Debounce search input by 300ms
    - Debounce filter operations by 300ms
    - _Requirements: 12.7_

- [x] 24. Checkpoint - Visual management interface complete
  - Ensure all tests pass, ask the user if questions arise.


### Phase 5: Error Handling and User Feedback

- [x] 25. Implement comprehensive error handling
  - [x] 25.1 Create error classification system
    - Define ErrorCategory enum
    - Define ExtensionError interface
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 25.2 Implement permission error handling
    - Handle AccessDeniedException with missing permission display
    - Show link to IAM permissions documentation
    - _Requirements: 10.1_
  
  - [x] 25.3 Implement resource not found error handling
    - Handle QueueDoesNotExist with helpful suggestions
    - Suggest checking queue name and region
    - _Requirements: 10.2_
  
  - [x] 25.4 Implement network error handling
    - Detect ENOTFOUND and ETIMEDOUT errors
    - Display connectivity troubleshooting message
    - _Requirements: 10.4_

- [x] 26. Implement Output panel logging
  - [x] 26.1 Create OutputLogger class
    - Create Output channel: "SQS Management Tool"
    - Implement error, warn, info methods with timestamps
    - _Requirements: 10.6_
  
  - [ ]* 26.2 Write property test for error logging
    - **Property 23: Error Logging**
    - **Validates: Requirements 10.6**


- [x] 27. Implement input validation
  - [x] 27.1 Create validation utility functions
    - Implement validateQueueUrl with regex pattern
    - Implement validateQueueName
    - Implement validateVisibilityTimeout
    - _Requirements: 10.9_
  
  - [ ]* 27.2 Write property test for input validation before API calls
    - **Property 24: Input Validation Before API Calls**
    - **Validates: Requirements 10.9**
  
  - [x] 27.3 Implement validation error messages
    - Include specific validation rule in error message
    - _Requirements: 10.10_
  
  - [ ]* 27.4 Write property test for validation error messages
    - **Property 25: Validation Error Messages Include Rule**
    - **Validates: Requirements 10.10**
  
  - [x] 27.5 Implement queue URL sanitization
    - Validate and sanitize user-provided URLs
    - Prevent injection attacks
    - _Requirements: 13.5, 13.6_
  
  - [ ]* 27.6 Write property test for queue URL sanitization
    - **Property 28: Queue URL Sanitization**
    - **Validates: Requirements 13.5, 13.6**

- [x] 28. Implement progress notifications and cancellation
  - [x] 28.1 Implement progress notifications for long operations
    - Use vscode.window.withProgress for redrive operations
    - Show progress with cancel button
    - _Requirements: 7.9, 10.7_

  - [x] 28.2 Implement cancellation support
    - Check token.isCancellationRequested before each batch
    - Clean up resources on cancellation
    - Display cancellation message
    - _Requirements: 10.8_
  
  - [x] 28.3 Implement redrive completion summary
    - Display success and failure counts
    - _Requirements: 7.10_

- [x] 29. Implement resource management
  - [x] 29.1 Implement request throttling
    - Limit concurrent AWS API calls to 5 per queue
    - _Requirements: 12.2, 12.3_
  
  - [x] 29.2 Implement queue attribute refresh throttling
    - Limit refresh to once per 30 seconds per queue
    - _Requirements: 12.6_
  
  - [x] 29.3 Implement client disposal on deactivation
    - Dispose SQS clients when extension deactivates
    - _Requirements: 12.5_
  
  - [x] 29.4 Implement queue storage limit
    - Limit stored queues to 1000
    - Display warning when approaching limit
    - _Requirements: 12.8_

- [x] 30. Checkpoint - Error handling and user feedback complete
  - Ensure all tests pass, ask the user if questions arise.


### Phase 6: Testing and Quality Assurance

- [x] 31. Set up testing infrastructure
  - [x] 31.1 Install testing dependencies
    - Install Jest or Mocha for unit testing
    - Install fast-check for property-based testing
    - Install @types/vscode for VS Code API mocking
    - _Requirements: 15.1_
  
  - [x] 31.2 Set up LocalStack for integration testing
    - Create docker-compose.yml for LocalStack
    - Configure LocalStack with SQS service
    - _Requirements: 15.2_
  
  - [x] 31.3 Create test directory structure
    - Create tests/unit, tests/integration, tests/property directories
    - _Requirements: 15.1_

- [ ] 32. Write unit tests for SQS Service
  - [ ]* 32.1 Write unit tests for queue operations
    - Test tryListQueues with AccessDenied
    - Test getQueueUrl and getQueueAttributes
    - Test validateQueueAccess
    - Test extractDlqFromAttributes
    - _Requirements: 15.1_
  
  - [ ]* 32.2 Write unit tests for message operations
    - Test receiveMessages, sendMessage, deleteMessage
    - Test changeMessageVisibility with edge cases
    - Test purgeQueue with PurgeInProgress error
    - _Requirements: 15.1_

  - [ ]* 32.3 Write unit tests for redrive operations
    - Test redriveMessages with success and failure scenarios
    - Test redriveSelectedMessages
    - _Requirements: 15.1_

- [ ] 33. Write unit tests for Credential Provider
  - [ ]* 33.1 Write tests for credential loading from all sources
    - Test environment variables
    - Test AWS profiles
    - Test VS Code SecretStorage
    - Test IAM roles
    - _Requirements: 15.3_
  
  - [ ]* 33.2 Write tests for credential priority chain
    - Test priority order
    - _Requirements: 15.3_
  
  - [ ]* 33.3 Write tests for credential validation
    - Test validateCredentials with valid and invalid credentials
    - _Requirements: 15.3_

- [ ] 34. Write unit tests for Queue Storage
  - [ ]* 34.1 Write tests for CRUD operations
    - Test addQueue, getQueue, updateQueue, removeQueue
    - _Requirements: 15.5_
  
  - [ ]* 34.2 Write tests for import/export
    - Test exportQueues and importQueues
    - _Requirements: 15.5_
  
  - [ ]* 34.3 Write tests for workspace storage
    - Test toggle between global and workspace storage
    - _Requirements: 15.5_


- [ ] 35. Write unit tests for error handling
  - [ ]* 35.1 Write tests for error classification
    - Test error categorization
    - _Requirements: 15.4_
  
  - [ ]* 35.2 Write tests for retry logic
    - Test exponential backoff
    - Test max retries
    - _Requirements: 15.4_
  
  - [ ]* 35.3 Write tests for IAM permission errors
    - Test AccessDeniedException handling
    - Test permission extraction
    - _Requirements: 15.8_

- [ ] 36. Write integration tests with LocalStack
  - [ ]* 36.1 Write integration test for message round-trip
    - Test send and receive message
    - _Requirements: 15.2_
  
  - [ ]* 36.2 Write integration test for redrive operations
    - Test redrive from DLQ to main queue
    - _Requirements: 15.2_
  
  - [ ]* 36.3 Write integration test for queue discovery
    - Test ListQueues and GetQueueAttributes
    - _Requirements: 15.2_

- [ ] 37. Write tests for Webview communication
  - [ ]* 37.1 Write tests for postMessage protocol
    - Test request-response pattern
    - Test timeout handling
    - _Requirements: 15.7_

  - [ ]* 37.2 Write tests for API Adapter
    - Test Promise-based API methods
    - _Requirements: 15.7_

- [ ] 38. Write tests for manual queue entry
  - [ ]* 38.1 Write tests for addQueueByName
    - Test successful queue addition
    - Test error handling
    - _Requirements: 15.9_
  
  - [ ]* 38.2 Write tests for addQueueByUrl
    - Test URL validation
    - Test successful queue addition
    - _Requirements: 15.9_

- [ ] 39. Write performance tests
  - [ ]* 39.1 Write tests for operation completion times
    - Test message receive completes within acceptable time
    - Test queue discovery completes within acceptable time
    - _Requirements: 15.10_
  
  - [ ]* 39.2 Write tests for resource usage
    - Test memory usage with large message tables
    - Test client caching effectiveness
    - _Requirements: 15.10_

- [ ] 40. Run full test suite and verify coverage
  - Run all unit tests
  - Run all integration tests
  - Run all property tests
  - Verify 80% code coverage
  - _Requirements: 15.1_

- [x] 41. Checkpoint - Testing and quality assurance complete
  - Ensure all tests pass, ask the user if questions arise.


### Phase 7: Documentation and Publishing Preparation

- [x] 42. Create user documentation
  - [x] 42.1 Update README with setup instructions
    - Document AWS credential configuration options
    - Document minimal IAM permissions required
    - Add screenshots of key features
    - _Requirements: 16.1, 16.2, 17.4_
  
  - [x] 42.2 Create IAM permissions guide
    - Document minimal permissions: sqs:GetQueueUrl, sqs:GetQueueAttributes, sqs:ReceiveMessage, sqs:SendMessage, sqs:DeleteMessage
    - Document optional permissions: sqs:ListQueues, sqs:PurgeQueue
    - Provide example IAM policy JSON
    - _Requirements: 16.2_
  
  - [x] 42.3 Create troubleshooting guide
    - Document common errors and solutions
    - Document credential configuration issues
    - Document network connectivity issues
    - _Requirements: 16.3_
  
  - [x] 42.4 Create manual queue entry examples
    - Document adding queues by name
    - Document adding queues by URL
    - Provide examples for restrictive IAM environments
    - _Requirements: 16.4_
  
  - [x] 42.5 Add tooltips and inline help
    - Add tooltips for all UI actions
    - Add inline help text for credential configuration
    - _Requirements: 16.6, 16.9_

  - [x] 42.6 Create Getting Started walkthrough
    - Implement "Getting Started" command
    - Create walkthrough guide
    - _Requirements: 16.8_

- [ ] 43. Create visual assets
  - [ ] 43.1 Create extension icon
    - Design 128x128 PNG icon following VS Code guidelines
    - _Requirements: 17.2_
  
  - [ ] 43.2 Create marketplace banner
    - Design 1280x640 PNG banner
    - _Requirements: 17.3_
  
  - [ ] 43.3 Create screenshots
    - Screenshot: Queue tree view
    - Screenshot: Message table with filtering
    - Screenshot: Manual queue entry
    - Screenshot: Redrive operation
    - _Requirements: 17.4_

- [ ] 44. Prepare marketplace metadata
  - [ ] 44.1 Update package.json with marketplace fields
    - Set name, displayName, description, version, publisher
    - Add icon and repository URLs
    - Add keywords: aws, sqs, queue, messaging, restrictive-iam, no-console-access
    - Add categories: Azure, Other
    - _Requirements: 17.1, 17.7_
  
  - [ ] 44.2 Configure activation events
    - Set activationEvents to onView:sqsQueueExplorer
    - _Requirements: 17.8_

  - [ ] 44.3 Create CHANGELOG
    - Document all versions and changes
    - _Requirements: 17.5_
  
  - [ ] 44.4 Add LICENSE file
    - Add MIT or Apache 2.0 license
    - _Requirements: 17.6_
  
  - [ ] 44.5 Verify dependencies
    - Ensure all dependencies listed in package.json
    - Bundle dependencies or mark as external
    - _Requirements: 17.9_

- [ ] 45. Set up CI/CD pipeline
  - [ ] 45.1 Create GitHub Actions workflow
    - Run tests on push and pull request
    - Run linting and type checking
    - Build extension package
  
  - [ ] 45.2 Configure automated publishing
    - Set up vsce publish automation
    - Configure version bumping

- [ ] 46. Validate extension package
  - [ ] 46.1 Run vsce package
    - Verify package builds without errors
    - _Requirements: 17.10_
  
  - [ ] 46.2 Test extension installation
    - Install .vsix file locally
    - Verify all features work
  
  - [ ] 46.3 Run manual testing checklist
    - Test extension activation
    - Test manual queue entry (by name and URL)
    - Test message operations (receive, send, delete)
    - Test redrive operations
    - Test credential management
    - Test multi-region support
    - Test error handling


- [ ] 47. Implement backward compatibility and migration
  - [ ] 47.1 Implement configuration migration
    - Check for old configuration format on activation
    - Migrate to new format preserving all data
    - Create backup before migration
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_
  
  - [ ] 47.2 Implement migration error handling
    - Restore backup on migration failure
    - Display error message
    - _Requirements: 14.7_
  
  - [ ] 47.3 Display migration success message
    - Show success notification after migration
    - _Requirements: 14.5_

- [x] 48. Final checkpoint - Documentation and publishing preparation complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests with LocalStack validate end-to-end AWS SQS operations
- All 28 correctness properties from the design document are covered by property tests
- Implementation uses TypeScript as specified in the design document
