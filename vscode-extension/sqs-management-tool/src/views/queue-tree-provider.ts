import * as vscode from 'vscode';
import { QueueConfig } from '../models/queue-storage';
import { QueueStorage } from '../services/queue-storage';

/**
 * Queue Tree Item Interface
 * 
 * Represents an item in the queue tree view.
 * Can be either a region group or an individual queue.
 */
export interface QueueTreeItem {
    id: string;
    label: string;
    description?: string;
    iconPath?: vscode.ThemeIcon;
    contextValue: string;
    queue?: QueueConfig;
    collapsibleState: vscode.TreeItemCollapsibleState;
}

/**
 * Queue Tree Provider Interface
 * 
 * Extends VS Code's TreeDataProvider to display queues grouped by region
 * with appropriate icons and context menu actions.
 */
export interface IQueueTreeProvider extends vscode.TreeDataProvider<QueueTreeItem> {
    /**
     * Refresh the tree view
     */
    refresh(): void;

    /**
     * Get the tree item representation
     */
    getTreeItem(element: QueueTreeItem): vscode.TreeItem;

    /**
     * Get children of a tree item
     */
    getChildren(element?: QueueTreeItem): Promise<QueueTreeItem[]>;
}

/**
 * Queue Tree Data Provider Implementation
 * 
 * Displays queues grouped by region with icons indicating queue type
 * (standard, FIFO, DLQ) and region as description.
 */
export class QueueTreeDataProvider implements IQueueTreeProvider {
    private _onDidChangeTreeData: vscode.EventEmitter<QueueTreeItem | undefined | void> =
        new vscode.EventEmitter<QueueTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<QueueTreeItem | undefined | void> =
        this._onDidChangeTreeData.event;

    constructor(private queueStorage: QueueStorage) { }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get the tree item representation
     */
    getTreeItem(element: QueueTreeItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
        treeItem.id = element.id;
        treeItem.description = element.description;
        treeItem.iconPath = element.iconPath;
        treeItem.contextValue = element.contextValue;

        // Add command to select queue when clicked (only for queue items, not regions)
        if (element.queue) {
            treeItem.command = {
                command: 'sqs-management-tool.selectQueue',
                title: 'Select Queue',
                arguments: [element.queue]
            };
            treeItem.tooltip = this.createQueueTooltip(element.queue);
        }

        return treeItem;
    }

    /**
     * Get children of a tree item
     * 
     * If element is undefined, returns region groups.
     * If element is a region, returns queues in that region.
     */
    async getChildren(element?: QueueTreeItem): Promise<QueueTreeItem[]> {
        try {
            const queues = await this.queueStorage.getQueues();

            if (queues.length === 0 && !element) {
                vscode.window.showInformationMessage(
                    'No SQS queues configured. Add one using the command palette (Ctrl+Shift+P) with "SQS: Add Queue".'
                );
                return [];
            }

            if (!element) {
                // Root level: return region groups
                return this.getRegionGroups(queues);
            } else if (element.contextValue === 'regionGroup') {
                // Region level: return queues in this region
                return this.getQueuesInRegion(queues, element.label);
            } else {
                // Queue level: no children
                return [];
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to load SQS queues: ${error.message}`);
            return [];
        }
    }

    /**
     * Get region groups from queues
     */
    private getRegionGroups(queues: QueueConfig[]): QueueTreeItem[] {
        // Group queues by region
        const regionMap = new Map<string, QueueConfig[]>();
        for (const queue of queues) {
            const region = queue.region;
            if (!regionMap.has(region)) {
                regionMap.set(region, []);
            }
            regionMap.get(region)!.push(queue);
        }

        // Create region group items
        const regionGroups: QueueTreeItem[] = [];
        for (const [region, regionQueues] of regionMap.entries()) {
            regionGroups.push({
                id: `region-${region}`,
                label: region,
                description: `${regionQueues.length} queue${regionQueues.length !== 1 ? 's' : ''}`,
                iconPath: new vscode.ThemeIcon('globe'),
                contextValue: 'regionGroup',
                collapsibleState: vscode.TreeItemCollapsibleState.Expanded
            });
        }

        // Sort regions alphabetically
        regionGroups.sort((a, b) => a.label.localeCompare(b.label));

        return regionGroups;
    }

    /**
     * Get queues in a specific region
     */
    private getQueuesInRegion(queues: QueueConfig[], region: string): QueueTreeItem[] {
        const regionQueues = queues.filter(q => q.region === region);

        return regionQueues.map(queue => ({
            id: queue.id,
            label: queue.name,
            description: queue.region,
            iconPath: this.getQueueIcon(queue),
            contextValue: 'queueItem',
            queue: queue,
            collapsibleState: vscode.TreeItemCollapsibleState.None
        }));
    }

    /**
     * Get appropriate icon for queue type
     */
    private getQueueIcon(queue: QueueConfig): vscode.ThemeIcon {
        // Check if it's a DLQ (Dead Letter Queue)
        if (queue.name.toLowerCase().includes('dlq') ||
            queue.name.toLowerCase().includes('dead-letter') ||
            queue.name.toLowerCase().includes('deadletter')) {
            return new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
        }

        // Check if it's a FIFO queue
        if (queue.name.endsWith('.fifo')) {
            return new vscode.ThemeIcon('list-ordered');
        }

        // Standard queue
        return new vscode.ThemeIcon('inbox');
    }

    /**
     * Create tooltip for queue
     */
    private createQueueTooltip(queue: QueueConfig): string {
        const lines = [
            `Name: ${queue.name}`,
            `Region: ${queue.region}`,
            `URL: ${queue.url}`,
            `ID: ${queue.id}`
        ];

        if (queue.dlqUrl) {
            lines.push(`DLQ: ${queue.dlqName || queue.dlqUrl}`);
        }

        if (queue.addedManually) {
            lines.push('Added manually');
        }

        if (queue.favorite) {
            lines.push('⭐ Favorite');
        }

        if (queue.tags && queue.tags.length > 0) {
            lines.push(`Tags: ${queue.tags.join(', ')}`);
        }

        if (queue.attributes) {
            const attrs = queue.attributes;
            if (attrs.ApproximateNumberOfMessages) {
                lines.push(`Messages: ${attrs.ApproximateNumberOfMessages}`);
            }
            if (attrs.ApproximateNumberOfMessagesNotVisible) {
                lines.push(`In Flight: ${attrs.ApproximateNumberOfMessagesNotVisible}`);
            }
        }

        return lines.join('\n');
    }
}
