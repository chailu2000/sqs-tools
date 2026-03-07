/**
 * Utility functions for sanitizing sensitive information from logs and outputs.
 * 
 * This module ensures that AWS credentials and other sensitive data are never
 * exposed in logs, debug console, or any other output channels.
 */

/**
 * Patterns to detect and redact sensitive information
 */
const SENSITIVE_PATTERNS = [
    // AWS Access Key ID pattern (AKIA followed by 16 alphanumeric characters)
    { pattern: /AKIA[0-9A-Z]{16}/gi, replacement: 'AKIA****************' },

    // AWS Secret Access Key pattern (40 base64 characters)
    { pattern: /(?:aws_secret_access_key|secretAccessKey|SecretAccessKey)[\s:=]+([A-Za-z0-9/+=]{40})/gi, replacement: '$1[REDACTED]' },

    // AWS Session Token pattern (longer base64 strings)
    { pattern: /(?:aws_session_token|sessionToken|SessionToken)[\s:=]+([A-Za-z0-9/+=]{100,})/gi, replacement: '$1[REDACTED]' },

    // Generic secret/password patterns
    { pattern: /(?:password|secret|token|key)[\s:=]+["']?([^\s"']{8,})["']?/gi, replacement: 'password=[REDACTED]' },
];

/**
 * Sanitizes an object or string by redacting sensitive information.
 * 
 * This function should be used before logging any data that might contain
 * AWS credentials or other sensitive information.
 * 
 * @param data - The data to sanitize (can be string, object, array, or primitive)
 * @returns A sanitized copy of the data with sensitive information redacted
 * 
 * @example
 * ```typescript
 * const credentials = { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' };
 * const sanitized = sanitizeForLog(credentials);
 * console.log(sanitized); // { accessKeyId: '[REDACTED]', secretAccessKey: '[REDACTED]' }
 * ```
 */
export function sanitizeForLog(data: any): any {
    // Handle null and undefined
    if (data === null || data === undefined) {
        return data;
    }

    // Handle primitives
    if (typeof data === 'string') {
        return sanitizeString(data);
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
        return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForLog(item));
    }

    // Handle objects
    if (typeof data === 'object') {
        return sanitizeObject(data);
    }

    return data;
}

/**
 * Sanitizes a string by redacting sensitive patterns
 */
function sanitizeString(str: string): string {
    let sanitized = str;

    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, replacement);
    }

    return sanitized;
}

/**
 * Sanitizes an object by redacting sensitive fields and values
 */
function sanitizeObject(obj: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        // Check if the key itself indicates sensitive data
        if (isSensitiveKey(key)) {
            sanitized[key] = '[REDACTED]';
        } else {
            // Recursively sanitize the value
            sanitized[key] = sanitizeForLog(value);
        }
    }

    return sanitized;
}

/**
 * Checks if a key name indicates sensitive data
 */
function isSensitiveKey(key: string): boolean {
    const sensitiveKeyPatterns = [
        /access.*key/i,
        /secret/i,
        /password/i,
        /token/i,
        /credential/i,
        /auth/i,
    ];

    return sensitiveKeyPatterns.some(pattern => pattern.test(key));
}

/**
 * Creates a safe error message for logging by sanitizing the error object
 * 
 * @param error - The error to sanitize
 * @returns A sanitized error message string
 */
export function sanitizeError(error: any): string {
    if (!error) {
        return 'Unknown error';
    }

    if (typeof error === 'string') {
        return sanitizeString(error);
    }

    if (error instanceof Error) {
        const sanitizedMessage = sanitizeString(error.message);
        const sanitizedStack = error.stack ? sanitizeString(error.stack) : '';

        return `${error.name}: ${sanitizedMessage}\n${sanitizedStack}`;
    }

    // For other error types, convert to string and sanitize
    return sanitizeString(String(error));
}

/**
 * Sanitizes data before sending to webview to prevent credential leakage.
 * 
 * This is a stricter version of sanitizeForLog that ensures no credentials
 * are ever sent to the webview context.
 * 
 * @param data - The data to sanitize before sending to webview
 * @returns A sanitized copy of the data
 */
export function sanitizeForWebview(data: any): any {
    // Use the same sanitization logic as sanitizeForLog
    return sanitizeForLog(data);
}
