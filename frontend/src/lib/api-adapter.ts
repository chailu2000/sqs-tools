/**
 * API Adapter for VS Code Extension
 * Converts HTTP API calls to postMessage communication with the extension host
 */

// VS Code API - use global instance set by extension HTML
declare global {
    interface Window {
        vscode: any;
        initialQueue: any;
    }
}

const vscode = window.vscode;

export interface Message {
    messageId: string;
    receiptHandle: string;
    body: string;
    attributes: {
        SentTimestamp?: string;
        ApproximateReceiveCount?: string;
        ApproximateFirstReceiveTimestamp?: string;
        SenderId?: string;
        MessageGroupId?: string;
        MessageDeduplicationId?: string;
        [key: string]: string | undefined;
    };
    messageAttributes?: {
        [key: string]: {
            stringValue?: string;
            binaryValue?: string;
            dataType: string;
        };
    };
}

export interface QueueConfiguration {
    id: string;
    queueName: string;
    queueUrl: string;
    region: string;
    dlqUrl?: string;
    dlqName?: string;
    attributes: { [key: string]: string };
}

export interface RedriveResult {
    successCount: number;
    failureCount: number;
    processedCount: number;
    succeeded: Array<{ messageId: string }>;
    failed: Array<{ messageId: string; error: string }>;
}

/**
 * Helper to create a promise that resolves when a specific message is received
 */
function waitForMessage<T>(commandName: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.command === commandName) {
                window.removeEventListener('message', handler);
                if (msg.error) {
                    reject(new Error(msg.error));
                } else {
                    resolve(msg as T);
                }
            }
        };
        window.addEventListener('message', handler);

        // Timeout after 30 seconds
        setTimeout(() => {
            window.removeEventListener('message', handler);
            reject(new Error(`Timeout waiting for ${commandName}`));
        }, 30000);
    });
}

export const api = {
    /**
     * Receive messages from the queue
     */
    async receiveMessages(
        queueId: string,
        options: {
            maxMessages: number;
            visibilityTimeout: number;
            waitTimeSeconds?: number;
            peek?: boolean;
        }
    ): Promise<Message[]> {
        const promise = waitForMessage<{ messages: Message[] }>('messagesLoaded');

        vscode.postMessage({
            command: 'fetchMessages',
            queueId,
            maxMessages: options.maxMessages,
            visibilityTimeout: options.visibilityTimeout,
            waitTimeSeconds: options.waitTimeSeconds || 0
        });

        const result = await promise;
        return result.messages || [];
    },

    /**
     * Receive messages from the DLQ
     */
    async receiveDlqMessages(
        queueId: string,
        options: {
            maxMessages: number;
            visibilityTimeout: number;
            peek?: boolean;
        }
    ): Promise<Message[]> {
        const promise = waitForMessage<{ messages: Message[] }>('dlqMessagesLoaded');

        vscode.postMessage({
            command: 'fetchDLQMessages',
            queueId,
            maxMessages: options.maxMessages,
            visibilityTimeout: options.visibilityTimeout
        });

        const result = await promise;
        return result.messages || [];
    },

    /**
     * Delete a single message
     */
    async deleteMessage(queueId: string, receiptHandle: string, dlq: boolean = false): Promise<void> {
        const promise = waitForMessage<{ success: boolean }>('messageDeleted');

        vscode.postMessage({
            command: 'deleteMessage',
            queueId,
            receiptHandle,
            dlq
        });

        await promise;
    },

    /**
     * Redrive selected messages from DLQ to main queue
     */
    async redriveSelectedMessages(
        queueId: string,
        messages: Array<{
            messageId: string;
            receiptHandle: string;
            body: string;
            messageAttributes?: any;
        }>
    ): Promise<RedriveResult> {
        const promise = waitForMessage<RedriveResult>('redriveResult');

        // Serialize messages to ensure they can be cloned by postMessage
        const serializedMessages = JSON.parse(JSON.stringify(messages));

        vscode.postMessage({
            command: 'redriveSelectedMessages',
            queueId,
            messages: serializedMessages
        });

        return await promise;
    },

    /**
     * Send a message to the queue
     */
    async sendMessage(
        queueId: string,
        body: string,
        attributes?: { [key: string]: string },
        delaySeconds?: number,
        messageGroupId?: string,
        messageDeduplicationId?: string,
        dlq: boolean = false
    ): Promise<void> {
        const promise = waitForMessage<{ success: boolean }>('messageSent');

        vscode.postMessage({
            command: 'sendMessage',
            queueId,
            body,
            attributes,
            delaySeconds,
            messageGroupId,
            messageDeduplicationId,
            dlq
        });

        await promise;
    },

    /**
     * Purge the queue
     */
    async purgeQueue(queueId: string): Promise<void> {
        const promise = waitForMessage<{ success: boolean }>('queuePurged');

        vscode.postMessage({
            command: 'purgeQueue',
            queueId
        });

        await promise;
    },

    /**
     * Get queue configuration (not needed for extension, queue is passed via context)
     */
    async getQueueConfiguration(queueId: string): Promise<QueueConfiguration> {
        throw new Error('getQueueConfiguration not supported in extension context');
    }
};
