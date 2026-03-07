/**
 * Standalone VS Code Extension for AWS SQS Management
 * 
 * This extension communicates directly with AWS SQS without requiring a backend server.
 * It uses the AWS SDK for all operations and stores configuration in VS Code's storage.
 */

import * as vscode from 'vscode';
import { SQSClientFactory } from './aws/client-factory';
import { SQSService } from './services/sqs-service';
import { CredentialProvider } from './services/credential-provider';
import { QueueStorage } from './services/queue-storage';
import { QueueConfig } from './models/queue-storage';
import { sanitizeForWebview } from './utils/webview-sanitizer';
import { log } from './utils/logger';

let extensionContext: vscode.ExtensionContext;
let clientFactory: SQSClientFactory;
let credentialProvider: CredentialProvider;
let queueStorage: QueueStorage;

class QueueItem extends vscode.TreeItem {
    constructor(
        public readonly queue: QueueConfig,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(queue.name, collapsibleState);
        this.tooltip = `URL: ${queue.url}\\nRegion: ${queue.region}`;
        this.description = queue.region;
        this.contextValue = 'queueItem';
        this.command = {
            command: 'sqs-management-tool.selectQueue',
            title: 'Select Queue',
            arguments: [queue]
        };
    }
}

class QueueTreeDataProvider implements vscode.TreeDataProvider<QueueItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<QueueItem | undefined | void> = new vscode.EventEmitter<QueueItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<QueueItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: QueueItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: QueueItem): Promise<QueueItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            try {
                const queues = await queueStorage.getQueues();
                if (queues.length === 0) {
                    vscode.window.showInformationMessage('No SQS queues configured. Add one using the + button.');
                }
                return queues.map(queue => new QueueItem(queue, vscode.TreeItemCollapsibleState.None));
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to load SQS queues: ${error.message}`);
                return [];
            }
        }
    }
}

export async function activate(context: vscode.ExtensionContext) {
    extensionContext = context;
    log('SQS Management Tool (Standalone) extension is now active!');

    // Initialize services
    credentialProvider = new CredentialProvider(context.secrets);
    queueStorage = new QueueStorage(context);

    // Initialize client factory with credentials
    try {
        const credentials = await credentialProvider.getCredentials();
        clientFactory = new SQSClientFactory({ credentials });
    } catch (error) {
        // No credentials yet - will prompt user
        clientFactory = new SQSClientFactory();
    }

    // Initialize tree view
    const queueTreeDataProvider = new QueueTreeDataProvider();
    vscode.window.registerTreeDataProvider('sqsManagementQueues', queueTreeDataProvider);

    // Create status bar item for AWS profile
    const awsProfileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    awsProfileStatusBarItem.command = 'sqs-management-tool.selectAwsProfile';
    awsProfileStatusBarItem.tooltip = 'Select AWS Profile';
    awsProfileStatusBarItem.show();
    context.subscriptions.push(awsProfileStatusBarItem);

    // Function to update status bar
    async function updateAwsProfileStatusBarItem() {
        try {
            const credentials = await credentialProvider.getCredentials();
            // Try to get the profile name from storage
            const profileName = context.globalState.get<string>('aws-profile-name');
            if (profileName) {
                awsProfileStatusBarItem.text = `$(cloud) AWS: ${profileName}`;
            } else {
                awsProfileStatusBarItem.text = `$(cloud) AWS: Configured`;
            }
        } catch (error) {
            awsProfileStatusBarItem.text = `$(warning) AWS: Not Configured`;
            awsProfileStatusBarItem.tooltip = 'Click to configure AWS credentials';
        }
    }

    // Initial update
    await updateAwsProfileStatusBarItem();

    // Register commands (will be added in next chunk)
    registerCommands(context, queueTreeDataProvider, awsProfileStatusBarItem, updateAwsProfileStatusBarItem);

    // Try auto-discovery on activation (skip in test mode)
    const isTestMode = process.env.VSCODE_TEST_MODE === 'true';
    if (!isTestMode) {
        await tryAutoDiscovery(queueTreeDataProvider);
    }

    // Return test API for E2E tests
    return {
        context,
        queueStorage,
        credentialProvider,
        clientFactory,
        queueTreeDataProvider
    };
}

function registerCommands(
    context: vscode.ExtensionContext,
    queueTreeDataProvider: QueueTreeDataProvider,
    awsProfileStatusBarItem: vscode.StatusBarItem,
    updateAwsProfileStatusBarItem: () => Promise<void>
) {
    // Register AWS profile selection command
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.selectAwsProfile', async () => {
            try {
                const profiles = await credentialProvider.listProfiles();

                const items = [
                    ...profiles.map(p => ({ label: p, description: 'AWS Profile' })),
                    { label: '$(add) Enter credentials manually', description: 'Manual entry' }
                ];

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select an AWS profile or enter credentials manually'
                });

                if (selected) {
                    let credentials;

                    if (selected.label.startsWith('$(add)')) {
                        // Manual credential entry
                        const accessKeyId = await vscode.window.showInputBox({
                            prompt: 'Enter AWS Access Key ID',
                            password: false,
                            ignoreFocusOut: true
                        });

                        if (!accessKeyId) {
                            return;
                        }

                        const secretAccessKey = await vscode.window.showInputBox({
                            prompt: 'Enter AWS Secret Access Key',
                            password: true,
                            ignoreFocusOut: true
                        });

                        if (!secretAccessKey) {
                            return;
                        }

                        credentials = { accessKeyId, secretAccessKey };
                        await credentialProvider.storeCredentials(credentials);
                    } else {
                        // Use selected profile
                        credentials = await credentialProvider.getCredentials(selected.label);
                        // Store the profile credentials in SecretStorage so they persist
                        await credentialProvider.storeCredentials(credentials);
                        // Store the profile name for display
                        await context.globalState.update('aws-profile-name', selected.label);
                    }

                    // Update client factory with new credentials
                    clientFactory.updateCredentials(credentials);

                    await updateAwsProfileStatusBarItem();
                    queueTreeDataProvider.refresh();
                    vscode.window.showInformationMessage(`AWS credentials configured`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to configure AWS credentials: ${error.message}`);
                log(`Failed to configure AWS credentials: ${error.message}`);
            }
        })
    );

    // Register refresh queues command
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.refreshQueues', () => {
            queueTreeDataProvider.refresh();
        })
    );

    // Register select queue command (opens webview)
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.selectQueue', (queue: QueueConfig) => {
            const panel = vscode.window.createWebviewPanel(
                'sqsQueueDetails',
                `SQS: ${queue.name}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
                }
            );

            panel.webview.html = getWebviewContent(panel.webview, queue);

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(
                async message => {
                    await handleWebviewMessage(message, panel, queue);
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Register add queue command
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.addQueue', async () => {
            const choice = await vscode.window.showQuickPick([
                { label: 'By Queue Name', description: 'Enter queue name (requires sqs:GetQueueUrl)' },
                { label: 'By Queue URL', description: 'Enter full queue URL' }
            ], {
                placeHolder: 'How would you like to add the queue?'
            });

            if (!choice) {
                return;
            }

            try {
                if (choice.label === 'By Queue Name') {
                    await addQueueByName(queueTreeDataProvider);
                } else {
                    await addQueueByUrl(queueTreeDataProvider);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to add queue: ${error.message}`);
            }
        })
    );

    // Register remove queue command
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.removeQueue', async (item: QueueItem) => {
            const confirm = await vscode.window.showWarningMessage(
                `Remove queue ${item.queue.name}?`,
                'Yes',
                'No'
            );

            if (confirm === 'Yes') {
                try {
                    await queueStorage.removeQueue(item.queue.id);
                    vscode.window.showInformationMessage(`Queue ${item.queue.name} removed`);
                    queueTreeDataProvider.refresh();
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to remove queue: ${error.message}`);
                }
            }
        })
    );

    // Register copy queue URL command
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.copyQueueUrl', async (item: QueueItem) => {
            try {
                await vscode.env.clipboard.writeText(item.queue.url);
                vscode.window.showInformationMessage(`Queue URL copied to clipboard`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to copy queue URL: ${error.message}`);
            }
        })
    );

    // Register export queues command
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.exportQueues', async () => {
            try {
                const queues = await queueStorage.exportQueues();

                if (queues.length === 0) {
                    vscode.window.showInformationMessage('No queues to export');
                    return;
                }

                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file('sqs-queues.json'),
                    filters: {
                        'JSON': ['json']
                    },
                    saveLabel: 'Export Queues'
                });

                if (uri) {
                    const content = JSON.stringify(queues, null, 2);
                    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
                    vscode.window.showInformationMessage(`Exported ${queues.length} queue(s) to ${uri.fsPath}`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to export queues: ${error.message}`);
                log(`Failed to export queues: ${error.message}`);
            }
        })
    );

    // Register import queues command
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.importQueues', async () => {
            try {
                const uris = await vscode.window.showOpenDialog({
                    canSelectMany: false,
                    filters: {
                        'JSON': ['json']
                    },
                    openLabel: 'Import Queues'
                });

                if (!uris || uris.length === 0) {
                    return;
                }

                const content = await vscode.workspace.fs.readFile(uris[0]);
                const json = new TextDecoder('utf-8').decode(content);

                let queues: QueueConfig[];
                try {
                    queues = JSON.parse(json);
                } catch (parseError) {
                    vscode.window.showErrorMessage('Invalid JSON file format');
                    return;
                }

                if (!Array.isArray(queues)) {
                    vscode.window.showErrorMessage('Invalid queue configuration format: expected an array');
                    return;
                }

                // Validate queue structure
                for (const queue of queues) {
                    if (!queue.id || !queue.name || !queue.url || !queue.region) {
                        vscode.window.showErrorMessage('Invalid queue configuration: missing required fields (id, name, url, region)');
                        return;
                    }
                }

                await queueStorage.importQueues(queues);
                vscode.window.showInformationMessage(`Imported ${queues.length} queue(s)`);
                queueTreeDataProvider.refresh();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to import queues: ${error.message}`);
                log(`Failed to import queues: ${error.message}`);
            }
        })
    );
}

