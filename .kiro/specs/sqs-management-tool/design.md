# Design Document: SQS Management Tool

## Overview

The SQS Management Tool is a locally-running, web-based application that provides visualization and management capabilities for AWS SQS queues. The system consists of a Spring Boot backend service that interfaces with AWS SQS APIs and a modern web frontend that provides an intuitive user interface.

The architecture is designed to work within the constraints of restricted AWS IAM permissions, specifically without listQueues, createQueue, or deleteQueue permissions. Users manually provide queue names or URLs, and the system handles all other operations through permitted APIs.

### Key Design Principles

1. **Minimal Permissions**: Operate with the minimum required AWS permissions
2. **Local-First**: All data and operations run on the developer's local machine
3. **Cross-Platform**: Support Windows and macOS without platform-specific dependencies
4. **User-Friendly**: Provide clear feedback and intuitive interfaces for all operations
5. **Extensible**: Design for future enhancements (XML support, additional message formats)

## Technology Stack

### Backend
- **Spring Boot**: 4.0.x (released November 2025)
- **Spring Framework**: 7.0.x (included with Spring Boot 4)
- **Java**: 21 or 23 (LTS recommended)
- **Spring Data JPA**: 4.0.x (included with Spring Boot)
- **SQLite JDBC**: 3.46.x
- **AWS SDK for Java**: 2.x (latest)
- **Jackson**: 2.18.x (included with Spring Boot)
- **jqwik**: 1.9.x (property-based testing)
- **JUnit**: 5.11.x (included with Spring Boot)
- **Mockito**: 5.x (included with Spring Boot)

### Frontend
- **Svelte**: 5.x (latest with runes)
- **Vite**: 6.x (build tool)
- **TypeScript**: 5.x
- **Vitest**: 2.x (testing framework)
- **@testing-library/svelte**: 5.x (component testing)
- **Prism.js**: 1.29.x (syntax highlighting for JSON)

### Build & Packaging
- **Gradle**: 8.14+ or 9.x (Spring Boot 4 supports both)
- **npm**: 10.x or **pnpm**: 9.x (for Svelte)

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Frontend Application (Svelte 5)           │  │
│  │  - Queue Management UI                            │  │
│  │  - Message Viewer                                 │  │
│  │  - Operation Controls                             │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────┐
│           Backend Service (Spring Boot)                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │              REST Controllers                       │ │
│  │  - QueueController                                 │ │
│  │  - MessageController                               │ │
│  │  - ConfigController                                │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Service Layer                          │ │
│  │  - QueueService                                    │ │
│  │  - MessageService                                  │ │
│  │  - RedriveService                                  │ │
│  │  - ConfigurationService                            │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │              AWS Integration Layer                  │ │
│  │  - SQSClientFactory                                │ │
│  │  - CredentialsProvider                             │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ AWS SDK
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    AWS SQS Service                       │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Queue Addition Flow**:
   - User enters queue name/URL in Frontend
   - Frontend sends POST request to Backend
   - Backend resolves queue name to URL (if needed)
   - Backend retrieves queue attributes
   - Backend persists queue configuration
   - Backend returns queue details to Frontend

2. **Message Viewing Flow**:
   - User selects queue in Frontend
   - Frontend requests messages from Backend
   - Backend calls ReceiveMessage API
   - Backend formats and returns messages
   - Frontend displays messages with formatting

3. **Redrive Flow**:
   - User initiates redrive operation
   - Backend receives messages from DLQ
   - For each message: send to main queue, then delete from DLQ
   - Backend reports progress to Frontend
   - Frontend displays operation results

## Components and Interfaces

### Backend Components

#### 1. REST Controllers

**QueueController**
```java
@RestController
@RequestMapping("/api/queues")
public class QueueController {
    
    // Add queue by name or URL
    POST /api/queues
    Request: { "identifier": "queue-name-or-url", "region": "us-east-1" }
    Response: { "queueUrl": "...", "attributes": {...}, "dlqUrl": "..." }
    
    // Get all saved queues
    GET /api/queues
    Response: [{ "queueUrl": "...", "name": "...", "attributes": {...} }]
    
    // Get queue details
    GET /api/queues/{queueId}
    Response: { "queueUrl": "...", "attributes": {...}, "dlqUrl": "..." }
    
    // Remove saved queue
    DELETE /api/queues/{queueId}
    Response: 204 No Content
    
    // Purge queue
    POST /api/queues/{queueId}/purge
    Response: { "success": true, "message": "..." }
}
```

