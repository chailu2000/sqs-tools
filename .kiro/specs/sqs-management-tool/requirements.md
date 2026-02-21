# Requirements Document

## Introduction

This document specifies the requirements for an open-source SQS (Simple Queue Service) visualization and management tool. The tool addresses the needs of development teams working in shared AWS accounts with restricted permissions, providing a cross-platform, web-based interface for managing SQS queues without requiring AWS console access or broad IAM permissions.

## Glossary

- **SQS_Tool**: The web-based application for managing AWS SQS queues
- **Queue_Manager**: Component responsible for queue URL resolution and attribute retrieval
- **Message_Handler**: Component responsible for message operations (send, receive, delete)
- **DLQ**: Dead Letter Queue - a queue that receives messages that failed processing
- **Redrive_Operation**: The process of moving messages from a DLQ back to the main queue
- **Queue_URL**: The fully qualified AWS resource identifier for an SQS queue
- **Queue_Name**: The human-readable name of an SQS queue
- **Visibility_Timeout**: The duration a message is hidden from other consumers after being received
- **AWS_Profile**: A named set of AWS credentials stored in the AWS CLI configuration
- **Backend_Service**: The Spring Boot application providing REST APIs
- **Frontend_Application**: The web-based user interface
- **Message_Attributes**: Metadata associated with SQS messages
- **Queue_Attributes**: Configuration properties of an SQS queue

## Requirements

### Requirement 1: Queue URL Management

**User Story:** As a developer, I want to add queues by name or URL, so that I can manage queues without listQueues permission.

#### Acceptance Criteria

1. WHEN a user provides a queue name, THE Queue_Manager SHALL use the GetQueueUrl API to resolve it to a Queue_URL
2. WHEN a user provides a Queue_URL directly, THE Queue_Manager SHALL validate and store it without additional API calls
3. WHEN queue resolution fails, THE SQS_Tool SHALL return a descriptive error message indicating the failure reason
4. THE SQS_Tool SHALL persist saved queue configurations to local storage
5. WHEN the application starts, THE SQS_Tool SHALL load previously saved queue configurations
6. THE Queue_Manager SHALL retrieve and display queue attributes using GetQueueAttributes API
7. WHEN displaying queue attributes, THE SQS_Tool SHALL include the DLQ configuration if present

### Requirement 2: AWS Authentication

**User Story:** As a developer, I want to authenticate using AWS CLI profiles or environment variables, so that I can use my existing AWS credentials.

#### Acceptance Criteria

1. THE Backend_Service SHALL support authentication via AWS CLI profiles
2. THE Backend_Service SHALL support authentication via AWS environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
3. WHEN multiple authentication methods are available, THE Backend_Service SHALL prioritize environment variables over AWS profiles
4. WHEN authentication fails, THE Backend_Service SHALL return an error message indicating the authentication failure
5. THE Frontend_Application SHALL allow users to select an AWS profile from available profiles
6. THE Backend_Service SHALL validate AWS credentials before performing any SQS operations

### Requirement 3: DLQ Discovery and Management

**User Story:** As a developer, I want to automatically discover and manage DLQs, so that I can handle failed messages efficiently.

#### Acceptance Criteria

1. WHEN retrieving queue attributes, THE Queue_Manager SHALL extract the RedrivePolicy attribute to identify the associated DLQ
2. WHEN a DLQ is discovered, THE SQS_Tool SHALL display it alongside the main queue
3. THE SQS_Tool SHALL support viewing messages in both the main queue and its DLQ
4. WHEN a queue has no DLQ configured, THE SQS_Tool SHALL indicate that no DLQ is associated
5. THE Queue_Manager SHALL retrieve and display DLQ attributes using the DLQ's Queue_URL

### Requirement 4: Message Viewing and Pagination

**User Story:** As a developer, I want to view messages with pagination, so that I can browse through queue contents efficiently.

#### Acceptance Criteria

