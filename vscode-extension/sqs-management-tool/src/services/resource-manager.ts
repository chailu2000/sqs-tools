/**
 * Resource management service for the SQS Management Tool extension.
 * 
 * This service manages:
 * - Request throttling (limit concurrent AWS API calls)
 * - Queue attribute refresh throttling
 * - Client disposal on deactivation
 * - Queue storage limits
 */

import * as vscode from 'vscode';
import { SQSClient } from '@aws-sdk/client-sqs';
import { OutputLogger } from '../utils/logger';

/**
 * Manages concurrent requests per queue
 */
class RequestThrottler {
    private queueRequests: Map<string, number> = new Map();
    private readonly maxConcurrentRequests = 5;
    private pendingRequests: Map<string, Array<() => void>> = new Map();

    /**
     * Executes an operation with throttling for a specific queue.
     * Limits concurrent requests to 5 per queue.
     * 
     * @param queueUrl - The queue URL
     * @param operation - The async operation to execute
     * @returns Promise resolving to the operation result
     */
    async execute<T>(queueUrl: string, operation: () => Promise<T>): Promise<T> {
        // Wait for available slot
        await this.waitForSlot(queueUrl);

        // Increment active requests
        const current = this.queueRequests.get(queueUrl) || 0;
        this.queueRequests.set(queueUrl, current + 1);

        try {
            // Execute the operation
            return await operation();
        } finally {
            // Decrement active requests
            const updated = this.queueRequests.get(queueUrl)! - 1;
            this.queueRequests.set(queueUrl, updated);

            // Process next pending request if any
            this.processNextPending(queueUrl);
        }
    }

    /**
     * Waits for an available request slot for the queue
     */
    private async waitForSlot(queueUrl: string): Promise<void> {
        const current = this.queueRequests.get(queueUrl) || 0;

        if (current < this.maxConcurrentRequests) {
            return; // Slot available
        }

        // Wait for a slot to become available
        return new Promise<void>((resolve) => {
            const pending = this.pendingRequests.get(queueUrl) || [];
            pending.push(resolve);
            this.pendingRequests.set(queueUrl, pending);
        });
    }

    /**
     * Processes the next pending request for a queue
     */
    private processNextPending(queueUrl: string): void {
        const pending = this.pendingRequests.get(queueUrl);
        if (pending && pending.length > 0) {
            const next = pending.shift()!;
            if (pending.length === 0) {
                this.pendingRequests.delete(queueUrl);
            }
            next();
        }
    }

    /**
     * Gets the current number of active requests for a queue
     */
    getActiveRequests(queueUrl: string): number {
        return this.queueRequests.get(queueUrl) || 0;
    }

    /**
     * Clears all throttling state
     */
    clear(): void {
        this.queueRequests.clear();
        this.pendingRequests.clear();
    }
}

/**
 * Manages queue attribute refresh throttling
 */
class RefreshThrottler {
    private lastRefresh: Map<string, number> = new Map();
    private readonly throttleMs = 30000; // 30 seconds

    /**
     * Checks if a queue can be refreshed (not refreshed in last 30 seconds)
     * 
     * @param queueUrl - The queue URL
     * @returns True if refresh is allowed
     */
    canRefresh(queueUrl: string): boolean {
        const last = this.lastRefresh.get(queueUrl);
        if (!last) {
            return true;
        }

        const elapsed = Date.now() - last;
        return elapsed >= this.throttleMs;
    }

    /**
     * Records a refresh for a queue
     * 
     * @param queueUrl - The queue URL
     */
    recordRefresh(queueUrl: string): void {
        this.lastRefresh.set(queueUrl, Date.now());
    }

    /**
     * Gets the time remaining until next refresh is allowed (in seconds)
     * 
     * @param queueUrl - The queue URL
     * @returns Seconds remaining, or 0 if refresh is allowed
     */
    getTimeRemaining(queueUrl: string): number {
        const last = this.lastRefresh.get(queueUrl);
        if (!last) {
            return 0;
        }

        const elapsed = Date.now() - last;
        const remaining = this.throttleMs - elapsed;
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }

    /**
     * Clears all refresh state
     */
    clear(): void {
        this.lastRefresh.clear();
    }
}

/**
 * Resource manager for the extension
 */