**MessageController**
```java
@RestController
@RequestMapping("/api/queues/{queueId}/messages")
public class MessageController {
    
    // Receive messages
    GET /api/queues/{queueId}/messages
    Query Params: maxMessages, visibilityTimeout, waitTimeSeconds
    Response: [{ "messageId": "...", "body": "...", "attributes": {...}, "receiptHandle": "..." }]
    
    // Send message
    POST /api/queues/{queueId}/messages
    Request: { "body": "...", "attributes": {...}, "delaySeconds": 0 }
    Response: { "messageId": "...", "success": true }
    
    // Delete message
    DELETE /api/queues/{queueId}/messages/{receiptHandle}
    Response: { "success": true }
    
    // Change message visibility
    PATCH /api/queues/{queueId}/messages/{receiptHandle}/visibility
    Request: { "visibilityTimeout": 300 }
    Response: { "success": true }
}
```

**RedriveController**
```java
@RestController
@RequestMapping("/api/queues/{queueId}/redrive")
public class RedriveController {
    
    // Redrive messages from DLQ to main queue
    POST /api/queues/{queueId}/redrive
    Request: { "maxMessages": 10, "redriveAll": false }
    Response: { "processedCount": 5, "successCount": 5, "failureCount": 0, "errors": [] }
}
```

**ConfigController**
```java
@RestController
@RequestMapping("/api/config")
public class ConfigController {
    
    // Get available AWS profiles
    GET /api/config/profiles
    Response: ["default", "dev", "prod"]
    
    // Set active AWS profile
    POST /api/config/profile
    Request: { "profileName": "dev" }
    Response: { "success": true }
    
    // Test AWS credentials
    GET /api/config/test-credentials
    Response: { "valid": true, "accountId": "...", "method": "profile" }
}
```

#### 2. Service Layer

**QueueService**
- Resolves queue names to URLs using GetQueueUrl
- Retrieves queue attributes using GetQueueAttributes
- Extracts DLQ configuration from RedrivePolicy
- Manages queue configuration persistence
- Validates queue accessibility

**MessageService**
- Receives messages with configurable parameters
- Sends messages with attributes and delay
- Deletes messages using receipt handles
- Changes message visibility timeout
- Purges queues
- Formats message bodies (JSON pretty-printing)

**RedriveService**
- Orchestrates redrive operations
- Receives messages from DLQ
- Sends messages to main queue
- Deletes successfully redriven messages from DLQ
- Tracks operation progress and errors
- Implements retry logic for failed sends

**ConfigurationService**
- Loads and saves queue configurations to SQLite database
- Manages application settings
- Provides AWS profile enumeration
- Handles database initialization and migrations

#### 3. AWS Integration Layer

**SQSClientFactory**
- Creates and configures AWS SQS clients
- Manages client lifecycle
- Applies region configuration
- Handles client caching per region

**CredentialsProvider**
- Resolves AWS credentials from multiple sources
- Priority: Environment variables → AWS profile → Default chain
- Validates credentials before use
- Provides credential information for UI display

### Frontend Components

#### 1. Core Components

**QueueList Component**
- Displays all saved queues
- Shows queue names and basic attributes
- Provides add/remove queue actions
- Highlights selected queue

**QueueDetails Component**
- Displays detailed queue attributes
- Shows DLQ information if configured
- Provides queue-level operations (purge)
- Displays queue metrics

**MessageViewer Component**
- Lists messages with pagination
- Displays message body with formatting
- Shows message attributes and metadata
- Provides message-level actions (delete, change visibility)

**MessageComposer Component**
- Text area for message body
- JSON validation and formatting
- Message attributes editor
- Delay seconds configuration
- Send button with confirmation

**RedrivePanel Component**
- Shows DLQ message count
- Provides redrive controls (single/all)
- Displays redrive progress
- Shows operation results

**SettingsPanel Component**
- AWS profile selector
- Credential status display
- Application configuration options

#### 2. State Management

The frontend uses Svelte 5's runes for reactive state management:

- `$state`: Queue list, selected queue, messages, loading states
- `$derived`: Computed values (filtered messages, DLQ status)
- `$effect`: Side effects (auto-refresh, persistence)

