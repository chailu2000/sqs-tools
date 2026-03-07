/**
 * Unit tests for SQS Service
 */

import { SQSService } from '../sqs-service';
import { SQSClient } from '@aws-sdk/client-sqs';

describe('SQSService', () => {
    let mockClient: any;
    let service: SQSService;

    beforeEach(() => {
        mockClient = {
            send: jest.fn()
        };
        service = new SQSService(mockClient);
    });

    describe('tryListQueues', () => {
        it('should return queues and hasPermission=true on success', async () => {
            mockClient.send.mockResolvedValue({
                QueueUrls: ['https://sqs.us-east-1.amazonaws.com/123/queue1']
            });

            const result = await service.tryListQueues();

            expect(result.hasPermission).toBe(true);
            expect(result.queues).toHaveLength(1);
            expect(result.queues[0]).toContain('queue1');
        });

        it('should return hasPermission=false on AccessDeniedException', async () => {
            const error = new Error('Access Denied');
            error.name = 'AccessDeniedException';
            mockClient.send.mockRejectedValue(error);

            const result = await service.tryListQueues();

            expect(result.hasPermission).toBe(false);
            expect(result.queues).toEqual([]);
        });

        it('should throw on other errors', async () => {
            const error = new Error('Network error');
            mockClient.send.mockRejectedValue(error);

            await expect(service.tryListQueues()).rejects.toThrow('Network error');
        });
    });

    describe('extractQueueName', () => {
        it('should extract queue name from URL', () => {
            const url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
            const name = service.extractQueueName(url);
            expect(name).toBe('my-queue');
        });

        it('should handle FIFO queue names', () => {
            const url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue.fifo';
            const name = service.extractQueueName(url);
            expect(name).toBe('my-queue.fifo');
        });
    });

    describe('extractDlqFromAttributes', () => {
        it('should extract DLQ info from RedrivePolicy', () => {
            const attributes = {
                RedrivePolicy: JSON.stringify({
                    deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123456789012:my-dlq',
                    maxReceiveCount: 3
                })
            };

            const dlqInfo = service.extractDlqFromAttributes(attributes);

            expect(dlqInfo).not.toBeNull();
            expect(dlqInfo?.dlqName).toBe('my-dlq');
            expect(dlqInfo?.dlqUrl).toBe('https://sqs.us-east-1.amazonaws.com/123456789012/my-dlq');
            expect(dlqInfo?.maxReceiveCount).toBe(3);
        });

        it('should return null if no RedrivePolicy', () => {
            const attributes = {};
            const dlqInfo = service.extractDlqFromAttributes(attributes);
            expect(dlqInfo).toBeNull();
        });

        it('should return null if RedrivePolicy is invalid JSON', () => {
            const attributes = {
                RedrivePolicy: 'invalid json'
            };
            const dlqInfo = service.extractDlqFromAttributes(attributes);
            expect(dlqInfo).toBeNull();
        });
    });

    describe('changeMessageVisibility', () => {
        it('should throw error if timeout is less than 0', async () => {
            await expect(
                service.changeMessageVisibility('queue-url', 'receipt-handle', -1)
            ).rejects.toThrow('Visibility timeout must be between 0 and 43200 seconds');
        });

        it('should throw error if timeout is greater than 43200', async () => {
            await expect(
                service.changeMessageVisibility('queue-url', 'receipt-handle', 43201)
            ).rejects.toThrow('Visibility timeout must be between 0 and 43200 seconds');
        });

        it('should accept valid timeout values', async () => {
            mockClient.send.mockResolvedValue({});

            await expect(
                service.changeMessageVisibility('queue-url', 'receipt-handle', 30)
            ).resolves.not.toThrow();
        });
    });

    describe('validateQueueAccess', () => {
        it('should return valid=true if GetQueueAttributes succeeds', async () => {
            mockClient.send.mockResolvedValue({
                Attributes: { QueueArn: 'arn:aws:sqs:us-east-1:123/queue' }
            });

            const result = await service.validateQueueAccess('queue-url');

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return valid=false with error on AccessDeniedException', async () => {
            const error = new Error('Access Denied');
            error.name = 'AccessDeniedException';
            mockClient.send.mockRejectedValue(error);

            const result = await service.validateQueueAccess('queue-url');

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.requiredPermissions).toContain('sqs:GetQueueAttributes');
        });
    });
});