export class ResourceManager {
    private static instance: ResourceManager | null = null;
    private logger: OutputLogger;
    private requestThrottler: RequestThrottler;
    private refreshThrottler: RefreshThrottler;
    private clients: Map<string, SQSClient> = new Map();
    private readonly maxStoredQueues = 1000;
    private readonly warningThreshold = 900; // 90% of max

    private constructor() {
        this.logger = OutputLogger.getInstance();
        this.requestThrottler = new RequestThrottler();
        this.refreshThrottler = new RefreshThrottler();
    }

    /**
     * Gets the singleton instance
     */
    static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }

    /**
     * Executes an AWS API operation with request throttling.
     * Limits concurrent requests to 5 per queue.
     * 
     * @param queueUrl - The queue URL
     * @param operation - The async operation to execute
     * @returns Promise resolving to the operation result
     */
    async executeWithThrottling<T>(queueUrl: string, operation: () => Promise<T>): Promise<T> {
        return this.requestThrottler.execute(queueUrl, operation);
    }

    /**
     * Checks if a queue can be refreshed (throttled to once per 30 seconds).
     * 
     * @param queueUrl - The queue URL
     * @returns True if refresh is allowed
     */
    canRefreshQueue(queueUrl: string): boolean {
        return this.refreshThrottler.canRefresh(queueUrl);
    }

    /**
     * Records a queue refresh operation.
     * 
     * @param queueUrl - The queue URL
     */
    recordQueueRefresh(queueUrl: string): void {
        this.refreshThrottler.recordRefresh(queueUrl);
    }

    /**
     * Gets the time remaining until next refresh is allowed.
     * 
     * @param queueUrl - The queue URL
     * @returns Seconds remaining, or 0 if refresh is allowed
     */
    getRefreshTimeRemaining(queueUrl: string): number {
        return this.refreshThrottler.getTimeRemaining(queueUrl);
    }

    /**
     * Registers an SQS client for disposal on deactivation.
     * 
     * @param region - The AWS region
     * @param client - The SQS client instance
     */
    registerClient(region: string, client: SQSClient): void {
        this.clients.set(region, client);
        this.logger.info(`Registered SQS client for region: ${region}`);
    }

    /**
     * Disposes all registered SQS clients.
     * Called when the extension deactivates.
     */
    disposeClients(): void {
        this.logger.info(`Disposing ${this.clients.size} SQS clients`);

        for (const [region, client] of this.clients.entries()) {
            try {
                client.destroy();
                this.logger.info(`Disposed SQS client for region: ${region}`);
            } catch (error: any) {
                this.logger.error(`Failed to dispose client for region ${region}`, error);
            }
        }

        this.clients.clear();
    }

    /**
     * Checks if adding a queue would exceed the storage limit.
     * 
     * @param currentCount - Current number of stored queues
     * @returns Object with canAdd flag and optional warning message
     */
    checkQueueStorageLimit(currentCount: number): { canAdd: boolean; warning?: string } {
        if (currentCount >= this.maxStoredQueues) {
            return {
                canAdd: false,
                warning: `Queue storage limit reached (${this.maxStoredQueues} queues). Please remove some queues before adding new ones.`
            };
        }

        if (currentCount >= this.warningThreshold) {
            return {
                canAdd: true,
                warning: `Approaching queue storage limit (${currentCount}/${this.maxStoredQueues}). Consider removing unused queues.`
            };
        }

        return { canAdd: true };
    }

    /**
     * Shows a warning message if approaching queue storage limit.
     * 
     * @param currentCount - Current number of stored queues
     */
    async showStorageLimitWarning(currentCount: number): Promise<void> {
        const check = this.checkQueueStorageLimit(currentCount);

        if (check.warning) {
            if (!check.canAdd) {
                await vscode.window.showErrorMessage(check.warning);
            } else {
                await vscode.window.showWarningMessage(check.warning);
            }
        }
    }

    /**
     * Gets the maximum number of queues that can be stored.
     */
    getMaxStoredQueues(): number {
        return this.maxStoredQueues;
    }

    /**
     * Disposes all resources and clears state.
     * Called when the extension deactivates.
     */
    dispose(): void {
        this.logger.info('Disposing resource manager');
        this.disposeClients();
        this.requestThrottler.clear();
        this.refreshThrottler.clear();
        ResourceManager.instance = null;
    }
}