#### 3. API Client

**ApiClient Service**
- Wraps all backend API calls
- Handles authentication headers
- Manages error responses
- Provides loading state management
- Implements request retry logic

## Data Models

### Queue Configuration

```typescript
interface QueueConfiguration {
  id: string;                    // Internal identifier
  queueUrl: string;              // Full AWS queue URL
  queueName: string;             // Extracted queue name
  region: string;                // AWS region
  attributes: QueueAttributes;   // Queue attributes from AWS
  dlqUrl?: string;              // DLQ URL if configured
  dlqName?: string;             // DLQ name if configured
  savedAt: string;              // ISO timestamp
}

interface QueueAttributes {
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  approximateNumberOfMessagesDelayed: number;
  visibilityTimeout: number;
  messageRetentionPeriod: number;
  maximumMessageSize: number;
  delaySeconds: number;
  receiveMessageWaitTimeSeconds: number;
  redrivePolicy?: RedrivePolicy;
}

interface RedrivePolicy {
  deadLetterTargetArn: string;
  maxReceiveCount: number;
}
```

### Message

```typescript
interface SQSMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
  bodyFormatted?: any;          // Parsed JSON if applicable
  attributes: MessageAttributes;
  messageAttributes: Record<string, MessageAttributeValue>;
  md5OfBody: string;
}

interface MessageAttributes {
  sentTimestamp: string;
  approximateReceiveCount: number;
  approximateFirstReceiveTimestamp: string;
  senderId: string;
}

interface MessageAttributeValue {
  dataType: string;
  stringValue?: string;
  binaryValue?: string;
}
```

### Redrive Operation Result

```typescript
interface RedriveResult {
  processedCount: number;
  successCount: number;
  failureCount: number;
  errors: RedriveError[];
}

interface RedriveError {
  messageId: string;
  error: string;
}
```

### Application Configuration

```typescript
interface AppConfiguration {
  queues: QueueConfiguration[];
  activeProfile?: string;
  preferences: {
    defaultVisibilityTimeout: number;
    defaultMaxMessages: number;
    autoRefreshInterval: number;
    theme: 'light' | 'dark';
  };
}
```

### Database Schema

**queues table**
```sql
CREATE TABLE queues (
  id TEXT PRIMARY KEY,
  queue_url TEXT NOT NULL UNIQUE,
  queue_name TEXT NOT NULL,
  region TEXT NOT NULL,
  attributes TEXT NOT NULL,  -- JSON string
  dlq_url TEXT,
  dlq_name TEXT,
  saved_at TEXT NOT NULL
);
```

