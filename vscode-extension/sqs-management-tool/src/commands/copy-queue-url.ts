import * as vscode from 'vscode';
import { QueueConfig } from '../models/queue-storage';
import { log } from '../utils/logger';

/**
 * Command handler for copying queue URL to clipboard
 * 
 * This command copies the queue URL to the system clipboard.
 */
export async function copyQueueUrlCommand(queue: QueueConfig): Promise<void> {
    try {
        await vscode.env.clipboard.writeText(queue.url);
        vscode.window.showInformationMessage(`Queue URL copied to clipboard: ${queue.name}`);
        log(`Copied queue URL to clipboard: ${queue.url}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to copy queue URL: ${error.message}`);
    }
}
