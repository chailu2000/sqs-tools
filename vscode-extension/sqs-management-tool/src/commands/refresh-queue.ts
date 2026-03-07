import * as vscode from 'vscode';
import { SQSService } from '../services/sqs-service';
import { QueueStorage } from '../services/queue-storage';
import { log, error as logError } from '../utils/logger';

/**
 * Command handler for refreshing queue attributes
 * 
 * This command fetches fresh queue attributes from AWS SQS and updates
 * the stored queue configuration.
 */
export async function refreshQueueCommand(
    queueId: string,
    queueStorage: QueueStorage,
    sqsService: SQSService
): Promise<void> {
    try {
        // Refresh queue attributes from AWS
        const updatedQueue = await queueStorage.refreshAttributes(queueId, sqsService);

        // Show success message
        const message = `Queue "${updatedQueue.name}" attributes refreshed successfully.`;
        vscode.window.showInformationMessage(message);
        log(message);
    } catch (error: any) {
        logError('Error refreshing queue attributes:', error);

        // Show error message
        const errorMessage = error.message || 'Failed to refresh queue attributes';
        vscode.window.showErrorMessage(`Failed to refresh queue: ${errorMessage}`);
    }
}
