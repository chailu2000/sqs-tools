import { expect, Page } from '@playwright/test';
import { SettingsPage } from '../pages/SettingsPage';
import { QueuePage } from '../pages/QueuePage';
import { generateValidQueueData } from '../fixtures/queueData';

export async function setupAwsProfile(settingsPage: SettingsPage, profileName: string, page: Page) {
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();
    await settingsPage.open();

    // await settingsPage.getProfiles(); // Removed as it was causing issues
    // console.log('Available AWS Profiles from frontend:', availableProfiles); // Removed debug log
    await settingsPage.setProfile(profileName);
    await settingsPage.testCredentials();
    await settingsPage.waitForCredentialStatus();
    await expect(settingsPage.getCredentialStatus()).resolves.toBe('valid');
    await settingsPage.close();
}

export async function addTestQueue(queuePage: QueuePage, queueName: string, region: string, page: Page) {
    await queuePage.goto();
    await queuePage.waitForPageLoad();

    const queueExists = await queuePage.hasQueue(queueName);

    if (!queueExists) {
        await queuePage.addQueue(queueName, region);
        // Wait for it to appear in the list
        await page.locator(queuePage.queueItem).filter({ hasText: queueName }).waitFor({ state: 'visible' });
    }
    await queuePage.selectQueue(queueName);
}

export async function clearAllQueues(page: Page) {
    await page.goto('/');
    // We use the internal API via page.evaluate for speed and robustness
    await page.evaluate(async () => {
        try {
            const resp = await fetch('/api/queues');
            if (!resp.ok) return;
            const queues = await resp.json();
            for (const q of queues) {
                await fetch(`/api/queues/${q.id}`, { method: 'DELETE' });
            }
        } catch (e) {
            console.error('Failed to clear queues:', e);
        }
    });
    await page.reload();
}
