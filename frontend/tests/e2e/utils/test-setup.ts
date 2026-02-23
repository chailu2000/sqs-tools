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
