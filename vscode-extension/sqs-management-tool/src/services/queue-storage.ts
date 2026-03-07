import * as vscode from 'vscode';
import { IQueueStorage, QueueConfig, STORAGE_SCHEMA_VERSION } from '../models/queue-storage';

/**
 * Queue Storage Service
 * 
 * Implements queue persistence using VS Code GlobalState and WorkspaceState APIs.
 * Supports schema versioning for future migration support.
 */
export class QueueStorage implements IQueueStorage {
    private readonly GLOBAL_STATE_KEY = 'queues';
    private readonly WORKSPACE_STATE_KEY = 'queues';
    private readonly SCHEMA_VERSION_KEY = 'queueStorageSchemaVersion';

    private useWorkspace: boolean = false;

    constructor(private context: vscode.ExtensionContext) { }

    /**
     * Get all queues from storage
     */
    async getQueues(): Promise<QueueConfig[]> {
        const queues = this.useWorkspace
            ? this.context.workspaceState.get<QueueConfig[]>(this.WORKSPACE_STATE_KEY, [])
            : this.context.globalState.get<QueueConfig[]>(this.GLOBAL_STATE_KEY, []);

        return queues || [];
    }

    /**
     * Get a specific queue by ID
     */
    async getQueue(id: string): Promise<QueueConfig | null> {
        const queues = await this.getQueues();
        return queues.find(q => q.id === id) || null;
    }

    /**
     * Add a new queue to storage
     */
    async addQueue(queue: QueueConfig): Promise<void> {
        const queues = await this.getQueues();

        // Check if queue with same ID already exists
        if (queues.some(q => q.id === queue.id)) {
            throw new Error(`Queue with ID ${queue.id} already exists`);
        }

        queues.push(queue);
        await this.saveQueues(queues);
    }

    /**
     * Update an existing queue in storage
     */
    async updateQueue(id: string, updates: Partial<QueueConfig>): Promise<void> {
        const queues = await this.getQueues();
        const index = queues.findIndex(q => q.id === id);

        if (index === -1) {
            throw new Error(`Queue with ID ${id} not found`);
        }

        // Update the queue with new values
        queues[index] = {
            ...queues[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.saveQueues(queues);
    }

    /**
     * Remove a queue from storage
     */
    async removeQueue(id: string): Promise<void> {
        const queues = await this.getQueues();
        const filteredQueues = queues.filter(q => q.id !== id);

        if (filteredQueues.length === queues.length) {
            throw new Error(`Queue with ID ${id} not found`);
        }

        await this.saveQueues(filteredQueues);
    }

    /**
     * Import multiple queues from an array
     */
    async importQueues(queues: QueueConfig[]): Promise<void> {
        const existingQueues = await this.getQueues();

        // Merge queues, avoiding duplicates
        const mergedQueues = [...existingQueues];
        for (const queue of queues) {
            if (!mergedQueues.some(q => q.id === queue.id)) {
                mergedQueues.push(queue);
            }
        }

        await this.saveQueues(mergedQueues);
    }

    /**
     * Export all queues as an array
     */
    async exportQueues(): Promise<QueueConfig[]> {
        return await this.getQueues();
    }

    /**
     * Search queues by name or URL
     */
    async searchQueues(query: string): Promise<QueueConfig[]> {
        const queues = await this.getQueues();
        const lowerQuery = query.toLowerCase();

        return queues.filter(q =>
            q.name.toLowerCase().includes(lowerQuery) ||
            q.url.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get queues filtered by region
     */
    async getQueuesByRegion(region: string): Promise<QueueConfig[]> {
        const queues = await this.getQueues();
        return queues.filter(q => q.region === region);
    }

    /**
     * Get favorite queues
     */
    async getFavoriteQueues(): Promise<QueueConfig[]> {
        const queues = await this.getQueues();
        return queues.filter(q => q.favorite === true);
    }

    /**
     * Toggle between global and workspace storage
     */
    useWorkspaceStorage(enabled: boolean): void {
        this.useWorkspace = enabled;
    }

    /**
     * Refresh queue attributes from AWS and update storage
     */
    async refreshAttributes(id: string, sqsService: any): Promise<QueueConfig> {
        const queue = await this.getQueue(id);

        if (!queue) {
            throw new Error(`Queue with ID ${id} not found`);
        }

        // Get fresh attributes from AWS
        const attributes = await sqsService.getQueueAttributes(queue.url);

        // Update the queue with fresh attributes
        const updatedQueue: QueueConfig = {
            ...queue,
            attributes: {
                ...queue.attributes,
                ...attributes
            },
            updatedAt: new Date().toISOString()
        };

        // Save updated queue to storage
        await this.updateQueue(id, updatedQueue);

        return updatedQueue;
    }

    /**
     * Save queues to appropriate storage (GlobalState or WorkspaceState)
     */
    private async saveQueues(queues: QueueConfig[]): Promise<void> {
        // Update schema version
        await this.context.globalState.update(this.SCHEMA_VERSION_KEY, STORAGE_SCHEMA_VERSION);

        // Save queues
        if (this.useWorkspace) {
            await this.context.workspaceState.update(this.WORKSPACE_STATE_KEY, queues);
        } else {
            await this.context.globalState.update(this.GLOBAL_STATE_KEY, queues);
        }
    }
}