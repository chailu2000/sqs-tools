import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { QueueStorage } from '../services/queue-storage';
import { SQSService } from '../services/sqs-service';
import { SQSClientFactory } from '../aws/client-factory';
import { QueueConfig } from '../models/queue-storage';
import { log, error as logError } from '../utils/logger';

/**
 * Add a queue by name
 * 
 * This command allows users to add a queue by providing just the queue name.
 * It will:
 * 1. Call GetQueueUrl to resolve the queue URL
 * 2. Call GetQueueAttributes to validate access and fetch metadata
 * 3. Store the queue with addedManually: true
 * 
 * This is useful in restrictive IAM environments where ListQueues is not available.
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param clientFactory - SQS client factory for creating region-specific clients
 * @param refreshCallback - Callback to refresh the tree view after adding
 */
export async function addQueueByNameCommand(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    clientFactory: SQSClientFactory,
    refreshCallback: () => void
): Promise<void> {
    try {
        // Step 1: Get queue name from user
        const queueName = await vscode.window.showInputBox({
            prompt: 'Enter SQS Queue Name',
            placeHolder: 'e.g., my-queue-name',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Queue name cannot be empty';
                }
                // Basic validation for queue name format
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                    return 'Queue name can only contain alphanumeric characters, hyphens, and underscores';
                }
                return null;
            }
        });

        if (!queueName) {
            return; // User cancelled
        }

        // Step 2: Get AWS region from user
        const region = await vscode.window.showInputBox({
            prompt: 'Enter AWS Region',
            placeHolder: 'e.g., us-east-1',
            value: context.globalState.get<string>('awsRegion') || 'us-east-1',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'AWS Region cannot be empty';
                }
                return null;
            }
        });

        if (!region) {
            return; // User cancelled
        }

        // Show progress notification
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Adding queue "${queueName}"...`,
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: 'Resolving queue URL...' });

                // Step 3: Get SQS client for the specified region
                const client = clientFactory.getClient(region);
                const sqsService = new SQSService(client);

                // Step 4: Call GetQueueUrl to resolve the queue URL
                log(`Resolving queue URL for: ${queueName} in region: ${region}`);
                const queueUrl = await sqsService.getQueueUrl(queueName);
                log(`Resolved queue URL: ${queueUrl}`);

                progress.report({ message: 'Validating queue access...' });

                // Step 5: Call GetQueueAttributes to validate access and fetch metadata
                const validationResult = await sqsService.validateQueueAccess(queueUrl);

                if (!validationResult.valid) {
                    throw new Error(validationResult.error || 'Failed to validate queue access');
                }

                progress.report({ message: 'Fetching queue attributes...' });

                // Step 6: Fetch full queue attributes
                const attributes = await sqsService.getQueueAttributes(queueUrl);

                // Extract DLQ information if present
                const dlqInfo = sqsService.extractDlqFromAttributes(attributes);

                progress.report({ message: 'Saving queue configuration...' });

                // Step 7: Create queue configuration
                const queueId = crypto.randomUUID();
                const now = new Date().toISOString();

                const newQueue: QueueConfig = {
                    id: queueId,
                    name: queueName,
                    url: queueUrl,
                    region: region,
                    attributes: attributes,
                    dlqUrl: dlqInfo?.dlqUrl,
                    dlqName: dlqInfo?.dlqName,
                    addedManually: true,
                    createdAt: now,
                    updatedAt: now
                };

                // Step 8: Check for duplicates
                const existingQueues = await queueStorage.getQueues();
                const isDuplicate = existingQueues.some(q => q.url === queueUrl);

                if (isDuplicate) {
                    vscode.window.showWarningMessage(`Queue "${queueName}" is already in your list.`);
                    return;
                }

                // Step 9: Store the queue
                await queueStorage.addQueue(newQueue);

                // Step 10: Store last used region
                await context.globalState.update('awsRegion', region);

                log(`Successfully added queue: ${queueName} (${queueUrl})`);
                vscode.window.showInformationMessage(`Queue "${queueName}" added successfully!`);

                // Refresh the tree view
                refreshCallback();
            } catch (error: any) {
                logError(`Failed to add queue by name: ${queueName}`, error);

                // Check for specific AWS errors
                if (error.name === 'QueueDoesNotExist' || error.message.includes('does not exist')) {
                    vscode.window.showErrorMessage(
                        `Queue "${queueName}" does not exist in region ${region}. Please check the queue name and region.`
                    );
                } else if (error.name === 'AccessDeniedException' || error.message.includes('Access')) {
                    // Show IAM error with link to documentation
                    const action = await vscode.window.showErrorMessage(
                        `Access denied when trying to access queue "${queueName}". You may be missing required IAM permissions.`,
                        'View IAM Permissions Guide'
                    );

                    if (action === 'View IAM Permissions Guide') {
                        vscode.env.openExternal(vscode.Uri.parse('https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-api-permissions-reference.html'));
                    }
                } else {
                    vscode.window.showErrorMessage(`Failed to add queue: ${error.message}`);
                }
            }
        });
    } catch (error: any) {
        logError('Error in addQueueByNameCommand', error);
        vscode.window.showErrorMessage(`Failed to add queue: ${error.message}`);
    }
}
