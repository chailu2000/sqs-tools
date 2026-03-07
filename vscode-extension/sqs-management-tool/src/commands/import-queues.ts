import * as vscode from 'vscode';
import { QueueStorage } from '../services/queue-storage';
import { QueueConfig } from '../models/queue-storage';
import { log, error as logError } from '../utils/logger';

/**
 * Command handler for importing queue configurations from a JSON file
 * 
 * This command imports queue configurations from a JSON file using
 * VS Code's file picker dialog. It validates the JSON schema and
 * merges imported queues with existing queues.
 */
export async function importQueuesCommand(
    queueStorage: QueueStorage
): Promise<void> {
    try {
        // Show open dialog
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            },
            openLabel: 'Import Queues'
        });

        if (!uris || uris.length === 0) {
            // User cancelled the dialog
            return;
        }

        const uri = uris[0];

        // Read file content
        const fileContent = await vscode.workspace.fs.readFile(uri);
        const jsonString = Buffer.from(fileContent).toString('utf8');

        // Parse JSON
        let queues: any[];
        try {
            queues = JSON.parse(jsonString);
        } catch (parseError: any) {
            throw new Error(`Invalid JSON format: ${parseError.message}`);
        }

        // Validate that it's an array
        if (!Array.isArray(queues)) {
            throw new Error('Invalid format: Expected an array of queue configurations');
        }

        // Validate each queue configuration
        const validatedQueues: QueueConfig[] = [];
        for (let i = 0; i < queues.length; i++) {
            const queue = queues[i];

            // Validate required fields
            if (!queue.id || typeof queue.id !== 'string') {
                throw new Error(`Queue at index ${i}: Missing or invalid 'id' field`);
            }
            if (!queue.name || typeof queue.name !== 'string') {
                throw new Error(`Queue at index ${i}: Missing or invalid 'name' field`);
            }
            if (!queue.url || typeof queue.url !== 'string') {
                throw new Error(`Queue at index ${i}: Missing or invalid 'url' field`);
            }
            if (!queue.region || typeof queue.region !== 'string') {
                throw new Error(`Queue at index ${i}: Missing or invalid 'region' field`);
            }

            // Validate addedManually field
            if (typeof queue.addedManually !== 'boolean') {
                throw new Error(`Queue at index ${i}: Missing or invalid 'addedManually' field`);
            }

            // Validate timestamps
            if (!queue.createdAt || typeof queue.createdAt !== 'string') {
                throw new Error(`Queue at index ${i}: Missing or invalid 'createdAt' field`);
            }
            if (!queue.updatedAt || typeof queue.updatedAt !== 'string') {
                throw new Error(`Queue at index ${i}: Missing or invalid 'updatedAt' field`);
            }

            validatedQueues.push(queue as QueueConfig);
        }

        if (validatedQueues.length === 0) {
            vscode.window.showInformationMessage('No valid queues found in the file.');
            return;
        }

        // Import queues (this will merge with existing queues, avoiding duplicates)
        await queueStorage.importQueues(validatedQueues);

        // Show success message
        const message = `Successfully imported ${validatedQueues.length} queue(s) from ${uri.fsPath}`;
        vscode.window.showInformationMessage(message);
        log(message);
    } catch (error: any) {
        logError('Error importing queues:', error);

        // Show error message
        const errorMessage = error.message || 'Failed to import queues';
        vscode.window.showErrorMessage(`Failed to import queues: ${errorMessage}`);
    }
}
