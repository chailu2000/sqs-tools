import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { QueueStorage } from '../services/queue-storage';
import { SQSService } from '../services/sqs-service';
import { SQSClientFactory } from '../aws/client-factory';
import { QueueConfig } from '../models/queue-storage';
import { log, error as logError } from '../utils/logger';

/**
 * Auto-discover queues on extension activation
 * 
 * This function attempts to discover queues using ListQueues.
 * If ListQueues is denied (AccessDeniedException), it shows a message
 * about manual queue entry instead of failing.
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param clientFactory - SQS client factory for creating region-specific clients
 * @param refreshCallback - Callback to refresh the tree view after importing
 */
export async function autoDiscoverQueuesOnActivation(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    clientFactory: SQSClientFactory,
    refreshCallback: () => void
): Promise<void> {
    try {
        // Check if auto-discovery has been run before
        const hasRunAutoDiscovery = context.globalState.get<boolean>('hasRunAutoDiscovery', false);

        // Only run auto-discovery once on first activation
        if (hasRunAutoDiscovery) {
            log('Auto-discovery already run, skipping...');
            return;
        }

        // Get the default region
        const region = context.globalState.get<string>('awsRegion') || 'us-east-1';

        log(`Attempting auto-discovery in region: ${region}`);

        // Get SQS client for the region
        const client = clientFactory.getClient(region);
        const sqsService = new SQSService(client);

        // Try to list queues
        const result = await sqsService.tryListQueues();

        if (!result.hasPermission) {
            // ListQueues permission denied - show manual entry message
            log('ListQueues permission denied, showing manual entry message');

            const action = await vscode.window.showInformationMessage(
                'Add queues manually - ListQueues permission not available. You can add queues by name or URL using the command palette.',
                'Add Queue by Name',
                'Add Queue by URL',
                'Dismiss'
            );

            if (action === 'Add Queue by Name') {
                vscode.commands.executeCommand('sqs-management-tool.addQueueByName');
            } else if (action === 'Add Queue by URL') {
                vscode.commands.executeCommand('sqs-management-tool.addQueueByUrl');
            }

            // Mark auto-discovery as run
            await context.globalState.update('hasRunAutoDiscovery', true);
            return;
        }

        // Check if queues were discovered
        if (result.queues.length === 0) {
            log('No queues discovered');
            vscode.window.showInformationMessage('No SQS queues found in your AWS account.');
            await context.globalState.update('hasRunAutoDiscovery', true);
            return;
        }

        log(`Discovered ${result.queues.length} queues`);

        // Show import prompt
        await showQueueImportPicker(
            context,
            queueStorage,
            sqsService,
            result.queues,
            region,
            refreshCallback
        );

        // Mark auto-discovery as run
        await context.globalState.update('hasRunAutoDiscovery', true);
    } catch (error: any) {
        logError('Error during auto-discovery', error);
        // Don't show error to user - auto-discovery is optional
    }
}

/**
 * Show queue import picker
 * 
 * Displays a QuickPick with options to import all queues, select specific queues, or skip.
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param sqsService - SQS service instance
 * @param queueUrls - Array of discovered queue URLs
 * @param region - AWS region
 * @param refreshCallback - Callback to refresh the tree view after importing
 */
async function showQueueImportPicker(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    sqsService: SQSService,
    queueUrls: string[],
    region: string,
    refreshCallback: () => void
): Promise<void> {
    const action = await vscode.window.showQuickPick(
        [
            {
                label: '$(cloud-download) Import All',
                description: `Import all ${queueUrls.length} discovered queues`,
                action: 'importAll'
            },
            {
                label: '$(list-selection) Select Queues',
                description: 'Choose which queues to import',
                action: 'selectQueues'
            },
            {
                label: '$(x) Skip',
                description: 'Skip importing queues',
                action: 'skip'
            }
        ],
        {
            placeHolder: `Found ${queueUrls.length} queues. What would you like to do?`,
            title: 'Queue Discovery'
        }
    );

    if (!action || action.action === 'skip') {
        log('User skipped queue import');
        return;
    }

    if (action.action === 'importAll') {
        await importQueues(context, queueStorage, sqsService, queueUrls, region, refreshCallback);
    } else if (action.action === 'selectQueues') {
        await showQueueSelectionPicker(context, queueStorage, sqsService, queueUrls, region, refreshCallback);
    }
}

/**
 * Show queue selection picker
 * 
 * Displays a multi-select QuickPick for selecting specific queues to import.
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param sqsService - SQS service instance
 * @param queueUrls - Array of discovered queue URLs
 * @param region - AWS region
 * @param refreshCallback - Callback to refresh the tree view after importing
 */
