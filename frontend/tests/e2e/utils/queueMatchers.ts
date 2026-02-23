import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Custom matchers for queue operations
 * Extends expect with queue-specific assertions
 */

/**
 * Asserts that the queue count matches the expected count
 */
export async function assertQueueCount(page: Page, expectedCount: number) {
    const queueCount = await page.locator('.queue-item').count();
    expect(queueCount, `Expected queue count to be ${expectedCount}, but found ${queueCount}`).toBe(expectedCount);
}

/**
 * Asserts that a specific queue exists in the list
 */
export async function assertQueueExists(page: Page, queueName: string) {
    const queueItem = page.locator('.queue-item').filter({ hasText: queueName });
        await expect(queueItem, `Expected queue "${queueName}" to be visible in the list`).toBeVisible({
            timeout: 5000,
        });
}

/**
 * Asserts that a specific queue does not exist in the list
 */
export async function assertQueueNotExists(page: Page, queueName: string) {
    const queueItem = page.locator('.queue-item').filter({ hasText: queueName });
        await expect(queueItem, `Expected queue "${queueName}" to NOT be visible in the list`).not.toBeVisible({
            timeout: 5000,
        });
}

/**
 * Asserts that the add queue modal is visible
 */
export async function assertAddQueueModalVisible(page: Page) {
    const modal = page.locator('.add-queue-modal');
        await expect(modal, 'Expected add queue modal to be visible').toBeVisible({
            timeout: 5000,
        });
}

/**
 * Asserts that the queue details panel is visible
 */
export async function assertQueueDetailsVisible(page: Page, queueName: string) {
    const detailsPanel = page.locator('.queue-details').filter({ hasText: queueName });
        await expect(detailsPanel, `Expected queue details for "${queueName}" to be visible`).toBeVisible({
            timeout: 5000,
        });
}

/**
 * Asserts that a success toast is displayed after a queue operation
 */
export async function assertQueueOperationSuccess(page: Page) {
    const successToast = page.locator('.toast-success');
        await expect(successToast, 'Expected success toast to be visible after queue operation').toBeVisible({
            timeout: 5000,
        });
}

/**
 * Asserts that an error toast is displayed after a queue operation failure
 */
export async function assertQueueOperationFailure(page: Page, expectedErrorMessage?: string) {
    const errorToast = page.locator('.toast-error');
    const errorDiv = page.locator('.add-form .error');

    await expect(errorToast.or(errorDiv), 'Expected error toast or error div to be visible after queue operation failure').toBeVisible({
        timeout: 5000,
    });

    if (expectedErrorMessage) {
        await expect(errorToast.or(errorDiv), 'Expected error message to contain specific text').toContainText(expectedErrorMessage);
    }
}

/**
 * Asserts that the add queue error message is visible
 */
export async function assertAddQueueErrorVisible(page: Page, expectedErrorMessage: string) {
    const errorElement = page.locator('.add-form .error');
    await expect(errorElement, 'Expected add queue error message to be visible').toBeVisible({
        timeout: 5000,
    });
    await expect(errorElement, 'Expected add queue error message to contain specific text').toContainText(expectedErrorMessage);
}

export async function assertNoQueuesMessageVisible(page: Page) {
    const messageLocator = page.locator('.empty', { hasText: 'No queues added yet. Click "Add Queue" to get started.' });
    await expect(messageLocator, 'Expected "No queues added yet" message to be visible').toBeVisible();
}
