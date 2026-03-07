# Requirements Document

## Introduction

This document specifies requirements for transforming the VS Code SQS Management Tool extension from a backend-dependent architecture to a standalone extension that communicates directly with AWS SQS using the AWS SDK. The extension will eliminate the need for the Spring Boot backend while maintaining feature parity and adding support for restrictive IAM environments.

The key differentiator of this extension is its ability to work in restrictive corporate AWS environments where developers lack AWS Console access and do not have the `sqs:ListQueues` IAM permission. The extension provides a rich visual interface for SQS management directly within VS Code, making it ideal for shared AWS accounts with minimal permissions.

## Glossary

- **Extension_Host**: The Node.js process that runs VS Code extension code with access to VS Code APIs and Node.js modules
- **Webview**: A sandboxed iframe within VS Code that displays HTML/CSS/JavaScript content but cannot directly access Node.js APIs
- **AWS_SDK**: The AWS SDK for JavaScript v3 (@aws-sdk/client-sqs) used for direct AWS SQS communication
- **Backend**: The existing Spring Boot application that currently handles AWS SQS operations
- **Queue_Storage**: VS Code's GlobalState API used to persist queue configurations across sessions
- **Credential_Provider**: Component responsible for loading and managing AWS credentials from various sources
- **Manual_Queue_Entry**: Feature allowing users to add queues by name or URL without requiring ListQueues permission
- **Tree_View**: VS Code's native tree view component displaying the list of configured queues
- **SQS_Service**: TypeScript service layer that wraps AWS SDK operations and replicates backend functionality
- **IAM_Permission**: AWS Identity and Access Management permission that controls access to AWS resources
- **ListQueues**: AWS SQS API operation that lists all queues in an account (often restricted in corporate environments)
- **GetQueueAttributes**: AWS SQS API operation that retrieves queue metadata (used for validation)
- **DLQ**: Dead Letter Queue - a queue that receives messages that failed processing in the main queue
- **Redrive**: Operation to move messages from a DLQ back to the main queue
- **Message_Attributes**: Custom metadata attached to SQS messages
- **Receipt_Handle**: Unique identifier for a received message used for deletion and visibility changes
- **Visibility_Timeout**: Duration in seconds that a message is hidden from other consumers after being received
- **Long_Polling**: SQS feature that waits for messages to arrive if the queue is empty (reduces API calls)


## Requirements

### Requirement 1: AWS SDK Integration

**User Story:** As a developer, I want the extension to communicate directly with AWS SQS, so that I don't need to run a backend server.

#### Acceptance Criteria

1. THE Extension_Host SHALL integrate @aws-sdk/client-sqs version 3.x for AWS SQS operations
2. THE Extension_Host SHALL integrate @aws-sdk/credential-providers for AWS credential management
3. THE SQS_Service SHALL provide methods for all core SQS operations (receive, send, delete, purge, get attributes)
4. WHEN an AWS SDK operation fails, THE Extension_Host SHALL capture the error and provide user-friendly error messages
5. THE Extension_Host SHALL cache SQS client instances per region to avoid repeated client creation
6. WHEN the AWS region changes, THE Extension_Host SHALL create a new SQS client for that region
7. THE SQS_Service SHALL implement retry logic with exponential backoff for transient AWS errors
8. THE Extension_Host SHALL replace all HTTP API calls to the backend with direct AWS SDK calls

### Requirement 2: Restrictive IAM Environment Support

**User Story:** As a developer in a restrictive corporate environment, I want to use the extension without ListQueues permission, so that I can manage queues even with minimal IAM permissions.

#### Acceptance Criteria

1. WHEN the extension activates, THE Extension_Host SHALL attempt to call ListQueues
2. IF ListQueues returns AccessDeniedException, THEN THE Extension_Host SHALL continue normal operation without error
3. WHEN ListQueues is denied, THE Extension_Host SHALL display a message: "Add queues manually - ListQueues permission not available"
4. THE Extension_Host SHALL provide a command to add queues by queue name
5. THE Extension_Host SHALL provide a command to add queues by queue URL
6. WHEN a user adds a queue by name, THE Extension_Host SHALL call GetQueueUrl to resolve the queue URL
7. WHEN a user adds a queue by URL, THE Extension_Host SHALL validate the URL format before proceeding
8. WHEN a queue is added (by name or URL), THE Extension_Host SHALL call GetQueueAttributes to validate access
9. IF GetQueueAttributes fails, THEN THE Extension_Host SHALL display an error message with required IAM permissions
10. THE Extension_Host SHALL store manually added queues in Queue_Storage for future sessions
11. THE Extension_Host SHALL display an icon or indicator showing whether a queue was added manually or auto-discovered