async function tryAutoDiscovery(treeProvider: QueueTreeDataProvider) {
    try {
        // Try to get credentials first
        await credentialProvider.getCredentials();

        // Pick a default region for discovery
        const region = 'us-east-1';
        const client = clientFactory.getClient(region);
        const sqsService = new SQSService(client);

        const result = await sqsService.tryListQueues();
        if (result.hasPermission && result.queues.length > 0) {
            const existingQueues = await queueStorage.getQueues();
            const newQueues = result.queues.filter(url =>
                !existingQueues.some(q => q.url === url)
            );

            if (newQueues.length > 0) {
                const choice = await vscode.window.showInformationMessage(
                    `Found ${newQueues.length} queue(s). Would you like to import them?`,
                    'Import All',
                    'Skip'
                );

                if (choice === 'Import All') {
                    for (const queueUrl of newQueues) {
                        try {
                            const regionMatch = queueUrl.match(/sqs\.([^.]+)\.amazonaws\.com/);
                            if (!regionMatch) {
                                continue;
                            }
                            const queueRegion = regionMatch[1];

                            const queueClient = clientFactory.getClient(queueRegion);
                            const queueService = new SQSService(queueClient);

                            const attributes = await queueService.getQueueAttributes(queueUrl);
                            const queueName = queueService.extractQueueName(queueUrl);

                            const queue: QueueConfig = {
                                id: generateId(),
                                name: queueName,
                                url: queueUrl,
                                region: queueRegion,
                                attributes,
                                addedManually: false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };

                            const dlqInfo = queueService.extractDlqFromAttributes(attributes);
                            if (dlqInfo) {
                                queue.dlqUrl = dlqInfo.dlqUrl;
                                queue.dlqName = dlqInfo.dlqName;
                            }

                            await queueStorage.addQueue(queue);
                        } catch (error) {
                            log(`Failed to import queue ${queueUrl}: ${error}`);
                        }
                    }

                    vscode.window.showInformationMessage(`Imported ${newQueues.length} queue(s)`);
                    treeProvider.refresh();
                }
            }
        }
    } catch (error) {
        // Silent fail - auto-discovery is optional
        log(`Auto-discovery failed: ${error}`);
    }
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.random() * possible.length);
    }
    return text;
}

