import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Custom matchers for message operations
 * Extends expect with message-specific assertions
 */

/**
 * Asserts that the message count matches the expected count
 */
export async function assertMessageCount(page: Page, expectedCount: number) {
    const messageCount = await page.locator('.message-item').count();
    expect(messageCount, `Expected message count to be ${expectedCount}, but found ${messageCount}`).toBe(expectedCount);
}

/**
 * Asserts that a message with specific body is visible
 */
export async function assertMessageBodyVisible(page: Page, body: string) {
    const messageBodies = await page.locator('.message-body').allTextContents();
    console.log('Expected message body:', body);
    console.log('Actual message bodies on page:', messageBodies);

    const messageBody = page.locator('.message-body').filter({ hasText: body });
    await expect(messageBody).toBeVisible({ timeout: 10000 });
}

/**
 * Asserts that a message with specific ID is visible
 */
export async function assertMessageIdVisible(page: Page, messageId: string) {
    const messageIdElement = page.locator('.message-id').filter({ hasText: messageId });
    await expect(messageIdElement).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts that the message composer is visible
 */
export async function assertMessageComposerVisible(page: Page) {
    const composer = page.locator('.message-composer');
    await expect(composer).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts that the message viewer is visible
 */
export async function assertMessageViewerVisible(page: Page) {
    const viewer = page.locator('.message-viewer');
    await expect(viewer).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts that the DLQ section is visible
 */
export async function assertDLQSectionVisible(page: Page) {
    const dlqSection = page.locator('.dlq-section');
    await expect(dlqSection).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts that DLQ messages are visible
 */
export async function assertDLQMessagesVisible(page: Page) {
    const dlqMessages = page.locator('.dlq-message-item');
    const count = await dlqMessages.count();
    expect(count, 'Expected DLQ messages to be visible').toBeGreaterThan(0);
}

/**
 * Asserts that a success toast is displayed after a message operation
 */
export async function assertMessageOperationSuccess(page: Page) {
    const successToast = page.locator('.toast-success');
    await expect(successToast).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts that an error toast is displayed after a message operation failure
 */
export async function assertMessageOperationFailure(page: Page) {
    const errorToast = page.locator('.toast-error');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
}

/**
 * Asserts that the redrive panel is visible
 */
export async function assertRedrivePanelVisible(page: Page) {
    const redrivePanel = page.locator('.redrive-panel');
    await expect(redrivePanel).toBeVisible({ timeout: 5000 });
}
