import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { QueueStorage } from '../services/queue-storage';
import { SQSService } from '../services/sqs-service';
import { SQSClientFactory } from '../aws/client-factory';
import { QueueConfig } from '../models/queue-storage';
import { log, error as logError } from '../utils/logger';

/**
 * Add a queue by URL
 * 
 * This command allows users to add a queue by providing the full queue URL.
 * It will:
 * 1. Validate the URL format
 * 2. Extract the region from the URL
 * 3. Call GetQueueAttributes to validate access and fetch metadata
 * 4. Store the queue with addedManually: true
 * 
 * This is useful in restrictive IAM environments where ListQueues is not available.
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param clientFactory - SQS client factory for creating region-specific clients
 * @param refreshCallback - Callback to refresh the tree view after adding
 */
export async function addQueueByUrlCommand(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    clientFactory: SQSClientFactory,
    refreshCallback: () => void
): Promise<void> {
    try {
        // Step 1: Get queue URL from user
        const queueUrl = await vscode.window.showInputBox({
            prompt: 'Enter SQS Queue URL',
            placeHolder: 'e.g., https://sqs.us-east-1.amazonaws.com/123456789012/my-queue-name',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Queue URL cannot be empty';
                }

                // Validate URL format
                // Expected format: https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}
                const urlPattern = /^https:\/\/sqs\.([a-z0-9-]+)\.amazonaws\.com\/(\d+)\/([a-zA-Z0-9_-]+(?:\.fifo)?)$/;

                if (!urlPattern.test(value)) {
                    return 'Invalid queue URL format. Expected: https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}';
                }

                return null;
            }
        });

        if (!queueUrl) {
            return; // User cancelled
        }

        // Show progress notification
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Adding queue...',
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: 'Parsing queue URL...' });

                // Step 2: Extract region and queue name from URL
                const urlPattern = /^https:\/\/sqs\.([a-z0-9-]+)\.amazonaws\.com\/(\d+)\/([a-zA-Z0-9_-]+(?:\.fifo)?)$/;
                const match = queueUrl.match(urlPattern);

                if (!match) {
                    throw new Error('Invalid queue URL format');
                }

                const region = match[1];
                const queueName = match[3];

                log(`Parsed queue URL - Region: ${region}, Queue Name: ${queueName}`);

                progress.report({ message: 'Validating queue access...' });

                // Step 3: Get SQS client for the extracted region
                const client = clientFactory.getClient(region);
                const sqsService = new SQSService(client);

                // Step 4: Call GetQueueAttributes to validate access and fetch metadata
                const validationResult = await sqsService.validateQueueAccess(queueUrl);

                if (!validationResult.valid) {
                    throw new Error(validationResult.error || 'Failed to validate queue access');
                }

                progress.report({ message: 'Fetching queue attributes...' });

                // Step 5: Fetch full queue attributes
                const attributes = await sqsService.getQueueAttributes(queueUrl);

                // Extract DLQ information if present
                const dlqInfo = sqsService.extractDlqFromAttributes(attributes);

                progress.report({ message: 'Saving queue configuration...' });

                // Step 6: Create queue configuration
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

                // Step 7: Check for duplicates
                const existingQueues = await queueStorage.getQueues();
                const isDuplicate = existingQueues.some(q => q.url === queueUrl);

                if (isDuplicate) {
                    vscode.window.showWarningMessage(`Queue "${queueName}" is already in your list.`);
                    return;
                }

                // Step 8: Store the queue
                await queueStorage.addQueue(newQueue);

                // Step 9: Store last used region
                await context.globalState.update('awsRegion', region);

                log(`Successfully added queue: ${queueName} (${queueUrl})`);
                vscode.window.showInformationMessage(`Queue "${queueName}" added successfully!`);

                // Refresh the tree view
                refreshCallback();
            } catch (error: any) {
                logError(`Failed to add queue by URL: ${queueUrl}`, error);

                // Check for specific AWS errors
                if (error.name === 'QueueDoesNotExist' || error.message.includes('does not exist')) {
                    vscode.window.showErrorMessage(
                        `Queue does not exist. Please check the queue URL.`
                    );
                } else if (error.name === 'AccessDeniedException' || error.message.includes('Access')) {
                    // Show IAM error with link to documentation
                    const action = await vscode.window.showErrorMessage(
                        `Access denied when trying to access the queue. You may be missing required IAM permissions.`,
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
        logError('Error in addQueueByUrlCommand', error);
        vscode.window.showErrorMessage(`Failed to add queue: ${error.message}`);
    }
}
