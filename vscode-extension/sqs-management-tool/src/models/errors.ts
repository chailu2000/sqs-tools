/**
 * Error classification and handling for the SQS Management Tool extension.
 * 
 * This module defines error categories and interfaces for consistent error handling
 * across the extension, providing user-friendly error messages with actionable information.
 */

/**
 * Categories of errors that can occur in the extension.
 * Used to classify errors for appropriate handling and user messaging.
 */
export enum ErrorCategory {
    /** IAM permission issues (e.g., AccessDeniedException) */
    PERMISSION = 'PERMISSION',

    /** Input validation failures */
    VALIDATION = 'VALIDATION',

    /** Network connectivity issues */
    NETWORK = 'NETWORK',

    /** AWS rate limiting (ThrottlingException) */
    THROTTLING = 'THROTTLING',

    /** Resource not found (e.g., QueueDoesNotExist) */
    NOT_FOUND = 'NOT_FOUND',

    /** Configuration issues (e.g., invalid credentials) */
    CONFIGURATION = 'CONFIGURATION',

    /** Internal extension errors */
    INTERNAL = 'INTERNAL'
}

/**
 * Structured error interface for extension errors.
 * Provides consistent error information with actionable guidance for users.
 */
export interface ExtensionError {
    /** Error category for classification */
    category: ErrorCategory;

    /** Error code for programmatic handling */
    code: string;

    /** User-friendly error message */
    message: string;

    /** Additional details about the error */
    details?: string;

    /** Required IAM permissions (for permission errors) */
    requiredPermissions?: string[];

    /** URL to troubleshooting documentation */
    troubleshootingUrl?: string;

    /** Original error object */
    originalError?: Error;
}

/**
 * Standard error codes used throughout the extension.
 */
export enum ErrorCode {
    // Permission errors
    ACCESS_DENIED = 'ACCESS_DENIED',
    MISSING_PERMISSION = 'MISSING_PERMISSION',

    // Resource errors
    QUEUE_NOT_FOUND = 'QUEUE_NOT_FOUND',
    QUEUE_DOES_NOT_EXIST = 'QUEUE_DOES_NOT_EXIST',

    // Credential errors
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    CREDENTIALS_NOT_FOUND = 'CREDENTIALS_NOT_FOUND',
    CREDENTIAL_VALIDATION_FAILED = 'CREDENTIAL_VALIDATION_FAILED',

    // Network errors
    NETWORK_ERROR = 'NETWORK_ERROR',
    CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
    DNS_LOOKUP_FAILED = 'DNS_LOOKUP_FAILED',

    // Throttling errors
    THROTTLING = 'THROTTLING',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Validation errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_QUEUE_URL = 'INVALID_QUEUE_URL',
    INVALID_QUEUE_NAME = 'INVALID_QUEUE_NAME',
    INVALID_VISIBILITY_TIMEOUT = 'INVALID_VISIBILITY_TIMEOUT',

    // Operation errors
    PURGE_IN_PROGRESS = 'PURGE_IN_PROGRESS',
    OPERATION_CANCELLED = 'OPERATION_CANCELLED',

    // Internal errors
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Creates a structured ExtensionError from an AWS SDK error or generic error.
 * 
 * @param error - The original error object
 * @param context - Additional context about where the error occurred
 * @returns A structured ExtensionError with category and user-friendly message
 */
export function createExtensionError(error: any, context?: string): ExtensionError {
    // Handle AWS SDK errors
    if (error.name === 'AccessDeniedException') {
        return {
            category: ErrorCategory.PERMISSION,
            code: ErrorCode.ACCESS_DENIED,
            message: 'Access denied: Missing required IAM permissions',
            details: context,
            requiredPermissions: extractRequiredPermissions(error),
            troubleshootingUrl: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-authentication-and-access-control.html',
            originalError: error
        };
    }

    if (error.name === 'QueueDoesNotExist' || error.code === 'AWS.SimpleQueueService.NonExistentQueue') {
        return {
            category: ErrorCategory.NOT_FOUND,
            code: ErrorCode.QUEUE_NOT_FOUND,
            message: 'Queue not found',
            details: context ? `${context}\n\nPlease check:\n- Queue name is correct\n- Queue exists in the specified region\n- You have access to the queue` : undefined,
            originalError: error
        };
    }

    if (error.name === 'ThrottlingException' || error.code === 'ThrottlingException') {
        return {
            category: ErrorCategory.THROTTLING,
            code: ErrorCode.THROTTLING,
            message: 'Request throttled by AWS',
            details: 'Too many requests. The operation will be retried automatically.',
            originalError: error
        };
    }

    if (error.code === 'PurgeQueueInProgress') {
        return {
            category: ErrorCategory.VALIDATION,
            code: ErrorCode.PURGE_IN_PROGRESS,
            message: 'Purge operation already in progress',
            details: 'AWS allows only one purge per queue every 60 seconds. Please wait and try again.',
            originalError: error
        };
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND') {
        return {
            category: ErrorCategory.NETWORK,
            code: ErrorCode.DNS_LOOKUP_FAILED,
            message: 'Network error: Unable to reach AWS SQS',
            details: 'DNS lookup failed. Please check your internet connection and try again.',
            originalError: error
        };
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        return {
            category: ErrorCategory.NETWORK,
            code: ErrorCode.CONNECTION_TIMEOUT,
            message: 'Network error: Connection timeout',
            details: 'The request timed out. Please check your internet connection and try again.',
            originalError: error
        };
    }

    // Handle credential errors
    if (error.message?.includes('credentials') || error.message?.includes('authentication')) {
        return {
            category: ErrorCategory.CONFIGURATION,
            code: ErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid AWS credentials',
            details: 'Please check your AWS credentials configuration.',
            troubleshootingUrl: 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html',
            originalError: error
        };
    }

    // Generic error
    return {
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred',
        details: context,
        originalError: error
    };
}

/**
 * Extracts required IAM permissions from an AWS AccessDeniedException error.
 * 
 * @param error - The AWS error object
 * @returns Array of required permission strings
 */
function extractRequiredPermissions(error: any): string[] {
    const permissions: string[] = [];

    // Try to extract from error message
    // AWS error messages typically include: "User is not authorized to perform: sqs:ListQueues"
    const message = error.message || '';
    const match = message.match(/perform:\s*([a-zA-Z0-9:,\s]+)/);

    if (match) {
        const permissionString = match[1];
        permissions.push(...permissionString.split(',').map((p: string) => p.trim()));
    }

    return permissions;
}

/**
 * Formats an ExtensionError into a user-friendly message string.
 * 
 * @param error - The ExtensionError to format
 * @returns Formatted error message
 */
export function formatErrorMessage(error: ExtensionError): string {
    let message = error.message;

    if (error.details) {
        message += `\n\n${error.details}`;
    }

    if (error.requiredPermissions && error.requiredPermissions.length > 0) {
        message += `\n\nRequired permissions:\n${error.requiredPermissions.map(p => `- ${p}`).join('\n')}`;
    }

    return message;
}
