/**
 * SQS Service Implementation
 * 
 * Replicates backend QueueService.java functionality with direct AWS SDK integration.
 * Handles queue operations, message operations, and redrive operations.
 */

import {
    SQSClient,
    ListQueuesCommand,
    GetQueueUrlCommand,
    GetQueueAttributesCommand,
    ReceiveMessageCommand,
    SendMessageCommand,
    DeleteMessageCommand,
    ChangeMessageVisibilityCommand,
    PurgeQueueCommand,
    QueueAttributeName
} from '@aws-sdk/client-sqs';

import {
    ISQSService,
    ListQueuesResult,
    ValidationResult,
    QueueAttributes,
    DlqInfo,
    ReceiveOptions,
    SendOptions,
    Message,
    SendResult,
    RedriveOptions,
    RedriveResult
} from '../models/sqs-service';

/**
 * SQS Service implementation
 */
export class SQSService implements ISQSService {
    constructor(private client: SQSClient) { }

    /**
     * Attempt to list queues with graceful AccessDenied handling
     * Returns hasPermission: false if ListQueues is denied
     * 
     * Validates: Requirements 1.4, 2.1, 2.2
     */
    async tryListQueues(): Promise<ListQueuesResult> {
        try {
            const command = new ListQueuesCommand({});
            const response = await this.client.send(command);

            return {
                queues: response.QueueUrls || [],
                hasPermission: true
            };
        } catch (error: any) {
            // Gracefully handle AccessDeniedException
            if (error.name === 'AccessDeniedException' || error.name === 'AccessDenied') {
                return {
                    queues: [],
                    hasPermission: false
                };
            }

            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Get queue URL from queue name
     * 
     * Validates: Requirements 1.3, 8.1
     */
    async getQueueUrl(queueName: string, accountId?: string): Promise<string> {
        const command = new GetQueueUrlCommand({
            QueueName: queueName,
            QueueOwnerAWSAccountId: accountId
        });

        const response = await this.client.send(command);

        if (!response.QueueUrl) {
            throw new Error(`Failed to get queue URL for: ${queueName}`);
        }

        return response.QueueUrl;
    }

    /**
     * Get all attributes for a queue
     * 
     * Validates: Requirements 1.3, 8.1, 8.2
     */
    async getQueueAttributes(queueUrl: string): Promise<QueueAttributes> {
        const command = new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All']
        });

        const response = await this.client.send(command);

        return response.Attributes || {};
    }

    /**
     * Validate that the user has access to a queue
     * 
     * Validates: Requirements 2.8, 2.9
     */
    async validateQueueAccess(queueUrl: string): Promise<ValidationResult> {
        try {
            await this.getQueueAttributes(queueUrl);
            return { valid: true };
        } catch (error: any) {
            // Extract required permissions from error
            const requiredPermissions: string[] = [];

            if (error.name === 'AccessDeniedException' || error.name === 'AccessDenied') {
                requiredPermissions.push('sqs:GetQueueAttributes');
            }

            return {
                valid: false,
                error: error.message || 'Failed to validate queue access',
                requiredPermissions
            };
        }
    }

    /**
     * Extract DLQ information from queue attributes
     * Parses RedrivePolicy JSON and converts ARN to URL
     * 
     * Validates: Requirements 5.7, 8.5, 8.6
     */
    extractDlqFromAttributes(attributes: QueueAttributes): DlqInfo | null {
        const redrivePolicy = attributes.RedrivePolicy;

        if (!redrivePolicy) {
            return null;
        }

        try {
            const policy = JSON.parse(redrivePolicy);
            const dlqArn = policy.deadLetterTargetArn;
            const maxReceiveCount = policy.maxReceiveCount || 0;

            if (!dlqArn) {
                return null;
            }

            // Convert ARN to URL
            // ARN format: arn:aws:sqs:{region}:{account}:{queue-name}
            const arnParts = dlqArn.split(':');

            if (arnParts.length < 6) {
                return null;
            }

            const region = arnParts[3];
            const accountId = arnParts[4];
            const queueName = arnParts[5];

            const dlqUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;

            return {
                dlqUrl,
                dlqName: queueName,
                maxReceiveCount
            };
        } catch (error) {
            // If parsing fails, return null
            return null;
        }
    }

    /**
     * Extract queue name from queue URL
     * Returns the last path segment of the URL
     * 
     * Validates: Requirements 8.7
     */
    extractQueueName(queueUrl: string): string {
        const parts = queueUrl.split('/');
        return parts[parts.length - 1];
    }

