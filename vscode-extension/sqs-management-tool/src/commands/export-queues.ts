import * as vscode from 'vscode';
import { QueueStorage } from '../services/queue-storage';
import { log, error as logError } from '../utils/logger';

/**
 * Command handler for exporting queue configurations to a JSON file
 * 
 * This command exports all queue configurations to a JSON file using
 * VS Code's file picker dialog.
 */
export async function exportQueuesCommand(
    queueStorage: QueueStorage
): Promise<void> {
    try {
        // Get all queues from storage
        const queues = await queueStorage.exportQueues();

        if (queues.length === 0) {
            vscode.window.showInformationMessage('No queues to export.');
            return;
        }

        // Show save dialog
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('sqs-queues.json'),
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            },
            saveLabel: 'Export Queues'
        });

        if (!uri) {
            // User cancelled the dialog
            return;
        }

        // Convert queues to JSON with pretty formatting
        const jsonContent = JSON.stringify(queues, null, 2);

        // Write to file
        await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf8'));

        // Show success message
        const message = `Successfully exported ${queues.length} queue(s) to ${uri.fsPath}`;
        vscode.window.showInformationMessage(message);
        log(message);
    } catch (error: any) {
        logError('Error exporting queues:', error);

        // Show error message
        const errorMessage = error.message || 'Failed to export queues';
        vscode.window.showErrorMessage(`Failed to export queues: ${errorMessage}`);
    }
}
