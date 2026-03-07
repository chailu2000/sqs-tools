/**
 * Credential Error Handler
 * 
 * Provides user-friendly error messages and troubleshooting steps for credential-related errors.
 * Validates: Requirements 3.12, 10.3
 */

import * as vscode from 'vscode';

/**
 * Error types for credential-related issues
 */
export enum CredentialErrorType {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    NO_CREDENTIALS_FOUND = 'NO_CREDENTIALS_FOUND',
    PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Credential error information
 */
export interface CredentialError {
    type: CredentialErrorType;
    message: string;
    troubleshootingSteps: string[];
    documentationUrl?: string;
}

/**
 * Parse AWS SDK error and classify it
 */
export function classifyCredentialError(error: any): CredentialError {
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.name;

    // Invalid credentials (STS GetCallerIdentity failed)
    if (errorCode === 'InvalidClientTokenId' || errorCode === 'SignatureDoesNotMatch' || errorCode === 'UnrecognizedClientException') {
        return {
            type: CredentialErrorType.INVALID_CREDENTIALS,
            message: 'Invalid AWS credentials. The Access Key ID or Secret Access Key is incorrect.',
            troubleshootingSteps: [
                'Verify your AWS Access Key ID and Secret Access Key are correct',
                'Check if the credentials have been rotated or expired',
                'Ensure there are no extra spaces or characters in your credentials',
                'Try generating new credentials in the AWS IAM console'
            ],
            documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html'
        };
    }

    // No credentials found
    if (errorMessage.includes('No AWS credentials found') || errorMessage.includes('Could not load credentials')) {
        return {
            type: CredentialErrorType.NO_CREDENTIALS_FOUND,
            message: 'No AWS credentials found. Please configure your credentials.',
            troubleshootingSteps: [
                'Option 1: Set environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
                'Option 2: Configure AWS CLI with "aws configure" command',
                'Option 3: Create ~/.aws/credentials file with your profile',
                'Option 4: Use the extension to enter credentials manually'
            ],
            documentationUrl: 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html'
        };
    }

    // Profile not found
    if (errorMessage.includes('Profile') && (errorMessage.includes('not found') || errorMessage.includes('does not exist'))) {
        return {
            type: CredentialErrorType.PROFILE_NOT_FOUND,
            message: 'AWS profile not found in ~/.aws/credentials',
            troubleshootingSteps: [
                'Check if the profile name is spelled correctly',
                'Verify the profile exists in ~/.aws/credentials file',
                'Run "aws configure --profile <profile-name>" to create the profile',
                'Select a different profile or enter credentials manually'
            ],
            documentationUrl: 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html'
        };
    }

    // Permission denied (AccessDenied)
    if (errorCode === 'AccessDenied' || errorCode === 'AccessDeniedException') {
        return {
            type: CredentialErrorType.PERMISSION_DENIED,
            message: 'Access denied. Your AWS credentials do not have sufficient permissions.',
            troubleshootingSteps: [
                'Verify your IAM user/role has the required permissions',
                'Check if there are any IAM policies restricting access',
                'Contact your AWS administrator to grant necessary permissions',
                'Review the AWS CloudTrail logs for detailed error information'
            ],
            documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/troubleshoot_access-denied.html'
        };
    }

    // Network errors
    if (errorCode === 'NetworkingError' || errorCode === 'ENOTFOUND' || errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED') {
        return {
            type: CredentialErrorType.NETWORK_ERROR,
            message: 'Network error. Unable to connect to AWS services.',
            troubleshootingSteps: [
                'Check your internet connection',
                'Verify you can access AWS services from your network',
                'Check if there is a firewall or proxy blocking AWS API calls',
                'Try again in a few moments if AWS services are experiencing issues'
            ],
            documentationUrl: 'https://status.aws.amazon.com/'
        };
    }

    // Unknown error
    return {
        type: CredentialErrorType.UNKNOWN_ERROR,
        message: `Credential error: ${errorMessage}`,
        troubleshootingSteps: [
            'Check the error message for specific details',
            'Review your AWS credentials configuration',
            'Try re-entering your credentials',
            'Check the VS Code Output panel for more details'
        ]
    };
}

/**
 * Display credential error with troubleshooting steps
 */
export async function displayCredentialError(error: any): Promise<void> {
    const credentialError = classifyCredentialError(error);

    // Format troubleshooting steps
    const troubleshootingMessage = credentialError.troubleshootingSteps
        .map((step, index) => `${index + 1}. ${step}`)
        .join('\n');

    // Show error message with action buttons
    const actions: string[] = ['View Troubleshooting'];
    if (credentialError.documentationUrl) {
        actions.push('Open Documentation');
    }
    actions.push('Dismiss');

    const selection = await vscode.window.showErrorMessage(
        credentialError.message,
        ...actions
    );

    if (selection === 'View Troubleshooting') {
        // Show troubleshooting steps in an information message
        vscode.window.showInformationMessage(
            `Troubleshooting Steps:\n\n${troubleshootingMessage}`,
            { modal: true }
        );
    } else if (selection === 'Open Documentation' && credentialError.documentationUrl) {
        // Open documentation URL in browser
        vscode.env.openExternal(vscode.Uri.parse(credentialError.documentationUrl));
    }
}

/**
 * Log credential error to output channel (without exposing credentials)
 */
export function logCredentialError(error: any, outputChannel: vscode.OutputChannel): void {
    const credentialError = classifyCredentialError(error);

    outputChannel.appendLine(`[${new Date().toISOString()}] Credential Error: ${credentialError.type}`);
    outputChannel.appendLine(`Message: ${credentialError.message}`);
    outputChannel.appendLine(`Troubleshooting Steps:`);
    credentialError.troubleshootingSteps.forEach((step, index) => {
        outputChannel.appendLine(`  ${index + 1}. ${step}`);
    });
    if (credentialError.documentationUrl) {
        outputChannel.appendLine(`Documentation: ${credentialError.documentationUrl}`);
    }
    outputChannel.appendLine('');
}