async function showQueueSelectionPicker(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    sqsService: SQSService,
    queueUrls: string[],
    region: string,
    refreshCallback: () => void
): Promise<void> {
    // Extract queue names from URLs for display
    const queueItems = queueUrls.map(url => ({
        label: sqsService.extractQueueName(url),
        description: url,
        picked: false,
        url: url
    }));

    const selectedItems = await vscode.window.showQuickPick(queueItems, {
        placeHolder: 'Select queues to import',
        title: 'Select Queues',
        canPickMany: true
    });

    if (!selectedItems || selectedItems.length === 0) {
        log('No queues selected for import');
        return;
    }

    const selectedUrls = selectedItems.map(item => item.url);
    await importQueues(context, queueStorage, sqsService, selectedUrls, region, refreshCallback);
}

/**
 * Import queues
 * 
 * Fetches metadata for each queue and stores them in queue storage.
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param sqsService - SQS service instance
 * @param queueUrls - Array of queue URLs to import
 * @param region - AWS region
 * @param refreshCallback - Callback to refresh the tree view after importing
 */
async function importQueues(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    sqsService: SQSService,
    queueUrls: string[],
    region: string,
    refreshCallback: () => void
): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Importing queues...',
        cancellable: false
    }, async (progress) => {
        let imported = 0;
        let skipped = 0;
        let failed = 0;

        for (let i = 0; i < queueUrls.length; i++) {
            const queueUrl = queueUrls[i];
            const queueName = sqsService.extractQueueName(queueUrl);

            progress.report({
                message: `Importing ${queueName} (${i + 1}/${queueUrls.length})...`,
                increment: (100 / queueUrls.length)
            });

            try {
                // Check if queue already exists
                const existingQueues = await queueStorage.getQueues();
                if (existingQueues.some(q => q.url === queueUrl)) {
                    log(`Queue ${queueName} already exists, skipping`);
                    skipped++;
                    continue;
                }

                // Fetch queue attributes
                const attributes = await sqsService.getQueueAttributes(queueUrl);

                // Extract DLQ information
                const dlqInfo = sqsService.extractDlqFromAttributes(attributes);

                // Create queue configuration
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
                    addedManually: false, // Auto-discovered
                    createdAt: now,
                    updatedAt: now
                };

                // Store the queue
                await queueStorage.addQueue(newQueue);
                log(`Successfully imported queue: ${queueName}`);
                imported++;
            } catch (error: any) {
                logError(`Failed to import queue: ${queueName}`, error);
                failed++;
            }
        }

        // Show summary
        const summary = [];
        if (imported > 0) summary.push(`${imported} imported`);
        if (skipped > 0) summary.push(`${skipped} skipped`);
        if (failed > 0) summary.push(`${failed} failed`);

        vscode.window.showInformationMessage(
            `Queue import complete: ${summary.join(', ')}`
        );

        // Refresh the tree view
        refreshCallback();
    });
}

/**
 * Manual discovery trigger command
 * 
 * Allows users to manually trigger queue discovery.
 * Shows helpful message if ListQueues fails.
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param clientFactory - SQS client factory for creating region-specific clients
 * @param refreshCallback - Callback to refresh the tree view after importing
 */
export async function tryAutoDiscoverCommand(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    clientFactory: SQSClientFactory,
    refreshCallback: () => void
): Promise<void> {
    try {
        // Get the region
        const region = context.globalState.get<string>('awsRegion') || 'us-east-1';

        log(`Manual discovery triggered in region: ${region}`);

        // Get SQS client for the region
        const client = clientFactory.getClient(region);
        const sqsService = new SQSService(client);

        // Try to list queues
        const result = await sqsService.tryListQueues();

        if (!result.hasPermission) {
            // ListQueues permission denied - show helpful message
            log('ListQueues permission denied');

            const action = await vscode.window.showWarningMessage(
                'Queue discovery requires the sqs:ListQueues permission. You can add queues manually instead.',
                'Add Queue by Name',
                'Add Queue by URL',
                'View IAM Permissions Guide'
            );

            if (action === 'Add Queue by Name') {
                vscode.commands.executeCommand('sqs-management-tool.addQueueByName');
            } else if (action === 'Add Queue by URL') {
                vscode.commands.executeCommand('sqs-management-tool.addQueueByUrl');
            } else if (action === 'View IAM Permissions Guide') {
                vscode.env.openExternal(vscode.Uri.parse('https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-api-permissions-reference.html'));
            }

            return;
        }

        // Check if queues were discovered
        if (result.queues.length === 0) {
            log('No queues discovered');
            vscode.window.showInformationMessage('No SQS queues found in your AWS account.');
            return;
        }

        log(`Discovered ${result.queues.length} queues`);

        // Show import prompt
        await showQueueImportPicker(
            context,
            queueStorage,
            sqsService,
            result.queues,
            region,
            refreshCallback
        );
    } catch (error: any) {
        logError('Error during manual discovery', error);
        vscode.window.showErrorMessage(`Failed to discover queues: ${error.message}`);
    }
}
