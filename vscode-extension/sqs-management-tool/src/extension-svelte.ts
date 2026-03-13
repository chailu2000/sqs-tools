/**
 * VS Code Extension with Bundled Svelte UI
 * This version loads the bundled Svelte app instead of inline HTML
 */

import * as vscode from 'vscode';
import {
    getAllQueues,
    receiveMessages,
    getAwsProfiles,
    setAwsProfile,
    sendMessage,
    deleteMessage,
    purgeQueue,
    addQueue,
    removeQueue,
    changeMessageVisibility,
    redriveDLQ,
    QueueConfiguration
} from './api';
import { sanitizeForWebview } from './utils/webview-sanitizer';
import { log } from './utils/logger';

let extensionContext: vscode.ExtensionContext;

class QueueItem extends vscode.TreeItem {
    constructor(
        public readonly queue: QueueConfiguration,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(queue.queueName, collapsibleState);
        this.tooltip = `ID: ${queue.id}\\nURL: ${queue.queueUrl}\\nRegion: ${queue.region}`;
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

    constructor(private workspaceRoot?: string) { }

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
                const queues = await getAllQueues();
                if (queues.length === 0) {
                    vscode.window.showInformationMessage('No SQS queues configured. Add one in settings.');
                }
                return queues.map(queue => new QueueItem(queue, vscode.TreeItemCollapsibleState.None));
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to load SQS queues: ${error.message}`);
                return [];
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;
    log('SQS Management Tool extension is now active!');

    const queueTreeDataProvider = new QueueTreeDataProvider();
    vscode.window.registerTreeDataProvider('sqsManagementQueues', queueTreeDataProvider);

    // Create a status bar item for AWS profile selection
    const awsProfileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    awsProfileStatusBarItem.command = 'sqs-management-tool.selectAwsProfile';
    awsProfileStatusBarItem.tooltip = 'Select AWS Profile';
    awsProfileStatusBarItem.show();
    context.subscriptions.push(awsProfileStatusBarItem);

    // Function to update the status bar item
    function updateAwsProfileStatusBarItem() {
        const currentProfile = extensionContext.globalState.get<string>('awsProfile');
        if (currentProfile) {
            awsProfileStatusBarItem.text = `$(cloud) AWS: ${currentProfile}`;
        } else {
            awsProfileStatusBarItem.text = `$(warning) AWS: Not Selected`;
            awsProfileStatusBarItem.tooltip = 'Click to select an AWS profile';
        }
    }

    // Initial update
    updateAwsProfileStatusBarItem();

    // Register AWS profile selection command
    context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.selectAwsProfile', async () => {
        try {
            const profiles = await getAwsProfiles();
            if (profiles.length === 0) {
                vscode.window.showInformationMessage('No AWS profiles found. Please configure your AWS credentials.');
                return;
            }

            const selectedProfile = await vscode.window.showQuickPick(profiles, {
                placeHolder: 'Select an AWS profile'
            });

            if (selectedProfile) {
                await setAwsProfile(selectedProfile);
                vscode.window.showInformationMessage(`AWS profile set to: ${selectedProfile}`);
                await extensionContext.globalState.update('awsProfile', selectedProfile);
                updateAwsProfileStatusBarItem();
                queueTreeDataProvider.refresh();
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to select AWS profile: ${error.message}`);
        }
    }));

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.refreshQueues', () => {
            queueTreeDataProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.selectQueue', (queue: QueueConfiguration) => {
            const panel = vscode.window.createWebviewPanel(
                'sqsQueueDetails',
                `SQS: ${queue.queueName}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
                }
            );

            panel.webview.html = getWebviewContent(panel.webview, queue);

            // SECURITY: Handle messages from webview
            // IMPORTANT: Never send AWS credentials to the webview via postMessage.
            // The webview is sandboxed and should never have access to credentials.
            // All AWS operations are performed in the extension host, and only
            // results (messages, success/error status) are sent to the webview.
            panel.webview.onDidReceiveMessage(
                async message => {
                    log('Extension received message from webview:', message);

                    switch (message.command) {
                        case 'fetchMessages':
                            try {
                                const messages = await receiveMessages(
                                    message.queueId,
                                    false, // peek
                                    message.maxMessages,
                                    message.visibilityTimeout,
                                    message.waitTimeSeconds
                                );
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
                                const messages = await receiveMessages(
                                    message.queueId,
                                    false, // peek
                                    message.maxMessages,
                                    message.visibilityTimeout,
                                    0 // waitTime
                                );
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
                                await deleteMessage(message.queueId, message.receiptHandle);
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
                                await sendMessage(
                                    message.queueId,
                                    message.body,
                                    message.delaySeconds,
                                    message.attributes
                                );
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
                                await purgeQueue(message.queueId);
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
                                // Implement redrive by sending each message to the main queue
                                const messages = message.messages;
                                const results = {
                                    successCount: 0,
                                    failureCount: 0,
                                    processedCount: messages.length,
                                    succeeded: [] as Array<{ messageId: string }>,
                                    failed: [] as Array<{ messageId: string; error: string }>
                                };

                                for (const msg of messages) {
                                    try {
                                        // Extract FIFO attributes if present in system attributes
                                        const messageGroupId = msg.attributes ? msg.attributes.MessageGroupId : undefined;
                                        const messageDeduplicationId = msg.attributes ? msg.attributes.MessageDeduplicationId : undefined;

                                        // Send message to main queue
                                        await sendMessage(
                                            message.queueId,
                                            msg.body,
                                            0, // no delay
                                            msg.messageAttributes || {},
                                            messageGroupId,
                                            messageDeduplicationId
                                        );

                                        // Delete from DLQ
                                        await deleteMessage(message.queueId, msg.receiptHandle);

                                        results.successCount++;
                                        results.succeeded.push({ messageId: msg.messageId });
                                    } catch (err: any) {
                                        results.failureCount++;
                                        results.failed.push({
                                            messageId: msg.messageId,
                                            error: err.message
                                        });
                                    }
                                }

                                panel.webview.postMessage(sanitizeForWebview({
                                    command: 'redriveResult',
                                    ...results
                                }));

                                if (results.failureCount === 0) {
                                    vscode.window.showInformationMessage(
                                        `Successfully redriven ${results.successCount} message(s)`
                                    );
                                } else {
                                    vscode.window.showWarningMessage(
                                        `Redriven ${results.successCount} of ${results.processedCount} message(s). ${results.failureCount} failed.`
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
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Other commands...
    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.addQueue', async () => {
            const identifier = await vscode.window.showInputBox({
                prompt: 'Enter queue name or URL',
                placeHolder: 'my-queue or https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'
            });
            const region = await vscode.window.showInputBox({
                prompt: 'Enter AWS region',
                placeHolder: 'us-east-1'
            });

            if (identifier && region) {
                try {
                    await addQueue(identifier, region);
                    vscode.window.showInformationMessage(`Queue added successfully`);
                    queueTreeDataProvider.refresh();
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to add queue: ${error.message}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sqs-management-tool.removeQueue', async (item: QueueItem) => {
            const confirm = await vscode.window.showWarningMessage(
                `Remove queue ${item.queue.queueName}?`,
                'Yes',
                'No'
            );

            if (confirm === 'Yes') {
                try {
                    await removeQueue(item.queue.id);
                    vscode.window.showInformationMessage(`Queue ${item.queue.queueName} removed`);
                    queueTreeDataProvider.refresh();
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to remove queue: ${error.message}`);
                }
            }
        })
    );
}

function getWebviewContent(webview: vscode.Webview, queue: QueueConfiguration): string {
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionContext.extensionUri, 'media', 'bundle.js')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https:;">
    <title>SQS Queue: ${queue.queueName}</title>
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
        window.initialQueue = ${JSON.stringify(queue)};
        
        // Acquire VS Code API before loading bundle
        const vscode = acquireVsCodeApi();
        window.vscode = vscode;
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate() { }
