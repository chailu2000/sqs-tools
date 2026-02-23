import { test, expect } from '@playwright/test';
import { generateValidQueueData, generateQueueName, generateRegion } from '../e2e/fixtures/queueData';
import { assertQueueCount, assertQueueExists, assertQueueNotExists, assertAddQueueModalVisible, assertQueueDetailsVisible, assertQueueOperationSuccess, assertQueueOperationFailure, assertAddQueueErrorVisible, assertNoQueuesMessageVisible } from '../e2e/utils/queueMatchers';
import { QueuePage } from '../e2e/pages/QueuePage';
import { SettingsPage } from '../e2e/pages/SettingsPage';
import { setupAwsProfile, addTestQueue } from '../e2e/utils/test-setup';

test.describe('Queue Management Smoke Tests', () => {
    let queuePage: QueuePage;
    let settingsPage: SettingsPage;

    test.beforeEach(async ({ page }) => {
        queuePage = new QueuePage(page);
        settingsPage = new SettingsPage(page);
        await queuePage.goto();
        await queuePage.waitForPageLoad();
        await setupAwsProfile(settingsPage, 'sqs-tool', page);
    });

    test('Add existing queue does not increase count', {
        tag: '@queue @smoke'
    }, async ({ page }) => {
        // Arrange
        const queueName = 'test-queue-1';
        const region = 'us-east-1';

        // Ensure the queue is already present in the UI by adding it once
        await addTestQueue(queuePage, queueName, region);
        const initialCount = await queuePage.getQueueCount();

        // Act - Attempt to add the same queue again
        await queuePage.addQueue(queueName, region);

        // Assert - The count should not increase, and the queue should still exist
        await assertQueueCount(page, initialCount);
        await assertQueueExists(page, queueName);
    });

    test.skip('Add new valid queue increases count', {
        tag: '@queue @smoke'
    }, async ({ page }) => {
        // Arrange
        const queueName = generateQueueName(); // Generate a new unique queue name
        const region = 'us-east-1';
        const initialCount = await queuePage.getQueueCount();

        // Act
        await queuePage.addQueue(queueName, region);

        // Assert
        await assertQueueCount(page, initialCount + 1);
        await assertQueueExists(page, queueName);
    });

    test('Add non-existent queue displays error', {
        tag: '@queue @negative'
    }, async ({ page }) => {
        // Arrange
        const nonExistentQueueName = 'non-existent-queue-' + Math.random().toString(36).substring(7);
        const region = 'us-east-1';

        // Act
        await queuePage.addQueue(nonExistentQueueName, region);

        // Assert - Error toast should be displayed
        await assertAddQueueErrorVisible(page, 'Queue not found');
    });

    test('Remove an existing queue displays "No queues added yet" message when all queues are removed', {
        tag: '@queue @smoke'
    }, async ({ page }) => {
        // Arrange
        const queueName = 'test-queue-1';
        const region = 'us-east-1';

        // Add a queue to ensure it's present
        await addTestQueue(queuePage, queueName, region);

        // Act - Initiate and confirm removal
        await queuePage.initiateRemoveQueue(queueName);
        await queuePage.confirmQueueRemoval();

        // Assert - The "No queues added yet" message should be visible
        await assertNoQueuesMessageVisible(page);
    });
});

