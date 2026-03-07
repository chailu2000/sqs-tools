import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { SQSClient } from '@aws-sdk/client-sqs';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { SQSService } from './services/sqs-service';
import { SQSClientFactory } from './aws/client-factory';
import { CredentialProvider } from './services/credential-provider';
import { QueueStorage } from './services/queue-storage';
import { selectProfileCommand } from './commands/select-profile';
import { exportQueuesCommand } from './commands/export-queues';
import { importQueuesCommand } from './commands/import-queues';
import { toggleWorkspaceStorageCommand } from './commands/toggle-workspace-storage';
import { addQueueByNameCommand } from './commands/add-queue-by-name';
import { addQueueByUrlCommand } from './commands/add-queue-by-url';
import { autoDiscoverQueuesOnActivation, tryAutoDiscoverCommand } from './commands/auto-discover-queues';
import { refreshQueueCommand } from './commands/refresh-queue';
import { copyQueueUrlCommand } from './commands/copy-queue-url';
import { log, error as logError } from './utils/logger';
import { sanitizeForWebview } from './utils/webview-sanitizer';
import { QueueConfig } from './models/queue-storage';
import { QueueTreeDataProvider, QueueTreeItem } from './views/queue-tree-provider';

let extensionContext: vscode.ExtensionContext;
let clientFactory: SQSClientFactory;
let queueStorage: QueueStorage;

// Initialize the client factory with default credentials
function initializeClientFactory() {
  if (!clientFactory) {
    clientFactory = new SQSClientFactory({
      credentials: fromNodeProviderChain()
    });
  }
  return clientFactory;
}



