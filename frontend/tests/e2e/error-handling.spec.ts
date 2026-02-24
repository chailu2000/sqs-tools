import { test, expect } from '@playwright/test';
import { QueuePage } from './pages/QueuePage';
import { MessagePage } from './pages/MessagePage';

// ---------------------------------------------------------------------------
// Shared mock queue setup
// ---------------------------------------------------------------------------
const mockQueue = {
    id: 'err-queue-id',
    queueName: 'error-test-queue',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/error-test-queue',
    region: 'us-east-1',
    attributes: {},
    tags: {},
    savedAt: new Date().toISOString(),
};

async function setupBasicMocks(page: import('@playwright/test').Page) {
    // Queue list
    await page.route('**/api/queues', async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([mockQueue]),
            });
        } else {
            await route.continue();
        }
    });

    // Default empty messages
    await page.route('**/api/queues/*/messages*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });
}

// ---------------------------------------------------------------------------
// 11. Error Handling Tests
// ---------------------------------------------------------------------------
test.describe('Error Handling', () => {
    let queuePage: QueuePage;
    let messagePage: MessagePage;

    test.beforeEach(async ({ page }) => {
        queuePage = new QueuePage(page);
        messagePage = new MessagePage(page);

        await setupBasicMocks(page);
        await queuePage.goto();
        await queuePage.waitForPageLoad();
        await queuePage.selectQueue(mockQueue.queueName);
    });

    // -------------------------------------------------------------------------
    // 11.1 — API operation failures should show an error message in the UI
    // -------------------------------------------------------------------------
    test.describe('11.1 API error display', () => {
        test('should display error when receiving messages fails (500)', async ({ page }) => {
            // Override to return 500
            await page.route('**/api/queues/*/messages*', async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Internal Server Error' }),
                });
            });

            // "Receive Once" triggers loadMessages
            await page.locator('[data-testid="tab-main"]').click();
            await page.locator('button:has-text("Receive Once")').click();

            // Expect an error element to become visible
            await expect(page.locator('.error').first()).toBeVisible({ timeout: 10000 });
        });

        test('should display error when sending a message fails (500)', async ({ page }) => {
            // Route POST to messages to fail
            await page.route('**/api/queues/*/messages', async (route) => {
                if (route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({ message: 'Send failed' }),
                    });
                } else {
                    await route.continue();
                }
            });

            // Switch to Cards view (MessageViewer/Composer)
            await messagePage.setViewMode('cards');

            // Fill the message body and send
            await page.locator('#message-body').fill('Test message that should fail');
            await page.locator('.message-composer .btn-primary').click();

            // An error should appear inside the composer
            await expect(page.locator('.message-composer .error, .message-composer .error-message').first())
                .toBeVisible({ timeout: 10000 });
        });

        test('should display error when purging a queue fails (500)', async ({ page }) => {
            await page.route('**/api/queues/*/purge', async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Purge failed' }),
                });
            });

            // Navigate to the Queue Info tab
            await page.locator('[data-testid="tab-queue"]').click();
            await page.locator('button:has-text("Purge Queue")').click();

            // Confirm the purge dialog
            await page.locator('.confirm-dialog .btn-danger').click();

            // An error should appear
            await expect(page.locator('.error').first()).toBeVisible({ timeout: 10000 });
        });
    });

    // -------------------------------------------------------------------------
    // 11.2 — Field-specific validation errors
    // -------------------------------------------------------------------------
    test.describe('11.2 Field validation errors', () => {
        test('should not allow adding queue with empty identifier', async ({ page }) => {
            // Mock POST to add queue — should NOT be called
            let addQueueCalled = false;
            await page.route('**/api/queues', async (route) => {
                if (route.request().method() === 'POST') {
                    addQueueCalled = true;
                    await route.fulfill({ status: 200, body: JSON.stringify(mockQueue) });
                } else {
                    await route.fulfill({ status: 200, body: JSON.stringify([mockQueue]) });
                }
            });

            // Open the add form
            await page.locator('.btn-add').click();
            await page.locator('.add-form').waitFor({ state: 'visible' });

            // Submit with empty identifier — input uses HTML5 `required`
            const identifierInput = page.locator('input[placeholder="Queue name or URL"]');
            await identifierInput.fill('');

            // Try to click the primary submit button
            await page.locator('.add-form .btn-primary').click();

            // The form should still be visible (prevented submission)
            await expect(page.locator('.add-form')).toBeVisible();

            // The API should not have been called
            expect(addQueueCalled).toBe(false);
        });

        test('should not submit empty message body', async ({ page }) => {
            let messageSent = false;
            await page.route('**/api/queues/*/messages', async (route) => {
                if (route.request().method() === 'POST') {
                    messageSent = true;
                    await route.fulfill({ status: 200, body: JSON.stringify({ messageId: 'x', success: true }) });
                } else {
                    await route.continue();
                }
            });

            // Switch to Cards view to access message composer
            await messagePage.setViewMode('cards');

            // Ensure the body is empty and click Send
            const bodyInput = page.locator('#message-body');
            await bodyInput.fill('');
            await page.locator('.message-composer .btn-primary').click();

            // Wait briefly — the message should NOT have been sent
            await page.waitForTimeout(300);
            expect(messageSent).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // 11.3 — Network error / timeout handling
    // -------------------------------------------------------------------------
    test.describe('11.3 Network error handling', () => {
        test('should show error and keep UI usable when messages request is aborted', async ({ page }) => {
            // Abort the request — simulates a hard network failure
            await page.route('**/api/queues/*/messages*', async (route) => {
                await route.abort('failed');
            });

            await page.locator('[data-testid="tab-main"]').click();
            await page.locator('button:has-text("Receive Once")').click();

            // An error element should appear
            await expect(page.locator('.error').first()).toBeVisible({ timeout: 10000 });

            // The page should still be interactive — e.g., we can still see queue list
            await expect(page.locator('.queue-list')).toBeVisible();
        });

        test('should recover after a network error and successfully receive messages', async ({ page }) => {
            let callCount = 0;

            await page.route('**/api/queues/*/messages*', async (route) => {
                callCount++;
                if (callCount === 1) {
                    // First call fails
                    await route.abort('failed');
                } else {
                    // Subsequent calls succeed
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify([
                            {
                                messageId: 'recover-msg-1',
                                body: 'Recovered message',
                                receiptHandle: 'rh1',
                                attributes: {},
                                messageAttributes: {},
                                md5OfBody: 'md5',
                            },
                        ]),
                    });
                }
            });

            // First receive — fails
            await page.locator('[data-testid="tab-main"]').click();
            await page.locator('button:has-text("Receive Once")').click();
            await expect(page.locator('.error').first()).toBeVisible({ timeout: 10000 });

            // Second receive — recovers
            await page.locator('button:has-text("Receive Once")').click();
            await expect(page.locator('text=Recovered message')).toBeVisible({ timeout: 10000 });
        });
    });
});
