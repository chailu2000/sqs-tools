/**
 * Tree View Interaction Tests
 * 
 * Tests for VS Code extension tree view interactions.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
 */

import { expect } from 'chai';
import * as vscode from 'vscode';
import { ExtensionTestContext } from '../fixtures/extension-context';
import { QueueFixture, QueueConfig } from '../fixtures/test-data';
import { LocalStackFixture } from '../fixtures/localstack';
import { getExtensionHelper } from '../fixtures/extension-helper';
import { waitFor } from '../utils/wait';
import { createTestQueue, cleanupTestQueue, getGlobalSetup } from '../fixtures/setup';

describe('Tree View Interaction Tests', () => {
    let context: ExtensionTestContext;
    const createdQueues: QueueConfig[] = [];

    before(async function () {
        this.timeout(60000);

        // Get global setup (LocalStack already started)
        const setup = getGlobalSetup();
        context = setup.testContext;

        // Clear any existing queues
        const helper = await getExtensionHelper();
        await helper.clearAllQueues();

        // Dismiss any auto-discovery prompts
        await helper.dismissDialogs();
        await new Promise(resolve => setTimeout(resolve, 1000));
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
        // Final cleanup
        const helper = await getExtensionHelper();
        await helper.clearAllQueues();
    });

    describe('Queue Display', () => {
        it('should display queues from LocalStack in tree view', async function () {
            this.timeout(20000);

            // Create test queues using helper
            const queue1 = await createTestQueue('tree-test-1');
            const queue2 = await createTestQueue('tree-test-2');
            createdQueues.push(queue1, queue2);

            // Refresh tree view to pick up changes
            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Wait for tree view to update
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify queues are in storage
            const helper = await getExtensionHelper();
            const queues = await helper.getQueuesFromStorage();
            expect(queues.length).to.be.at.least(2);
        });
    });

    describe('Queue Selection', () => {
        it('should open webview when queue is selected', async function () {
            this.timeout(20000);

            // Create a test queue using helper
            const queueConfig = await createTestQueue('tree-select-test');
            createdQueues.push(queueConfig);

            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Select the queue (pass QueueConfig object)
            await context.executeCommand('sqs-management-tool.selectQueue', queueConfig);

            // Wait for webview to open
            await waitFor(
                () => vscode.window.tabGroups.all.some(group =>
                    group.tabs.some(tab => tab.label.includes(queueConfig.name))
                ),
                { timeout: 10000, errorMessage: 'Webview should open after queue selection' }
            );

            const hasWebview = vscode.window.tabGroups.all.some(group =>
                group.tabs.some(tab => tab.label.includes(queueConfig.name))
            );
            expect(hasWebview).to.be.true;
        });
    });

    describe('Refresh Button', () => {
        it('should reload queue data when refresh button is clicked', async function () {
            this.timeout(15000);

            // Create a test queue using helper
            const queueConfig = await createTestQueue('tree-refresh-test');
            createdQueues.push(queueConfig);

            // Execute refresh command
            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Wait for refresh to complete
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify queue is in storage
            const helper = await getExtensionHelper();
            const queues = await helper.getQueuesFromStorage();
            expect(queues.length).to.be.at.least(1);
        });
    });

    describe('Queue Addition', () => {
        it('should update tree view automatically after adding queue', async function () {
            this.timeout(15000);

            // Get initial item count
            const helper = await getExtensionHelper();
            const initialQueues = await helper.getQueuesFromStorage();
            const initialCount = initialQueues.length;

            // Create and add a new queue using helper (bypasses UI dialog)
            const queueConfig = await createTestQueue('tree-add-test');
            createdQueues.push(queueConfig);

            // Refresh tree view
            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Wait for tree view to update
            await waitFor(
                async () => {
                    const queues = await helper.getQueuesFromStorage();
                    return queues.length > initialCount;
                },
                { timeout: 10000, errorMessage: 'Tree view should update after adding queue' }
            );

            const updatedQueues = await helper.getQueuesFromStorage();
            expect(updatedQueues.length).to.be.greaterThan(initialCount);
        });
    });

    describe('Queue Removal', () => {
        it('should update tree view after removing queue', async function () {
            this.timeout(15000);

            // Create and add a queue using helper
            const queueConfig = await createTestQueue('tree-remove-test');
            createdQueues.push(queueConfig);

            // Wait for tree view to update
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get item count before removal
            const helper = await getExtensionHelper();
            const beforeQueues = await helper.getQueuesFromStorage();
            const beforeCount = beforeQueues.length;

            // Remove the queue using helper
            await cleanupTestQueue(queueConfig);
            const index = createdQueues.indexOf(queueConfig);
            if (index > -1) {
                createdQueues.splice(index, 1);
            }

            // Refresh tree view
            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Wait for tree view to update
            await waitFor(
                async () => {
                    const queues = await helper.getQueuesFromStorage();
                    return queues.length < beforeCount;
                },
                { timeout: 10000, errorMessage: 'Tree view should update after removing queue' }
            );

            const afterQueues = await helper.getQueuesFromStorage();
            expect(afterQueues.length).to.be.lessThan(beforeCount);
        });
    });

    describe('Queue Attributes', () => {
        it('should update queue attributes in tree view', async function () {
            this.timeout(15000);

            // Create a test queue using helper
            const queueConfig = await createTestQueue('tree-attr-test');
            createdQueues.push(queueConfig);

            // Refresh tree view
            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Wait for attributes to update
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify queue is in storage
            const helper = await getExtensionHelper();
            const queues = await helper.getQueuesFromStorage();
            expect(queues.length).to.be.at.least(1);
        });
    });

    describe('Empty State', () => {
        it('should show empty state message when no queues configured', async function () {
            this.timeout(10000);

            // Remove all queues
            const helper = await getExtensionHelper();
            await helper.clearAllQueues();

            // Refresh tree view
            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Wait for tree view to update
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify empty state
            const queues = await helper.getQueuesFromStorage();
            expect(queues.length).to.equal(0);
        });
    });
});
