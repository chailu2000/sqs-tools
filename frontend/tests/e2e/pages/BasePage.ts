import { type Page } from '@playwright/test';

/**
 * Base Page Object Model class
 * Provides common functionality for all page objects
 */
export class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigate to the application root
     */
    async goto() {
        await this.page.goto('http://localhost:5173');
    }

    /**
     * Wait for the page to be fully loaded
     */
    async waitForPageLoad() {
        await this.page.waitForSelector('.app', { state: 'visible' });
    }

    /**
     * Wait for a specific selector to be visible
     */
    async waitForSelector(selector: string, state: 'visible' | 'hidden' = 'visible') {
        await this.page.waitForSelector(selector, { state });
    }

    /**
     * Click an element by selector
     */
    async click(selector: string) {
        await this.page.click(selector);
    }

    /**
     * Fill an input field by selector
     */
    async fill(selector: string, value: string) {
        await this.page.fill(selector, value);
    }

    /**
     * Get text content of an element
     */
    async getText(selector: string): Promise<string | null> {
        return await this.page.textContent(selector);
    }

    /**
     * Get attribute value of an element
     */
    async getAttribute(selector: string, attribute: string): Promise<string | null> {
        return await this.page.getAttribute(selector, attribute);
    }

    /**
     * Check if an element is visible
     */
    async isVisible(selector: string): Promise<boolean> {
        return await this.page.isVisible(selector);
    }

    /**
     * Check if an element exists
     */
    async exists(selector: string): Promise<boolean> {
        return await this.page.locator(selector).count() > 0;
    }

    /**
     * Get count of elements matching selector
     */
    async count(selector: string): Promise<number> {
        return await this.page.locator(selector).count();
    }

    /**
     * Take a screenshot
     */
    async screenshot(name: string) {
        await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
    }

    /**
     * Wait for network to be idle
     */
    async waitForNetworkIdle() {
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Wait for loading indicators to disappear
     */
    async waitForLoadingToFinish() {
        // Since many components don't have a dedicated .loading element 
        // and networkidle is flaky with polling, we'll just wait for 100ms
        // to let the UI settle if needed.
        await this.page.waitForTimeout(100);
    }

    // Common selectors
    get appContainer() { return '.app'; }
    get queueList() { return '.queue-list'; }
    get queueItem() { return '.queue-item'; }
    get queueName() { return '.queue-name'; }
    get queueRegion() { return '.queue-region'; }
    get queueDlq() { return '.queue-dlq'; }
    get btnAddQueue() { return '.btn-add'; }
    get btnRemoveQueue() { return '.btn-remove'; }
    get btnSelectQueue() { return '.queue-item'; }
    get addQueueForm() { return '.add-form'; }
    get inputQueueIdentifier() { return 'input[placeholder="Queue name or URL"]'; }
    get selectRegion() { return 'select'; }
    get btnPrimary() { return '.btn-primary'; }
    get btnDanger() { return '.btn-danger'; }
    get btnSecondary() { return '.btn-secondary'; }
    get btnSecondaryAction() { return '.btn-secondary-action'; }
    get errorToast() { return '.toast.error'; }
    get error() { return '.error'; }
    get success() { return '.success'; }
    get confirmDialog() { return '.confirm-dialog'; }
    get confirmContent() { return '.confirm-content'; }
    get confirmActions() { return '.confirm-actions'; }
    get modalOverlay() { return '.modal-overlay'; }
    get modalContent() { return '.modal-content'; }
    get modalClose() { return '.modal-close'; }
    get btnSettings() { return '.btn-settings'; }
    get viewToggle() { return '.view-toggle'; }
    get viewModeCards() { return '[data-testid="view-mode-cards"]'; }
    get viewModeTable() { return '[data-testid="view-mode-table"]'; }
    get messageViewer() { return '.message-viewer'; }
    get messageComposer() { return '.message-composer'; }
    get messageTable() { return '.message-table'; }
    get messageCard() { return '.message-card'; }
    get messageBody() { return '.message-body'; }
    get messageAttributes() { return '.message-attributes'; }
    get messageHeader() { return '.message-header'; }
    get messageActions() { return '.message-actions'; }
    get btnSendMessage() { return '.message-composer .btn-primary'; }
    get btnReceiveMessages() { return '.message-viewer .btn-primary'; }
    get btnDeleteMessage() { return '.message-actions .btn-danger-small'; }
    get btnChangeVisibility() { return '.message-actions .btn-small'; }
    get inputMessageBody() { return '#message-body'; }
    get inputSearchMessages() { return '.input-search'; }
    get inputMaxMessages() { return 'input[placeholder="Max Messages"]'; }
    get inputVisibilityTimeout() { return 'input[placeholder="Visibility Timeout"]'; }
    get inputWaitTime() { return 'input[placeholder="Wait Time"]'; }
    get selectViewMode() { return '.select-small'; }
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
}