**preferences table**
```sql
CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Queue Identifier Resolution

*For any* valid queue name, resolving it to a Queue_URL should call the GetQueueUrl API and return a properly formatted SQS URL. *For any* valid Queue_URL provided directly, the system should accept it without making additional API calls.

**Validates: Requirements 1.1, 1.2**

### Property 2: Queue Configuration Persistence Round-Trip

*For any* queue configuration, saving it to local storage and then loading it should produce an equivalent configuration with all fields preserved (queue URL, name, region, attributes).

**Validates: Requirements 1.4, 1.5, 12.1, 12.2, 12.3**

### Property 3: Queue Attribute Retrieval

*For any* valid queue URL, retrieving queue attributes should return a complete attributes object containing all standard SQS queue properties (message counts, timeouts, retention period).

**Validates: Requirements 1.6**

### Property 4: DLQ Extraction from Attributes

*For any* queue attributes containing a RedrivePolicy, extracting the DLQ information should return the DLQ ARN and maxReceiveCount. *For any* queue attributes without a RedrivePolicy, the DLQ field should be null or empty.

**Validates: Requirements 1.7, 3.1, 3.4**

### Property 5: Error Response Completeness

*For any* failed operation (queue resolution, authentication, message operations), the system should return an error response containing a descriptive error message indicating the failure reason.

**Validates: Requirements 1.3, 2.4, 6.5, 7.6, 9.4, 10.5, 13.1, 13.3**

### Property 6: Credential Validation Before Operations

*For any* SQS operation request, if AWS credentials are invalid or missing, the system should fail with an authentication error before attempting to call AWS APIs.

**Validates: Requirements 2.6**

### Property 7: DLQ Message Access

*For any* queue with a configured DLQ, the system should be able to retrieve messages from both the main queue URL and the DLQ URL independently.

**Validates: Requirements 3.3, 3.5**

### Property 8: Message Field Completeness

*For any* message received from SQS, the returned message object should contain all required fields: messageId, body, receiptHandle, attributes, and messageAttributes.

**Validates: Requirements 4.2, 7.3**

### Property 9: JSON Message Formatting Round-Trip

*For any* message body containing valid JSON, parsing and pretty-printing it should produce formatted JSON that, when parsed again, equals the original parsed value. *For any* message body that is not valid JSON, the system should return it as plain text without throwing errors.

**Validates: Requirements 4.4, 4.5, 15.1, 15.3, 15.5**

### Property 10: Visibility Timeout Parameter Passing

*For any* ReceiveMessage operation with a specified visibility timeout value, the AWS API call should include that visibility timeout parameter.

**Validates: Requirements 4.6, 7.1**

### Property 11: Message Search Filtering

*For any* list of messages and search term, the filtered results should only contain messages where the message body or attributes contain the search term. The length of filtered results should be less than or equal to the original list length.

**Validates: Requirements 5.2, 5.3**

### Property 12: Message Send with Attributes

*For any* message sent with message attributes, the SendMessage API call should include those attributes, and a successful response should return a message ID.

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 13: JSON Validation Before Send

*For any* message body marked as JSON content, if the body is not valid JSON, validation should fail before attempting to send the message.

**Validates: Requirements 6.6**

### Property 14: Message Send with Delay

*For any* message sent with a delay seconds value, the SendMessage API call should include the delaySeconds parameter with that value.

**Validates: Requirements 6.7**

### Property 15: Message Deletion with Receipt Handle

*For any* delete message operation, the DeleteMessage API call should be invoked with the correct receipt handle from the received message.

**Validates: Requirements 7.4**

### Property 16: Batch Message Receive

*For any* ReceiveMessage request with maxMessages parameter greater than 1, the system should support receiving up to that many messages in a single API call.

**Validates: Requirements 7.7**

### Property 17: Redrive Operation Transactional Behavior

*For any* message received from a DLQ during a redrive operation, if sending it to the main queue succeeds, the message should be deleted from the DLQ. If sending to the main queue fails, the message should remain in the DLQ (not deleted).

**Validates: Requirements 8.2, 8.3, 8.4, 8.5**

### Property 18: Purge Queue API Usage

*For any* purge queue operation, the system should call the PurgeQueue API, and a successful operation should return a success response.

**Validates: Requirements 9.2, 9.3**

### Property 19: Change Visibility API Usage

*For any* change message visibility operation, the system should call the ChangeMessageVisibility API with the receipt handle and new timeout value.

**Validates: Requirements 10.2, 10.4**

### Property 20: Visibility Timeout Range Validation

*For any* visibility timeout value between 0 and 43200 seconds (inclusive), the system should accept it. *For any* value outside this range, the system should reject it with a validation error.

**Validates: Requirements 10.3**

### Property 21: Queue Configuration Removal

*For any* saved queue configuration, removing it should result in that configuration not being present in the list of saved queues after the removal operation completes.

**Validates: Requirements 12.5**

### Property 22: Queue Configuration Update

*For any* queue configuration update operation, the saved configuration should reflect the updated values when retrieved after the update.

**Validates: Requirements 12.6, 12.7**

### Property 23: Cross-Platform File Path Handling

*For any* file path operation (saving/loading configuration), the system should use path separators and formats that work correctly on both Windows (backslash) and macOS/Linux (forward slash) operating systems.

**Validates: Requirements 14.3**

## Error Handling

### Error Categories

The system handles errors in the following categories:

1. **AWS API Errors**
   - Queue not found (QueueDoesNotExist)
   - Access denied (AccessDenied)
   - Invalid parameter values
   - Throttling errors
   - Service unavailable

2. **Authentication Errors**
   - Invalid credentials
   - Expired credentials
   - Missing credentials
   - Insufficient permissions

3. **Validation Errors**
   - Invalid queue URL format
   - Invalid JSON format
   - Invalid parameter ranges (visibility timeout, delay seconds)
   - Missing required fields

4. **Network Errors**
   - Connection timeout
   - DNS resolution failure
   - Network unreachable

5. **Application Errors**
   - Configuration file read/write errors
   - Invalid application state
   - Concurrent operation conflicts
   - Database connection errors
   - Database constraint violations

### Error Handling Strategy

**Backend Error Handling:**
- All AWS SDK exceptions are caught and translated to application-specific error responses
- Error responses include: error code, user-friendly message, technical details (for logging)
- HTTP status codes are used appropriately (400 for validation, 401 for auth, 404 for not found, 500 for server errors)
- Detailed error information is logged for debugging
- Sensitive information (credentials, account IDs) is redacted from error messages
- Database errors are handled gracefully with appropriate rollback

**Frontend Error Handling:**
- All API calls are wrapped in try-catch blocks
- Error messages are displayed in a toast/notification component
- Loading states are cleared when errors occur
- Retry mechanisms for transient errors (network issues, throttling)
- User-friendly error messages with actionable guidance

**Specific Error Scenarios:**

1. **Queue Resolution Failure:**
   - Message: "Queue '{name}' not found. Verify the queue name and your AWS permissions."
   - Action: Allow user to retry or enter a different queue name

2. **Authentication Failure:**
   - Message: "AWS authentication failed. Check your credentials and try again."
   - Action: Prompt user to verify AWS profile or environment variables

3. **Message Send Failure:**
   - Message: "Failed to send message: {reason}"
   - Action: Allow user to retry or modify the message

4. **Purge Rate Limit:**
   - Message: "Queue was recently purged. AWS allows purge operations once every 60 seconds."
   - Action: Display countdown timer until next purge is allowed

5. **Network Timeout:**
   - Message: "Request timed out. Check your network connection and try again."
   - Action: Provide retry button

## Testing Strategy

### Overview

The testing strategy employs a dual approach combining unit tests for specific examples and edge cases with property-based tests for universal correctness properties. This ensures both concrete behavior validation and comprehensive input coverage.

### Property-Based Testing

**Framework:** For Java/Spring Boot backend, we'll use **jqwik 1.9.x** (https://jqwik.net/), a mature property-based testing framework for the JVM that works seamlessly with JUnit 5.

**Configuration:**
- Minimum 100 iterations per property test
- Each property test references its design document property number
- Tag format: `@Tag("Feature: sqs-management-tool, Property {N}: {property_text}")`
- jqwik integrates with Spring Boot Test for dependency injection

**Property Test Examples:**

```java
@Property
@Tag("Feature: sqs-management-tool, Property 2: Queue Configuration Persistence Round-Trip")
void queueConfigurationPersistenceRoundTrip(@ForAll QueueConfiguration config) {
    // Save configuration
    configService.saveQueue(config);
    
    // Load configuration
    QueueConfiguration loaded = configService.loadQueue(config.getId());
    
    // Verify equivalence
    assertThat(loaded).isEqualTo(config);
}

