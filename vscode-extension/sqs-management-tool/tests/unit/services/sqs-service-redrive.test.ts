/**
 * Unit tests for SQS Service - Redrive Operations
 * 
 * Tests for Task 4: Implement SQS Service Layer - Redrive Operations
 * Validates Requirements 7.1-7.8
 */

import { SQSService } from '../../../src/services/sqs-service';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Message, RedriveOptions, RedriveResult } from '../../../src/models/sqs-service';

// Mock SQSClient
jest.mock('@aws-sdk/client-sqs');

describe('SQSService - Redrive Operations', () => {
    let service: SQSService;
    let mockClient: jest.Mocked<SQSClient>;

    beforeEach(() => {
        mockClient = new SQSClient({}) as jest.Mocked<SQSClient>;
        service = new SQSService(mockClient);
    });

    describe('redriveMessages', () => {
        it('should receive messages from DLQ and send to main queue', async () => {
            // Mock receiveMessages to return test messages
            const testMessages: Message[] = [
                {
                    messageId: 'msg-1',
                    body: 'Test message 1',
                    receiptHandle: 'receipt-1',
                    attributes: {},
                    messageAttributes: {
                        'CustomAttr': {
                            StringValue: 'value1',
                            DataType: 'String'
                        }
                    }
                }
            ];

            jest.spyOn(service, 'receiveMessages')
                .mockResolvedValueOnce(testMessages)
                .mockResolvedValueOnce([]); // Second call returns empty to stop loop

            jest.spyOn(service, 'sendMessage').mockResolvedValue({ messageId: 'msg-1' });
            jest.spyOn(service, 'deleteMessage').mockResolvedValue();

            const options: RedriveOptions = {
                maxMessages: 10,
                redriveAll: false
            };

            const result = await service.redriveMessages('dlq-url', 'main-url', options);

            // Verify result structure
            expect(result.processedCount).toBe(1);
            expect(result.successCount).toBe(1);
            expect(result.failureCount).toBe(0);
            expect(result.succeeded).toEqual(['msg-1']);
            expect(result.failed).toEqual([]);

            // Verify methods were called correctly
            expect(service.receiveMessages).toHaveBeenCalledWith('dlq-url', {
                maxMessages: 10,
                visibilityTimeout: 30,
                waitTimeSeconds: 0
            });

            expect(service.sendMessage).toHaveBeenCalledWith('main-url', 'Test message 1', {
                messageAttributes: testMessages[0].messageAttributes
            });

            expect(service.deleteMessage).toHaveBeenCalledWith('dlq-url', 'receipt-1');
        });

        it('should preserve message attributes when redriving', async () => {
            const messageAttributes = {
                'Attr1': { StringValue: 'value1', DataType: 'String' },
                'Attr2': { StringValue: 'value2', DataType: 'String' }
            };

            const testMessages: Message[] = [
                {
                    messageId: 'msg-1',
                    body: 'Test',
                    receiptHandle: 'receipt-1',
                    attributes: {},
                    messageAttributes
                }
            ];

            jest.spyOn(service, 'receiveMessages')
                .mockResolvedValueOnce(testMessages)
                .mockResolvedValueOnce([]);

            jest.spyOn(service, 'sendMessage').mockResolvedValue({ messageId: 'msg-1' });
            jest.spyOn(service, 'deleteMessage').mockResolvedValue();

            await service.redriveMessages('dlq-url', 'main-url', { maxMessages: 10, redriveAll: false });

            // Verify message attributes were passed to sendMessage
            expect(service.sendMessage).toHaveBeenCalledWith('main-url', 'Test', {
                messageAttributes
            });
        });

        it('should not delete from DLQ if send to main queue fails', async () => {
            const testMessages: Message[] = [
                {
                    messageId: 'msg-1',
                    body: 'Test',
                    receiptHandle: 'receipt-1',
                    attributes: {},
                    messageAttributes: {}
                }
            ];

            jest.spyOn(service, 'receiveMessages')
                .mockResolvedValueOnce(testMessages)
                .mockResolvedValueOnce([]);

            jest.spyOn(service, 'sendMessage').mockRejectedValue(new Error('Send failed'));
            jest.spyOn(service, 'deleteMessage').mockResolvedValue();

            const result = await service.redriveMessages('dlq-url', 'main-url', { maxMessages: 10, redriveAll: false });

            // Verify failure was recorded
            expect(result.processedCount).toBe(1);
            expect(result.successCount).toBe(0);
            expect(result.failureCount).toBe(1);
            expect(result.failed).toEqual([
                { messageId: 'msg-1', error: 'Send failed' }
            ]);

            // Verify deleteMessage was NOT called
            expect(service.deleteMessage).not.toHaveBeenCalled();
        });

        it('should return correct counts in RedriveResult', async () => {
            const testMessages: Message[] = [
                {
                    messageId: 'msg-1',
                    body: 'Test 1',
                    receiptHandle: 'receipt-1',
                    attributes: {},
                    messageAttributes: {}
                },
                {
                    messageId: 'msg-2',
                    body: 'Test 2',
                    receiptHandle: 'receipt-2',
                    attributes: {},
                    messageAttributes: {}
                }
            ];

            jest.spyOn(service, 'receiveMessages')
                .mockResolvedValueOnce(testMessages)
                .mockResolvedValueOnce([]);

            // First message succeeds, second fails
            jest.spyOn(service, 'sendMessage')
                .mockResolvedValueOnce({ messageId: 'msg-1' })
                .mockRejectedValueOnce(new Error('Failed'));

            jest.spyOn(service, 'deleteMessage').mockResolvedValue();

            const result = await service.redriveMessages('dlq-url', 'main-url', { maxMessages: 10, redriveAll: false });

            expect(result.processedCount).toBe(2);
            expect(result.successCount).toBe(1);
            expect(result.failureCount).toBe(1);
            expect(result.succeeded).toEqual(['msg-1']);
            expect(result.failed).toEqual([
                { messageId: 'msg-2', error: 'Failed' }
            ]);
        });
    });

    describe('redriveSelectedMessages', () => {
        it('should only redrive specified messages', async () => {
            const selectedMessages: Message[] = [
                {
                    messageId: 'msg-1',
                    body: 'Selected message 1',
                    receiptHandle: 'receipt-1',
                    attributes: {},
                    messageAttributes: {}
                },
                {
                    messageId: 'msg-2',
                    body: 'Selected message 2',
                    receiptHandle: 'receipt-2',
                    attributes: {},
                    messageAttributes: {}
                }
            ];

            jest.spyOn(service, 'sendMessage').mockResolvedValue({ messageId: 'msg-1' });
            jest.spyOn(service, 'deleteMessage').mockResolvedValue();

            const result = await service.redriveSelectedMessages('dlq-url', 'main-url', selectedMessages);

            // Verify all selected messages were processed
            expect(result.processedCount).toBe(2);
            expect(result.successCount).toBe(2);
            expect(result.failureCount).toBe(0);

            // Verify sendMessage was called for each message
            expect(service.sendMessage).toHaveBeenCalledTimes(2);
            expect(service.sendMessage).toHaveBeenCalledWith('main-url', 'Selected message 1', {
                messageAttributes: {}
            });
            expect(service.sendMessage).toHaveBeenCalledWith('main-url', 'Selected message 2', {
                messageAttributes: {}
            });

            // Verify deleteMessage was called for each message
            expect(service.deleteMessage).toHaveBeenCalledTimes(2);
            expect(service.deleteMessage).toHaveBeenCalledWith('dlq-url', 'receipt-1');
            expect(service.deleteMessage).toHaveBeenCalledWith('dlq-url', 'receipt-2');
        });

        it('should preserve message attributes for selected messages', async () => {
            const messageAttributes = {
                'CustomAttr': { StringValue: 'custom-value', DataType: 'String' }
            };

            const selectedMessages: Message[] = [
                {
                    messageId: 'msg-1',
                    body: 'Test',
                    receiptHandle: 'receipt-1',
                    attributes: {},
                    messageAttributes
                }
            ];

            jest.spyOn(service, 'sendMessage').mockResolvedValue({ messageId: 'msg-1' });
            jest.spyOn(service, 'deleteMessage').mockResolvedValue();

            await service.redriveSelectedMessages('dlq-url', 'main-url', selectedMessages);

            // Verify message attributes were preserved
            expect(service.sendMessage).toHaveBeenCalledWith('main-url', 'Test', {
                messageAttributes
            });
        });

        it('should handle partial failures in selected messages', async () => {
            const selectedMessages: Message[] = [
                {
                    messageId: 'msg-1',
                    body: 'Message 1',
                    receiptHandle: 'receipt-1',
                    attributes: {},
                    messageAttributes: {}
                },
                {
                    messageId: 'msg-2',
                    body: 'Message 2',
                    receiptHandle: 'receipt-2',
                    attributes: {},
                    messageAttributes: {}
                }
            ];

            jest.spyOn(service, 'sendMessage')
                .mockResolvedValueOnce({ messageId: 'msg-1' })
                .mockRejectedValueOnce(new Error('Send failed'));

            jest.spyOn(service, 'deleteMessage').mockResolvedValue();

            const result = await service.redriveSelectedMessages('dlq-url', 'main-url', selectedMessages);

            expect(result.processedCount).toBe(2);
            expect(result.successCount).toBe(1);
            expect(result.failureCount).toBe(1);
            expect(result.succeeded).toEqual(['msg-1']);
            expect(result.failed).toEqual([
                { messageId: 'msg-2', error: 'Send failed' }
            ]);

            // Verify deleteMessage was only called for successful message
            expect(service.deleteMessage).toHaveBeenCalledTimes(1);
            expect(service.deleteMessage).toHaveBeenCalledWith('dlq-url', 'receipt-1');
        });
    });
});