    /**
     * Receive messages from a queue
     * 
     * Validates: Requirements 6.1, 6.2, 6.3
     */
    async receiveMessages(queueUrl: string, options: ReceiveOptions): Promise<Message[]> {
        const command = new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: options.maxMessages,
            VisibilityTimeout: options.visibilityTimeout,
            WaitTimeSeconds: options.waitTimeSeconds,
            MessageAttributeNames: ['All'],
            AttributeNames: ['All']
        });

        const response = await this.client.send(command);

        if (!response.Messages) {
            return [];
        }

        return response.Messages.map(msg => ({
            messageId: msg.MessageId || '',
            body: msg.Body || '',
            receiptHandle: msg.ReceiptHandle || '',
            md5OfBody: msg.MD5OfBody,
            attributes: msg.Attributes || {},
            messageAttributes: msg.MessageAttributes || {}
        }));
    }

    /**
     * Send a message to a queue
     * 
     * Validates: Requirements 6.4, 6.5
     */
    async sendMessage(queueUrl: string, body: string, options: SendOptions): Promise<SendResult> {
        const command = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: body,
            DelaySeconds: options.delaySeconds,
            MessageAttributes: options.messageAttributes,
            MessageGroupId: options.messageGroupId,
            MessageDeduplicationId: options.messageDeduplicationId
        });

        const response = await this.client.send(command);

        if (!response.MessageId) {
            throw new Error('Failed to send message: No message ID returned');
        }

        return {
            messageId: response.MessageId
        };
    }

    /**
     * Delete a message from a queue
     * 
     * Validates: Requirements 6.6, 6.7
     */
    async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
        const command = new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle
        });

        await this.client.send(command);
    }

    /**
     * Change the visibility timeout of a message
     * Validates timeout is between 0 and 43200 seconds
     * 
     * Validates: Requirements 6.8, 6.9
     */
    async changeMessageVisibility(queueUrl: string, receiptHandle: string, timeout: number): Promise<void> {
        // Validate timeout range
        if (timeout < 0 || timeout > 43200) {
            throw new Error('Visibility timeout must be between 0 and 43200 seconds');
        }

        const command = new ChangeMessageVisibilityCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle,
            VisibilityTimeout: timeout
        });

        await this.client.send(command);
    }

    /**
     * Purge all messages from a queue
     * 
     * Validates: Requirements 6.10, 6.11
     */
    async purgeQueue(queueUrl: string): Promise<void> {
        try {
            const command = new PurgeQueueCommand({
                QueueUrl: queueUrl
            });

            await this.client.send(command);
        } catch (error: any) {
            // Handle PurgeQueueInProgress error with user-friendly message
            if (error.code === 'PurgeQueueInProgress' || error.name === 'PurgeQueueInProgress') {
                throw new Error(
                    'A purge operation is already in progress for this queue. ' +
                    'AWS allows only one purge per queue every 60 seconds. Please wait and try again.'
                );
            }

            throw error;
        }
    }

    /**
     * Redrive messages from DLQ to main queue
     * Receives messages from DLQ, sends to main queue, deletes from DLQ on success
     * 
     * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
     */
    async redriveMessages(dlqUrl: string, mainQueueUrl: string, options: RedriveOptions): Promise<RedriveResult> {
        const result: RedriveResult = {
            processedCount: 0,
            successCount: 0,
            failureCount: 0,
            succeeded: [],
            failed: []
        };

        const maxMessages = options.redriveAll ? 10 : options.maxMessages;

        while (true) {
            // Receive messages from DLQ
            const messages = await this.receiveMessages(dlqUrl, {
                maxMessages,
                visibilityTimeout: 30,
                waitTimeSeconds: 0
            });

            if (messages.length === 0) {
                break;
            }

            // Process each message
            for (const message of messages) {
                result.processedCount++;

                const messageGroupId = message.attributes ? message.attributes.MessageGroupId : undefined;
                const messageDeduplicationId = message.attributes ? message.attributes.MessageDeduplicationId : undefined;

                try {
                    // Send to main queue with original attributes
                    await this.sendMessage(mainQueueUrl, message.body, {
                        messageAttributes: message.messageAttributes,
                        messageGroupId,
                        messageDeduplicationId
                    });

                    // Delete from DLQ only on successful send
                    await this.deleteMessage(dlqUrl, message.receiptHandle);

                    result.successCount++;
                    result.succeeded.push(message.messageId);
                } catch (error: any) {
                    result.failureCount++;
                    result.failed.push({
                        messageId: message.messageId,
                        error: error.message || 'Unknown error'
                    });
                }
            }

            // If not redriving all, stop after first batch
            if (!options.redriveAll) {
                break;
            }
        }

        return result;
    }

    /**
     * Redrive specific messages from DLQ to main queue
     * 
     * Validates: Requirements 7.7, 7.8
     */
    async redriveSelectedMessages(dlqUrl: string, mainQueueUrl: string, messages: Message[]): Promise<RedriveResult> {
        const result: RedriveResult = {
            processedCount: 0,
            successCount: 0,
            failureCount: 0,
            succeeded: [],
            failed: []
        };

        for (const message of messages) {
            result.processedCount++;

            const messageGroupId = message.attributes ? message.attributes.MessageGroupId : undefined;
            const messageDeduplicationId = message.attributes ? message.attributes.MessageDeduplicationId : undefined;

            try {
                // Send to main queue with original attributes
                await this.sendMessage(mainQueueUrl, message.body, {
                    messageAttributes: message.messageAttributes,
                    messageGroupId,
                    messageDeduplicationId
                });

                // Delete from DLQ only on successful send
                await this.deleteMessage(dlqUrl, message.receiptHandle);

                result.successCount++;
                result.succeeded.push(message.messageId);
            } catch (error: any) {
                result.failureCount++;
                result.failed.push({
                    messageId: message.messageId,
                    error: error.message || 'Unknown error'
                });
            }
        }

        return result;
    }
}
