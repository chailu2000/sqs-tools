/**
 * Extension Context Fixture
 * 
 * Provides access to VS Code API and extension functionality for E2E tests.
 */

import * as vscode from 'vscode';

export interface WebviewHandle {
    panel: vscode.WebviewPanel;
    postMessage(message: any): Promise<void>;
    waitForMessage(command: string, timeout?: number): Promise<any>;
    dispose(): void;
}

export class ExtensionTestContext {
    public readonly vscode = vscode;
    public extension: vscode.Extension<any> | undefined;

    /**
     * Activate the extension
     */
    async activateExtension(): Promise<void> {
        // Try different extension ID formats
        const possibleIds = [
            'undefined_publisher.sqs-management-tool',
            'sqs-management-tool',
            'publisher.sqs-management-tool'
        ];

        let foundExtension: vscode.Extension<any> | undefined;

        for (const id of possibleIds) {
            foundExtension = vscode.extensions.getExtension(id);
            if (foundExtension) {
                this.extension = foundExtension;
                break;
            }
        }

        if (!this.extension) {
            // List all extensions to help debug
            const allExtensions = vscode.extensions.all.map(ext => ext.id);
            console.log('Available extensions:', allExtensions);
            throw new Error(`Extension not found. Tried: ${possibleIds.join(', ')}`);
        }

        if (!this.extension.isActive) {
            await this.extension.activate();
        }

        // Wait a bit for extension to fully initialize
        await this.sleep(1000);
    }

    /**
     * Execute a VS Code command
     */
    async executeCommand<T = any>(command: string, ...args: any[]): Promise<T> {
        return await vscode.commands.executeCommand<T>(command, ...args);
    }

    /**
     * Get tree view items
     */
    async getTreeItems(): Promise<vscode.TreeItem[]> {
        // This is a simplified version - in reality, you'd need to access the tree data provider
        // For now, we'll return an empty array and implement this properly when needed
        return [];
    }

    /**
     * Open a webview for a queue
     */
    async openWebview(queueUrl: string): Promise<WebviewHandle> {
        // Execute the selectQueue command
        await this.executeCommand('sqs-management-tool.selectQueue', { queueUrl });

        // Wait for webview to be created
        await this.sleep(1000);

        // Find the webview panel (this is simplified - in reality you'd track panels)
        // For now, we'll create a mock handle
        const panel = await this.findWebviewPanel();

        return this.createWebviewHandle(panel);
    }

    /**
     * Wait for a condition to be true
     */
    async waitForCondition(
        predicate: () => boolean | Promise<boolean>,
        timeout: number = 5000
    ): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (await predicate()) {
                return;
            }
            await this.sleep(100);
        }

        throw new Error('Timeout waiting for condition');
    }

    /**
     * Dispose resources
     */
    async dispose(): Promise<void> {
        // Close all webviews
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

        // Wait for cleanup
        await this.sleep(500);
    }

    /**
     * Find webview panel (helper method)
     */
    private async findWebviewPanel(): Promise<vscode.WebviewPanel> {
        // This is a placeholder - in reality, you'd need to track panels
        // For now, we'll throw an error to indicate this needs implementation
        throw new Error('findWebviewPanel not yet implemented - needs panel tracking');
    }

    /**
     * Create webview handle
     */
    private createWebviewHandle(panel: vscode.WebviewPanel): WebviewHandle {
        return {
            panel,
            postMessage: async (message: any) => {
                await panel.webview.postMessage(message);
            },
            waitForMessage: (command: string, timeout: number = 5000) => {
                return new Promise((resolve, reject) => {
                    const timer = setTimeout(() => {
                        reject(new Error(`Timeout waiting for message: ${command}`));
                    }, timeout);

                    const disposable = panel.webview.onDidReceiveMessage(msg => {
                        if (msg.command === command) {
                            clearTimeout(timer);
                            disposable.dispose();
                            resolve(msg);
                        }
                    });
                });
            },
            dispose: () => {
                panel.dispose();
            }
        };
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Create extension test context
 */
export async function createExtensionContext(): Promise<ExtensionTestContext> {
    const context = new ExtensionTestContext();
    await context.activateExtension();
    return context;
}
