# AWS Client Management

This directory contains AWS SDK client management utilities for the SQS Management Tool extension.

## Client Factory

The `SQSClientFactory` class provides region-based caching of SQS clients to improve performance and resource usage.

### Features

- **Region-based caching**: Clients are cached per AWS region to avoid repeated client creation
- **Automatic client creation**: Creates new clients on-demand when a new region is requested
- **Resource management**: Provides `dispose()` method to clean up all clients when the extension deactivates
- **Credential management**: Accepts default configuration (including credentials) that applies to all clients

### Usage in Extension

```typescript
import { SQSClientFactory } from './aws/client-factory';
import { SQSService } from './services/sqs-service';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

// In extension.ts activation
let clientFactory: SQSClientFactory;

export async function activate(context: vscode.ExtensionContext) {
    // Load credentials from environment, AWS profile, or IAM role
    const credentials = fromNodeProviderChain();
    
    // Create factory with default configuration
    clientFactory = new SQSClientFactory({ credentials });
    
    // Register disposal
    context.subscriptions.push({
        dispose: () => clientFactory.dispose()
    });
    
    // Use factory to get clients for different regions
    const usEast1Service = new SQSService(clientFactory.getClient('us-east-1'));
    const usWest2Service = new SQSService(clientFactory.getClient('us-west-2'));
    
    // Getting the same region returns cached client
    const cachedClient = clientFactory.getClient('us-east-1'); // Returns same instance
}
```

### Multi-Region Queue Management

```typescript
interface QueueConfig {
    name: string;
    url: string;
    region: string;
}

class QueueManager {
    constructor(private clientFactory: SQSClientFactory) {}
    
    getServiceForQueue(queue: QueueConfig): SQSService {
        // Get cached client for the queue's region
        const client = this.clientFactory.getClient(queue.region);
        return new SQSService(client);
    }
    
    async receiveMessages(queue: QueueConfig) {
        const service = this.getServiceForQueue(queue);
        return service.receiveMessages(queue.url, {
            maxMessages: 10,
            visibilityTimeout: 30,
            waitTimeSeconds: 0
        });
    }
}
```

### Credential Updates

When credentials change (e.g., user switches AWS profile), you should:

1. Dispose of the old factory
2. Create a new factory with new credentials
3. All subsequent `getClient()` calls will use the new credentials

```typescript
function updateCredentials(newCredentials: AwsCredentialIdentity) {
    // Dispose old factory
    clientFactory.dispose();
    
    // Create new factory with new credentials
    clientFactory = new SQSClientFactory({ credentials: newCredentials });
}
```

### Testing

The client factory is fully tested with unit tests covering:
- Client caching by region
- Different clients for different regions
- Cache disposal and cleanup
- Client removal
- Configuration updates

See `__tests__/client-factory.test.ts` for examples.

## Retry Handler

The `executeWithRetry` function provides automatic retry logic with exponential backoff for AWS SDK operations.

### Features

- **Automatic retries**: Retries transient errors up to 3 times
- **Exponential backoff**: Uses 2^attempt * 1000ms delay pattern (1s, 2s, 4s)
- **Smart error detection**: Only retries on transient errors (throttling, timeouts, service unavailable)
- **Immediate failure**: Non-retryable errors (access denied, validation errors) fail immediately

### Retryable Errors

The retry handler automatically retries on:
- `ThrottlingException` - AWS rate limiting
- `ServiceUnavailable` / `ServiceUnavailableException` - AWS service temporarily down
- `RequestTimeout` / `RequestTimeoutException` - Request timed out
- `ETIMEDOUT` - Network timeout
- `ECONNRESET` - Connection reset
- `ENOTFOUND` - DNS lookup failed
- `EPIPE` - Broken pipe
- HTTP 503 status code - Service unavailable

### Usage

```typescript
import { executeWithRetry } from './aws/retry-handler';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

// Wrap any AWS SDK operation
const attributes = await executeWithRetry(() =>
    client.send(new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All']
    }))
);
```

### Integration with SQS Service

```typescript
import { executeWithRetry } from '../aws/retry-handler';

class SQSService {
    async getQueueAttributes(queueUrl: string): Promise<QueueAttributes> {
        const command = new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All']
        });

        // Automatically retries on transient errors
        const response = await executeWithRetry(() => 
            this.client.send(command)
        );

        return response.Attributes || {};
    }
}
```

### Retry Behavior

```typescript
// Example: Throttling with eventual success
const operation = async () => {
    // First attempt: ThrottlingException
    // Wait 1 second
    // Second attempt: ThrottlingException
    // Wait 2 seconds
    // Third attempt: Success!
    return await client.send(command);
};

const result = await executeWithRetry(operation);
// Total time: ~3 seconds (1s + 2s)
// Total attempts: 3
```

### Error Handling

```typescript
try {
    const result = await executeWithRetry(() =>
        client.send(new ReceiveMessageCommand({ QueueUrl: url }))
    );
} catch (error) {
    // Error is thrown after all retries exhausted
    // or immediately for non-retryable errors
    console.error('Operation failed:', error);
}
```

### Testing

The retry handler is fully tested with unit tests covering:
- Successful operations with and without retries
- All retryable error types
- Non-retryable errors (immediate failure)
- Exponential backoff timing
- Max retry limit
- Real-world scenarios

See `__tests__/retry-handler.test.ts` for examples.

## Requirements Validation

This implementation validates the following requirements:

### Client Factory
- **Requirement 1.5**: Cache SQS client instances per region to avoid repeated client creation
- **Requirement 1.6**: When the AWS region changes, create a new SQS client for that region
- **Requirement 11.5**: Create separate SQS client instances for each region
- **Requirement 12.5**: Dispose of SQS clients when the extension deactivates

### Retry Handler
- **Requirement 1.7**: Implement retry logic with exponential backoff for transient AWS errors
- **Requirement 10.5**: Automatically retry with exponential backoff when rate limiting occurs
