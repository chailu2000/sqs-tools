/**
 * Extension Finder Utility
 * 
 * Centralized logic for finding and activating the extension during tests.
 * This avoids code duplication across multiple test fixture files.
 */

import * as vscode from 'vscode';

/**
 * Find the extension by trying multiple possible IDs
 */
export function findExtension(): vscode.Extension<any> | undefined {
    // Try different extension ID formats
    const possibleIds = [
        'chailu2000.sqs-management-tool',
        'undefined_publisher.sqs-management-tool',
        'sqs-management-tool',
        'publisher.sqs-management-tool'
    ];

    let extension: vscode.Extension<any> | undefined;

    // Try exact ID matches first
    for (const id of possibleIds) {
        extension = vscode.extensions.getExtension(id);
        if (extension) {
            console.log(`Found extension with ID: ${id}`);
            return extension;
        }
    }

    // If not found by exact ID, try to find by partial match
    console.log('Extension not found by exact ID, trying partial match...');
    extension = vscode.extensions.all.find(ext =>
        ext.id.includes('sqs-management-tool')
    );

    if (extension) {
        console.log(`Found extension by partial match: ${extension.id}`);
        return extension;
    }

    // Not found - log available extensions for debugging
    const allExtensionIds = vscode.extensions.all
        .filter(ext => ext.id.includes('sqs'))
        .map(ext => ext.id);
    console.log('Available SQS extensions:', allExtensionIds);

    return undefined;
}

/**
 * Get the extension, throwing an error if not found
 */
export function getExtension(): vscode.Extension<any> {
    const extension = findExtension();

    if (!extension) {
        const allExtensionIds = vscode.extensions.all.map(ext => ext.id);
        console.log('All available extensions:', allExtensionIds);
        throw new Error('Extension not found. See console for available extensions.');
    }

    return extension;
}

/**
 * Get the extension and ensure it's activated
 */
export async function getActivatedExtension(): Promise<vscode.Extension<any>> {
    const extension = getExtension();

    if (!extension.isActive) {
        await extension.activate();
    }

    return extension;
}

/**
 * Get the extension context from the activated extension
 */
export async function getExtensionContext(): Promise<vscode.ExtensionContext> {
    const extension = await getActivatedExtension();

    const api = extension.exports;
    if (!api || !api.context) {
        throw new Error('Extension context not available in API');
    }

    return api.context;
}
