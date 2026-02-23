import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Settings Page Object Model class
 * Handles settings configuration operations
 */
export class SettingsPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    /**
     * Open the settings modal
     */
    async open() {
        await this.click(this.btnSettings);
        await this.waitForSelector(this.modalOverlay);
    }

    /**
     * Close the settings modal
     */
    async close() {
        await this.click(this.modalClose);
        await this.waitForSelector(this.modalOverlay, 'hidden');
    }

    /**
     * Set AWS profile
     */
    async setProfile(profileName: string) {
        await this.waitForProfiles();
        await this.page.selectOption(this.profileSelector, { value: profileName });
        await this.click(this.btnSetProfile);
        await this.waitForLoadingToFinish();
    }

    /**
     * Test AWS credentials
     */
    async testCredentials() {
        await this.page.click(this.btnTestCredentials);
        await this.waitForLoadingToFinish();
    }

    /**
     * Get credential status
     */
    async getCredentialStatus(): Promise<'valid' | 'invalid' | 'unknown'> {
        if (await this.page.locator(this.credentialValid).count() > 0) {
            return 'valid';
        }
        if (await this.page.locator(this.credentialInvalid).count() > 0) {
            return 'invalid';
        }
        return 'unknown';
    }

    /**
     * Wait for credential status to be determined (not 'unknown')
     */
    async waitForCredentialStatus() {
        await this.page.waitForFunction(() => {
            const validElement = document.querySelector('.status-card.valid');
            const invalidElement = document.querySelector('.status-card.invalid');
            return validElement !== null || invalidElement !== null;
        }, { timeout: 10000 }); // Wait up to 10 seconds
    }

    /**
     * Get AWS account ID from credentials
     */
    async getAccountId(): Promise<string | null> {
        return await this.page.locator('.status-detail:has-text("Account ID:") .detail-value').textContent();
    }

    /**
     * Get credential method
     */
    async getCredentialMethod(): Promise<string | null> {
        return await this.page.locator('.status-detail:has-text("Method:") .detail-value').textContent();
    }

    /**
     * Get credential error message
     */
    async getCredentialError(): Promise<string | null> {
        return await this.page.locator(this.credentialError).textContent();
    }

    /**
     * Wait for profiles to be loaded into the selector
     */
    async waitForProfiles() {
        await this.page.waitForSelector(`${this.profileSelector} option:not([value=""])`, { state: 'attached', timeout: 5000 });
    }

    /**
     * Get list of available profiles
     */
    async getProfiles(): Promise<string[]> {
        await this.waitForProfiles();
        const options = await this.page.$$eval(`${this.profileSelector} option`, (elements) => {
            return elements.map(el => el.textContent?.trim() || '').filter(option => option !== 'Select a profile...');
        });
        return options;
    }

    /**
     * Check if credentials are valid
     */
    async areCredentialsValid(): Promise<boolean> {
        return await this.getCredentialStatus() === 'valid';
    }

    /**
     * Wait for settings to load
     */
    async waitForSettingsToLoad() {
        await this.waitForLoadingToFinish();
    }

    /**
     * Get success message if present
     */
    async getSuccessMessage(): Promise<string | null> {
        const success = this.page.locator(this.success);
        if (await success.count() > 0) {
            return await success.textContent();
        }
        return null;
    }

    /**
     * Get error message if present
     */
    async getErrorMessage(): Promise<string | null> {
        const error = this.page.locator(this.error);
        if (await error.count() > 0) {
            return await error.textContent();
        }
        return null;
    }

    // Override selectors specific to SettingsPage
    get btnSettings() { return '[data-testid="settings-button"]'; }
    get modalOverlay() { return '.modal-overlay'; }
    get modalContent() { return '.modal-content'; }
    get modalClose() { return '.modal-close'; }
    get settingsPanel() { return '.settings-panel'; }
    get profileSelector() { return '.profile-selector select'; }
    get btnSetProfile() { return '.profile-selector .btn-primary'; }
    get btnTestCredentials() { return '.settings-panel .btn-secondary'; }
    get credentialStatus() { return '.status-card'; }
    get credentialValid() { return '.status-card.valid'; }
    get credentialInvalid() { return '.status-card.invalid'; }
    get credentialAccountId() { return '.status-card .detail-value'; }
    get credentialMethod() { return '.status-card .detail-value'; }
    get credentialError() { return '.status-error'; }
    get success() { return '.success'; }
    get error() { return '.error'; }
    get loading() { return '.loading'; }

    /**
     * Select an option from a dropdown
     */
    async selectOption(selector: string, value: string) {
        await this.page.selectOption(selector, { value });
    }
}
