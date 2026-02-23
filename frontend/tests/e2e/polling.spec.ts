import { test, expect } from '@playwright/test';
import { QueuePage } from './pages/QueuePage';
import { MessagePage } from './pages/MessagePage';
import { SettingsPage } from './pages/SettingsPage';
import { setupAwsProfile, addTestQueue } from './utils/test-setup';

test.describe('Polling Behavior', () => {
    let queuePage: QueuePage;
    let messagePage: MessagePage;
    let settingsPage: SettingsPage;
    const testQueueName = 'polling-test-queue';

    test.beforeEach(async ({ page }) => {
        queuePage = new QueuePage(page);
        messagePage = new MessagePage(page);
        settingsPage = new SettingsPage(page);

        // Mock profiles
        await page.route('**/api/config/profiles', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(['sqs-tool'])
            });
        });

        // Mock setting profile
        await page.route('**/api/config/profile', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
            } else {
                await route.continue();
            }
        });

        // Mock test credentials
        await page.route('**/api/config/test-credentials', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ valid: true, accountId: '123456789012', method: 'profile:sqs-tool' })
            });
        });

        // Mock queues listing
        let queues: string[] = ['polling-test-queue']; // Pre-populate to speed up
        await page.route('**/api/queues', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(queues.map(name => ({
                        queueName: name,
                        queueUrl: `https://sqs.us-east-1.amazonaws.com/123456789012/${name}`,
                        region: 'us-east-1',
                        attributes: {},
                        tags: {}
                    })))
                });
            } else if (route.request().method() === 'POST') {
                const body = route.request().postDataJSON();
                if (!queues.includes(body.queueName)) {
                    queues.push(body.queueName);
                }
                await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
            } else {
                await route.continue();
            }
        });

        await queuePage.goto();
        await queuePage.waitForPageLoad();
        await setupAwsProfile(settingsPage, 'sqs-tool', page);
        await addTestQueue(queuePage, testQueueName, 'us-east-1', page);

        // Switch to Table view as polling is implemented in MessageTable
        await messagePage.setViewMode('table');
    });

    test('9.1 & 9.2 should enable polling and show progress indicator', async ({ page }) => {
        // Mock API to return empty list so it keeps polling but doesn't finish too fast
        await page.route('**/api/queues/*/messages*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        await messagePage.startPolling();

        // Verify indicator appears
        await expect(page.locator(messagePage.pollingProgress)).toBeVisible();
        await expect(page.locator(messagePage.btnPollMessages)).toContainText('Polling...');

        // Verify Stop button appears
        await expect(page.locator(messagePage.btnStopPolling)).toBeVisible();

        // Stop polling
        await messagePage.stopPolling();

        // Verify indicator disappears
        await expect(page.locator(messagePage.pollingProgress)).toBeHidden();
        await expect(page.locator(messagePage.btnPollMessages)).toContainText('Poll for Messages');
    });

    test('9.3 should update message count during polling', async ({ page }) => {
        let callCount = 0;

        // Mock API to return different messages on subsequent calls
        await page.route('**/api/queues/*/messages*', async (route) => {
            callCount++;
            if (callCount === 1) {
                await route.fulfill({
                    body: JSON.stringify([
                        { messageId: 'msg-1', body: 'Message 1', receiptHandle: 'h1', attributes: { SentTimestamp: Date.now().toString() }, messageAttributes: {} }
                    ])
                });
            } else if (callCount === 2) {
                await route.fulfill({
                    body: JSON.stringify([
                        { messageId: 'msg-2', body: 'Message 2', receiptHandle: 'h2', attributes: { SentTimestamp: Date.now().toString() }, messageAttributes: {} }
                    ])
                });
            } else {
                await route.fulfill({ body: JSON.stringify([]) });
            }
        });

        await messagePage.startPolling();

        // Wait for first message
        await expect(page.locator('text=Message 1')).toBeVisible();

        // Wait for second message
        await expect(page.locator('text=Message 2')).toBeVisible();

        // Verify message count in UI
        await expect(page.locator('.message-count')).toContainText('Showing 2 of 2 received');

        await messagePage.stopPolling();
    });

    test('9.5 should stop polling when Stop is clicked', async ({ page }) => {
        await page.route('**/api/queues/*/messages*', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 500)); // Add delay to ensure we can click Stop
            await route.fulfill({ body: JSON.stringify([]) });
        });

        await messagePage.startPolling();
        await expect(page.locator(messagePage.pollingProgress)).toBeVisible();

        await messagePage.stopPolling();
        await expect(page.locator(messagePage.pollingProgress)).toBeHidden();
    });
});
