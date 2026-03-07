/**
 * Queue Storage Interface and Type Definitions
 * 
 * This file defines the interfaces for queue storage using VS Code GlobalState API.
 * It provides CRUD operations for queue configurations with persistence support.
 */

/**
 * Queue configuration stored in VS Code GlobalState
 */
export interface QueueConfig {
    // Identity
    id: string;                    // UUID
    name: string;                  // Queue name (e.g., "my-queue")
    url: string;                   // Full queue URL
    region: string;                // AWS region (e.g., "us-east-1")

    // Dead Letter Queue
    dlqUrl?: string;               // DLQ URL if configured
    dlqName?: string;              // DLQ name

    // Attributes (cached from GetQueueAttributes)
    attributes?: {
        ApproximateNumberOfMessages?: string;
        ApproximateNumberOfMessagesNotVisible?: string;
        ApproximateNumberOfMessagesDelayed?: string;
        MessageRetentionPeriod?: string;
        VisibilityTimeout?: string;
        DelaySeconds?: string;
        ReceiveMessageWaitTimeSeconds?: string;
        QueueArn?: string;
        CreatedTimestamp?: string;
        LastModifiedTimestamp?: string;
        RedrivePolicy?: string;
    };

    // Metadata
    addedManually: boolean;        // True if added manually (not auto-discovered)
    favorite?: boolean;            // User-marked favorite
    tags?: string[];               // User-defined tags
    createdAt: string;             // ISO timestamp
    updatedAt: string;             // ISO timestamp
}

/**
 * Storage schema version for migration support
 */
export const STORAGE_SCHEMA_VERSION = '1.0.0';

/**
 * Queue Storage Interface
 * 
 * Provides CRUD operations for queue configurations using VS Code GlobalState.
 * Supports both global and workspace-specific queue lists.
 */
export interface IQueueStorage {
    // CRUD Operations

    /**
     * Get all queues from storage
     * @returns Array of queue configurations
     */
    getQueues(): Promise<QueueConfig[]>;

    /**
     * Get a specific queue by ID
     * @param id Queue ID
     * @returns Queue configuration or null if not found
     */
    getQueue(id: string): Promise<QueueConfig | null>;

    /**
     * Add a new queue to storage
     * @param queue Queue configuration to add
     */
    addQueue(queue: QueueConfig): Promise<void>;

    /**
     * Update an existing queue in storage
     * @param id Queue ID to update
     * @param updates Partial queue configuration with fields to update
     */
    updateQueue(id: string, updates: Partial<QueueConfig>): Promise<void>;

    /**
     * Remove a queue from storage
     * @param id Queue ID to remove
     */
    removeQueue(id: string): Promise<void>;

    // Bulk Operations

    /**
     * Import multiple queues from an array
     * @param queues Array of queue configurations to import
     */
    importQueues(queues: QueueConfig[]): Promise<void>;

    /**
     * Export all queues as an array
     * @returns Array of all queue configurations
     */
    exportQueues(): Promise<QueueConfig[]>;

    // Search and Filter

    /**
     * Search queues by name or URL
     * @param query Search query
     * @returns Array of matching queue configurations
     */
    searchQueues(query: string): Promise<QueueConfig[]>;

    /**
     * Get queues filtered by region
     * @param region AWS region
     * @returns Array of queues in the specified region
     */
    getQueuesByRegion(region: string): Promise<QueueConfig[]>;

    /**
     * Get favorite queues
     * @returns Array of favorite queue configurations
     */
    getFavoriteQueues(): Promise<QueueConfig[]>;

    // Workspace Support

    /**
     * Toggle between global and workspace storage
     * @param enabled If true, use workspace storage; otherwise use global storage
     */
    useWorkspaceStorage(enabled: boolean): void;

    /**
     * Refresh queue attributes from AWS and update storage
     * @param id Queue ID to refresh
     * @param sqsService SQS service instance for AWS API calls
     * @returns Updated queue configuration
     */
    refreshAttributes(id: string, sqsService: any): Promise<QueueConfig>;
}