export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  log('Congratulations, your extension "sqs-management-tool" is now active!');

  // Initialize credential provider
  const credentialProvider = new CredentialProvider(context.secrets);

  // Initialize queue storage
  queueStorage = new QueueStorage(context);

  // Restore workspace storage mode from settings
  const useWorkspaceStorage = context.globalState.get<boolean>('useWorkspaceStorage', false);
  queueStorage.useWorkspaceStorage(useWorkspaceStorage);

  // Register the Tree View
  const queueTreeDataProvider = new QueueTreeDataProvider(queueStorage);
  vscode.window.registerTreeDataProvider('sqsManagementQueues', queueTreeDataProvider);

  // Attempt auto-discovery of queues on first activation
  autoDiscoverQueuesOnActivation(
    context,
    queueStorage,
    initializeClientFactory(),
    () => queueTreeDataProvider.refresh()
  ).catch(error => {
    // Silently fail - auto-discovery is optional
    logError('Auto-discovery failed', error);
  });

  // Store active webview panels keyed by queue ID
  const activePanels = new Map<string, vscode.WebviewPanel>();

  // Create a status bar item for AWS profile selection
  const awsProfileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  awsProfileStatusBarItem.command = 'sqs-management-tool.selectProfile';
  awsProfileStatusBarItem.tooltip = 'Select AWS Profile';
  awsProfileStatusBarItem.show();
  context.subscriptions.push(awsProfileStatusBarItem);

  // Function to update the status bar item
  function updateAwsProfileStatusBarItem() {
    const currentProfile = extensionContext.globalState.get<string>('awsProfile');
    if (currentProfile) {
      awsProfileStatusBarItem.text = `$(cloud) AWS: ${currentProfile}`;
      awsProfileStatusBarItem.tooltip = `Active AWS profile: ${currentProfile}`;
    } else {
      awsProfileStatusBarItem.text = `$(warning) AWS: Not Selected`;
      awsProfileStatusBarItem.tooltip = 'Click to select an AWS profile';
    }
  }

  // Initial update
  updateAwsProfileStatusBarItem();

  // Register refresh command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.refreshQueues', () => queueTreeDataProvider.refresh()));

  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.selectQueue', (queue: QueueConfig) => {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel for this queue, show it
    if (activePanels.has(queue.id)) {
      activePanels.get(queue.id)?.reveal(column);
      // Explicitly send setQueueId again to ensure webview re-fetches messages
      activePanels.get(queue.id)?.webview.postMessage(sanitizeForWebview({ command: 'setQueueId', queueId: queue.id }));
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'sqsQueueDetail',
      `SQS Queue: ${queue.name}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionContext.extensionUri, 'media')]
      }
    );

    activePanels.set(queue.id, panel);

    // Handle panel disposal
    panel.onDidDispose(() => {
      activePanels.delete(queue.id);
    }, null, context.subscriptions);

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(panel.webview, queue);

    // Send the queueId to the webview after it's created
    panel.webview.postMessage(sanitizeForWebview({ command: 'setQueueId', queueId: queue.id }));

    // SECURITY: Handle messages from webview
    // IMPORTANT: Never send AWS credentials to the webview via postMessage.
    // The webview is sandboxed and should never have access to credentials.
    // All AWS operations are performed in the extension host, and only
    // results (messages, success/error status) are sent to the webview.
    panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'fetchMessages':
            log(`Extension received fetchMessages command for queueId: ${message.queueId}`);
            try {
              // Get queue configuration to extract queueUrl and region
              const queues = await queueStorage.getQueues();
              const queueConfig = queues.find(q => q.id === message.queueId);

              if (!queueConfig) {
                throw new Error(`Queue not found: ${message.queueId}`);
              }

              // Get SQS client for the queue's region
              const client = initializeClientFactory().getClient(queueConfig.region);
              const sqsService = new SQSService(client);

              // Receive messages using AWS SDK
              const messages = await sqsService.receiveMessages(queueConfig.url, {
                maxMessages: message.maxMessages || 10,
                visibilityTimeout: message.visibilityTimeout || 30,
                waitTimeSeconds: message.waitTime || 0
              });

              panel.webview.postMessage(sanitizeForWebview({ command: 'messagesLoaded', messages: messages }));
            } catch (error: any) {
              logError(`Error fetching messages for ${message.queueId}:`, error);
              panel.webview.postMessage(sanitizeForWebview({ command: 'messagesLoaded', error: error.message }));
            }
            return;
          case 'sendMessage':
            log(`Extension received sendMessage command for queueId: ${message.queueId}`);
            try {
              // Get queue configuration to extract queueUrl and region
              const queues = await queueStorage.getQueues();
              const queueConfig = queues.find(q => q.id === message.queueId);

              if (!queueConfig) {
                throw new Error(`Queue not found: ${message.queueId}`);
              }

              // Get SQS client for the queue's region
              const client = initializeClientFactory().getClient(queueConfig.region);
              const sqsService = new SQSService(client);

              // Send message using AWS SDK
              await sqsService.sendMessage(queueConfig.url, message.messageBody, {
                delaySeconds: message.delaySeconds || 0,
                messageAttributes: {} // messageAttributes not yet implemented in UI
              });

              panel.webview.postMessage(sanitizeForWebview({ command: 'sendMessageResult', success: true }));
            } catch (error: any) {
              logError(`Error sending message to ${message.queueId}:`, error);
              vscode.window.showErrorMessage(`Failed to send message: ${error.message}`);
              panel.webview.postMessage(sanitizeForWebview({ command: 'sendMessageResult', success: false, error: error.message }));
            }
            return;
          case 'deleteMessage':
            log(`Extension received deleteMessage command for queueId: ${message.queueId}, receiptHandle: ${message.receiptHandle}`);
            try {
              // Get queue configuration to extract queueUrl and region
              const queues = await queueStorage.getQueues();
              const queueConfig = queues.find(q => q.id === message.queueId);

              if (!queueConfig) {
                throw new Error(`Queue not found: ${message.queueId}`);
              }

              // Get SQS client for the queue's region
              const client = initializeClientFactory().getClient(queueConfig.region);
              const sqsService = new SQSService(client);

              // Delete message using AWS SDK
              await sqsService.deleteMessage(queueConfig.url, message.receiptHandle);

              panel.webview.postMessage(sanitizeForWebview({ command: 'deleteMessageResult', success: true }));
              vscode.window.showInformationMessage('Message deleted successfully!');
            } catch (error: any) {
              logError(`Error deleting message from ${message.queueId}:`, error);
              vscode.window.showErrorMessage(`Failed to delete message: ${error.message}`);
              panel.webview.postMessage(sanitizeForWebview({ command: 'deleteMessageResult', success: false, error: error.message }));
            }
            return;
          case 'confirm':
            const confirmed = await vscode.window.showInformationMessage(
              message.message,
              { modal: true },
              'Yes'
            );
            if (confirmed === 'Yes') {
              if (message.action === 'purgeQueue') {
                try {
                  // Get queue configuration to extract queueUrl and region
                  const queues = await queueStorage.getQueues();
                  const queueConfig = queues.find(q => q.id === message.queueId);

                  if (!queueConfig) {
                    throw new Error(`Queue not found: ${message.queueId}`);
                  }

                  // Get SQS client for the queue's region
                  const client = initializeClientFactory().getClient(queueConfig.region);
                  const sqsService = new SQSService(client);

                  // Purge queue using AWS SDK
                  await sqsService.purgeQueue(queueConfig.url);

                  panel.webview.postMessage(sanitizeForWebview({ command: 'purgeQueueResult', success: true }));
                  vscode.window.showInformationMessage('Queue purged successfully!');
                } catch (error: any) {
                  logError(`Error purging queue ${message.queueId}:`, error);
                  vscode.window.showErrorMessage(`Failed to purge queue: ${error.message}`);
                  panel.webview.postMessage(sanitizeForWebview({ command: 'purgeQueueResult', success: false, error: error.message }));
                }
              }
            }
            return;
          case 'changeVisibility':
            log(`Extension received changeVisibility command for queueId: ${message.queueId}, receiptHandle: ${message.receiptHandle}, visibilityTimeout: ${message.visibilityTimeout}`);
            try {
              // Get queue configuration to extract queueUrl and region
              const queues = await queueStorage.getQueues();
              const queueConfig = queues.find(q => q.id === message.queueId);

              if (!queueConfig) {
                throw new Error(`Queue not found: ${message.queueId}`);
              }

              // Get SQS client for the queue's region
              const client = initializeClientFactory().getClient(queueConfig.region);
              const sqsService = new SQSService(client);

              // Change message visibility using AWS SDK
              await sqsService.changeMessageVisibility(queueConfig.url, message.receiptHandle, message.visibilityTimeout);

              panel.webview.postMessage(sanitizeForWebview({ command: 'changeVisibilityResult', success: true }));
              vscode.window.showInformationMessage('Message visibility timeout updated successfully!');
            } catch (error: any) {
              logError(`Error changing message visibility for ${message.queueId}:`, error);
              vscode.window.showErrorMessage(`Failed to change message visibility: ${error.message}`);
              panel.webview.postMessage(sanitizeForWebview({ command: 'changeVisibilityResult', success: false, error: error.message }));
            }
            return;
          case 'requestVisibilityTimeoutInput':
            const { queueId: reqQueueId, receiptHandle: reqReceiptHandle } = message;
            const newVisibilityTimeoutStr = await vscode.window.showInputBox({
              prompt: 'Enter new visibility timeout in seconds (0-43200):',
              value: '0',
              validateInput: text => {
                const timeout = parseInt(text, 10);
                if (isNaN(timeout) || timeout < 0 || timeout > 43200) {
                  return 'Invalid visibility timeout. Please enter a number between 0 and 43200.';
                }
                return null;
              }
            });

            if (newVisibilityTimeoutStr === undefined) { // User cancelled input box
              panel.webview.postMessage(sanitizeForWebview({ command: 'changeVisibilityResult', success: false, error: 'User cancelled input.' }));
              return;
            }

            const newVisibilityTimeout = parseInt(newVisibilityTimeoutStr, 10);

            try {
              // Get queue configuration to extract queueUrl and region
              const queues = await queueStorage.getQueues();
              const queueConfig = queues.find(q => q.id === reqQueueId);

              if (!queueConfig) {
                throw new Error(`Queue not found: ${reqQueueId}`);
              }

              // Get SQS client for the queue's region
              const client = initializeClientFactory().getClient(queueConfig.region);
              const sqsService = new SQSService(client);

              // Change message visibility using AWS SDK
              await sqsService.changeMessageVisibility(queueConfig.url, reqReceiptHandle, newVisibilityTimeout);

              panel.webview.postMessage(sanitizeForWebview({ command: 'changeVisibilityResult', success: true }));
              vscode.window.showInformationMessage('Message visibility timeout updated successfully!');
            } catch (error: any) {
              logError(`Error changing message visibility for ${reqQueueId}:`, error);
              vscode.window.showErrorMessage(`Failed to change message visibility: ${error.message}`);
              panel.webview.postMessage(sanitizeForWebview({ command: 'changeVisibilityResult', success: false, error: error.message }));
            }
            return;
        }
      },
      undefined,
      context.subscriptions
    );
  }));

  let disposable = vscode.commands.registerCommand('sqs-management-tool.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from SQS Management Tool!');
  });

  context.subscriptions.push(disposable);

  // Register command to add a new queue
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.addQueue', async () => {
    const queueIdentifier = await vscode.window.showInputBox({
      prompt: 'Enter SQS Queue URL or Name',
      placeHolder: 'e.g., my-queue-name or https://sqs.us-east-1.amazonaws.com/123456789012/my-queue-name'
    });

    if (!queueIdentifier) {
      vscode.window.showInformationMessage('Queue identifier cannot be empty.');
      return;
    }

    const region = await vscode.window.showInputBox({
      prompt: 'Enter AWS Region',
      placeHolder: 'e.g., us-east-1',
      value: extensionContext.globalState.get<string>('awsRegion') || 'us-east-1' // Pre-fill with last used or default
    });

    if (!region) {
      vscode.window.showInformationMessage('AWS Region cannot be empty.');
      return;
    }

    // Client-side check for duplicate queues
    try {
      const existingQueues = await queueStorage.getQueues();
      const isDuplicate = existingQueues.some(q =>
        q.url === queueIdentifier || q.name.toLowerCase() === queueIdentifier.toLowerCase()
      );

      if (isDuplicate) {
        vscode.window.showErrorMessage(`Queue '${queueIdentifier}' already exists.`);
        return;
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to check existing queues: ${error.message}`);
      return;
    }

    try {
      // Generate a unique UUID for the queue
      const queueId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create queue configuration
      const newQueue: QueueConfig = {
        id: queueId,
        name: queueIdentifier, // Will be updated after validation
        url: queueIdentifier,  // Will be updated after validation
        region: region,
        addedManually: true,
        createdAt: now,
        updatedAt: now
      };

      // Store the queue
      await queueStorage.addQueue(newQueue);

      // For now, use the identifier as name and url
      // In a full implementation, we would validate with AWS and fetch actual queue name
      await queueStorage.updateQueue(queueId, {
        name: queueIdentifier,
        url: queueIdentifier,
        updatedAt: new Date().toISOString()
      });

      vscode.window.showInformationMessage(`Queue '${queueIdentifier}' added successfully!`);
      queueTreeDataProvider.refresh();
      await extensionContext.globalState.update('awsRegion', region); // Store last used region
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to add queue: ${error.message}`);
    }
  }));

  // Register command to remove an existing queue
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.removeQueue', async (item: QueueTreeItem) => {
    const queue = item.queue; // Extract the QueueConfig from the QueueTreeItem
    if (!queue) {
      vscode.window.showErrorMessage('Invalid queue item');
      return;
    }
    const confirmed = await vscode.window.showInformationMessage(
      `Are you sure you want to remove queue '${queue.name}'? This will only remove it from your VS Code view, not delete it from AWS.`,
      { modal: true },
      'Yes'
    );

    if (confirmed === 'Yes') {
      try {
        await queueStorage.removeQueue(queue.id);
        vscode.window.showInformationMessage(`Queue '${queue.name}' removed successfully.`);
        queueTreeDataProvider.refresh();
        // Close the webview panel if it's open for the removed queue
        if (activePanels.has(queue.id)) {
          activePanels.get(queue.id)?.dispose();
          activePanels.delete(queue.id);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to remove queue: ${error.message}`);
      }
    }
  }));

  // Register command to refresh queue attributes
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.refreshAttributes', async (item: QueueTreeItem) => {
    const queue = item.queue;
    if (!queue) {
      vscode.window.showErrorMessage('Invalid queue item');
      return;
    }

    const sqsService = new SQSService(initializeClientFactory().getClient(queue.region));
    await refreshQueueCommand(queue.id, queueStorage, sqsService);
    queueTreeDataProvider.refresh();
  }));

  // Register command to copy queue URL
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.copyQueueUrl', async (item: QueueTreeItem) => {
    const queue = item.queue;
    if (!queue) {
      vscode.window.showErrorMessage('Invalid queue item');
      return;
    }

    await copyQueueUrlCommand(queue);
  }));

  // Register profile selection command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.selectProfile', async () => {
    await selectProfileCommand(
      context,
      credentialProvider,
      initializeClientFactory(),
      awsProfileStatusBarItem,
      () => queueTreeDataProvider.refresh()
    );
  }));

  // Register export queues command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.exportQueues', async () => {
    await exportQueuesCommand(queueStorage);
  }));

  // Register import queues command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.importQueues', async () => {
    await importQueuesCommand(queueStorage);
    // Refresh the tree view after importing
    queueTreeDataProvider.refresh();
  }));

  // Register toggle workspace storage command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.toggleWorkspaceStorage', async () => {
    await toggleWorkspaceStorageCommand(context, queueStorage, () => queueTreeDataProvider.refresh());
  }));

  // Register add queue by name command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.addQueueByName', async () => {
    await addQueueByNameCommand(context, queueStorage, initializeClientFactory(), () => queueTreeDataProvider.refresh());
  }));

  // Register add queue by URL command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.addQueueByUrl', async () => {
    await addQueueByUrlCommand(context, queueStorage, initializeClientFactory(), () => queueTreeDataProvider.refresh());
  }));

  // Register manual queue discovery command
  context.subscriptions.push(vscode.commands.registerCommand('sqs-management-tool.tryAutoDiscover', async () => {
    await tryAutoDiscoverCommand(context, queueStorage, initializeClientFactory(), () => queueTreeDataProvider.refresh());
  }));
}

