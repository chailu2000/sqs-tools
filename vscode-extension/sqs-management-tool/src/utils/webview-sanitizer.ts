/**
 * Webview Message Sanitizer
 * 
 * Ensures that messages sent to the webview never contain sensitive information
 * like AWS credentials. This provides an additional layer of security beyond
 * the general sanitization.
 */

import { sanitizeForLog } from './sanitizer';

/**
 * Sanitizes data before sending it to the webview via postMessage.
 * 
 * This function ensures that no AWS credentials or other sensitive information
 * is accidentally sent to the webview, which runs in a sandboxed environment
 * but should never have access to credentials.
 * 
 * @param data - The data to be sent to the webview
 * @returns Sanitized data safe for webview consumption
 * 
 * @example
 * ```typescript
 * const safeData = sanitizeForWebview({ messages, queueUrl });
 * panel.webview.postMessage(safeData);
 * ```
 */
export function sanitizeForWebview(data: any): any {
    // Use the general sanitizer which already handles credentials
    return sanitizeForLog(data);
}

/**
 * Type guard to check if an object contains credential-like fields
 */
function hasCredentialFields(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    const credentialKeys = [
        'accessKeyId',
        'secretAccessKey',
        'sessionToken',
        'credentials',
        'awsCredentials',
    ];

    return credentialKeys.some(key => key in obj);
}

/**
 * Validates that a message object is safe to send to the webview.
 * Throws an error if credentials are detected.
 * 
 * This is a defensive check that should never fail in production,
 * but provides an extra safety net during development.
 * 
 * @param message - The message to validate
 * @throws Error if credentials are detected in the message
 */
export function validateWebviewMessage(message: any): void {
    if (hasCredentialFields(message)) {
        throw new Error(
            'SECURITY ERROR: Attempted to send credentials to webview. ' +
            'This is a bug and must be fixed immediately.'
        );
    }

    // Recursively check nested objects
    if (typeof message === 'object' && message !== null) {
        for (const value of Object.values(message)) {
            if (typeof value === 'object' && value !== null) {
                validateWebviewMessage(value);
            }
        }
    }
}