export function deactivate() {
    if (clientFactory) {
        clientFactory.dispose();
    }
}

// Helper functions for queue management

async function addQueueByName(treeProvider: QueueTreeDataProvider) {
    const queueName = await vscode.window.showInputBox({
        prompt: 'Enter queue name',
        placeHolder: 'my-queue'
    });

    if (!queueName) {
        return;
    }

    const region = await vscode.window.showInputBox({
        prompt: 'Enter AWS region',
        placeHolder: 'us-east-1',
        value: 'us-east-1'
    });

    if (!region) {
        return;
    }

    const client = clientFactory.getClient(region);
    const sqsService = new SQSService(client);

    const queueUrl = await sqsService.getQueueUrl(queueName);
    const attributes = await sqsService.getQueueAttributes(queueUrl);

    const queue: QueueConfig = {
        id: generateId(),
        name: queueName,
        url: queueUrl,
        region,
        attributes,
        addedManually: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Extract DLQ if present
    const dlqInfo = sqsService.extractDlqFromAttributes(attributes);
    if (dlqInfo) {
        queue.dlqUrl = dlqInfo.dlqUrl;
        queue.dlqName = dlqInfo.dlqName;
    }

    await queueStorage.addQueue(queue);
    vscode.window.showInformationMessage(`Queue ${queueName} added successfully`);
    treeProvider.refresh();
}

async function addQueueByUrl(treeProvider: QueueTreeDataProvider) {
    const queueUrl = await vscode.window.showInputBox({
        prompt: 'Enter queue URL',
        placeHolder: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'
    });

    if (!queueUrl) {
        return;
    }

    // Extract region from URL
    const regionMatch = queueUrl.match(/sqs\.([^.]+)\.amazonaws\.com/);
    if (!regionMatch) {
        throw new Error('Invalid queue URL format');
    }
    const region = regionMatch[1];

    const client = clientFactory.getClient(region);
    const sqsService = new SQSService(client);

    const attributes = await sqsService.getQueueAttributes(queueUrl);
    const queueName = sqsService.extractQueueName(queueUrl);

    const queue: QueueConfig = {
        id: generateId(),
        name: queueName,
        url: queueUrl,
        region,
        attributes,
        addedManually: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Extract DLQ if present
    const dlqInfo = sqsService.extractDlqFromAttributes(attributes);
    if (dlqInfo) {
        queue.dlqUrl = dlqInfo.dlqUrl;
        queue.dlqName = dlqInfo.dlqName;
    }

    await queueStorage.addQueue(queue);
    vscode.window.showInformationMessage(`Queue ${queueName} added successfully`);
    treeProvider.refresh();
}

function getWebviewContent(webview: vscode.Webview, queue: QueueConfig): string {
    // Log for debugging
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionContext.extensionUri, 'media', 'bundle.js')
    );
    const nonce = getNonce();

    // Convert QueueConfig to the format expected by the webview
    const webviewQueue = {
        id: queue.id,
        queueName: queue.name,
        queueUrl: queue.url,
        region: queue.region,
        attributes: queue.attributes || {},
        dlqUrl: queue.dlqUrl,
        dlqName: queue.dlqName
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https:;">
    <title>SQS Queue: ${queue.name}</title>
    <style nonce="${nonce}">
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            overflow-x: hidden;
        }
        #app {
            width: 100%;
            min-height: 100vh;
        }
    </style>
