/**
 * Extension Helper
 * 
 * Provides direct access to extension internals for testing.
 * This bypasses UI dialogs and directly manipulates extension state.
 */

import * as vscode from 'vscode';
import { QueueConfig } from '../../../src/models/queue-storage';

/**
 * Helper to interact with extension internals during tests
 */
export class ExtensionHelper {
    constructor(private context: vscode.ExtensionContext) { }

    /**
     * Configure AWS credentials for testing
     */
    async configureTestCredentials(): Promise<void> {
        // Store test credentials in SecretStorage
        await this.context.secrets.store('aws-credentials', JSON.stringify({
            accessKeyId: 'test',
            secretAccessKey: 'test'
        }));
    }

    /**
     * Add a queue directly to storage (bypasses UI dialogs)
     */
    async addQueueToStorage(queueConfig: QueueConfig): Promise<void> {
        // Get current queues from globalState (use 'queues' key to match QueueStorage service)
        const queues: QueueConfig[] = this.context.globalState.get('queues', []);

        // Add new queue
        queues.push(queueConfig);

        // Save back to storage
        await this.context.globalState.update('queues', queues);
    }

    /**
     * Remove a queue directly from storage
     */
    async removeQueueFromStorage(queueId: string): Promise<void> {
        const queues: QueueConfig[] = this.context.globalState.get('queues', []);
        const filtered = queues.filter(q => q.id !== queueId);
        await this.context.globalState.update('queues', filtered);
    }

    /**
     * Clear all queues from storage
     */
    async clearAllQueues(): Promise<void> {
        await this.context.globalState.update('queues', []);
    }

    /**
     * Get all queues from storage
     */
    async getQueuesFromStorage(): Promise<QueueConfig[]> {
        return this.context.globalState.get('queues', []);
    }

    /**
     * Dismiss any open dialogs/prompts
     */
    async dismissDialogs(): Promise<void> {
        // Send escape key to dismiss dialogs
        await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
    }
}

/**
 * Get extension helper for the active extension
 */
export async function getExtensionHelper(): Promise<ExtensionHelper> {
    // Find the extension
    const possibleIds = [
        'undefined_publisher.sqs-management-tool',
        'sqs-management-tool',
        'publisher.sqs-management-tool'
    ];

    let extension: vscode.Extension<any> | undefined;

    for (const id of possibleIds) {
        extension = vscode.extensions.getExtension(id);
        if (extension) {
            break;
        }
    }

    if (!extension) {
        throw new Error('Extension not found');
    }

    // Activate extension and get test API
    const testApi = extension.isActive ? extension.exports : await extension.activate();

    // Use the actual extension context from the test API
    if (!testApi || !testApi.context) {
        throw new Error('Extension context not available in test API');
    }

    return new ExtensionHelper(testApi.context);
}
