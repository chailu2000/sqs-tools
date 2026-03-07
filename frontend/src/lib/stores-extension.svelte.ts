/**
 * Extension-specific store
 * Extends the base store with extension context (queue from extension)
 */

import type { QueueConfiguration, Message } from './api-adapter';

type ViewMode = 'cards' | 'table';

// Create a store class to encapsulate state
class ExtensionStore {
    // Queue is provided by extension, not fetched
    selectedQueue = $state<QueueConfiguration | null>(null);
    messages = $state<Message[]>([]);
    dlqMessages = $state<Message[]>([]);
    searchTerm = $state('');
    viewMode = $state<ViewMode>('table'); // Default to table for extension
    activeTab = $state<'queue' | 'main' | 'dlq'>('queue'); // Include queue info tab
    selectedMessageIds = $state<Set<string>>(new Set());
    loading = $state({
        messages: false,
        dlqMessages: false,
        operation: false,
    });
    error = $state<string | null>(null);

    // Derived states
    filteredMessages = $derived.by(() => {
        if (!this.searchTerm) return this.messages;

        const term = this.searchTerm.toLowerCase();
        return this.messages.filter(msg =>
            msg.body.toLowerCase().includes(term) ||
            JSON.stringify(msg.messageAttributes).toLowerCase().includes(term)
        );
    });

    hasDLQ = $derived.by(() => {
        return this.selectedQueue?.dlqUrl != null;
    });

    // Actions
    selectQueue(queue: QueueConfiguration | null) {
        this.selectedQueue = queue;
        this.messages = []; // Clear messages when switching queues
        this.dlqMessages = [];
    }

    setMessages(newMessages: Message[]) {
        this.messages = newMessages;
    }

    removeMessage(receiptHandle: string) {
        this.messages = this.messages.filter(m => m.receiptHandle !== receiptHandle);
    }

    setLoading(key: keyof typeof this.loading, value: boolean) {
        this.loading[key] = value;
    }

    setError(message: string | null) {
        this.error = message;
    }

    clearError() {
        this.error = null;
    }

    setSearchTerm(term: string) {
        this.searchTerm = term;
    }

    setViewMode(mode: ViewMode) {
        this.viewMode = mode;
    }

    setActiveTab(tab: 'queue' | 'main' | 'dlq') {
        this.activeTab = tab;
    }

    setDlqMessages(messages: Message[]) {
        this.dlqMessages = messages;
    }

    toggleMessageSelection(messageId: string) {
        if (this.selectedMessageIds.has(messageId)) {
            this.selectedMessageIds.delete(messageId);
        } else {
            this.selectedMessageIds.add(messageId);
        }
        this.selectedMessageIds = new Set(this.selectedMessageIds);
    }

    selectAllMessages() {
        const currentMessages = this.activeTab === 'main' ? this.messages : this.dlqMessages;
        this.selectedMessageIds = new Set(currentMessages.map(m => m.messageId));
    }

    clearSelection() {
        this.selectedMessageIds = new Set();
    }
}

// Export a single instance
export const store = new ExtensionStore();