@Property
@Tag("Feature: sqs-management-tool, Property 9: JSON Message Formatting Round-Trip")
void jsonMessageFormattingRoundTrip(@ForAll("validJsonStrings") String jsonBody) {
    // Parse and format
    Object parsed = messageService.parseJson(jsonBody);
    String formatted = messageService.prettyPrint(parsed);
    Object reparsed = messageService.parseJson(formatted);
    
    // Verify equivalence
    assertThat(reparsed).isEqualTo(parsed);
}

@Property
@Tag("Feature: sqs-management-tool, Property 20: Visibility Timeout Range Validation")
void visibilityTimeoutRangeValidation(@ForAll @IntRange(min = 0, max = 43200) int validTimeout,
                                      @ForAll @IntRange(min = -1000, max = -1) int invalidNegative,
                                      @ForAll @IntRange(min = 43201, max = 50000) int invalidHigh) {
    // Valid range should be accepted
    assertThat(messageService.validateVisibilityTimeout(validTimeout)).isTrue();
    
    // Invalid ranges should be rejected
    assertThat(messageService.validateVisibilityTimeout(invalidNegative)).isFalse();
    assertThat(messageService.validateVisibilityTimeout(invalidHigh)).isFalse();
}
```

### Unit Testing

**Framework:** JUnit 5 with Mockito for mocking AWS SDK clients

**Focus Areas:**
- Specific examples of queue operations
- Edge cases (empty queues, malformed URLs, special characters)
- Error conditions (AWS exceptions, network failures)
- Integration points between components
- Controller endpoint behavior

**Unit Test Examples:**

```java
@Test
void shouldHandleQueueNotFoundError() {
    // Given
    when(sqsClient.getQueueUrl(any())).thenThrow(QueueDoesNotExistException.class);
    
    // When
    ResponseEntity<ErrorResponse> response = queueController.addQueue("nonexistent-queue");
    
    // Then
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(response.getBody().getMessage()).contains("not found");
}

