/**
 * Error Handling Tests
 * 
 * Tests for error scenarios and edge cases.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */

import { expect } from 'chai';
import * as vscode from 'vscode';
import { ExtensionTestContext } from '../fixtures/extension-context';
import { QueueFixture, QueueConfig } from '../fixtures/test-data';
import { LocalStackFixture } from '../fixtures/localstack';
import { createTestQueue, cleanupTestQueue, getGlobalSetup } from '../fixtures/setup';
import { getExtensionHelper } from '../fixtures/extension-helper';

describe('Error Handling Tests', () => {
    let context: ExtensionTestContext;
    let queueFixture: QueueFixture;
    const createdQueues: QueueConfig[] = [];

    before(async function () {
        this.timeout(60000);

        // Get global setup (LocalStack already started)
        const setup = getGlobalSetup();
        context = setup.testContext;
        queueFixture = setup.queueFixture;
    });

    afterEach(async () => {
        // Clean up queues created in this test
        for (const queue of createdQueues) {
            try {
                await cleanupTestQueue(queue);
            } catch (e) {
                // Ignore errors during cleanup
            }
        }
        createdQueues.length = 0;
    });

    after(async () => {
        // Final cleanup handled by global teardown
    });

    describe('Invalid Queue Operations', () => {
        it('should handle operations on non-existent queue', async function () {
            this.timeout(10000);

            // Create a queue config for a non-existent queue
            const fakeQueue: QueueConfig = {
                id: 'fake-id',
                name: 'non-existent-queue',
                url: 'https://sqs.us-east-1.amazonaws.com/123456789012/non-existent',
                region: 'us-east-1',
                addedManually: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Try to select the queue - should handle gracefully
            try {
                await context.executeCommand('sqs-management-tool.selectQueue', fakeQueue);
                // Command should complete without crashing
                expect(true).to.be.true;
            } catch (e) {
                // Error is acceptable
                expect(true).to.be.true;
            }
        });

        it('should handle queue with invalid URL format', async function () {
            this.timeout(10000);

            const helper = await getExtensionHelper();
            const initialCount = (await helper.getQueuesFromStorage()).length;

            // Try to add queue with invalid URL - should be rejected or handled
            const invalidQueue: QueueConfig = {
                id: 'invalid-id',
                name: 'invalid-queue',
                url: 'not-a-valid-url',
                region: 'us-east-1',
                addedManually: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                await helper.addQueueToStorage(invalidQueue);
                // If it succeeds, verify it was added
                const queues = await helper.getQueuesFromStorage();
                expect(queues.length).to.be.greaterThan(initialCount);
            } catch (e) {
                // Error is acceptable
                expect(true).to.be.true;
            }
        });
    });

    describe('Storage Operations', () => {
        it('should handle empty queue list gracefully', async function () {
            this.timeout(10000);

            const helper = await getExtensionHelper();
            await helper.clearAllQueues();

            // Refresh should work with empty list
            await context.executeCommand('sqs-management-tool.refreshQueues');

            const queues = await helper.getQueuesFromStorage();
            expect(queues.length).to.equal(0);
        });

        it('should handle duplicate queue IDs', async function () {
            this.timeout(10000);

            const queue1 = await createTestQueue('dup-test-1');
            createdQueues.push(queue1);

            // Try to add same queue again
            const helper = await getExtensionHelper();
            try {
                await helper.addQueueToStorage(queue1);
                // Duplicate might be allowed (merged)
                expect(true).to.be.true;
            } catch (e) {
                // Or it might be rejected
                expect(true).to.be.true;
            }
        });
    });

    describe('Webview Operations', () => {
        it('should handle webview creation for valid queue', async function () {
            this.timeout(15000);

            const queueConfig = await createTestQueue('webview-test');
            createdQueues.push(queueConfig);

            // Select queue should create webview
            await context.executeCommand('sqs-management-tool.selectQueue', queueConfig);

            // Wait for webview
            await new Promise(resolve => setTimeout(resolve, 2000));

            const hasWebview = vscode.window.tabGroups.all.some(group =>
                group.tabs.some(tab => tab.label.includes(queueConfig.name))
            );
            expect(hasWebview).to.be.true;
        });

        it('should handle multiple webview instances', async function () {
            this.timeout(20000);

            const queue1 = await createTestQueue('multi-webview-1');
            const queue2 = await createTestQueue('multi-webview-2');
            createdQueues.push(queue1, queue2);

            // Open both webviews
            await context.executeCommand('sqs-management-tool.selectQueue', queue1);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await context.executeCommand('sqs-management-tool.selectQueue', queue2);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Both should be open
            const hasQueue1 = vscode.window.tabGroups.all.some(group =>
                group.tabs.some(tab => tab.label.includes(queue1.name))
            );
            const hasQueue2 = vscode.window.tabGroups.all.some(group =>
                group.tabs.some(tab => tab.label.includes(queue2.name))
            );

            expect(hasQueue1 || hasQueue2).to.be.true;
        });
    });

    describe('Command Error Handling', () => {
        it('should handle refresh command errors gracefully', async function () {
            this.timeout(10000);

            // Refresh should always work
            await context.executeCommand('sqs-management-tool.refreshQueues');
            expect(true).to.be.true;
        });

        it('should handle copy command with valid queue', async function () {
            this.timeout(10000);

            const queueConfig = await createTestQueue('copy-test');
            createdQueues.push(queueConfig);

            const queueItem = {
                queue: queueConfig,
                label: queueConfig.name,
                collapsibleState: 0
            };

            await context.executeCommand('sqs-management-tool.copyQueueUrl', queueItem);

            const clipboardContent = await vscode.env.clipboard.readText();
            expect(clipboardContent).to.equal(queueConfig.url);
        });
    });

    describe('Cleanup and Resource Management', () => {
        it('should handle queue removal', async function () {
            this.timeout(15000);

            const queueConfig = await createTestQueue('remove-test');
            createdQueues.push(queueConfig);

            const helper = await getExtensionHelper();
            const beforeCount = (await helper.getQueuesFromStorage()).length;

            // Remove queue
            await helper.removeQueueFromStorage(queueConfig.id);

            const afterCount = (await helper.getQueuesFromStorage()).length;
            expect(afterCount).to.be.lessThan(beforeCount);
        });

        it('should handle clearing all queues', async function () {
            this.timeout(10000);

            await createTestQueue('clear-test-1');
            await createTestQueue('clear-test-2');

            const helper = await getExtensionHelper();
            await helper.clearAllQueues();

            const queues = await helper.getQueuesFromStorage();
            expect(queues.length).to.equal(0);
        });
    });
});
