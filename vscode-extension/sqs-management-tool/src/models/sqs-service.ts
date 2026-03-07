/**
 * SQS Service Interface and Type Definitions
 * 
 * This file defines the interfaces for the SQS service layer that replicates
 * backend QueueService, MessageService, and RedriveService functionality.
 */

import { MessageAttributeValue } from '@aws-sdk/client-sqs';

/**
 * Result of attempting to list queues
 */
export interface ListQueuesResult {
    queues: string[];
    hasPermission: boolean;
}

/**
 * Result of validating queue access
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
    requiredPermissions?: string[];
}

/**
 * Queue attributes returned from AWS SQS
 */
export interface QueueAttributes {
    [key: string]: string;
}

/**
 * Dead Letter Queue information extracted from RedrivePolicy
 */
export interface DlqInfo {
    dlqUrl: string;
    dlqName: string;
    maxReceiveCount: number;
}

/**
 * Options for receiving messages
 */
export interface ReceiveOptions {
    maxMessages: number;
    visibilityTimeout: number;
    waitTimeSeconds: number;
}

/**
 * Options for sending messages
 */
export interface SendOptions {
    delaySeconds?: number;
    messageAttributes?: Record<string, MessageAttributeValue>;
}

/**
 * SQS Message structure
 */
export interface Message {
    messageId: string;
    body: string;
    receiptHandle: string;
    md5OfBody?: string;
    attributes: Record<string, string>;
    messageAttributes: Record<string, MessageAttributeValue>;
}

/**
 * Result of sending a message
 */
export interface SendResult {
    messageId: string;
}

/**
 * Options for redrive operations
 */
export interface RedriveOptions {
    maxMessages: number;
    redriveAll: boolean;
}

/**
 * Result of a redrive operation
 */
export interface RedriveResult {
    processedCount: number;
    successCount: number;
    failureCount: number;
    succeeded: Array<{ messageId: string }>;
    failed: Array<{ messageId: string; error: string }>;
}

/**
 * Main SQS Service Interface
 * 
 * Replicates backend functionality:
 * - Queue Operations (QueueService equivalent)
 * - Message Operations (MessageService equivalent)
 * - Redrive Operations (RedriveService equivalent)
 */
export interface ISQSService {
    // Queue Operations (QueueService equivalent)

    /**
     * Attempt to list queues with graceful AccessDenied handling
     * Returns hasPermission: false if ListQueues is denied
     */
    tryListQueues(): Promise<ListQueuesResult>;

    /**
     * Get queue URL from queue name
     */
    getQueueUrl(queueName: string, accountId?: string): Promise<string>;

    /**
     * Get all attributes for a queue
     */
    getQueueAttributes(queueUrl: string): Promise<QueueAttributes>;

    /**
     * Validate that the user has access to a queue
     */
    validateQueueAccess(queueUrl: string): Promise<ValidationResult>;

    /**
     * Extract DLQ information from queue attributes
     */
    extractDlqFromAttributes(attributes: QueueAttributes): DlqInfo | null;

    /**
     * Extract queue name from queue URL
     */
    extractQueueName(queueUrl: string): string;

    // Message Operations (MessageService equivalent)

    /**
     * Receive messages from a queue
     */
    receiveMessages(queueUrl: string, options: ReceiveOptions): Promise<Message[]>;

    /**
     * Send a message to a queue
     */
    sendMessage(queueUrl: string, body: string, options: SendOptions): Promise<SendResult>;

    /**
     * Delete a message from a queue
     */
    deleteMessage(queueUrl: string, receiptHandle: string): Promise<void>;

    /**
     * Change the visibility timeout of a message
     */
    changeMessageVisibility(queueUrl: string, receiptHandle: string, timeout: number): Promise<void>;

    /**
     * Purge all messages from a queue
     */
    purgeQueue(queueUrl: string): Promise<void>;

    // Redrive Operations (RedriveService equivalent)

    /**
     * Redrive messages from DLQ to main queue
     */
    redriveMessages(dlqUrl: string, mainQueueUrl: string, options: RedriveOptions): Promise<RedriveResult>;

    /**
     * Redrive specific messages from DLQ to main queue
     */
    redriveSelectedMessages(dlqUrl: string, mainQueueUrl: string, messages: Message[]): Promise<RedriveResult>;
}
