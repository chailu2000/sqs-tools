import { ISQSService } from '../models/sqs-service';

export interface TrackedMessage {
    receiptHandle: string;
    queueUrl: string;
    region: string;
}

/**
 * Service to track SQS message receipt handles during "Peek Mode" or active polling sessions,
 * allowing their visibility timeout to be reset to 0 later.
 */
export class VisibilityTracker {
    // Maps a panel ID (or queue ID) to a set of tracked messages
    private trackedMessages = new Map<string, Set<TrackedMessage>>();

    constructor(private getSqsService: (region: string) => ISQSService) {}

    /**
     * Start tracking a message
     */
    trackMessage(panelId: string, message: TrackedMessage): void {
        if (!this.trackedMessages.has(panelId)) {
            this.trackedMessages.set(panelId, new Set());
        }
        
        // Check if message is already tracked (prevent duplicates)
        const set = this.trackedMessages.get(panelId)!;
        const exists = Array.from(set).some(
            msg => msg.receiptHandle === message.receiptHandle && msg.queueUrl === message.queueUrl
        );
        
        if (!exists) {
            set.add(message);
        }
    }

    /**
     * Stop tracking a message (e.g. when it gets deleted by the user)
     */
    untrackMessage(panelId: string, receiptHandle: string): void {
        const set = this.trackedMessages.get(panelId);
        if (set) {
            for (const item of set) {
                if (item.receiptHandle === receiptHandle) {
                    set.delete(item);
                    break;
                }
            }
            if (set.size === 0) {
                this.trackedMessages.delete(panelId);
            }
        }
    }

    /**
     * Get the count of tracked messages for a panel
     */
    getTrackedCount(panelId: string): number {
        return this.trackedMessages.get(panelId)?.size || 0;
    }

    /**
     * Reset visibility timeout to 0 for all tracked messages under a panel ID
     */
    async resetVisibilityForPanel(panelId: string): Promise<void> {
        const set = this.trackedMessages.get(panelId);
        if (!set || set.size === 0) {
            return;
        }

        const messages = Array.from(set);
        // Clear set immediately so we don't double-reset on concurrent calls
        this.trackedMessages.delete(panelId);

        const promises = messages.map(async (msg) => {
            try {
                const service = this.getSqsService(msg.region);
                await service.changeMessageVisibility(msg.queueUrl, msg.receiptHandle, 0);
            } catch (err: any) {
                // Log warning and continue to next message
                console.error(`[VisibilityTracker] Failed to reset visibility for message: ${err.message}`);
            }
        });

        await Promise.all(promises);
    }
}
