/**
 * Verification tests for SQS Service message operations
 * 
 * These tests verify that Task 3 implementation is complete and correct.
 */

import { SQSClient } from '@aws-sdk/client-sqs';
import { SQSService } from '../sqs-service';
import { ReceiveOptions, SendOptions } from '../../models/sqs-service';

describe('SQSService - Task 3 Verification', () => {
    let service: SQSService;
    let mockClient: SQSClient;

    beforeEach(() => {
        // Create a mock SQS client
        mockClient = {
            send: jest.fn()
        } as any;

        service = new SQSService(mockClient);
    });

    describe('receiveMessages', () => {
        it('should use ReceiveMessageCommand with MessageAttributeNames: "All" and AttributeNames: "All"', async () => {
            // Mock response
            (mockClient.send as jest.Mock).mockResolvedValue({
                Messages: [
                    {
                        MessageId: 'msg-1',
                        Body: 'test body',
                        ReceiptHandle: 'receipt-1',
                        Attributes: { SenderId: 'sender-1' },
                        MessageAttributes: {}
                    }
                ]
            });

            const options: ReceiveOptions = {
                maxMessages: 10,
                visibilityTimeout: 30,
                waitTimeSeconds: 20
            };

            const messages = await service.receiveMessages('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue', options);

            // Verify command was called with correct parameters
            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        MessageAttributeNames: ['All'],
                        AttributeNames: ['All']
                    })
                })
            );

            // Verify messages are transformed correctly
            expect(messages).toHaveLength(1);
            expect(messages[0]).toEqual({
                messageId: 'msg-1',
                body: 'test body',
                receiptHandle: 'receipt-1',
                md5OfBody: undefined,
                attributes: { SenderId: 'sender-1' },
                messageAttributes: {}
            });
        });

        it('should return empty array when no messages', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({});

            const options: ReceiveOptions = {
                maxMessages: 10,
                visibilityTimeout: 30,
                waitTimeSeconds: 20
            };

            const messages = await service.receiveMessages('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue', options);

            expect(messages).toEqual([]);
        });
    });

    describe('sendMessage', () => {
        it('should use SendMessageCommand with body, delaySeconds, messageAttributes', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({
                MessageId: 'msg-123'
            });

            const options: SendOptions = {
                delaySeconds: 10,
                messageAttributes: {
                    'attr1': {
                        DataType: 'String',
                        StringValue: 'value1'
                    }
                }
            };

            const result = await service.sendMessage(
                'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
                'test message body',
                options
            );

            // Verify command was called with correct parameters
            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        MessageBody: 'test message body',
                        DelaySeconds: 10,
                        MessageAttributes: options.messageAttributes
                    })
                })
            );

            // Verify messageId is returned
            expect(result.messageId).toBe('msg-123');
        });

        it('should throw error if no messageId returned', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({});

            const options: SendOptions = {};

            await expect(
                service.sendMessage('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue', 'test', options)
            ).rejects.toThrow('Failed to send message: No message ID returned');
        });

        it('should support different message attribute data types', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({
                MessageId: 'msg-456'
            });

            const options: SendOptions = {
                messageAttributes: {
                    'stringAttr': {
                        DataType: 'String',
                        StringValue: 'text value'
                    },
                    'numberAttr': {
                        DataType: 'Number',
                        StringValue: '42'
                    },
                    'jsonAttr': {
                        DataType: 'String.json',
                        StringValue: '{"key":"value"}'
                    },
                    'floatAttr': {
                        DataType: 'Number.float',
                        StringValue: '3.14'
                    }
                }
            };

            const result = await service.sendMessage(
                'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
                'test message',
                options
            );

            // Verify command was called with all attribute types
            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        MessageBody: 'test message',
                        MessageAttributes: options.messageAttributes
                    })
                })
            );

            expect(result.messageId).toBe('msg-456');
        });
    });

    describe('deleteMessage', () => {
        it('should use DeleteMessageCommand', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({});

            await service.deleteMessage(
                'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
                'receipt-handle-123'
            );

            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
                        ReceiptHandle: 'receipt-handle-123'
                    })
                })
            );
        });
    });

    describe('changeMessageVisibility', () => {
        it('should validate timeout is between 0 and 43200 seconds', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({});

            // Test invalid timeout < 0
            await expect(
                service.changeMessageVisibility('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue', 'receipt-1', -1)
            ).rejects.toThrow('Visibility timeout must be between 0 and 43200 seconds');

            // Test invalid timeout > 43200
            await expect(
                service.changeMessageVisibility('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue', 'receipt-1', 43201)
            ).rejects.toThrow('Visibility timeout must be between 0 and 43200 seconds');
        });

        it('should use ChangeMessageVisibilityCommand with valid timeout', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({});

            await service.changeMessageVisibility(
                'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
                'receipt-handle-123',
                300
            );

            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
                        ReceiptHandle: 'receipt-handle-123',
                        VisibilityTimeout: 300
                    })
                })
            );
        });
    });

    describe('purgeQueue', () => {
        it('should use PurgeQueueCommand', async () => {
            (mockClient.send as jest.Mock).mockResolvedValue({});

            await service.purgeQueue('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue');

            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'
                    })
                })
            );
        });

        it('should handle PurgeQueueInProgress error with user-friendly message', async () => {
            const error = new Error('PurgeQueueInProgress');
            (error as any).code = 'PurgeQueueInProgress';
            (mockClient.send as jest.Mock).mockRejectedValue(error);

            await expect(
                service.purgeQueue('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue')
            ).rejects.toThrow(
                'A purge operation is already in progress for this queue. ' +
                'AWS allows only one purge per queue every 60 seconds. Please wait and try again.'
            );
        });

        it('should re-throw other errors', async () => {
            const error = new Error('Some other error');
            (mockClient.send as jest.Mock).mockRejectedValue(error);

            await expect(
                service.purgeQueue('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue')
            ).rejects.toThrow('Some other error');
        });
    });
});