1. WHEN viewing a queue, THE Message_Handler SHALL retrieve messages using the ReceiveMessage API
2. THE SQS_Tool SHALL display message body, message ID, receipt handle, and Message_Attributes
3. THE Frontend_Application SHALL implement pagination controls for navigating through messages
4. WHEN messages are JSON formatted, THE SQS_Tool SHALL pretty-print the JSON for readability
5. WHEN a message body is not valid JSON, THE SQS_Tool SHALL display it as plain text
6. THE Message_Handler SHALL respect the Visibility_Timeout when receiving messages
7. WHEN no messages are available, THE SQS_Tool SHALL display an appropriate empty state message

### Requirement 5: Message Search and Filtering

**User Story:** As a developer, I want to search and filter messages, so that I can quickly find specific messages.

#### Acceptance Criteria

1. THE Frontend_Application SHALL provide a search interface for filtering messages by content
2. WHEN a search term is provided, THE SQS_Tool SHALL filter displayed messages matching the search criteria
3. THE SQS_Tool SHALL support filtering by message attributes
4. THE Frontend_Application SHALL update the displayed messages in real-time as filter criteria change
5. WHEN no messages match the filter criteria, THE SQS_Tool SHALL display an appropriate message

### Requirement 6: Send Messages

**User Story:** As a developer, I want to send messages to queues, so that I can test queue processing and inject test data.

#### Acceptance Criteria

1. THE Frontend_Application SHALL provide an interface for composing new messages
2. WHEN sending a message, THE Message_Handler SHALL use the SendMessage API
3. THE SQS_Tool SHALL support adding Message_Attributes to sent messages
4. WHEN a message is successfully sent, THE SQS_Tool SHALL display a confirmation with the message ID
5. WHEN message sending fails, THE SQS_Tool SHALL display an error message with the failure reason
6. THE Frontend_Application SHALL validate JSON format before sending if the user indicates JSON content
7. THE SQS_Tool SHALL support sending messages with delay seconds configuration

### Requirement 7: Receive and Delete Messages

**User Story:** As a developer, I want to receive and delete messages, so that I can process and remove messages from queues.

#### Acceptance Criteria

1. WHEN receiving messages, THE Message_Handler SHALL use the ReceiveMessage API with configurable Visibility_Timeout
2. THE Frontend_Application SHALL allow users to specify the Visibility_Timeout duration
3. THE SQS_Tool SHALL display the receipt handle for each received message
4. WHEN deleting a message, THE Message_Handler SHALL use the DeleteMessage API with the message's receipt handle
5. WHEN a message is successfully deleted, THE SQS_Tool SHALL remove it from the displayed list
6. WHEN message deletion fails, THE SQS_Tool SHALL display an error message indicating the failure reason
7. THE Message_Handler SHALL support receiving multiple messages in a single request (batch receive)

### Requirement 8: Redrive Operations

**User Story:** As a developer, I want to redrive messages from DLQ to main queue, so that I can reprocess failed messages.

#### Acceptance Criteria

1. WHEN a DLQ is displayed, THE Frontend_Application SHALL provide a redrive operation interface
2. WHEN performing a redrive operation, THE Message_Handler SHALL receive messages from the DLQ
3. FOR EACH received message from the DLQ, THE Message_Handler SHALL send it to the main queue
4. WHEN a message is successfully sent to the main queue, THE Message_Handler SHALL delete it from the DLQ
5. IF sending to the main queue fails, THE Message_Handler SHALL not delete the message from the DLQ
6. THE SQS_Tool SHALL display progress and results of the redrive operation
7. THE Frontend_Application SHALL allow users to redrive individual messages or all messages from the DLQ

### Requirement 9: Purge Queue

**User Story:** As a developer, I want to purge queues, so that I can quickly clear all messages during testing.

#### Acceptance Criteria

1. THE Frontend_Application SHALL provide a purge queue operation with confirmation dialog
2. WHEN purging a queue, THE Message_Handler SHALL use the PurgeQueue API
3. WHEN a purge operation is successful, THE SQS_Tool SHALL display a confirmation message
4. WHEN a purge operation fails, THE SQS_Tool SHALL display an error message with the failure reason
5. THE Frontend_Application SHALL require explicit user confirmation before executing a purge operation
6. THE SQS_Tool SHALL handle the AWS limitation that purge operations can only be performed once every 60 seconds

### Requirement 10: Change Message Visibility

