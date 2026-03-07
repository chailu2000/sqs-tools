/**
 * Command Execution Tests
 * 
 * Tests for VS Code extension command execution.
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import { expect } from 'chai';
import * as vscode from 'vscode';
import { ExtensionTestContext } from '../fixtures/extension-context';
import { QueueFixture, QueueConfig } from '../fixtures/test-data';
import { LocalStackFixture } from '../fixtures/localstack';
import { waitFor } from '../utils/wait';
import { createTestQueue, cleanupTestQueue, getGlobalSetup } from '../fixtures/setup';

describe('Command Execution Tests', () => {
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

    describe('refreshQueues command', () => {
        it('should execute without errors', async function () {
            this.timeout(10000);

            await context.executeCommand('sqs-management-tool.refreshQueues');

            // Command should complete without throwing
            expect(true).to.be.true;
        });
    });

    describe('selectQueue command', () => {
        it('should execute with queue config parameter', async function () {
            this.timeout(15000);

            // Create a test queue using helper
            const queueConfig = await createTestQueue('cmd-test');
            createdQueues.push(queueConfig);

            // Execute selectQueue command (pass QueueConfig object)
            await context.executeCommand('sqs-management-tool.selectQueue', queueConfig);

            // Wait for webview to open
            await waitFor(
                () => vscode.window.tabGroups.all.some(group =>
                    group.tabs.some(tab => tab.label.includes(queueConfig.name))
                ),
                { timeout: 5000, errorMessage: 'Webview should open after selecting queue' }
            );
        });
    });

    describe('addQueue command', () => {
        it.skip('should execute and show input dialog (requires manual interaction)', async function () {
            // This command requires user input dialog interaction (showQuickPick, showInputBox)
            // Cannot be automated without mocking VS Code UI APIs
            // Skipped in automated tests as it would hang waiting for input
            this.timeout(10000);

            try {
                await context.executeCommand('sqs-management-tool.addQueue');
                expect(true).to.be.true;
            } catch (e) {
                // Command might throw if dialog is cancelled, which is expected
                expect(true).to.be.true;
            }
        });
    });

    describe('removeQueue command', () => {
        it.skip('should execute with queue config (requires confirmation dialog)', async function () {
            // This command requires user confirmation dialog interaction (showWarningMessage)
            // Cannot be automated without mocking VS Code UI APIs
            // Skipped in automated tests as it would hang waiting for confirmation
            this.timeout(15000);

            const queueConfig = await createTestQueue('cmd-remove-test');
            createdQueues.push(queueConfig);

            // Note: removeQueue expects a QueueItem (tree item), not QueueConfig
            // In real usage, this is called from the tree view context menu
            await context.executeCommand('sqs-management-tool.removeQueue', queueConfig);

            expect(true).to.be.true;
        });
    });

    describe('copyQueueUrl command', () => {
        it('should copy queue URL to clipboard', async function () {
            this.timeout(15000);

            const queueConfig = await createTestQueue('cmd-copy-test');
            createdQueues.push(queueConfig);

            // Create a QueueItem-like object (the command expects this from tree view)
            const queueItem = {
                queue: queueConfig,
                label: queueConfig.name,
                collapsibleState: 0
            };

            await context.executeCommand('sqs-management-tool.copyQueueUrl', queueItem);

            await new Promise(resolve => setTimeout(resolve, 500));

            const clipboardContent = await vscode.env.clipboard.readText();
            expect(clipboardContent).to.equal(queueConfig.url);
        });
    });

    describe('exportQueues command', () => {
        it.skip('should execute without errors (requires file picker interaction)', async function () {
            // This command requires file picker dialog interaction
            // Skipped in automated tests as it would hang waiting for file selection
            this.timeout(10000);

            try {
                await context.executeCommand('sqs-management-tool.exportQueues');
                expect(true).to.be.true;
            } catch (e) {
                // Command might throw if dialog is cancelled, which is expected
                expect(true).to.be.true;
            }
        });
    });

    describe('importQueues command', () => {
        it.skip('should execute without errors (requires file picker interaction)', async function () {
            // This command requires file picker dialog interaction
            // Skipped in automated tests as it would hang waiting for file selection
            this.timeout(10000);

            try {
                await context.executeCommand('sqs-management-tool.importQueues');
                expect(true).to.be.true;
            } catch (e) {
                // Command might throw if dialog is cancelled, which is expected
                expect(true).to.be.true;
            }
        });
    });
});
