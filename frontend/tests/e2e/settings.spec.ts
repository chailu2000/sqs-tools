import { test, expect } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';

test.describe('Settings Configuration', () => {
    let settingsPage: SettingsPage;

    test.beforeEach(async ({ page }) => {
        settingsPage = new SettingsPage(page);

        // Mock profiles list
        await page.route('**/api/config/profiles', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(['default', 'test-profile', 'production'])
            });
        });

        // Mock setting profile
        await page.route('**/api/config/profile', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, profile: 'test-profile' })
                });
            } else {
                await route.continue();
            }
        });

        // Mock test credentials (initially valid)
        await page.route('**/api/config/test-credentials', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    valid: true,
                    accountId: '123456789012',
                    method: 'profile:test-profile'
                })
            });
        });

        await settingsPage.goto();
    });

    test('8.1 should open and close settings modal', async ({ page }) => {
        await settingsPage.open();
        await expect(page.locator(settingsPage.modalContent)).toBeVisible();
        await expect(page.locator(settingsPage.settingsPanel)).toBeVisible();

        await settingsPage.close();
        await expect(page.locator(settingsPage.modalOverlay)).toBeHidden();
    });

    test('8.2 should select an AWS profile and test credentials', async ({ page }) => {
        await settingsPage.open();

        // Check if profiles are loaded
        const profiles = await settingsPage.getProfiles();
        expect(profiles).toContain('test-profile');
        expect(profiles).toContain('production');

        // Select and set profile
        await settingsPage.setProfile('test-profile');

        // Test credentials
        await settingsPage.testCredentials();
        await settingsPage.waitForCredentialStatus();

        const status = await settingsPage.getCredentialStatus();
        expect(status).toBe('valid');

        const accountId = await settingsPage.getAccountId();
        expect(accountId).toContain('123456789012');

        const method = await settingsPage.getCredentialMethod();
        expect(method).toContain('profile:test-profile');
    });

    test('8.3 should handle invalid credentials', async ({ page }) => {
        // Mock invalid credentials for this test
        await page.route('**/api/config/test-credentials', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    valid: false,
                    error: 'The security token included in the request is invalid.'
                })
            });
        });

        await settingsPage.open();
        await settingsPage.testCredentials();
        await settingsPage.waitForCredentialStatus();

        const status = await settingsPage.getCredentialStatus();
        expect(status).toBe('invalid');

        const error = await settingsPage.getCredentialError();
        expect(error).toContain('security token included in the request is invalid');
    });
});
