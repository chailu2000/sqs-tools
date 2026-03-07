/**
 * Retry Handler with Exponential Backoff
 * 
 * Provides automatic retry logic for AWS SDK operations with exponential backoff.
 * Validates: Requirements 1.7, 10.5
 * 
 * Usage Example:
 * ```typescript
 * import { executeWithRetry } from './aws/retry-handler';
 * import { ReceiveMessageCommand } from '@aws-sdk/client-sqs';
 * 
 * // Wrap AWS SDK operation with retry logic
 * const response = await executeWithRetry(
 *   () => client.send(new ReceiveMessageCommand({ QueueUrl: url }))
 * );
 * ```
 */

import { log } from '../utils/logger';

/**
 * Error names that should trigger a retry
 */
const RETRYABLE_ERROR_NAMES = [
    'ThrottlingException',
    'ServiceUnavailable',
    'ServiceUnavailableException',
    'RequestTimeout',
    'RequestTimeoutException'
];

/**
 * Error codes that should trigger a retry
 */
const RETRYABLE_ERROR_CODES = [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'EPIPE'
];

/**
 * Maximum number of retry attempts
 */
const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds for exponential backoff
 */
const BASE_DELAY_MS = 1000;

/**
 * Check if an error is retryable
 * @param error - The error to check
 * @returns true if the error should trigger a retry
 */
function isRetryableError(error: any): boolean {
    // Check error name
    if (error.name && RETRYABLE_ERROR_NAMES.includes(error.name)) {
        return true;
    }

    // Check error code
    if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
        return true;
    }

    // Check $metadata for throttling
    if (error.$metadata?.httpStatusCode === 503) {
        return true;
    }

    return false;
}

/**
 * Calculate delay for exponential backoff
 * Formula: 2^attempt * 1000ms
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 * 
 * Examples:
 * - Attempt 0: 2^0 * 1000 = 1000ms (1 second)
 * - Attempt 1: 2^1 * 1000 = 2000ms (2 seconds)
 * - Attempt 2: 2^2 * 1000 = 4000ms (4 seconds)
 */
function calculateBackoffDelay(attempt: number): number {
    return Math.pow(2, attempt) * BASE_DELAY_MS;
}

/**
 * Sleep for the specified duration
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an AWS SDK operation with automatic retry and exponential backoff
 * 
 * Retries on:
 * - ThrottlingException
 * - ServiceUnavailable
 * - ETIMEDOUT
 * - Other transient network errors
 * 
 * Retry strategy:
 * - Max 3 retries
 * - Exponential backoff: 2^attempt * 1000ms (1s, 2s, 4s)
 * - Non-retryable errors are thrown immediately
 * 
 * @param operation - Async function that performs the AWS SDK operation
 * @returns Promise resolving to the operation result
 * @throws The last error if all retries are exhausted, or non-retryable errors immediately
 * 
 * Validates: Requirements 1.7, 10.5
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = await executeWithRetry(() => 
 *   client.send(new GetQueueAttributesCommand({ QueueUrl: url }))
 * );
 * 
 * // With error handling
 * try {
 *   const messages = await executeWithRetry(() =>
 *     client.send(new ReceiveMessageCommand({ QueueUrl: url }))
 *   );
 * } catch (error) {
 *   console.error('Operation failed after retries:', error);
 * }
 * ```
 */
export async function executeWithRetry<T>(
    operation: () => Promise<T>
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Execute the operation
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Check if error is retryable
            if (!isRetryableError(error)) {
                // Non-retryable error - throw immediately
                throw error;
            }

            // Check if we've exhausted retries
            if (attempt === MAX_RETRIES) {
                // Last attempt failed - throw the error
                throw error;
            }

            // Calculate backoff delay
            const delay = calculateBackoffDelay(attempt);

            // Log retry attempt (optional - can be removed or made configurable)
            log(
                `Retryable error encountered: ${error.name || error.code}. ` +
                `Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
            );

            // Wait before retrying
            await sleep(delay);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
}

/**
 * Export retry configuration for testing
 */
export const RETRY_CONFIG = {
    MAX_RETRIES,
    BASE_DELAY_MS,
    RETRYABLE_ERROR_NAMES,
    RETRYABLE_ERROR_CODES
};