### Requirement 3: Credential Management

**User Story:** As a developer, I want flexible credential configuration options, so that I can use the extension with my existing AWS setup.

#### Acceptance Criteria

1. THE Credential_Provider SHALL support loading credentials from AWS profiles in ~/.aws/credentials
2. THE Credential_Provider SHALL support loading credentials from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
3. THE Credential_Provider SHALL support loading credentials from VS Code SecretStorage API
4. THE Credential_Provider SHALL support IAM roles when running on EC2 or ECS instances
5. WHEN multiple credential sources are available, THE Credential_Provider SHALL use this priority: environment variables, AWS profile, VS Code secrets, IAM role
6. WHEN no credentials are found, THE Credential_Provider SHALL prompt the user to enter credentials manually
7. WHEN a user enters credentials manually, THE Extension_Host SHALL store them in VS Code SecretStorage
8. THE Extension_Host SHALL provide a command to select an AWS profile from available profiles
9. THE Extension_Host SHALL display the active AWS profile in the status bar
10. WHEN the AWS profile changes, THE Extension_Host SHALL refresh the SQS client and reload queues
11. THE Credential_Provider SHALL validate credentials by calling STS GetCallerIdentity
12. IF credential validation fails, THEN THE Extension_Host SHALL display an error message with troubleshooting steps

### Requirement 4: Queue Storage and Management

**User Story:** As a developer, I want my queue configurations saved locally, so that I don't need to re-add queues every time I open VS Code.

#### Acceptance Criteria

1. THE Extension_Host SHALL use VS Code GlobalState API to persist queue configurations
2. THE Queue_Storage SHALL store queue configurations as JSON with fields: id, name, url, region, dlqUrl, dlqName, attributes, addedManually, favorite, tags
3. WHEN the extension activates, THE Extension_Host SHALL load all saved queues from Queue_Storage
4. THE Extension_Host SHALL provide a command to add a new queue
5. THE Extension_Host SHALL provide a command to remove a queue
6. THE Extension_Host SHALL provide a command to refresh queue attributes
7. THE Extension_Host SHALL provide a command to export queue configurations to JSON file
8. THE Extension_Host SHALL provide a command to import queue configurations from JSON file
9. WHEN a queue is added, THE Extension_Host SHALL assign a unique UUID as the queue ID
10. WHEN a queue is removed, THE Extension_Host SHALL delete it from Queue_Storage and refresh the Tree_View
11. THE Queue_Storage SHALL support workspace-specific queue lists using VS Code WorkspaceState API
12. THE Extension_Host SHALL provide a command to toggle between global and workspace queue lists

### Requirement 5: Queue Discovery and Validation

**User Story:** As a developer, I want the extension to auto-discover queues when possible, so that I can quickly see all available queues.

#### Acceptance Criteria

1. WHEN the extension activates AND ListQueues permission is available, THE Extension_Host SHALL call ListQueues to discover queues
2. WHEN ListQueues returns queues, THE Extension_Host SHALL prompt the user to import discovered queues
3. THE Extension_Host SHALL provide options: "Import All", "Select Queues", "Skip"
4. WHEN "Import All" is selected, THE Extension_Host SHALL add all discovered queues to Queue_Storage
5. WHEN "Select Queues" is selected, THE Extension_Host SHALL display a multi-select picker for queue selection
6. WHEN queues are imported, THE Extension_Host SHALL call GetQueueAttributes for each queue to retrieve metadata
7. THE Extension_Host SHALL extract DLQ information from the RedrivePolicy attribute
8. WHEN a DLQ is detected, THE Extension_Host SHALL store the DLQ URL and name in the queue configuration
9. THE Extension_Host SHALL provide a command to manually trigger queue discovery
10. WHEN queue discovery is triggered manually AND ListQueues fails, THE Extension_Host SHALL display a helpful message about manual queue entry

### Requirement 6: Message Operations

