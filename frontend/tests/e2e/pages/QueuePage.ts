import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Queue Page Object Model class
 * Handles queue management operations
 */
export class QueuePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    /**
     * Add a queue with the given name and region
     */
    async addQueue(name: string, region: string = 'us-east-1') {
        const initialQueueCount = await this.getQueueCount();
        await this.click(this.btnAddQueue);
        await this.waitForSelector(this.addQueueForm);
        await this.fill(this.inputQueueIdentifier, name);
        await this.selectOption(this.selectRegion, region);
        await this.click(this.btnPrimary);
        await this.page.locator(this.addQueueForm).waitFor({ state: 'hidden' });
    }

    /**
     * Wait for the queue count to increase
     */
    async waitForQueueCountIncrease(initialCount: number, expectedCount: number) {
        await this.page.waitForFunction(
            (args) => {
                const { initialCount, expectedCount, queueItemSelector } = args;
                const currentCount = document.querySelectorAll(queueItemSelector).length;
                return currentCount === expectedCount;
            },
            { initialCount, expectedCount, queueItemSelector: this.queueItem },
            { timeout: 30000 } // Increased timeout to 30 seconds
        );
    }

    /**
     * Initiate removal of a queue by name (clicks the 'x' button)
     */
    async initiateRemoveQueue(name: string) {
        const queueItem = this.page.locator(this.queueItem).filter({ hasText: name });
        await queueItem.locator(this.btnRemoveQueue).click();
        // Wait for the confirmation dialog to appear
        await this.page.locator(this.confirmDialog).waitFor({ state: 'visible' });
    }

    /**
     * Confirm the removal of a queue
     */
    async confirmQueueRemoval() {
        await this.click(this.btnDanger); // Clicks the 'Remove' button in the confirmation dialog
        await this.waitForLoadingToFinish(); // Wait for the operation to complete
        await this.page.locator(this.confirmDialog).waitFor({ state: 'hidden' }); // Wait for the confirmation dialog to disappear
    }

    /**
     * Cancel the removal of a queue
     */
    async cancelQueueRemoval() {
        await this.click(this.btnSecondaryAction); // Clicks the 'Cancel' button in the confirmation dialog
        await this.page.locator(this.confirmDialog).waitFor({ state: 'hidden' }); // Wait for the confirmation dialog to disappear
    }

    /**
     * Select a queue by name
     */
    async selectQueue(name: string) {
        const queueItem = this.page.locator(this.queueItem).filter({ hasText: name });
        await queueItem.waitFor({ state: 'visible' });
        await queueItem.click();
        await this.waitForLoadingToFinish();
    }

    /**
     * Get the count of queues in the list
     */
    async getQueueCount(): Promise<number> {
        return await this.count(this.queueItem);
    }

    /**
     * Get the names of all queues
     */
    async getQueueNames(): Promise<string[]> {
        const count = await this.count(this.queueItem);
        const names: string[] = [];
        for (let i = 0; i < count; i++) {
            const name = await this.page.locator(this.queueItem).nth(i).locator(this.queueName).textContent();
            if (name) {
                names.push(name.trim());
            }
        }
        return names;
    }

    /**
     * Check if a queue exists by name
     */
    async hasQueue(name: string): Promise<boolean> {
        return await this.page.locator(this.queueItem).filter({ hasText: name }).count() > 0;
    }

    /**
     * Get queue details (region, DLQ name)
     */
    async getQueueDetails(name: string): Promise<{ region: string; dlqName?: string }> {
        const queueItem = this.page.locator(this.queueItem).filter({ hasText: name });
        const region = await queueItem.locator(this.queueRegion).textContent();
        const dlqName = await queueItem.locator(this.queueDlq).textContent();
        return {
            region: region?.trim() || '',
            dlqName: dlqName?.replace('DLQ: ', '').trim() || undefined
        };
    }

    /**
     * Cancel the add queue form
     */
    async cancelAddQueue() {
        await this.click(this.btnAddQueue);
        await this.waitForSelector(this.addQueueForm, 'hidden');
    }

    /**
     * Cancel queue removal confirmation
     */
    async cancelRemoveQueue() {
        await this.click(this.btnSecondaryAction);
    }

    /**
     * Get the selected queue name
     */
    async getSelectedQueueName(): Promise<string | null> {
        const selected = this.page.locator(this.queueItem + '.selected');
        if (await selected.count() > 0) {
            return await selected.locator(this.queueName).textContent();
        }
        return null;
    }

    /**
     * Check if the queue list is empty
     */
    async isQueueListEmpty(): Promise<boolean> {
        return await this.page.locator('.empty').count() > 0;
    }

    /**
     * Wait for queue operations to complete
     */
    async waitForQueueOperation() {
        await this.waitForLoadingToFinish();
    }

    // Override selectors specific to QueuePage
    get addQueueForm() { return '.add-form'; }
    get inputQueueIdentifier() { return 'input[placeholder="Queue name or URL"]'; }
    get selectRegion() { return this.addQueueForm + ' select'; }
    get btnPrimary() { return '.btn-primary'; }
    get btnDanger() { return '.btn-danger'; }
    get btnSecondaryAction() { return '.btn-secondary-action'; }
    get queueItem() { return '.queue-item'; }
    get queueName() { return '.queue-name'; }
    get queueRegion() { return '.queue-region'; }
    get queueDlq() { return '.queue-dlq'; }
    get btnRemoveQueue() { return '.btn-remove'; }
    get btnAddQueue() { return '.btn-add'; }
    get loading() { return '.loading'; }
    get confirmDialog() { return '.confirm-dialog'; }

    /**
     * Select an option from a dropdown
     */
    async selectOption(selector: string, value: string) {
        await this.page.selectOption(selector, { value });
    }
}
