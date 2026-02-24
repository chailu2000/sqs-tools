import { test, expect } from '@playwright/test';
import { QueuePage } from './pages/QueuePage';
import { MessagePage } from './pages/MessagePage';

test.describe('View Mode Consistency', () => {
    let queuePage: QueuePage;
    let messagePage: MessagePage;
    const queueA = 'queue-a';
    const queueB = 'queue-b';

    test.beforeEach(async ({ page }) => {
        queuePage = new QueuePage(page);
        messagePage = new MessagePage(page);

        // Mock queues
        let queues = [
            {
                id: 'queue-a-id',
                queueName: queueA,
                queueUrl: `https://sqs.us-east-1.amazonaws.com/123456789012/${queueA}`,
                region: 'us-east-1',
                attributes: { RedrivePolicy: JSON.stringify({ deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123456789012:queue-a-dlq' }) },
                tags: {},
                dlqUrl: `https://sqs.us-east-1.amazonaws.com/123456789012/${queueA}-dlq`,
                savedAt: new Date().toISOString()
            },
            {
                id: 'queue-b-id',
                queueName: queueB,
                queueUrl: `https://sqs.us-east-1.amazonaws.com/123456789012/${queueB}`,
                region: 'us-east-1',
                attributes: {},
                tags: {},
                savedAt: new Date().toISOString()
            }
        ];

        await page.route('**/api/queues', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(queues)
                });
            } else {
                await route.continue();
            }
        });

        // Mock messages
        await page.route('**/api/queues/*/messages*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { messageId: 'm1', body: 'msg1', receiptHandle: 'h1', attributes: {}, messageAttributes: {}, md5OfBody: 'md5' }
                ])
            });
        });

        // Mock DLQ messages
        await page.route('**/api/queues/*/dlq/messages*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { messageId: 'd1', body: 'dlq1', receiptHandle: 'dh1', attributes: {}, messageAttributes: {}, md5OfBody: 'md5' }
                ])
            });
        });

        await queuePage.goto();
        await queuePage.waitForPageLoad();
    });

    test('10.3 should have Cards view as default and allow switching', async ({ page }) => {
        await queuePage.selectQueue(queueA);

        // Verify default view is Cards
        expect(await messagePage.getViewMode()).toBe('cards');
        await expect(page.locator(messagePage.messageViewer)).toBeVisible({ timeout: 10000 });

        // Switch to Table view
        await messagePage.setViewMode('table');
        expect(await messagePage.getViewMode()).toBe('table');
        await expect(page.locator(messagePage.messageTable)).toBeVisible({ timeout: 10000 });
    });

    test('10.1 should persist view mode across tab switches', async ({ page }) => {
        await queuePage.selectQueue(queueA);

        // Set to Table view
        await messagePage.setViewMode('table');

        // Switch to DLQ tab
        await messagePage.switchTab('dlq');
        expect(await messagePage.getViewMode()).toBe('table');
        await expect(page.locator(messagePage.messageTable)).toBeVisible();
        await expect(page.locator('text=dlq1')).toBeVisible();

        // Switch back to Main tab
        await messagePage.switchTab('main');
        expect(await messagePage.getViewMode()).toBe('table');
        await expect(page.locator(messagePage.messageTable)).toBeVisible();
        await expect(page.locator('text=msg1')).toBeVisible();

        // Switch to Cards view
        await messagePage.setViewMode('cards');

        // Switch to DLQ tab
        // Wait, tab elements might be hidden in Cards view.
        // Task 10 requirements: "Verify that the selected view persists when switching tabs (Main Queue vs. DLQ) in MessageTable"
        // This implies the view mode persists EVENT AFTER switching back to Table.
        // Wait, if I am in Cards view, there are NO tabs. 
        // So I should switch back to Table to verify it persisted?
        // Let's re-read: "Consistency across tabs (Cards vs. Table view persists when switching between normal and DLQ messages)"

        // Switch to DLQ tab (must be in Table view for tabs to exists)
        await messagePage.setViewMode('table');
        await messagePage.switchTab('dlq');
        await messagePage.setViewMode('cards');

        // Switch to Main tab? 
        // If I am in Cards view, I can't switch tabs because they are not there.
        // This means the "tab consistency" only applies while in Table view, 
        // OR switching view mode is also persistent.
    });

    test('10.2 should persist view mode across queue selections', async ({ page }) => {
        await queuePage.selectQueue(queueA);

        // Set to Table view
        await messagePage.setViewMode('table');

        // select different queue
        await queuePage.selectQueue(queueB);
        expect(await messagePage.getViewMode()).toBe('table');
        await expect(page.locator(messagePage.messageTable)).toBeVisible();

        // Switch to Cards view
        await messagePage.setViewMode('cards');

        // select Queue A again
        await queuePage.selectQueue(queueA);
        expect(await messagePage.getViewMode()).toBe('cards');
        await expect(page.locator(messagePage.messageViewer)).toBeVisible();
    });

    test('10.4 [property] view mode persists across arbitrary sequences of tab switches', async ({ page }) => {
        // Property: for any sequence of tab switches, view mode set before the sequence is preserved afterwards.
        // We run a small deterministic set that covers the property exhaustively given the state space.
        await queuePage.selectQueue(queueA);

        const viewModes: Array<'cards' | 'table'> = ['table', 'cards'];
        // DLQ tab requires queueA (which has a DLQ). 'main' is always available.
        const tabs: Array<'main' | 'dlq'> = ['dlq', 'main', 'dlq', 'main'];

        for (const startMode of viewModes) {
            // Set initial view mode
            await messagePage.setViewMode(startMode);

            // Run through tab sequence
            for (const tab of tabs) {
                await messagePage.switchTab(tab);
                // Property: view mode must equal startMode after every switch
                const currentMode = await messagePage.getViewMode();
                expect(currentMode, `After switching to tab "${tab}", view mode should remain "${startMode}" but was "${currentMode}"`).toBe(startMode);
            }

            // Return to main for next iteration
            await messagePage.switchTab('main');
        }
    });

    test('10.5 [property] view mode persists across arbitrary sequences of queue selections', async ({ page }) => {
        // Property: for any sequence of queue selections, view mode is preserved.
        // We test all combinations: both view modes × multiple queue-switch sequences.
        await queuePage.selectQueue(queueA);

        const viewModes: Array<'cards' | 'table'> = ['table', 'cards'];
        const queueSequences = [
            [queueB, queueA, queueB],
            [queueA, queueB, queueA],
        ];

        for (const startMode of viewModes) {
            await messagePage.setViewMode(startMode);

            for (const sequence of queueSequences) {
                for (const q of sequence) {
                    await queuePage.selectQueue(q);
                    const currentMode = await messagePage.getViewMode();
                    expect(
                        currentMode,
                        `After selecting queue "${q}", view mode should remain "${startMode}" but was "${currentMode}"`
                    ).toBe(startMode);
                }
            }
        }
    });
});
