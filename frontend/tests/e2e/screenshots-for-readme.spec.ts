import { test, expect } from '@playwright/test';
import { QueuePage } from './pages/QueuePage';
import { MessagePage } from './pages/MessagePage';

// ---------------------------------------------------------------------------
// Mock data - same as visual-regression.spec.ts
// ---------------------------------------------------------------------------
const mockQueue = {
    id: 'screenshot-queue-id',
    queueName: 'my-application-queue',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-application-queue',
    region: 'us-east-1',
    attributes: {
        ApproximateNumberOfMessages: '5',
        ApproximateNumberOfMessagesNotVisible: '2',
        VisibilityTimeout: '30',
        MessageRetentionPeriod: '345600',
        MaximumMessageSize: '262144',
        ReceiveMessageWaitTimeSeconds: '5',
        DelaySeconds: '0',
        CreatedTimestamp: '1700000000',
        LastModifiedTimestamp: '1700000000',
    },
    dlqUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-application-queue-dlq',
    dlqName: 'my-application-queue-dlq',
    savedAt: new Date().toISOString(),
};

const mockMessages = [
    {
        messageId: 'msg-1',
        body: JSON.stringify({
            orderId: 'ORD-12345',
            status: 'processing',
            customer: 'John Doe',
            items: [
                { productId: 'PROD-001', name: 'Wireless Mouse', quantity: 2, price: 29.99 },
                { productId: 'PROD-002', name: 'Keyboard', quantity: 1, price: 79.99 }
            ],
            total: 139.97
        }),
        receiptHandle: 'rh1',
        attributes: {
            SentTimestamp: '1700001000000',
            ApproximateReceiveCount: '1',
            ApproximateFirstReceiveTimestamp: '1700001000000'
        },
        messageAttributes: {
            OrderType: { dataType: 'String', stringValue: 'premium' },
            Priority: { dataType: 'String', stringValue: 'high' }
        },
        md5OfBody: 'abc123',
    },
    {
        messageId: 'msg-2',
        body: JSON.stringify({
            eventType: 'user.signup',
            userId: 'USR-98765',
            email: 'jane.smith@example.com',
            timestamp: '2024-01-15T10:30:00Z',
            metadata: {
                source: 'web',
                campaign: 'spring-promotion'
            }
        }),
        receiptHandle: 'rh2',
        attributes: {
            SentTimestamp: '1700002000000',
            ApproximateReceiveCount: '3',
            ApproximateFirstReceiveTimestamp: '1700001500000'
        },
        messageAttributes: {
            EventType: { dataType: 'String', stringValue: 'signup' }
        },
        md5OfBody: 'def456',
    },
    {
        messageId: 'msg-3',
        body: 'Plain text notification: System maintenance scheduled for tonight at 11 PM EST',
        receiptHandle: 'rh3',
        attributes: {
            SentTimestamp: '1700003000000',
            ApproximateReceiveCount: '1',
            ApproximateFirstReceiveTimestamp: '1700003000000'
        },
        messageAttributes: {},
        md5OfBody: 'ghi789',
    },
];

const mockDlqMessages = [
    {
        messageId: 'dlq-msg-1',
        body: JSON.stringify({
            error: 'Connection timeout',
            message: 'Failed to process payment after 3 retries',
            orderId: 'ORD-11111',
            stackTrace: 'Error: Connection timeout\n    at processPayment (/app/services/payment.js:45:12)\n    at async handleMessage (/app/workers/queue-worker.js:78:5)'
        }),
        receiptHandle: 'dlq-rh1',
        attributes: {
            SentTimestamp: '1700004000000',
            ApproximateReceiveCount: '5',
            ApproximateFirstReceiveTimestamp: '1700003000000'
        },
        messageAttributes: {},
        md5OfBody: 'jkl012',
    },
];

async function setupMocks(page: import('@playwright/test').Page) {
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
// Screenshot capture for README
// ---------------------------------------------------------------------------
test.describe('Screenshots for README', () => {
    let queuePage: QueuePage;
    let messagePage: MessagePage;

    test.beforeEach(async ({ page }) => {
        queuePage = new QueuePage(page);
        messagePage = new MessagePage(page);

        await setupMocks(page);
        await queuePage.goto();
        await queuePage.waitForPageLoad();
    });

    test('01 - Main view with queue list', async ({ page }) => {
        // Select a queue to show the main interface
        await queuePage.selectQueue(mockQueue.queueName);
        await messagePage.setViewMode('table');

        // Wait for messages to load
        await page.locator('.message-table table').waitFor({ state: 'visible' });

        // Take screenshot
        await page.screenshot({
            path: '../docs/screenshots/01-main-queue-view.png',
            fullPage: false
        });
    });

    test('02 - Cards view mode', async ({ page }) => {
        await queuePage.selectQueue(mockQueue.queueName);
        await messagePage.setViewMode('cards');
        await page.locator('.message-viewer').waitFor({ state: 'visible' });

        await page.screenshot({
            path: '../docs/screenshots/02-cards-view.png',
            fullPage: false
        });
    });

    test('03 - DLQ tab with failed messages', async ({ page }) => {
        await queuePage.selectQueue(mockQueue.queueName);
        await messagePage.setViewMode('table');
        await messagePage.switchTab('dlq');
        await page.locator('.message-table table').waitFor({ state: 'visible' });

        await page.screenshot({
            path: '../docs/screenshots/03-dlq-view.png',
            fullPage: false
        });
    });

    test('04 - Queue info tab', async ({ page }) => {
        await queuePage.selectQueue(mockQueue.queueName);
        await messagePage.setViewMode('table');
        await messagePage.switchTab('queue');
        await page.locator('.queue-details').waitFor({ state: 'visible' });

        await page.screenshot({
            path: '../docs/screenshots/04-queue-details.png',
            fullPage: false
        });
    });

    test('05 - Settings panel', async ({ page }) => {
        await page.locator('.btn-settings').click();
        await page.locator('.settings-panel, .modal-content').first().waitFor({ state: 'visible' });

        await page.screenshot({
            path: '../docs/screenshots/05-settings.png',
            fullPage: false
        });
    });

    test('06 - Expanded message detail', async ({ page }) => {
        await queuePage.selectQueue(mockQueue.queueName);
        await messagePage.setViewMode('cards');
        await page.locator('.message-viewer').waitFor({ state: 'visible' });

        // Click the Expand button on the first message card
        const firstExpandBtn = page.locator('.message-card').first().locator('.btn-expand');
        await firstExpandBtn.click();

        // Wait for the inline expanded body (code-block appears inside the card)
        await page.locator('.message-card .code-block').first().waitFor({ state: 'visible' });

        await page.screenshot({
            path: '../docs/screenshots/06-message-expanded.png',
            fullPage: false
        });
    });
});