export function deactivate() {
  // Clean up client factory
  if (clientFactory) {
    clientFactory.dispose();
  }
}

function getWebviewContent(webview: vscode.Webview, queue: QueueConfig): string {
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionContext.extensionUri, 'media', 'main.js'));

  const dlqInfo = queue.dlqUrl && queue.dlqName ? `
    <h3>Dead Letter Queue</h3>
    <div class="dlq-info">
      <p><strong>DLQ Name:</strong> ${queue.dlqName}</p>
      <p><strong>DLQ URL:</strong> <a href="${queue.dlqUrl}">${queue.dlqUrl}</a></p>
    </div>
  ` : '';

  const aboutMessageCountsInfo = `
    <div class="about-message-counts">
      <h3>About Message Counts</h3>
      <p>
        SQS message counts are eventually consistent. This means the numbers you see here (and in the AWS console) may not always be perfectly up-to-date, especially after a burst of activity.
        The \`Available\` count typically updates every 10 seconds, while \`In-flight\` and \`Delayed\` counts update less frequently.
        If you require precise, real-time message counts, you should use the \`ReceiveMessage\` API with \`MaxNumberOfMessages=1\` and \`VisibilityTimeout=0\` to peek at messages.
      </p>
    </div>
  `;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
                <meta http-equiv="Pragma" content="no-cache">
                <meta http-equiv="Expires" content="0">
                <title>SQS Queue Details</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }
        h1, h2, h3 {
            color: var(--vscode-foreground);
            margin-top: 1.5em; /* Added for separation */
            margin-bottom: 0.5em;
        }
        h1 {
          margin-top: 0.5em; /* Adjust for first heading */
        }
        .queue-details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px; /* Added for separation */
        }
         .about-message-counts {
            background-color: var(--vscode-editorInfo-background);
            color: var(--vscode-editorInfo-foreground);
            padding: 10px;
            margin-top: 20px; /* Ensure separation from elements above */
            margin-bottom: 20px;
            border-radius: 4px; /* Apply border-radius here */
         }
         .about-message-counts h3 {
            margin-top: 0;
            margin-bottom: 5px; /* Add a small margin below heading */
            color: var(--vscode-editorInfo-foreground); /* Match parent foreground color for consistency */
         }
         .vscode-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 3px;
            white-space: nowrap; /* Prevent text wrapping */
            text-align: center;
         }
         .vscode-button:hover {
            background-color: var(--vscode-button-hoverBackground);
         }
         .vscode-button:active {
            background-color: var(--vscode-button-separator); /* A slightly different color for active state */
         }
        .queue-details-table td {
            padding: 8px 12px;
            border: 1px solid var(--vscode-editorGroup-border);
            vertical-align: top;
        }
        .queue-details-table td:first-child {
            font-weight: bold;
            width: 180px; /* Adjust as needed */
            background-color: var(--vscode-editorWidget-background);
        }
        .queue-details-table td:nth-child(even) {
          background-color: var(--vscode-input-background);
        }
        .dlq-info {
          background-color: var(--vscode-statusBarItem-warningBackground);
          color: var(--vscode-statusBarItem-warningForeground);
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .dlq-info a {
          color: var(--vscode-statusBarItem-warningForeground);
          text-decoration: underline;
        }
        .message-list-section {
            margin-top: 20px; /* Added for separation */
        }
        .message-item {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .delete-message-button, .change-visibility-button {
            /* Inherit from .vscode-button, add specific styles if needed */
            margin-left: 10px;
            float: right;
        }
        .message-id {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .message-body {
            white-space: pre-wrap;
            word-break: break-all;
            background-color: var(--vscode-editor-widget-background);
            padding: 5px;
            border-radius: 3px;
            margin-top: 5px;
        }
        .region {
          color: var(--vscode-descriptionForeground);
        }
        .message-send-container {
            margin-top: 20px; /* Added for separation */
            padding-top: 20px;
            border-top: 1px solid var(--vscode-editorGroup-border);
        }
        .message-send-container label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .message-send-container textarea {
          width: 100%;
          height: 100px;
          background-color: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          color: var(--vscode-input-foreground);
          padding: 5px;
          border-radius: 3px;
          margin-bottom: 10px;
        }
        .message-send-container button {
            /* Inherit from .vscode-button, add specific styles if needed */
            padding: 8px 15px; /* Slightly larger padding for send message button */
        }
        .controls-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .controls-row input[type="number"],
        .controls-row select {
          background-color: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          color: var(--vscode-input-foreground);
          padding: 5px;
          border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>Queue: ${queue.name} <span class="region">(${queue.region})</span></h1>

    <div class="controls-row">
      <button id="refresh-button" class="vscode-button">Refresh</button>
      <button id="purge-button" class="vscode-button">Purge Queue</button>
    </div>

    <h2>Queue Details</h2>
    <table class="queue-details-table">
        <tr>
            <td>Queue URL</td>
            <td><a href="${queue.url}">${queue.url}</a></td>
        </tr>
        <tr>
            <td>Region</td>
            <td>${queue.region}</td>
        </tr>
        <tr>
            <td>Messages Available</td>
            <td>${queue.attributes?.ApproximateNumberOfMessages || 'N/A'}</td>
        </tr>
        <tr>
            <td>Messages In Flight</td>
            <td>${queue.attributes?.ApproximateNumberOfMessagesNotVisible || 'N/A'}</td>
        </tr>
        <tr>
            <td>Messages Delayed</td>
            <td>${queue.attributes?.ApproximateNumberOfMessagesDelayed || 'N/A'}</td>
        </tr>
        <tr>
            <td>Visibility Timeout</td>
            <td>${queue.attributes?.VisibilityTimeout || 'N/A'} seconds</td>
        </tr>
        <tr>
            <td>Message Retention</td>
            <td>${queue.attributes?.MessageRetentionPeriod ? `${parseInt(queue.attributes.MessageRetentionPeriod) / (24 * 60 * 60)} days` : 'N/A'}</td>
        </tr>
        <tr>
            <td>Maximum Message Size</td>
            <td>${(queue.attributes as any)?.MaximumMessageSize ? `${parseInt((queue.attributes as any).MaximumMessageSize) / 1024} KB` : 'N/A'}</td>
        </tr>
        <tr>
            <td>Receive Wait Time</td>
            <td>${queue.attributes?.ReceiveMessageWaitTimeSeconds || 'N/A'} seconds</td>
        </tr>
        <tr>
            <td>Delay Seconds</td>
            <td>${queue.attributes?.DelaySeconds || 'N/A'} seconds</td>
        </tr>
        <tr>
            <td>Created</td>
            <td>${queue.attributes?.CreatedTimestamp ? new Date(parseInt(queue.attributes.CreatedTimestamp) * 1000).toLocaleString() : 'N/A'}</td>
        </tr>
        <tr>
            <td>Last Modified</td>
            <td>${queue.attributes?.LastModifiedTimestamp ? new Date(parseInt(queue.attributes.LastModifiedTimestamp) * 1000).toLocaleString() : 'N/A'}</td>
        </tr>
    </table>

    ${dlqInfo}
    ${aboutMessageCountsInfo}

    <div id="message-list-section">
        <h2>Received Messages</h2>
        <div class="message-receive-controls">
            <div class="controls-row">
                <label for="search-messages">Search messages...</label>
                <input type="text" id="search-messages" placeholder="Search...">
                <label for="max-messages">Max Messages:</label>
                <input type="number" id="max-messages" value="10" min="1" max="10">
                <label for="visibility-timeout-receive">Visibility Timeout:</label>
                <input type="number" id="visibility-timeout-receive" value="30" min="0" max="43200">
                <label for="wait-time">Wait Time:</label>
                <input type="number" id="wait-time" value="0" min="0" max="20">
                <label for="view-mode">View:</label>
                <select id="view-mode">
                    <option value="formatted">Formatted</option>
                    <option value="raw">Raw</option>
                </select>
                <button id="receive-messages-button" class="vscode-button">Receive Messages</button>
            </div>
        </div>
        <div id="messages-container">
            <p>Loading messages...</p>
        </div>
    </div>

    <div class="message-send-container">
        <h2>Send Message</h2>
        <label for="message-body">Message Body:</label>
        <textarea id="message-body" placeholder="Enter message body..."></textarea>
        <div class="controls-row">
            <input type="checkbox" id="validate-json">
            <label for="validate-json">Validate JSON format</label>
            <label for="delay-seconds">Delay (seconds):</label>
            <input type="number" id="delay-seconds" value="0" min="0" max="900">
            <button id="add-attribute-button" class="vscode-button">Add Attribute</button>
        </div>
        <button id="send-message-button" class="vscode-button">Send Message</button>
    </div>



    <script nonce="${nonce}" src="${scriptUri}?nonce=${nonce}"></script>
</body>
</html>`;
  return htmlContent;
}



function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
