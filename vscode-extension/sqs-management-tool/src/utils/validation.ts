/**
 * Input validation utilities for the SQS Management Tool extension.
 * 
 * This module provides validation functions for user inputs before making AWS API calls,
 * ensuring data integrity and preventing injection attacks.
 */

import { ErrorCode } from '../models/errors';

/**
 * Result of a validation operation
 */
export interface ValidationResult {
    /** Whether the validation passed */
    valid: boolean;

    /** Error message if validation failed */
    error?: string;

    /** Error code for programmatic handling */
    errorCode?: ErrorCode;

    /** The validation rule that was violated */
    violatedRule?: string;
}

/**
 * Validates a queue URL format.
 * 
 * Queue URLs must match the AWS SQS URL pattern:
 * https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}
 * 
 * @param url - The queue URL to validate
 * @returns ValidationResult indicating if the URL is valid
 */
export function validateQueueUrl(url: string): ValidationResult {
    if (!url || url.trim() === '') {
        return {
            valid: false,
            error: 'Queue URL is required',
            errorCode: ErrorCode.INVALID_QUEUE_URL,
            violatedRule: 'Queue URL must not be empty'
        };
    }

    // AWS SQS URL pattern
    const pattern = /^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/[a-zA-Z0-9_-]+(?:\.fifo)?$/;

    if (!pattern.test(url)) {
        return {
            valid: false,
            error: 'Invalid queue URL format. Expected: https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}',
            errorCode: ErrorCode.INVALID_QUEUE_URL,
            violatedRule: 'Queue URL must match AWS SQS URL pattern'
        };
    }

    return { valid: true };
}

/**
 * Validates a queue name.
 * 
 * Queue names must:
 * - Be 1-80 characters long
 * - Contain only alphanumeric characters, hyphens, and underscores
 * - For FIFO queues, end with .fifo suffix
 * 
 * @param name - The queue name to validate
 * @returns ValidationResult indicating if the name is valid
 */
export function validateQueueName(name: string): ValidationResult {
    if (!name || name.trim() === '') {
        return {
            valid: false,
            error: 'Queue name is required',
            errorCode: ErrorCode.INVALID_QUEUE_NAME,
            violatedRule: 'Queue name must not be empty'
        };
    }

    if (name.length < 1 || name.length > 80) {
        return {
            valid: false,
            error: 'Queue name must be between 1 and 80 characters',
            errorCode: ErrorCode.INVALID_QUEUE_NAME,
            violatedRule: 'Queue name length must be 1-80 characters'
        };
    }

    // Queue name pattern: alphanumeric, hyphens, underscores, optional .fifo suffix
    const pattern = /^[a-zA-Z0-9_-]+(?:\.fifo)?$/;

    if (!pattern.test(name)) {
        return {
            valid: false,
            error: 'Queue name can only contain alphanumeric characters, hyphens, and underscores',
            errorCode: ErrorCode.INVALID_QUEUE_NAME,
            violatedRule: 'Queue name must contain only alphanumeric characters, hyphens, and underscores'
        };
    }

    return { valid: true };
}

/**
 * Validates a visibility timeout value.
 * 
 * Visibility timeout must be between 0 and 43200 seconds (12 hours).
 * 
 * @param timeout - The visibility timeout in seconds
 * @returns ValidationResult indicating if the timeout is valid
 */
export function validateVisibilityTimeout(timeout: number): ValidationResult {
    if (typeof timeout !== 'number' || isNaN(timeout)) {
        return {
            valid: false,
            error: 'Visibility timeout must be a number',
            errorCode: ErrorCode.INVALID_VISIBILITY_TIMEOUT,
            violatedRule: 'Visibility timeout must be a numeric value'
        };
    }

    if (timeout < 0 || timeout > 43200) {
        return {
            valid: false,
            error: 'Visibility timeout must be between 0 and 43200 seconds (12 hours)',
            errorCode: ErrorCode.INVALID_VISIBILITY_TIMEOUT,
            violatedRule: 'Visibility timeout must be in range 0-43200 seconds'
        };
    }

    return { valid: true };
}

/**
 * Validates a message delay value.
 * 
 * Message delay must be between 0 and 900 seconds (15 minutes).
 * 
 * @param delay - The message delay in seconds
 * @returns ValidationResult indicating if the delay is valid
 */
export function validateMessageDelay(delay: number): ValidationResult {
    if (typeof delay !== 'number' || isNaN(delay)) {
        return {
            valid: false,
            error: 'Message delay must be a number',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Message delay must be a numeric value'
        };
    }

    if (delay < 0 || delay > 900) {
        return {
            valid: false,
            error: 'Message delay must be between 0 and 900 seconds (15 minutes)',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Message delay must be in range 0-900 seconds'
        };
    }

    return { valid: true };
}