**User Story:** As a developer, I want to receive, send, and delete messages, so that I can manage queue contents.

#### Acceptance Criteria

1. THE SQS_Service SHALL provide a receiveMessages method that accepts queueUrl, maxMessages, visibilityTimeout, waitTimeSeconds
2. WHEN receiveMessages is called, THE SQS_Service SHALL use ReceiveMessageCommand with MessageAttributeNames: "All" and AttributeNames: "All"
3. THE SQS_Service SHALL return an array of messages with fields: messageId, body, receiptHandle, attributes, messageAttributes
4. THE SQS_Service SHALL provide a sendMessage method that accepts queueUrl, body, delaySeconds, messageAttributes
5. WHEN sendMessage is called, THE SQS_Service SHALL use SendMessageCommand and return the messageId
6. THE SQS_Service SHALL provide a deleteMessage method that accepts queueUrl and receiptHandle
7. WHEN deleteMessage is called, THE SQS_Service SHALL use DeleteMessageCommand
8. THE SQS_Service SHALL provide a changeMessageVisibility method that accepts queueUrl, receiptHandle, visibilityTimeout
9. WHEN visibilityTimeout is less than 0 or greater than 43200, THE SQS_Service SHALL throw an error
10. THE SQS_Service SHALL provide a purgeQueue method that accepts queueUrl
11. WHEN purgeQueue is called AND a purge was performed in the last 60 seconds, THE SQS_Service SHALL throw a user-friendly error
12. THE Extension_Host SHALL handle all message operations via postMessage communication with the Webview

### Requirement 7: Dead Letter Queue (DLQ) Management

**User Story:** As a developer, I want to manage DLQ messages, so that I can redrive failed messages back to the main queue.

#### Acceptance Criteria

1. THE SQS_Service SHALL provide a redriveMessages method that accepts dlqUrl, mainQueueUrl, maxMessages, redriveAll
2. WHEN redriveMessages is called, THE SQS_Service SHALL receive messages from the DLQ
3. FOR EACH message received from DLQ, THE SQS_Service SHALL send the message to the main queue with original attributes
4. WHEN a message is successfully sent to the main queue, THE SQS_Service SHALL delete it from the DLQ
5. IF sending to main queue fails, THEN THE SQS_Service SHALL NOT delete the message from DLQ
6. THE SQS_Service SHALL return a result object with fields: processedCount, successCount, failureCount, succeeded, failed
7. THE SQS_Service SHALL provide a redriveSelectedMessages method that accepts dlqUrl, mainQueueUrl, messages array
8. WHEN redriveSelectedMessages is called, THE SQS_Service SHALL redrive only the specified messages
9. THE Extension_Host SHALL display redrive progress in a VS Code progress notification
10. WHEN redrive completes, THE Extension_Host SHALL display a summary message with success and failure counts

### Requirement 8: Queue Attributes and Metadata

**User Story:** As a developer, I want to view queue attributes, so that I can understand queue configuration and metrics.

#### Acceptance Criteria

1. THE SQS_Service SHALL provide a getQueueAttributes method that accepts queueUrl
2. WHEN getQueueAttributes is called, THE SQS_Service SHALL request all attributes using AttributeNames: "All"
3. THE SQS_Service SHALL return a map of attribute names to values
4. THE Extension_Host SHALL display queue attributes in the Webview including: ApproximateNumberOfMessages, ApproximateNumberOfMessagesNotVisible, MessageRetentionPeriod, VisibilityTimeout, DelaySeconds
5. THE SQS_Service SHALL provide an extractDlqFromAttributes method that parses the RedrivePolicy attribute
6. WHEN RedrivePolicy contains a deadLetterTargetArn, THE SQS_Service SHALL convert the ARN to a queue URL
7. THE SQS_Service SHALL provide an extractQueueName method that extracts the queue name from a queue URL
8. THE Extension_Host SHALL refresh queue attributes when the user clicks a refresh button

### Requirement 9: Visual Management Interface

**User Story:** As a developer without AWS Console access, I want a rich visual interface, so that I can manage queues without using the CLI.

#### Acceptance Criteria