</head>
<body>
    <div id="app"></div>
    <script nonce="${nonce}">
        // Pass queue configuration to the Svelte app
        window.initialQueue = ${JSON.stringify(webviewQueue)};
        
        // Acquire VS Code API before loading bundle
        const vscode = acquireVsCodeApi();
        window.vscode = vscode;
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

async function handleWebviewMessage(message: any, panel: vscode.WebviewPanel, queue: QueueConfig) {
    const client = clientFactory.getClient(queue.region);
    const sqsService = new SQSService(client);

    switch (message.command) {
        case 'fetchMessages':
            try {
                const messages = await sqsService.receiveMessages(queue.url, {
                    maxMessages: message.maxMessages || 10,
                    visibilityTimeout: message.visibilityTimeout || 30,
                    waitTimeSeconds: message.waitTimeSeconds || 0
                });
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'messagesLoaded',
                    messages
                }));
            } catch (error: any) {
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'messagesLoaded',
                    error: error.message
                }));
            }
            break;

        case 'fetchDLQMessages':
            try {
                if (!queue.dlqUrl) {
                    throw new Error('No DLQ configured for this queue');
                }
                const messages = await sqsService.receiveMessages(queue.dlqUrl, {
                    maxMessages: message.maxMessages || 10,
                    visibilityTimeout: message.visibilityTimeout || 30,
                    waitTimeSeconds: 0
                });
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'dlqMessagesLoaded',
                    messages
                }));
            } catch (error: any) {
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'dlqMessagesLoaded',
                    error: error.message
                }));
            }
            break;

        case 'deleteMessage':
            try {
                await sqsService.deleteMessage(queue.url, message.receiptHandle);
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'messageDeleted',
                    success: true
                }));
                vscode.window.showInformationMessage('Message deleted successfully');
            } catch (error: any) {
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'messageDeleted',
                    error: error.message
                }));
                vscode.window.showErrorMessage(`Failed to delete message: ${error.message}`);
            }
            break;

        case 'sendMessage':
            try {
                // Transform message attributes from frontend format to AWS SDK format
                const messageAttributes: Record<string, any> = {};
                if (message.attributes) {
                    for (const [key, value] of Object.entries(message.attributes)) {
                        const attr = value as any;
                        messageAttributes[key] = {
                            DataType: attr.dataType || attr.DataType || 'String',
                            StringValue: attr.stringValue || attr.StringValue || ''
                        };
                    }
                }

                await sqsService.sendMessage(queue.url, message.body, {
                    delaySeconds: message.delaySeconds || 0,
                    messageAttributes
                });
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'messageSent',
                    success: true
                }));
                vscode.window.showInformationMessage('Message sent successfully');
            } catch (error: any) {
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'messageSent',
                    error: error.message
                }));
                vscode.window.showErrorMessage(`Failed to send message: ${error.message}`);
            }
            break;

        case 'purgeQueue':
            try {
                await sqsService.purgeQueue(queue.url);
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'queuePurged',
                    success: true
                }));
                vscode.window.showInformationMessage('Queue purged successfully');
            } catch (error: any) {
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'queuePurged',
                    error: error.message
                }));
                vscode.window.showErrorMessage(`Failed to purge queue: ${error.message}`);
            }
            break;

        case 'redriveSelectedMessages':
            try {
                if (!queue.dlqUrl) {
                    throw new Error('No DLQ configured for this queue');
                }

                const result = await sqsService.redriveSelectedMessages(
                    queue.dlqUrl,
                    queue.url,
                    message.messages
                );

                panel.webview.postMessage(sanitizeForWebview({
                    command: 'redriveResult',
                    ...result
                }));

                if (result.failureCount === 0) {
                    vscode.window.showInformationMessage(
                        `Successfully redriven ${result.successCount} message(s)`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `Redriven ${result.successCount} of ${result.processedCount} message(s). ${result.failureCount} failed.`
                    );
                }
            } catch (error: any) {
                panel.webview.postMessage(sanitizeForWebview({
                    command: 'redriveResult',
                    error: error.message
                }));
                vscode.window.showErrorMessage(`Failed to redrive messages: ${error.message}`);
            }
            break;
    }
}
