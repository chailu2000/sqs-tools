import { test, expect } from '@playwright/test';
import { QueuePage } from './pages/QueuePage';
import { MessagePage } from './pages/MessagePage';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const mockQueue = {
    id: 'vr-queue-id',
    queueName: 'visual-test-queue',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/visual-test-queue',
    region: 'us-east-1',
    attributes: {
        ApproximateNumberOfMessages: '5',
        ApproximateNumberOfMessagesNotVisible: '0',
        VisibilityTimeout: '30',
        MessageRetentionPeriod: '345600',
        MaximumMessageSize: '262144',
        ReceiveMessageWaitTimeSeconds: '0',
        DelaySeconds: '0',
        CreatedTimestamp: '1700000000',
        LastModifiedTimestamp: '1700000000',
    },
    dlqUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/visual-test-queue-dlq',
    dlqName: 'visual-test-queue-dlq',
    savedAt: new Date().toISOString(),
};

const mockMessages = [
    {
        messageId: 'vr-msg-1',
        body: JSON.stringify({ orderId: 'ORD-001', status: 'pending', amount: 99.99 }),
        receiptHandle: 'vrh1',
        attributes: { SentTimestamp: '1700001000000', ApproximateReceiveCount: '1' },
        messageAttributes: { Priority: { dataType: 'String', stringValue: 'high' } },
        md5OfBody: 'abc123',
    },
    {
        messageId: 'vr-msg-2',
        body: 'Plain text message for visual testing',
        receiptHandle: 'vrh2',
        attributes: { SentTimestamp: '1700002000000', ApproximateReceiveCount: '2' },
        messageAttributes: {},
        md5OfBody: 'def456',
    },
];

const mockDlqMessages = [
    {
        messageId: 'vr-dlq-1',
        body: '{"error": "Processing failed after 3 retries"}',
        receiptHandle: 'vrdh1',
        attributes: { SentTimestamp: '1700003000000', ApproximateReceiveCount: '3' },
        messageAttributes: {},
        md5OfBody: 'ghi789',
    },
];

async function setupVisualMocks(page: import('@playwright/test').Page) {
    await page.route('**/api/queues', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockQueue]),
        });
    });

    await page.route('**/api/queues/*/messages*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockMessages),
        });
    });

    await page.route('**/api/queues/*/dlq/messages*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockDlqMessages),
        });
    });

    await page.route('**/api/config/profiles', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(['default', 'sqs-tool']),
        });
    });

    await page.route('**/api/config/test-credentials', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ valid: true, accountId: '123456789012', method: 'profile:sqs-tool' }),
        });
    });
}

// ---------------------------------------------------------------------------
// 12. Visual Regression Tests
// ---------------------------------------------------------------------------
test.describe('Visual Regression', () => {
    let queuePage: QueuePage;
    let messagePage: MessagePage;

    test.beforeEach(async ({ page }) => {
        queuePage = new QueuePage(page);
        messagePage = new MessagePage(page);

        await setupVisualMocks(page);
        await queuePage.goto();
        await queuePage.waitForPageLoad();
    });

    // -------------------------------------------------------------------------
    // 12.1 — Visual baselines for key UI states
    // -------------------------------------------------------------------------
    test.describe('12.1 Desktop visual baselines (1280x720)', () => {
        test('empty state — no queue selected', async ({ page }) => {
            // No queue selected, just the app shell with the queue list
            await expect(page).toHaveScreenshot('01-empty-state.png', { maxDiffPixelRatio: 0.02 });
        });

        test('queue selected — Main Queue tab (Table view)', async ({ page }) => {
            await queuePage.selectQueue(mockQueue.queueName);
            await messagePage.setViewMode('table');
            // Wait for messages to be reflected in the table
            await page.locator('.message-table table').waitFor({ state: 'visible' });
            await expect(page).toHaveScreenshot('02-main-queue-table.png', { maxDiffPixelRatio: 0.02 });
        });

        test('queue selected — Main Queue tab (Cards view)', async ({ page }) => {
            await queuePage.selectQueue(mockQueue.queueName);
            await messagePage.setViewMode('cards');
            await page.locator('.message-viewer').waitFor({ state: 'visible' });
            await expect(page).toHaveScreenshot('03-main-queue-cards.png', { maxDiffPixelRatio: 0.02 });
        });

        test('queue selected — DLQ tab (Table view)', async ({ page }) => {
            await queuePage.selectQueue(mockQueue.queueName);
            await messagePage.setViewMode('table');
            await messagePage.switchTab('dlq');
            await page.locator('.message-table table').waitFor({ state: 'visible' });
            await expect(page).toHaveScreenshot('04-dlq-tab-table.png', { maxDiffPixelRatio: 0.02 });
        });

        test('queue selected — Queue Info tab', async ({ page }) => {
            await queuePage.selectQueue(mockQueue.queueName);
            await messagePage.switchTab('queue');
            await page.locator('.queue-details').waitFor({ state: 'visible' });
            await expect(page).toHaveScreenshot('05-queue-info.png', { maxDiffPixelRatio: 0.02 });
        });

        test('settings modal open', async ({ page }) => {
            await page.locator('.btn-settings').click();
            await page.locator('.settings-panel, .modal-content').first().waitFor({ state: 'visible' });
            await expect(page).toHaveScreenshot('06-settings-open.png', { maxDiffPixelRatio: 0.02 });
        });
    });

    // -------------------------------------------------------------------------
    // 12.3 — Responsive layout at mobile viewports (375x812)
    // -------------------------------------------------------------------------
    test.describe('12.3 Mobile viewport (375x812)', () => {
        test.use({ viewport: { width: 375, height: 812 } });

        test('empty state at mobile size', async ({ page }) => {
            await expect(page).toHaveScreenshot('mobile-01-empty-state.png', { maxDiffPixelRatio: 0.03 });
        });

        test('queue selected — Main Queue tab (Table view) at mobile size', async ({ page }) => {
            await queuePage.selectQueue(mockQueue.queueName);
            await messagePage.setViewMode('table');
            await page.locator('.message-table table').waitFor({ state: 'visible' });
            await expect(page).toHaveScreenshot('mobile-02-main-queue-table.png', { maxDiffPixelRatio: 0.03 });
        });

        test('queue selected — Main Queue tab (Cards view) at mobile size', async ({ page }) => {
            await queuePage.selectQueue(mockQueue.queueName);
            await messagePage.setViewMode('cards');
            await page.locator('.message-viewer').waitFor({ state: 'visible' });
            await expect(page).toHaveScreenshot('mobile-03-main-queue-cards.png', { maxDiffPixelRatio: 0.03 });
        });
    });
});