1. THE Tree_View SHALL display all configured queues with icons indicating queue type (standard, FIFO, DLQ)
2. THE Tree_View SHALL display queue region as a description next to each queue name
3. THE Tree_View SHALL support context menu actions: "Remove Queue", "Refresh Attributes", "Copy Queue URL"
4. THE Webview SHALL display a message table with columns: Message ID, Body Preview, Sent Time, Receive Count
5. THE Webview SHALL support sorting messages by any column
6. THE Webview SHALL support filtering messages by text search
7. THE Webview SHALL display message bodies with syntax highlighting for JSON content
8. THE Webview SHALL provide a collapsible message details panel showing full body and attributes
9. THE Webview SHALL display a polling progress bar during message receive operations
10. THE Webview SHALL display queue statistics: message count, messages in flight, oldest message age
11. THE Webview SHALL provide visual indicators for queue health (green: healthy, yellow: warning, red: critical)
12. THE Webview SHALL support bulk message selection with checkboxes
13. THE Webview SHALL provide bulk actions: "Delete Selected", "Change Visibility", "Export to JSON"

### Requirement 10: Error Handling and User Feedback

**User Story:** As a developer, I want clear error messages, so that I can troubleshoot issues quickly.

#### Acceptance Criteria

1. WHEN an AWS SDK operation fails with AccessDeniedException, THE Extension_Host SHALL display the missing IAM permission
2. WHEN an AWS SDK operation fails with QueueDoesNotExist, THE Extension_Host SHALL suggest checking the queue name and region
3. WHEN credential loading fails, THE Extension_Host SHALL display a message with credential configuration options
4. WHEN network errors occur, THE Extension_Host SHALL display a message suggesting checking internet connectivity
5. WHEN rate limiting occurs (ThrottlingException), THE Extension_Host SHALL automatically retry with exponential backoff
6. THE Extension_Host SHALL log all errors to the VS Code Output panel under "SQS Management Tool" channel
7. WHEN a long-running operation is in progress, THE Extension_Host SHALL display a progress notification with cancel button
8. WHEN an operation is cancelled, THE Extension_Host SHALL clean up resources and display a cancellation message
9. THE Extension_Host SHALL validate user inputs before making AWS API calls
10. WHEN validation fails, THE Extension_Host SHALL display an error message with the validation rule

### Requirement 11: Multi-Account and Multi-Region Support

**User Story:** As a developer working with multiple AWS accounts, I want to switch between accounts and regions, so that I can manage queues across environments.

#### Acceptance Criteria

1. THE Extension_Host SHALL support multiple AWS profiles configured in ~/.aws/credentials
2. THE Extension_Host SHALL provide a command to switch between AWS profiles
3. WHEN the AWS profile changes, THE Extension_Host SHALL reload all queues and refresh the Tree_View
4. THE Extension_Host SHALL support queues in different AWS regions within the same profile
5. THE Extension_Host SHALL create separate SQS client instances for each region
6. THE Tree_View SHALL group queues by region when multiple regions are present
7. THE Extension_Host SHALL persist the selected AWS profile in GlobalState
8. WHEN the extension activates, THE Extension_Host SHALL restore the previously selected AWS profile

### Requirement 12: Performance and Resource Management

**User Story:** As a developer, I want the extension to be performant, so that it doesn't slow down VS Code.

#### Acceptance Criteria

1. THE Extension_Host SHALL cache SQS client instances to avoid repeated client creation
2. THE Extension_Host SHALL limit concurrent AWS API calls to 5 per queue
3. THE Extension_Host SHALL implement request throttling to avoid hitting AWS rate limits
4. THE Webview SHALL use virtual scrolling for message tables with more than 100 messages
5. THE Extension_Host SHALL dispose of SQS clients when the extension deactivates
6. THE Extension_Host SHALL limit queue attribute refresh to once per 30 seconds per queue
7. THE Webview SHALL debounce search and filter operations by 300ms
8. THE Extension_Host SHALL limit stored queue configurations to 1000 queues

### Requirement 13: Security and Credential Protection

**User Story:** As a developer, I want my AWS credentials protected, so that they are not exposed to unauthorized access.

#### Acceptance Criteria