**User Story:** As a developer, I want to change message visibility timeout, so that I can extend processing time or make messages immediately available.

#### Acceptance Criteria

1. THE Frontend_Application SHALL provide an interface for changing message Visibility_Timeout
2. WHEN changing visibility, THE Message_Handler SHALL use the ChangeMessageVisibility API
3. THE SQS_Tool SHALL accept visibility timeout values from 0 to 43200 seconds
4. WHEN visibility change is successful, THE SQS_Tool SHALL display a confirmation message
5. WHEN visibility change fails, THE SQS_Tool SHALL display an error message with the failure reason
6. THE Frontend_Application SHALL display the current visibility timeout for received messages

### Requirement 11: Application Architecture

**User Story:** As a developer, I want a locally-running web application, so that I can access the tool from any browser on my machine.

#### Acceptance Criteria

1. THE Backend_Service SHALL be implemented using Spring Boot
2. THE Frontend_Application SHALL be implemented as a modern web application
3. THE SQS_Tool SHALL run entirely on the local developer machine
4. THE Backend_Service SHALL expose RESTful APIs for all queue operations
5. THE Frontend_Application SHALL communicate with the Backend_Service via HTTP
6. THE SQS_Tool SHALL be packaged for easy local execution on Windows and macOS
7. WHEN the application starts, THE Backend_Service SHALL bind to a local port and display the access URL

### Requirement 12: Queue Configuration Persistence

**User Story:** As a developer, I want my queue configurations saved, so that I don't have to re-enter queue information each time.

#### Acceptance Criteria

1. THE Backend_Service SHALL persist queue configurations to a local file
2. WHEN a queue is added, THE Backend_Service SHALL save the queue name and Queue_URL
3. WHEN the application starts, THE Backend_Service SHALL load saved queue configurations
4. THE Frontend_Application SHALL display all saved queues on startup
5. THE SQS_Tool SHALL support removing saved queue configurations
6. THE Backend_Service SHALL support updating queue configurations
7. WHEN queue configurations are modified, THE Backend_Service SHALL persist changes immediately

### Requirement 13: Error Handling and User Feedback

**User Story:** As a developer, I want clear error messages, so that I can understand and resolve issues quickly.

#### Acceptance Criteria

1. WHEN an AWS API call fails, THE Backend_Service SHALL return a descriptive error message
2. THE Frontend_Application SHALL display error messages in a user-friendly format
3. WHEN authentication fails, THE SQS_Tool SHALL indicate the authentication issue clearly
4. WHEN a queue is not found, THE SQS_Tool SHALL display a message indicating the queue does not exist or is inaccessible
5. WHEN network errors occur, THE SQS_Tool SHALL display a message indicating connectivity issues
6. THE Backend_Service SHALL log detailed error information for debugging purposes
7. THE Frontend_Application SHALL provide visual feedback for all asynchronous operations (loading states)

### Requirement 14: Cross-Platform Compatibility

**User Story:** As a developer, I want the tool to work on Windows and macOS, so that all team members can use it regardless of their operating system.

#### Acceptance Criteria

1. THE SQS_Tool SHALL run on Windows operating systems
2. THE SQS_Tool SHALL run on macOS operating systems
3. THE Backend_Service SHALL use cross-platform file paths for configuration storage
4. THE SQS_Tool SHALL use cross-platform methods for accessing AWS credentials
5. THE Frontend_Application SHALL render consistently across different operating systems
6. THE SQS_Tool SHALL provide platform-specific installation instructions

### Requirement 15: Message Format Support

**User Story:** As a developer, I want to view JSON messages with pretty-printing, so that I can easily read and understand message content.

#### Acceptance Criteria

1. WHEN a message body is valid JSON, THE SQS_Tool SHALL parse and pretty-print it
2. THE Frontend_Application SHALL use syntax highlighting for JSON content
3. WHEN a message body is not valid JSON, THE SQS_Tool SHALL display it as plain text
4. THE Frontend_Application SHALL provide a toggle between raw and formatted views
5. THE SQS_Tool SHALL preserve the original message content when displaying formatted views
6. WHEN displaying message attributes, THE SQS_Tool SHALL format them in a readable structure
