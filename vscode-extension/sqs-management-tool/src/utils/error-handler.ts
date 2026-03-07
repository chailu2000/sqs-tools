/**
 * Error handling utilities for the SQS Management Tool extension.
 * 
 * This module provides functions for handling different types of errors
 * and displaying user-friendly error messages with actionable guidance.
 */

import * as vscode from 'vscode';
import { ErrorCategory, ExtensionError, ErrorCode, createExtensionError, formatErrorMessage } from '../models/errors';

/**
 * Handles an error by displaying an appropriate user message and logging.
 * 
 * @param error - The error to handle
 * @param context - Additional context about where the error occurred
 * @param logger - Optional logger instance for error logging
 */
export async function handleError(
    error: any,
    context?: string,
    logger?: { error: (message: string, error?: Error) => void }
): Promise<void> {
    const extensionError = createExtensionError(error, context);

    // Log the error
    if (logger) {
        logger.error(
            `${extensionError.category} error: ${extensionError.message}`,
            extensionError.originalError
        );
    }

    // Display user-friendly message based on error category
    switch (extensionError.category) {
        case ErrorCategory.PERMISSION:
            await handlePermissionError(extensionError);
            break;

        case ErrorCategory.NOT_FOUND:
            await handleNotFoundError(extensionError);
            break;

        case ErrorCategory.NETWORK:
            await handleNetworkError(extensionError);
            break;

        case ErrorCategory.THROTTLING:
            // Throttling errors are handled automatically with retry logic
            // Only show message if it persists
            vscode.window.showWarningMessage(
                `${extensionError.message}\n\n${extensionError.details || ''}`
            );
            break;

        case ErrorCategory.VALIDATION:
            await handleValidationError(extensionError);
            break;

        case ErrorCategory.CONFIGURATION:
            await handleConfigurationError(extensionError);
            break;

        default:
            await handleGenericError(extensionError);
            break;
    }
}

/**
 * Handles permission errors (AccessDeniedException).
 * Displays missing permissions and link to IAM documentation.
 */
async function handlePermissionError(error: ExtensionError): Promise<void> {
    const message = formatErrorMessage(error);

    const action = await vscode.window.showErrorMessage(
        message,
        'View IAM Docs',
        'Dismiss'
    );

    if (action === 'View IAM Docs' && error.troubleshootingUrl) {
        vscode.env.openExternal(vscode.Uri.parse(error.troubleshootingUrl));
    }
}

/**
 * Handles resource not found errors (QueueDoesNotExist).
 * Suggests checking queue name and region.
 */
async function handleNotFoundError(error: ExtensionError): Promise<void> {
    const message = formatErrorMessage(error);

    await vscode.window.showErrorMessage(message, 'OK');
}

/**
 * Handles network errors (ENOTFOUND, ETIMEDOUT).
 * Displays connectivity troubleshooting message.
 */
async function handleNetworkError(error: ExtensionError): Promise<void> {
    const message = formatErrorMessage(error);

    const action = await vscode.window.showErrorMessage(
        message,
        'Retry',
        'Check Network',
        'Dismiss'
    );

    if (action === 'Check Network') {
        vscode.window.showInformationMessage(
            'Network Troubleshooting:\n\n' +
            '1. Check your internet connection\n' +
            '2. Verify firewall settings allow AWS SQS access\n' +
            '3. Check if you need to configure a proxy\n' +
            '4. Verify AWS service status at https://status.aws.amazon.com/'
        );
    }

    // Return 'Retry' action for caller to handle
    if (action === 'Retry') {
        // Caller can check this by catching and re-attempting
        throw new Error('RETRY_REQUESTED');
    }
}

/**
 * Handles validation errors.
 * Displays specific validation rule that was violated.
 */
async function handleValidationError(error: ExtensionError): Promise<void> {
    const message = formatErrorMessage(error);

    await vscode.window.showErrorMessage(message, 'OK');
}

/**
 * Handles configuration errors (invalid credentials, etc.).
 * Provides guidance on fixing configuration issues.
 */
async function handleConfigurationError(error: ExtensionError): Promise<void> {
    const message = formatErrorMessage(error);

    const action = await vscode.window.showErrorMessage(
        message,
        'View Docs',
        'Configure Credentials',
        'Dismiss'
    );

    if (action === 'View Docs' && error.troubleshootingUrl) {
        vscode.env.openExternal(vscode.Uri.parse(error.troubleshootingUrl));
    } else if (action === 'Configure Credentials') {
        // Trigger credential configuration command
        vscode.commands.executeCommand('sqs-management-tool.selectProfile');
    }
}

/**
 * Handles generic/unknown errors.
 */
async function handleGenericError(error: ExtensionError): Promise<void> {
    const message = formatErrorMessage(error);

    const action = await vscode.window.showErrorMessage(
        message,
        'View Output',
        'Dismiss'
    );

    if (action === 'View Output') {
        vscode.commands.executeCommand('sqs-management-tool.showOutput');
    }
}

/**
 * Checks if an error is a specific AWS error type.
 * 
 * @param error - The error to check
 * @param errorName - The AWS error name to check for
 * @returns True if the error matches the specified type
 */
export function isAwsError(error: any, errorName: string): boolean {
    return error?.name === errorName || error?.code === errorName;
}

/**
 * Checks if an error is a network error.
 * 
 * @param error - The error to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: any): boolean {
    return error?.code === 'ENOTFOUND' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ESOCKETTIMEDOUT' ||
        error?.code === 'ECONNREFUSED';
}

/**
 * Checks if an error is a throttling error.
 * 
 * @param error - The error to check
 * @returns True if the error is a throttling error
 */
export function isThrottlingError(error: any): boolean {
    return error?.name === 'ThrottlingException' ||
        error?.code === 'ThrottlingException' ||
        error?.name === 'TooManyRequestsException';
}

/**
 * Checks if an error should be retried.
 * 
 * @param error - The error to check
 * @returns True if the error is transient and should be retried
 */
export function shouldRetry(error: any): boolean {
    return isThrottlingError(error) ||
        isNetworkError(error) ||
        error?.name === 'ServiceUnavailable' ||
        error?.code === 'ServiceUnavailable';
}