/**
 * Validates a wait time for long polling.
 * 
 * Wait time must be between 0 and 20 seconds.
 * 
 * @param waitTime - The wait time in seconds
 * @returns ValidationResult indicating if the wait time is valid
 */
export function validateWaitTime(waitTime: number): ValidationResult {
    if (typeof waitTime !== 'number' || isNaN(waitTime)) {
        return {
            valid: false,
            error: 'Wait time must be a number',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Wait time must be a numeric value'
        };
    }

    if (waitTime < 0 || waitTime > 20) {
        return {
            valid: false,
            error: 'Wait time must be between 0 and 20 seconds',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Wait time must be in range 0-20 seconds'
        };
    }

    return { valid: true };
}

/**
 * Validates the maximum number of messages to receive.
 * 
 * Max messages must be between 1 and 10.
 * 
 * @param maxMessages - The maximum number of messages
 * @returns ValidationResult indicating if the value is valid
 */
export function validateMaxMessages(maxMessages: number): ValidationResult {
    if (typeof maxMessages !== 'number' || isNaN(maxMessages)) {
        return {
            valid: false,
            error: 'Max messages must be a number',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Max messages must be a numeric value'
        };
    }

    if (maxMessages < 1 || maxMessages > 10) {
        return {
            valid: false,
            error: 'Max messages must be between 1 and 10',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Max messages must be in range 1-10'
        };
    }

    return { valid: true };
}

/**
 * Sanitizes a queue URL to prevent injection attacks.
 * 
 * This function:
 * 1. Validates the URL format
 * 2. Removes any query parameters or fragments
 * 3. Ensures the URL uses HTTPS
 * 4. Verifies it's an AWS SQS URL
 * 
 * @param url - The queue URL to sanitize
 * @returns Sanitized URL or throws an error if invalid
 */
export function sanitizeQueueUrl(url: string): string {
    // First validate the URL
    const validation = validateQueueUrl(url);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Parse the URL
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch (error) {
        throw new Error('Invalid URL format');
    }

    // Ensure HTTPS
    if (parsedUrl.protocol !== 'https:') {
        throw new Error('Queue URL must use HTTPS protocol');
    }

    // Ensure it's an AWS SQS domain
    if (!parsedUrl.hostname.match(/^sqs\.[a-z0-9-]+\.amazonaws\.com$/)) {
        throw new Error('Queue URL must be an AWS SQS domain');
    }

    // Remove query parameters and fragments (prevent injection)
    parsedUrl.search = '';
    parsedUrl.hash = '';

    // Return sanitized URL
    return parsedUrl.toString();
}

/**
 * Validates an AWS region string.
 * 
 * @param region - The AWS region to validate
 * @returns ValidationResult indicating if the region is valid
 */
export function validateRegion(region: string): ValidationResult {
    if (!region || region.trim() === '') {
        return {
            valid: false,
            error: 'AWS region is required',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'AWS region must not be empty'
        };
    }

    // AWS region pattern: us-east-1, eu-west-2, ap-southeast-1, etc.
    const pattern = /^[a-z]{2}-[a-z]+-\d+$/;

    if (!pattern.test(region)) {
        return {
            valid: false,
            error: 'Invalid AWS region format. Expected format: us-east-1, eu-west-2, etc.',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'AWS region must match pattern: {area}-{direction}-{number}'
        };
    }

    return { valid: true };
}

/**
 * Validates a message body.
 * 
 * Message body must not exceed 256 KB.
 * 
 * @param body - The message body to validate
 * @returns ValidationResult indicating if the body is valid
 */
export function validateMessageBody(body: string): ValidationResult {
    if (body === null || body === undefined) {
        return {
            valid: false,
            error: 'Message body is required',
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Message body must not be null or undefined'
        };
    }

    // Calculate size in bytes (UTF-8 encoding)
    const sizeInBytes = new TextEncoder().encode(body).length;
    const maxSizeInBytes = 256 * 1024; // 256 KB

    if (sizeInBytes > maxSizeInBytes) {
        return {
            valid: false,
            error: `Message body exceeds maximum size of 256 KB (current: ${Math.round(sizeInBytes / 1024)} KB)`,
            errorCode: ErrorCode.VALIDATION_ERROR,
            violatedRule: 'Message body must not exceed 256 KB'
        };
    }

    return { valid: true };
}