@Test
void shouldExtractDlqFromRedrivePolicy() {
    // Given
    Map<String, String> attributes = Map.of(
        "RedrivePolicy", "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:123456789:my-dlq\",\"maxReceiveCount\":3}"
    );
    
    // When
    Optional<String> dlqArn = queueService.extractDlqArn(attributes);
    
    // Then
    assertThat(dlqArn).isPresent();
    assertThat(dlqArn.get()).isEqualTo("arn:aws:sqs:us-east-1:123456789:my-dlq");
}

@Test
void shouldHandlePurgeRateLimitError() {
    // Given
    when(sqsClient.purgeQueue(any())).thenThrow(
        PurgeQueueInProgressException.builder()
            .message("Only one PurgeQueue operation per 60 seconds")
            .build()
    );
    
    // When
    ResponseEntity<ErrorResponse> response = queueController.purgeQueue("queue-id");
    
    // Then
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    assertThat(response.getBody().getMessage()).contains("60 seconds");
}
```

### Frontend Testing

**Framework:** Vitest 2.x with @testing-library/svelte 5.x

**Focus Areas:**
- Component rendering with different props
- User interactions (button clicks, form submissions)
- State management and reactivity (Svelte 5 runes)
- API client error handling
- Message filtering and search logic

**Test Examples:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import MessageViewer from './MessageViewer.svelte';

describe('MessageViewer', () => {
  it('should display messages with formatted JSON', () => {
    const messages = [
      { messageId: '1', body: '{"key":"value"}', receiptHandle: 'handle1' }
    ];
    
    render(MessageViewer, { messages });
    
    expect(screen.getByText(/"key"/)).toBeInTheDocument();
    expect(screen.getByText(/"value"/)).toBeInTheDocument();
  });
  
  it('should filter messages by search term', async () => {
    const messages = [
      { messageId: '1', body: 'hello world', receiptHandle: 'h1' },
      { messageId: '2', body: 'goodbye world', receiptHandle: 'h2' }
    ];
    
    const { component } = render(MessageViewer, { messages });
    
    await userEvent.type(screen.getByRole('searchbox'), 'hello');
    
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.queryByText('goodbye world')).not.toBeInTheDocument();
  });
});
```

### Integration Testing

**Approach:** Test complete flows from API endpoint to AWS SDK interaction

**Focus Areas:**
- End-to-end queue addition flow
- Message send and receive flow
- Redrive operation flow
- Configuration persistence flow

**Example:**

```java
@SpringBootTest
@AutoConfigureMockMvc
class QueueIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private SqsClient sqsClient;
    
    @Test
    void shouldAddQueueAndRetrieveAttributes() throws Exception {
        // Given
        when(sqsClient.getQueueUrl(any(GetQueueUrlRequest.class)))
            .thenReturn(GetQueueUrlResponse.builder()
                .queueUrl("https://sqs.us-east-1.amazonaws.com/123456789/my-queue")
                .build());
        
        when(sqsClient.getQueueAttributes(any(GetQueueAttributesRequest.class)))
            .thenReturn(GetQueueAttributesResponse.builder()
                .attributes(Map.of(
                    "ApproximateNumberOfMessages", "5",
                    "VisibilityTimeout", "30"
                ))
                .build());
        
        // When & Then
        mockMvc.perform(post("/api/queues")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"my-queue\",\"region\":\"us-east-1\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.queueUrl").value(containsString("my-queue")))
            .andExpect(jsonPath("$.attributes.approximateNumberOfMessages").value(5));
    }
}
```

### Test Coverage Goals

- Backend service layer: 90%+ coverage
- Backend controllers: 85%+ coverage
- Frontend components: 80%+ coverage
- Property tests: All 23 properties implemented
- Integration tests: All critical user flows covered

### Continuous Testing

- Tests run automatically on every commit
- Property tests run with 100 iterations in CI/CD
- Integration tests run against LocalStack (local AWS emulator) for realistic testing
- Performance benchmarks for message processing operations
