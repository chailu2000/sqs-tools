import { test, expect } from '@playwright/test';
import { QueuePage } from './pages/QueuePage';
import { MessagePage } from './pages/MessagePage';
import { SettingsPage } from './pages/SettingsPage';
import { setupAwsProfile, addTestQueue } from './utils/test-setup';

test.describe('DLQ Operations', () => {
    let queuePage: QueuePage;
    let messagePage: MessagePage;
    let settingsPage: SettingsPage;
    const testQueueName = 'dlq-test-queue';
    const dlqName = 'dlq-test-queue-dlq';
    const region = 'us-east-1';

    test.beforeEach(async ({ page }) => {
        queuePage = new QueuePage(page);
        messagePage = new MessagePage(page);
        settingsPage = new SettingsPage(page);

        const mockQueue = {
            id: testQueueName,
            queueUrl: `https://sqs.${region}.amazonaws.com/123456789012/${testQueueName}`,
            queueName: testQueueName,
            region: region,
            dlqUrl: `https://sqs.${region}.amazonaws.com/123456789012/${dlqName}`,
            dlqName: dlqName,
            attributes: {
                RedrivePolicy: JSON.stringify({
                    deadLetterTargetArn: `arn:aws:sqs:${region}:123456789012:${dlqName}`,
                    maxReceiveCount: 3
                })
            },
            savedAt: new Date().toISOString()
        };

        // Broad mock for ALL config related calls
        await page.route('**/api/config/**', async (route) => {
            const url = route.request().url();
            if (url.includes('test-credentials')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ valid: true, accountId: '123456789012', method: 'profile:default' })
                });
            } else if (url.includes('profiles')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['default', 'test-profile']) });
            } else if (url.includes('profile')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
            } else { await route.continue(); }
        });

        // Mock queue management endpoints
        await page.route('**/api/queues', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockQueue]) });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockQueue) });
            } else { await route.continue(); }
        });

        // Mock individual queue details
        await page.route(`**/api/queues/${testQueueName}`, async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockQueue) });
        });

        // Setup AWS Profile
        await setupAwsProfile(settingsPage, 'default', page);

        // Add the test queue
        await addTestQueue(queuePage, testQueueName, region);
    });

    test('should show DLQ info in cards view and tab in table view', async ({ page }) => {
        await queuePage.selectQueue(testQueueName);

        // 1. Verify RedrivePanel in Cards view (default)
        await expect(page.locator('.redrive-panel h3')).toContainText('Dead Letter Queue Redrive');
        await expect(page.locator('.dlq-info .value').first()).toContainText(dlqName);

        // 2. Switch to Table view
        await page.click(queuePage.viewModeTable);

        // Check if DLQ tab is enabled and visible in table view
        const dlqTab = page.locator(messagePage.tabDLQ);
        await expect(dlqTab).toBeVisible();
        await expect(dlqTab).toBeEnabled();

        // Verify DLQ name is shown in the sidebar info (should be consistent)
        const details = await queuePage.getQueueDetails(testQueueName);
        expect(details.dlqName).toBe(dlqName);
    });

    test('should view messages in DLQ', async ({ page }) => {
        // Switch to Table view first as DLQ tab is there
        await page.click(queuePage.viewModeTable);
        // Mock DLQ messages
        const mockDlqMessages = [
            {
                messageId: 'dlq-msg-1',
                body: 'Dead letter message 1',
                receiptHandle: 'handle-1',
                attributes: { SentTimestamp: Date.now().toString(), ApproximateReceiveCount: '3' },
                messageAttributes: {},
                md5OfBody: 'md5'
            },
            {
                messageId: 'dlq-msg-2',
                body: 'Dead letter message 2',
                receiptHandle: 'handle-2',
                attributes: { SentTimestamp: Date.now().toString(), ApproximateReceiveCount: '4' },
                messageAttributes: {},
                md5OfBody: 'md5'
            }
        ];

        await page.route(`**/api/queues/**/dlq/messages*`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockDlqMessages)
            });
        });

        await queuePage.selectQueue(testQueueName);
        await messagePage.switchTab('dlq');

        // Wait for messages to load
        await expect(page.locator('text=Dead letter message 1')).toBeVisible();
        await expect(page.locator('text=Dead letter message 2')).toBeVisible();

        const count = await messagePage.getMessageTableCount();
        expect(count).toBeGreaterThanOrEqual(1); // At least our mock messages
    });

    test('should redrive a single message', async ({ page }) => {
        // Switch to Table view
        await page.click(queuePage.viewModeTable);

        // Mock redrive operation
        await page.route(`**/api/queues/**/redrive/selective`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    processedCount: 1,
                    successCount: 1,
                    failureCount: 0,
                    succeeded: [{ messageId: 'dlq-msg-1' }],
                    failed: [],
                    errors: []
                })
            });
        });

        // Mock DLQ messages
        await page.route(`**/api/queues/**/dlq/messages*`, async (route) => {
            await route.fulfill({
                body: JSON.stringify([{
                    messageId: 'dlq-msg-1', body: 'Redrive me', receiptHandle: 'h1',
                    attributes: { SentTimestamp: '123', ApproximateReceiveCount: '3' }
                }])
            });
        });

        await queuePage.selectQueue(testQueueName);
        await messagePage.switchTab('dlq');

        // Select message - the checkbox is the one in the table
        await page.locator('input[type="checkbox"]').nth(1).click();

        // Use the robust redriveSelected method from MessagePage
        await messagePage.redriveSelected();

        // Verify success message
        await expect(page.locator('.message-table .success')).toContainText('Successfully redriven 1 message(s)');

        // Verify message is removed from the list
        await expect(page.locator('text=Redrive me')).toBeHidden();
    });

    test('should redrive multiple messages (bulk)', async ({ page }) => {
        // Switch to Table view
        await page.click(queuePage.viewModeTable);

        // Mock redrive operation for 2 messages
        await page.route(`**/api/queues/**/redrive/selective`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    processedCount: 2,
                    successCount: 2,
                    failureCount: 0,
                    succeeded: [{ messageId: 'dlq-msg-1' }, { messageId: 'dlq-msg-2' }],
                    failed: [],
                    errors: []
                })
            });
        });

        // Mock DLQ messages
        await page.route(`**/api/queues/**/dlq/messages*`, async (route) => {
            await route.fulfill({
                body: JSON.stringify([
                    { messageId: 'dlq-msg-1', body: 'Msg 1', receiptHandle: 'h1', attributes: { SentTimestamp: '1', ApproximateReceiveCount: '3' } },
                    { messageId: 'dlq-msg-2', body: 'Msg 2', receiptHandle: 'h2', attributes: { SentTimestamp: '2', ApproximateReceiveCount: '3' } }
                ])
            });
        });

        await queuePage.selectQueue(testQueueName);
        await messagePage.switchTab('dlq');

        // Select both messages via the header checkbox
        await page.locator('thead input[type="checkbox"]').click();

        // Use redriveSelected
        await messagePage.redriveSelected();

        // Verify success message for plural
        await expect(page.locator('.message-table .success')).toContainText('Successfully redriven 2 message(s)');

        // Verify messages are removed
        await expect(page.locator('text=Msg 1')).toBeHidden();
        await expect(page.locator('text=Msg 2')).toBeHidden();
    });

    test('should handle redrive failures', async ({ page }) => {
        // Switch to Table view
        await page.click(queuePage.viewModeTable);

        // Mock redrive failure
        await page.route(`**/api/queues/**/redrive/selective`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    processedCount: 1,
                    successCount: 0,
                    failureCount: 1,
                    succeeded: [],
                    failed: [{ messageId: 'dlq-msg-1', error: 'Queue full' }],
                    errors: [{ messageId: 'dlq-msg-1', error: 'Queue full' }]
                })
            });
        });

        // Mock DLQ messages
        await page.route(`**/api/queues/**/dlq/messages*`, async (route) => {
            await route.fulfill({
                body: JSON.stringify([{
                    messageId: 'dlq-msg-1', body: 'Fail me', receiptHandle: 'h1',
                    attributes: { SentTimestamp: '123', ApproximateReceiveCount: '3' }
                }])
            });
        });

        await queuePage.selectQueue(testQueueName);
        await messagePage.switchTab('dlq');

        await page.locator('input[type="checkbox"]').nth(1).click();

        // Use redriveSelected but expect it to handle failure gracefully (or manually handle if needed)
        // Since we want to check the SPECIFIC error message, we can still use redriveSelected 
        // because it waits for loading to finish.
        await messagePage.redriveSelected();

        // Verify error message
        await expect(page.locator('.message-table .error')).toContainText('Failed to redrive all 1 message(s)');
        await expect(page.locator('.message-table .error')).toContainText('Queue full');

        // Verify message stays in the list
        await expect(page.locator('text=Fail me')).toBeVisible();
    });
});
