/**
 * Test Data Fixtures
 * 
 * Provides utilities for creating test queues and messages in LocalStack.
 */

import {
    SQSClient,
    CreateQueueCommand,
    DeleteQueueCommand,
    SendMessageCommand,
    GetQueueAttributesCommand,
    type QueueAttributeName
} from '@aws-sdk/client-sqs';
import { LocalStackFixture } from './localstack';

/**
 * Queue configuration matching the extension's QueueConfig interface
 */
export interface QueueConfig {
    id: string;
    name: string;
    url: string;
    region: string;
    attributes?: {
        ApproximateNumberOfMessages?: string;
        ApproximateNumberOfMessagesNotVisible?: string;
        ApproximateNumberOfMessagesDelayed?: string;
        MessageRetentionPeriod?: string;
        VisibilityTimeout?: string;
        DelaySeconds?: string;
        ReceiveMessageWaitTimeSeconds?: string;
        QueueArn?: string;
        CreatedTimestamp?: string;
        LastModifiedTimestamp?: string;
        RedrivePolicy?: string;
    };
    dlqUrl?: string;
    dlqName?: string;
    addedManually: boolean;
    favorite?: boolean;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TestMessage {
    messageId: string;
    receiptHandle: string;
    body: string;
    attributes: {
        sentTimestamp: string;
        approximateReceiveCount: string;
        approximateFirstReceiveTimestamp: string;
    };
    messageAttributes?: Record<string, {
        dataType: string;
        stringValue?: string;
        binaryValue?: Buffer;
    }>;
}

export class QueueFixture {
    private client: SQSClient;

    constructor(private localstack: LocalStackFixture) {
        this.client = new SQSClient({
            endpoint: localstack.getEndpoint(),
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'test',
                secretAccessKey: 'test'
            }
        });
    }

    /**
     * Create a standard queue
     */
    async createStandardQueue(name: string): Promise<QueueConfig> {
        const result = await this.client.send(new CreateQueueCommand({
            QueueName: name,
            Attributes: {
                VisibilityTimeout: '30',
                MessageRetentionPeriod: '345600'
            }
        }));

        const queueUrl = result.QueueUrl!;

        // Get all queue attributes
        const attributesResult = await this.client.send(new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All' as QueueAttributeName]
        }));

        const now = new Date().toISOString();

        return {
            id: this.generateId(),
            name,
            url: queueUrl,
            region: 'us-east-1',
            attributes: attributesResult.Attributes,
            addedManually: true,
            createdAt: now,
            updatedAt: now
        };
    }

    /**
     * Create a queue with a dead letter queue
     */
    async createQueueWithDLQ(name: string, maxReceiveCount: number = 3): Promise<{
        main: QueueConfig;
        dlq: QueueConfig;
    }> {
        // Create DLQ first
        const dlq = await this.createStandardQueue(`${name}-dlq`);

        // Create main queue with redrive policy
        const result = await this.client.send(new CreateQueueCommand({
            QueueName: name,
            Attributes: {
                VisibilityTimeout: '30',
                MessageRetentionPeriod: '345600',
                RedrivePolicy: JSON.stringify({
                    deadLetterTargetArn: dlq.attributes?.QueueArn,
                    maxReceiveCount
                })
            }
        }));

        const queueUrl = result.QueueUrl!;

        // Get all queue attributes
        const attributesResult = await this.client.send(new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All' as QueueAttributeName]
        }));

        const now = new Date().toISOString();

        const main: QueueConfig = {
            id: this.generateId(),
            name,
            url: queueUrl,
            region: 'us-east-1',
            attributes: attributesResult.Attributes,
            dlqUrl: dlq.url,
            dlqName: dlq.name,
            addedManually: true,
            createdAt: now,
            updatedAt: now
        };

        return { main, dlq };
    }

    /**
     * Send messages to a queue
     */
    async sendMessages(queueUrl: string, count: number): Promise<TestMessage[]> {
        const messages: TestMessage[] = [];

        for (let i = 0; i < count; i++) {
            const body = `Test message ${i + 1} - ${Date.now()}`;
            const result = await this.client.send(new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: body,
                MessageAttributes: {
                    TestAttribute: {
                        DataType: 'String',
                        StringValue: `value-${i}`
                    }
                }
            }));

            messages.push({
                messageId: result.MessageId!,
                receiptHandle: '',
                body,
                attributes: {
                    sentTimestamp: Date.now().toString(),
                    approximateReceiveCount: '0',
                    approximateFirstReceiveTimestamp: ''
                },
                messageAttributes: {
                    TestAttribute: {
                        dataType: 'String',
                        stringValue: `value-${i}`
                    }
                }
            });
        }

        return messages;
    }

    /**
     * Delete a queue
     */
    async deleteQueue(queueUrl: string): Promise<void> {
        await this.client.send(new DeleteQueueCommand({
            QueueUrl: queueUrl
        }));
    }

    /**
     * Get queue ARN
     */
    private async getQueueArn(queueUrl: string): Promise<string> {
        const result = await this.client.send(new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['QueueArn' as QueueAttributeName]
        }));

        return result.Attributes?.QueueArn || '';
    }

    /**
     * Generate unique ID for queue config
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Generate unique queue name
     */
    static generateQueueName(prefix: string = 'test-queue'): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Generate a test message with configurable size and attributes
     */
    static generateMessage(options: {
        size?: number;
        attributes?: Record<string, string>;
        includeTimestamp?: boolean;
    } = {}): string {
        const {
            size = 100,
            attributes = {},
            includeTimestamp = true
        } = options;

        const timestamp = includeTimestamp ? `[${new Date().toISOString()}] ` : '';
        const attrStr = Object.keys(attributes).length > 0
            ? ` ${JSON.stringify(attributes)}`
            : '';

        const baseMessage = `${timestamp}Test message${attrStr}`;
        const padding = 'x'.repeat(Math.max(0, size - baseMessage.length));

        return baseMessage + padding;
    }

    /**
     * Generate multiple messages
     */
    static generateMessages(count: number, options: {
        size?: number;
        attributes?: Record<string, string>;
        includeTimestamp?: boolean;
    } = {}): string[] {
        const messages: string[] = [];

        for (let i = 0; i < count; i++) {
            const message = this.generateMessage({
                ...options,
                attributes: {
                    ...options.attributes,
                    index: i.toString()
                }
            });
            messages.push(message);
        }

        return messages;
    }

    /**
     * Generate random string
     */
    static randomString(length: number = 10): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    /**
     * Generate random number
     */
    static randomNumber(min: number = 0, max: number = 100): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random boolean
     */
    static randomBoolean(): boolean {
        return Math.random() < 0.5;
    }

    /**
     * Generate random array element
     */
    static randomElement<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }
}
