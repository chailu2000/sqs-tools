/**
 * Redrive service with progress notifications and cancellation support.
 * 
 * This service wraps the SQS service redrive operations and adds:
 * - Progress notifications with vscode.window.withProgress
 * - Cancellation support via CancellationToken
 * - Completion summaries
 */

import * as vscode from 'vscode';
import { ISQSService, RedriveOptions, RedriveResult, Message } from '../models/sqs-service';
import { OutputLogger } from '../utils/logger';

/**
 * Service for redriving messages with progress notifications
 */
export class RedriveService {
    private logger: OutputLogger;

    constructor(private sqsService: ISQSService) {
        this.logger = OutputLogger.getInstance();
    }

    /**
     * Redrive messages from DLQ to main queue with progress notifications.
     * 
     * @param dlqUrl - The DLQ URL to receive messages from
     * @param mainQueueUrl - The main queue URL to send messages to
     * @param options - Redrive options
     * @returns Promise resolving to redrive result with counts
     */
    async redriveMessagesWithProgress(
        dlqUrl: string,
        mainQueueUrl: string,
        options: RedriveOptions
    ): Promise<RedriveResult> {
        return await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Redriving messages from DLQ',
                cancellable: true
            },
            async (progress, token) => {
                this.logger.info(`Starting redrive operation: DLQ=${dlqUrl}, Main=${mainQueueUrl}`);

                const result: RedriveResult = {
                    processedCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    succeeded: [],
                    failed: []
                };

                const maxMessages = options.redriveAll ? 10 : options.maxMessages;
                let batchNumber = 0;

                // Set up cancellation handler
                token.onCancellationRequested(() => {
                    this.logger.info('Redrive operation cancelled by user');
                });

                try {
                    while (true) {
                        // Check cancellation before each batch
                        if (token.isCancellationRequested) {
                            this.logger.info(`Redrive cancelled after ${result.processedCount} messages`);
                            vscode.window.showWarningMessage(
                                `Redrive cancelled. Processed ${result.processedCount} messages ` +
                                `(${result.successCount} succeeded, ${result.failureCount} failed)`
                            );
                            return result;
                        }

                        batchNumber++;
                        progress.report({
                            message: `Processing batch ${batchNumber}... (${result.processedCount} messages so far)`,
                            increment: 10
                        });

                        // Receive messages from DLQ
                        const messages = await this.sqsService.receiveMessages(dlqUrl, {
                            maxMessages,
                            visibilityTimeout: 30,
                            waitTimeSeconds: 0
                        });

                        if (messages.length === 0) {
                            this.logger.info('No more messages in DLQ');
                            break;
                        }

                        this.logger.info(`Received ${messages.length} messages from DLQ in batch ${batchNumber}`);

                        // Process each message
                        for (const message of messages) {
                            // Check cancellation before each message
                            if (token.isCancellationRequested) {
                                this.logger.info(`Redrive cancelled after ${result.processedCount} messages`);
                                vscode.window.showWarningMessage(
                                    `Redrive cancelled. Processed ${result.processedCount} messages ` +
                                    `(${result.successCount} succeeded, ${result.failureCount} failed)`
                                );
                                return result;
                            }

                            result.processedCount++;

                            try {
                                // Preserve FIFO attributes if present
                                const messageGroupId = message.attributes ? message.attributes.MessageGroupId : undefined;
                                const messageDeduplicationId = message.attributes ? message.attributes.MessageDeduplicationId : undefined;

                                // Send to main queue with original attributes
                                await this.sqsService.sendMessage(mainQueueUrl, message.body, {
                                    messageAttributes: message.messageAttributes,
                                    messageGroupId,
                                    messageDeduplicationId
                                });

                                // Delete from DLQ only on successful send
                                await this.sqsService.deleteMessage(dlqUrl, message.receiptHandle);

                                result.successCount++;
                                result.succeeded.push(message.messageId);
                            } catch (error: any) {
                                this.logger.error(`Failed to redrive message ${message.messageId}`, error);
                                result.failureCount++;
                                result.failed.push({
                                    messageId: message.messageId,
                                    error: error.message || 'Unknown error'
                                });
                            }
                        }

                        // If not redriving all, stop after first batch
                        if (!options.redriveAll) {
                            break;
                        }
                    }

                    // Show completion summary
                    this.showCompletionSummary(result);
                    return result;

                } catch (error: any) {
                    this.logger.error('Redrive operation failed', error);
                    vscode.window.showErrorMessage(`Redrive failed: ${error.message}`);
                    throw error;
                }
            }
        );
    }

    /**
     * Redrive selected messages with progress notifications.
     * 
     * @param dlqUrl - The DLQ URL
     * @param mainQueueUrl - The main queue URL
     * @param messages - Array of messages to redrive
     * @returns Promise resolving to redrive result
     */
    async redriveSelectedMessagesWithProgress(
        dlqUrl: string,
        mainQueueUrl: string,
        messages: Message[]
    ): Promise<RedriveResult> {
        return await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Redriving ${messages.length} selected messages`,
                cancellable: true
            },
            async (progress, token) => {
                this.logger.info(`Starting selective redrive: ${messages.length} messages`);

                const result: RedriveResult = {
                    processedCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    succeeded: [],
                    failed: []
                };

                // Set up cancellation handler
                token.onCancellationRequested(() => {
                    this.logger.info('Selective redrive cancelled by user');
                });

                try {
                    for (let i = 0; i < messages.length; i++) {
                        // Check cancellation before each message
                        if (token.isCancellationRequested) {
                            this.logger.info(`Selective redrive cancelled after ${result.processedCount} messages`);
                            vscode.window.showWarningMessage(
                                `Redrive cancelled. Processed ${result.processedCount} of ${messages.length} messages ` +
                                `(${result.successCount} succeeded, ${result.failureCount} failed)`
                            );
                            return result;
                        }

                        const message = messages[i];
                        result.processedCount++;

                        // Update progress
                        const percentage = Math.round((i / messages.length) * 100);
                        progress.report({
                            message: `Processing message ${i + 1} of ${messages.length}`,
                            increment: percentage
                        });

                        try {
                            // Preserve FIFO attributes if present
                            const messageGroupId = message.attributes ? message.attributes.MessageGroupId : undefined;
                            const messageDeduplicationId = message.attributes ? message.attributes.MessageDeduplicationId : undefined;

                            // Send to main queue with original attributes
                            await this.sqsService.sendMessage(mainQueueUrl, message.body, {
                                messageAttributes: message.messageAttributes,
                                messageGroupId,
                                messageDeduplicationId
                            });

                            // Delete from DLQ only on successful send
                            await this.sqsService.deleteMessage(dlqUrl, message.receiptHandle);

                            result.successCount++;
                            result.succeeded.push(message.messageId);
                        } catch (error: any) {
                            this.logger.error(`Failed to redrive message ${message.messageId}`, error);
                            result.failureCount++;
                            result.failed.push({
                                messageId: message.messageId,
                                error: error.message || 'Unknown error'
                            });
                        }
                    }

                    // Show completion summary
                    this.showCompletionSummary(result);
                    return result;

                } catch (error: any) {
                    this.logger.error('Selective redrive operation failed', error);
                    vscode.window.showErrorMessage(`Redrive failed: ${error.message}`);
                    throw error;
                }
            }
        );
    }

    /**
     * Shows a completion summary after redrive operation.
     * 
     * @param result - The redrive result
     */
    private showCompletionSummary(result: RedriveResult): void {
        this.logger.info(
            `Redrive completed: ${result.processedCount} processed, ` +
            `${result.successCount} succeeded, ${result.failureCount} failed`
        );

        if (result.failureCount === 0) {
            vscode.window.showInformationMessage(
                `✓ Redrive completed successfully!\n\n` +
                `Processed: ${result.processedCount} messages\n` +
                `Succeeded: ${result.successCount}`
            );
        } else {
            const action = vscode.window.showWarningMessage(
                `Redrive completed with errors\n\n` +
                `Processed: ${result.processedCount} messages\n` +
                `Succeeded: ${result.successCount}\n` +
                `Failed: ${result.failureCount}`,
                'View Output'
            );

            action.then(choice => {
                if (choice === 'View Output') {
                    this.logger.show();
                }
            });
        }
    }
}