1. THE Extension_Host SHALL store AWS credentials in VS Code SecretStorage API (encrypted storage)
2. THE Extension_Host SHALL NOT log AWS credentials to the Output panel or Debug Console
3. THE Extension_Host SHALL NOT send AWS credentials to the Webview
4. THE Webview SHALL NOT have access to AWS credentials or make direct AWS API calls
5. THE Extension_Host SHALL validate that queue URLs match the expected AWS SQS URL format
6. THE Extension_Host SHALL sanitize user inputs before using them in AWS API calls
7. THE Extension_Host SHALL use Content Security Policy (CSP) to restrict Webview capabilities
8. THE Extension_Host SHALL use nonces for inline scripts and styles in the Webview

### Requirement 14: Backward Compatibility and Migration

**User Story:** As an existing user, I want my queue configurations preserved, so that I don't lose my setup when upgrading.

#### Acceptance Criteria

1. WHEN the extension activates for the first time, THE Extension_Host SHALL check for existing queue configurations
2. IF queue configurations exist in the old format, THEN THE Extension_Host SHALL migrate them to the new format
3. THE Extension_Host SHALL preserve queue IDs during migration to maintain references
4. THE Extension_Host SHALL preserve queue attributes, DLQ associations, and custom metadata during migration
5. WHEN migration completes, THE Extension_Host SHALL display a success message
6. THE Extension_Host SHALL create a backup of old configurations before migration
7. IF migration fails, THEN THE Extension_Host SHALL restore the backup and display an error message

### Requirement 15: Testing and Quality Assurance

**User Story:** As a developer, I want the extension to be reliable, so that I can trust it for production use.

#### Acceptance Criteria

1. THE SQS_Service SHALL have unit tests for all public methods with 80% code coverage
2. THE Extension_Host SHALL have integration tests using LocalStack for AWS SQS simulation
3. THE Extension_Host SHALL have tests for credential loading from all supported sources
4. THE Extension_Host SHALL have tests for error handling and retry logic
5. THE Extension_Host SHALL have tests for queue storage operations (add, remove, update, export, import)
6. THE Webview SHALL have tests for message table operations (sort, filter, select)
7. THE Extension_Host SHALL have tests for postMessage communication between Extension_Host and Webview
8. THE Extension_Host SHALL have tests for IAM permission error handling
9. THE Extension_Host SHALL have tests for manual queue entry (by name and URL)
10. THE Extension_Host SHALL have performance tests ensuring operations complete within acceptable time limits

### Requirement 16: Documentation and User Guidance

**User Story:** As a new user, I want clear documentation, so that I can set up and use the extension quickly.

#### Acceptance Criteria

1. THE Extension_Host SHALL provide a README with setup instructions for AWS credentials
2. THE Extension_Host SHALL provide documentation for minimal IAM permissions required
3. THE Extension_Host SHALL provide a troubleshooting guide for common errors
4. THE Extension_Host SHALL provide examples of manual queue entry for restrictive IAM environments
5. THE Extension_Host SHALL provide a video walkthrough demonstrating key features
6. THE Extension_Host SHALL display helpful tooltips in the UI for all actions
7. WHEN a user encounters an IAM permission error, THE Extension_Host SHALL display a link to the IAM permissions documentation
8. THE Extension_Host SHALL provide a "Getting Started" command that opens a walkthrough guide
9. THE Extension_Host SHALL provide inline help text for credential configuration options

### Requirement 17: Marketplace Publishing Preparation

**User Story:** As a publisher, I want the extension ready for the VS Code Marketplace, so that users can easily install it.

#### Acceptance Criteria

1. THE Extension_Host SHALL have a package.json with all required marketplace fields: name, displayName, description, version, publisher, icon, repository, keywords, categories
2. THE Extension_Host SHALL have an icon image (128x128 PNG) following VS Code design guidelines
3. THE Extension_Host SHALL have a banner image (1280x640 PNG) for the marketplace listing
4. THE Extension_Host SHALL have a comprehensive README with screenshots and feature descriptions
5. THE Extension_Host SHALL have a CHANGELOG documenting all versions and changes
6. THE Extension_Host SHALL have a LICENSE file (MIT or Apache 2.0)
7. THE Extension_Host SHALL have marketplace keywords including: aws, sqs, queue, messaging, restrictive-iam, no-console-access
8. THE Extension_Host SHALL have activation events configured to activate on view open
9. THE Extension_Host SHALL have all dependencies bundled or listed in package.json
10. THE Extension_Host SHALL pass VS Code extension validation (vsce package)

