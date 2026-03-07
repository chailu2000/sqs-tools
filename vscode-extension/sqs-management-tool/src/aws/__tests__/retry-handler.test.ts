/**
 * Unit tests for retry handler with exponential backoff
 */

import { executeWithRetry, RETRY_CONFIG } from '../retry-handler';

// Suppress console.log during tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('executeWithRetry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('successful operations', () => {
        it('should return result on first attempt if operation succeeds', async () => {
            const operation = jest.fn().mockResolvedValue('success');

            const result = await executeWithRetry(operation);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should return result after retries if operation eventually succeeds', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce({ name: 'ThrottlingException' })
                .mockRejectedValueOnce({ name: 'ThrottlingException' })
                .mockResolvedValue('success');

            const result = await executeWithRetry(operation);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        }, 10000);
    });

    describe('retryable errors', () => {
        it('should retry on ThrottlingException', async () => {
            const error = { name: 'ThrottlingException', message: 'Rate exceeded' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
        }, 10000);

        it('should retry on ServiceUnavailable', async () => {
            const error = { name: 'ServiceUnavailable', message: 'Service unavailable' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4);
        }, 10000);

        it('should retry on ServiceUnavailableException', async () => {
            const error = { name: 'ServiceUnavailableException', message: 'Service unavailable' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4);
        }, 10000);

        it('should retry on ETIMEDOUT', async () => {
            const error = { code: 'ETIMEDOUT', message: 'Connection timed out' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4);
        }, 10000);

        it('should retry on ECONNRESET', async () => {
            const error = { code: 'ECONNRESET', message: 'Connection reset' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4);
        }, 10000);

        it('should retry on 503 HTTP status code', async () => {
            const error = {
                name: 'ServiceError',
                $metadata: { httpStatusCode: 503 }
            };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4);
        }, 10000);
    });

    describe('non-retryable errors', () => {
        it('should throw immediately on AccessDeniedException', async () => {
            const error = { name: 'AccessDeniedException', message: 'Access denied' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(1); // No retries
        });

        it('should throw immediately on QueueDoesNotExist', async () => {
            const error = { name: 'QueueDoesNotExist', message: 'Queue not found' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should throw immediately on ValidationError', async () => {
            const error = { name: 'ValidationError', message: 'Invalid parameter' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(1);
        });
    });

    describe('exponential backoff timing', () => {
        it('should use exponential backoff delays', async () => {
            const operation = jest.fn().mockRejectedValue({ name: 'ThrottlingException' });
            const delays: number[] = [];
            const startTimes: number[] = [];

            // Track when each attempt starts
            operation.mockImplementation(() => {
                startTimes.push(Date.now());
                return Promise.reject({ name: 'ThrottlingException' });
            });

            const startTime = Date.now();

            try {
                await executeWithRetry(operation);
            } catch (error) {
                // Expected to fail
            }

            // Calculate delays between attempts
            for (let i = 1; i < startTimes.length; i++) {
                delays.push(startTimes[i] - startTimes[i - 1]);
            }

            // Verify we have 3 delays (between 4 attempts)
            expect(delays).toHaveLength(3);

            // Verify delays are approximately 1s, 2s, 4s (with some tolerance)
            expect(delays[0]).toBeGreaterThanOrEqual(900);
            expect(delays[0]).toBeLessThanOrEqual(1100);

            expect(delays[1]).toBeGreaterThanOrEqual(1900);
            expect(delays[1]).toBeLessThanOrEqual(2100);

            expect(delays[2]).toBeGreaterThanOrEqual(3900);
            expect(delays[2]).toBeLessThanOrEqual(4100);
        }, 10000);
    });

    describe('max retries', () => {
        it('should stop after 3 retries', async () => {
            const error = { name: 'ThrottlingException', message: 'Rate exceeded' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
        }, 10000);

        it('should throw the last error after exhausting retries', async () => {
            const error = { name: 'ServiceUnavailable', message: 'Service down' };
            const operation = jest.fn().mockRejectedValue(error);

            await expect(executeWithRetry(operation)).rejects.toEqual(error);
            expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
        }, 15000);
    });

    describe('retry configuration', () => {
        it('should export correct retry configuration', () => {
            expect(RETRY_CONFIG.MAX_RETRIES).toBe(3);
            expect(RETRY_CONFIG.BASE_DELAY_MS).toBe(1000);
            expect(RETRY_CONFIG.RETRYABLE_ERROR_NAMES).toContain('ThrottlingException');
            expect(RETRY_CONFIG.RETRYABLE_ERROR_NAMES).toContain('ServiceUnavailable');
            expect(RETRY_CONFIG.RETRYABLE_ERROR_CODES).toContain('ETIMEDOUT');
        });
    });

    describe('real-world scenarios', () => {
        it('should handle intermittent throttling', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce({ name: 'ThrottlingException' })
                .mockResolvedValue({ Messages: [] });

            const result = await executeWithRetry(operation);

            expect(result).toEqual({ Messages: [] });
            expect(operation).toHaveBeenCalledTimes(2);
        }, 10000);

        it('should handle network timeout followed by success', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
                .mockResolvedValue({ QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/test' });

            const result = await executeWithRetry(operation);

            expect(result).toHaveProperty('QueueUrl');
            expect(operation).toHaveBeenCalledTimes(2);
        }, 10000);

        it('should not retry on permanent errors', async () => {
            const operation = jest.fn()
                .mockRejectedValue({ name: 'InvalidParameterValue', message: 'Invalid queue name' });

            await expect(executeWithRetry(operation)).rejects.toEqual({
                name: 'InvalidParameterValue',
                message: 'Invalid queue name'
            });

            expect(operation).toHaveBeenCalledTimes(1);
        });
    });
});
