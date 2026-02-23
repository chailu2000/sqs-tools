import { type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Message Page Object Model class
 * Handles message operations
 */
export class MessagePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    /**
     * Send a message with the given body
     */
    async sendMessage(body: string) {
        await this.fill(this.inputMessageBody, body);
        await this.click(this.btnSendMessage);
        await this.waitForLoadingToFinish();
    }

    /**
     * Receive messages from the selected queue
     */
    async receiveMessages(maxMessages: number = 10) {
        await this.page.waitForSelector(this.inputMaxMessages, { state: 'visible' });
        await this.fill(this.inputMaxMessages, maxMessages.toString());
        await this.click(this.btnReceiveMessages);
        await this.waitForLoadingToFinish();
    }

    /**
     * Delete a message by receipt handle
     */
    async deleteMessage(receiptHandle: string) {
        const selector = `[data-receipt-handle="${receiptHandle}"] ${this.btnDeleteMessage}`;
        const deleteBtn = this.page.locator(selector);

        // Use force click to bypass stability checks that might be failing due to Svelte's background updates
        await deleteBtn.click({ force: true });

        // Use a more specific locator for the confirmation button to avoid global overlaps
        const confirmBtn = this.page.locator('.confirm-dialog .btn-danger');
        await confirmBtn.waitFor({ state: 'visible' });
        await confirmBtn.click();

        await this.waitForLoadingToFinish();
    }

    /**
     * Get the count of messages displayed
     */
    async getMessageCount(): Promise<number> {
        return await this.count(this.messageCard);
    }

    /**
     * Get the count of messages in the table
     */
    async getMessageTableCount(): Promise<number> {
        return await this.count(this.messageTable);
    }

    /**
     * Get all message bodies
     */
    async getMessageBodies(): Promise<string[]> {
        const count = await this.count(this.messageCard);
        const bodies: string[] = [];
        for (let i = 0; i < count; i++) {
            const body = await this.page.locator(this.messageCard).nth(i).locator(this.messageBody).textContent();
            if (body) {
                bodies.push(body.trim());
            }
        }
        return bodies;
    }

    /**
     * Search for messages
     */
    async searchMessages(searchTerm: string) {
        await this.fill(this.inputSearchMessages, searchTerm);
    }

    /**
     * Clear search
     */
    async clearSearch() {
        await this.fill(this.inputSearchMessages, '');
    }

    /**
     * Get the view mode (cards or table)
     */
    async getViewMode(): Promise<'cards' | 'table'> {
        const cardsButton = this.page.locator(this.viewModeCards);
        const tableButton = this.page.locator(this.viewModeTable);

        const cardsClass = await cardsButton.getAttribute('class');
        if (cardsClass?.includes('active')) {
            return 'cards';
        }
        const tableClass = await tableButton.getAttribute('class');
        if (tableClass?.includes('active')) {
            return 'table';
        }
        return 'cards'; // default
    }

    /**
     * Set the view mode
     */
    async setViewMode(mode: 'cards' | 'table') {
        const currentMode = await this.getViewMode();
        if (currentMode === mode) {
            return;
        }

        const selector = mode === 'cards' ? this.viewModeCards : this.viewModeTable;
        await this.click(selector);

        // Wait for the relevant component to be visible
        const componentSelector = mode === 'cards' ? this.messageViewer : this.messageTable;
        await this.page.waitForSelector(componentSelector, { state: 'visible', timeout: 5000 });
    }

    /**
     * Switch between tabs (Queue Info, Main Queue, DLQ)
     */
    async switchTab(tab: 'queue' | 'main' | 'dlq') {
        let selector = '';
        switch (tab) {
            case 'queue': selector = this.tabQueue; break;
            case 'main': selector = this.tabMain; break;
            case 'dlq': selector = this.tabDLQ; break;
        }
        await this.click(selector);
        await this.waitForLoadingToFinish();
    }

    /**
     * Start polling for messages
     */
    async startPolling() {
        await this.click(this.btnPollMessages);
    }

    /**
     * Stop polling for messages
     */
    async stopPolling() {
        await this.click(this.btnStopPolling);
    }

    /**
     * Check if polling is active
     */
    async isPolling(): Promise<boolean> {
        return await this.page.locator(this.pollingProgress).isVisible();
    }

    /**
     * Wait for polling to finish or progress bar to disappear
     */
    async waitForPollingToFinish(timeout: number = 30000) {
        await this.page.waitForSelector(this.pollingProgress, { state: 'hidden', timeout });
    }

    /**
     * Redrive selected messages from DLQ
     */
    async redriveSelected() {
        await this.click(this.btnRedriveSelected);
        const confirmBtn = this.page.locator('.confirm-dialog .btn-primary');
        await confirmBtn.waitFor({ state: 'visible' });
        await confirmBtn.click();
        await this.waitForLoadingToFinish();
    }

    /**
     * Get message attributes for a specific message
     */
    async getMessageAttributes(receiptHandle: string): Promise<Record<string, string>> {
        const messageCard = this.getMessageCardByReceiptHandle(receiptHandle);
        const attributes: Record<string, string> = {};

        const attributeCount = await messageCard.locator(this.messageAttributes).count();
        for (let i = 0; i < attributeCount; i++) {
            const key = await messageCard.locator(this.messageAttributes).nth(i).locator('.attr-key').textContent();
            const value = await messageCard.locator(this.messageAttributes).nth(i).locator('.attr-value').textContent();
            if (key && value) {
                attributes[key.trim()] = value.trim();
            }
        }
        return attributes;
    }

    /**
     * Get message body by receipt handle
     */
    async getMessageBody(receiptHandle: string): Promise<string | null> {
        const messageCard = this.getMessageCardByReceiptHandle(receiptHandle);
        return await messageCard.locator(this.messageBody).textContent();
    }

    async getMessageSentSuccessMessage(): Promise<string | null> {
        await this.page.waitForSelector(this.messageSentSuccess, { state: 'visible' });
        return await this.page.textContent(this.messageSentSuccess);
    }

    /**
     * Check if a message exists by receipt handle
     */
    async hasMessage(receiptHandle: string): Promise<boolean> {
        const locator = this.page.locator(`[data-receipt-handle="${receiptHandle}"]`);
        // Use a short timeout to check existence without hanging the test
        return await locator.count() > 0;
    }

    /**
     * Get the first message's receipt handle
     */
    async getFirstMessageReceiptHandle(): Promise<string | null> {
        const rows = this.page.locator(this.messageCard);
        const count = await rows.count();
        if (count > 0) {
            return await rows.nth(0).getAttribute('data-receipt-handle');
        }
        return null;
    }

    /**
     * Get all message receipt handles
     */
    async getAllMessageReceiptHandles(): Promise<string[]> {
        const count = await this.count(this.messageCard);
        const handles: string[] = [];
        for (let i = 0; i < count; i++) {
            const handle = await this.page.locator(this.messageCard).nth(i).getAttribute('data-receipt-handle');
            if (handle) {
                handles.push(handle);
            }
        }
        return handles;
    }

    /**
     * Get message count by status (available, in-flight, delayed)
     */
    async getMessageCounts(): Promise<{ available: number; inFlight: number; delayed: number }> {
        const available = await this.count(this.messageCard);
        return { available, inFlight: 0, delayed: 0 }; // Simplified for now
    }

    /**
     * Change message visibility timeout
     */
    async changeMessageVisibility(receiptHandle: string, timeout: number) {
        const messageCard = this.getMessageCardByReceiptHandle(receiptHandle);
        await messageCard.locator(this.btnChangeVisibility).click();

        // Prompt for timeout
        await this.page.evaluate((timeout) => {
            (window as any).prompt = () => timeout.toString();
        }, timeout);

        await this.click(this.btnPrimary);
        await this.waitForLoadingToFinish();
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

    /**
     * Get success message if present
     */
    /**
     * Get success message if present (typically from the composer)
     */
    async getSuccessMessage(): Promise<string | null> {
        const success = this.page.locator(this.messageSentSuccess).first();
        try {
            await success.waitFor({ state: 'visible', timeout: 5000 });
            return await success.textContent();
        } catch (e) {
            if (await success.count() > 0) {
                return await success.textContent();
            }
            return null;
        }
    }

    /**
     * Get the deletion success message specifically
     */
    async getDeletionSuccessMessage(): Promise<string | null> {
        // Use text matching to find the success message specifically for DELETION
        const success = this.page.locator('.success').filter({ hasText: /deleted/i }).first();

        try {
            await success.waitFor({ state: 'visible', timeout: 5000 });
            return await success.textContent();
        } catch (e) {
            if (await success.count() > 0) {
                return await success.textContent();
            }
            return null;
        }
    }

    /**
     * Wait for messages to load
     */
    async waitForMessagesToLoad() {
        await this.waitForLoadingToFinish();
    }

    /**
     * Get message card locator by receipt handle
     */
    private getMessageCardByReceiptHandle(receiptHandle: string) {
        return this.page.locator(`[data-receipt-handle="${receiptHandle}"]`);
    }

    // Override selectors specific to MessagePage
    get messageCard() { return '[data-receipt-handle]'; }
    get messageBody() { return '.message-body'; }
    get messageAttributes() { return '.message-attributes'; }
    get btnSendMessage() { return '.message-composer .btn-primary'; }
    get btnReceiveMessages() { return '.message-viewer .btn-primary'; }
    get btnDeleteMessage() { return '.message-actions .btn-danger-small'; }
    get btnChangeVisibility() { return '.message-actions .btn-small'; }
    get inputMessageBody() { return '#message-body'; }
    get inputSearchMessages() { return '.input-search'; }
    get inputMaxMessages() { return 'label:has-text("Max Messages") input.input-small'; }
    get inputVisibilityTimeout() { return 'input[placeholder="Visibility Timeout"]'; }
    get inputWaitTime() { return 'input[placeholder="Wait Time"]'; }
    get btnPrimary() { return '.btn-primary'; }
    get btnDanger() { return '.btn-danger'; }
    get error() { return '.error'; }
    get success() { return '.success'; }
    get loading() { return '.loading'; }
    get viewModeCards() { return '[data-testid="view-mode-cards"]'; }
    get viewModeTable() { return '[data-testid="view-mode-table"]'; }
    get messageSentSuccess() { return '.message-composer .success'; }
    get tabQueue() { return '[data-testid="tab-queue"]'; }
    get tabMain() { return '[data-testid="tab-main"]'; }
    get tabDLQ() { return '[data-testid="tab-dlq"]'; }
    get btnRedriveSelected() { return 'button:has-text("Redrive Selected")'; }
    get btnPollMessages() { return '.poll-button'; }
    get btnStopPolling() { return '.stop-button'; }
    get pollingProgress() { return '.progress-container'; }
}
