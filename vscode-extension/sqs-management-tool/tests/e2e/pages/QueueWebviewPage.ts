/**
 * Queue Webview Page Object
 * 
 * Provides a high-level API for interacting with the queue webview.
 * Requirements: 10.6, 10.7, 10.8
 */

import * as vscode from 'vscode';
import { waitFor } from '../utils/wait';

export interface Message {
    messageId: string;
    body: string;
    attributes: Record<string, string>;
    messageAttributes: Record<string, any>;
}

export interface PollingStatus {
    isActive: boolean;
    progress: number;
    messageCount: number;
}

export class QueueWebviewPage {
    private messageListeners: Map<string, (msg: any) => void> = new Map();
    private disposables: vscode.Disposable[] = [];

    constructor(private panel: vscode.WebviewPanel) {
        // Set up message listener
        this.disposables.push(
            panel.webview.onDidReceiveMessage(msg => {
                const listener = this.messageListeners.get(msg.command);
                if (listener) {
                    listener(msg);
                }
            })
        );
    }

    /**
     * Post a message to the webview
     */
    async postMessage(message: any): Promise<void> {
        await this.panel.webview.postMessage(message);
    }

    /**
     * Wait for a message from the webview
     */
    async waitForMessage(command: string, timeout: number = 5000): Promise<any> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.messageListeners.delete(command);
                reject(new Error(`Timeout waiting for message: ${command}`));
            }, timeout);

            this.messageListeners.set(command, (msg) => {
                clearTimeout(timer);
                this.messageListeners.delete(command);
                resolve(msg);
            });
        });
    }

    /**
     * Switch to Main Queue tab
     */
    async switchToMainQueueTab(): Promise<void> {
        await this.postMessage({
            command: 'switchTab',
            tab: 'mainQueue'
        });
        await this.waitForMessage('tabSwitched', 2000);
    }

    /**
     * Switch to DLQ tab
     */
    async switchToDLQTab(): Promise<void> {
        await this.postMessage({
            command: 'switchTab',
            tab: 'dlq'
        });
        await this.waitForMessage('tabSwitched', 2000);
    }

    /**
     * Switch to Queue Info tab
     */
    async switchToQueueInfoTab(): Promise<void> {
        await this.postMessage({
            command: 'switchTab',
            tab: 'queueInfo'
        });
        await this.waitForMessage('tabSwitched', 2000);
    }

    /**
     * Start polling for messages
     */
    async startPolling(): Promise<void> {
        await this.postMessage({
            command: 'startPolling'
        });
        await this.waitForMessage('pollingStarted', 2000);
    }

    /**
     * Stop polling for messages
     */
    async stopPolling(): Promise<void> {
        await this.postMessage({
            command: 'stopPolling'
        });
        await this.waitForMessage('pollingStopped', 2000);
    }

    /**
     * Wait for polling to complete
     */
    async waitForPollingComplete(timeout: number = 125000): Promise<void> {
        await this.waitForMessage('pollingComplete', timeout);
    }

    /**
     * Get polling status
     */
    async getPollingStatus(): Promise<PollingStatus> {
        await this.postMessage({
            command: 'getPollingStatus'
        });
        const response = await this.waitForMessage('pollingStatus', 2000);
        return response.status;
    }

    /**
     * Get messages from the table
     */
    async getMessages(): Promise<Message[]> {
        await this.postMessage({
            command: 'getMessages'
        });
        const response = await this.waitForMessage('messagesResponse', 2000);
        return response.messages;
    }

    /**
     * Select a message by ID
     */
    async selectMessage(messageId: string): Promise<void> {
        await this.postMessage({
            command: 'selectMessage',
            messageId
        });
        await this.waitForMessage('messageSelected', 2000);
    }

    /**
     * Delete selected messages
     */
    async deleteSelectedMessages(): Promise<void> {
        await this.postMessage({
            command: 'deleteSelected'
        });
        await this.waitForMessage('messagesDeleted', 5000);
    }

    /**
     * Get DLQ messages
     */
    async getDLQMessages(): Promise<Message[]> {
        await this.postMessage({
            command: 'getDLQMessages'
        });
        const response = await this.waitForMessage('dlqMessagesResponse', 2000);
        return response.messages;
    }

    /**
     * Redrive selected messages from DLQ
     */
    async redriveSelectedMessages(): Promise<void> {
        await this.postMessage({
            command: 'redriveSelected'
        });
        await this.waitForMessage('messagesRedriven', 10000);
    }

    /**
     * Assert message count
     */
    async assertMessageCount(expectedCount: number): Promise<void> {
        await waitFor(
            async () => {
                const messages = await this.getMessages();
                return messages.length === expectedCount;
            },
            { timeout: 5000, errorMessage: `Expected ${expectedCount} messages` }
        );
    }

    /**
     * Assert tab is enabled
     */
    async assertTabEnabled(tabName: string, enabled: boolean): Promise<void> {
        await this.postMessage({
            command: 'isTabEnabled',
            tabName
        });
        const response = await this.waitForMessage('tabEnabledResponse', 2000);

        if (response.enabled !== enabled) {
            throw new Error(`Expected tab ${tabName} to be ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Assert polling is active
     */
    async assertPollingActive(active: boolean): Promise<void> {
        const status = await this.getPollingStatus();

        if (status.isActive !== active) {
            throw new Error(`Expected polling to be ${active ? 'active' : 'inactive'}`);
        }
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        this.messageListeners.clear();
    }
}

/**
 * Create a queue webview page object
 */
export async function createQueueWebviewPage(panel: vscode.WebviewPanel): Promise<QueueWebviewPage> {
    const page = new QueueWebviewPage(panel);

    // Wait for webview to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    return page;
}
