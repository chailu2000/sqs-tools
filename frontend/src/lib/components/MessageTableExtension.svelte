<script lang="ts">
    import { api, type Message } from "../api-adapter";
    import { store } from "../stores-extension.svelte";
    import QueueDetailsExtension from "./QueueDetailsExtension.svelte";
    import MessageComposerExtension from "./MessageComposerExtension.svelte";

    let loading = $state(false);
    let error = $state<string | null>(null);
    let selectedMessage = $state<Message | null>(null);
    let currentPage = $state(1);
    let pageSize = $state(10);
    let maxMessages = $state(10);
    let visibilityTimeout = $state(0); // Default to 0 for extension (peek mode)
    let waitTimeSeconds = $state(0); // Short polling by default for better UI responsiveness
    let peek = $state(true); // Enabled by default as it's the desired behavior for this tool
    let activeTab = $derived(store.activeTab);
    let polling = $state(false);
    let pollCount = $state(0);
    let pollProgress = $state(0);
    let pollDuration = $state(120); // 2 minutes like AWS Console
    let hasLoadedMain = $state(false);
    let hasLoadedDlq = $state(false);
    let confirmDelete = $state(false);
    let confirmDeleteSingle = $state<string | null>(null);
    let confirmRedrive = $state(false);
    let successMessage = $state<string | null>(null);

    const paginatedMessages = $derived.by(() => {
        const messages =
            activeTab === "main" ? store.messages : store.dlqMessages;
        const start = (currentPage - 1) * pageSize;
        return messages.slice(start, start + pageSize);
    });

    const totalPages = $derived.by(() => {
        const messages =
            activeTab === "main" ? store.messages : store.dlqMessages;
        return Math.ceil(messages.length / pageSize);
    });

    const totalMessages = $derived.by(() => {
        return activeTab === "main"
            ? store.messages.length
            : store.dlqMessages.length;
    });

    const allSelected = $derived.by(() => {
        if (paginatedMessages.length === 0) return false;
        return paginatedMessages.every((m) =>
            store.selectedMessageIds.has(m.messageId),
        );
    });

    async function loadMessages() {
        if (!store.selectedQueue) return;
        if (loading) return;

        try {
            loading = true;
            error = null;

            if (activeTab === "main") {
                const messages = await api.receiveMessages(
                    store.selectedQueue.id,
                    {
                        maxMessages,
                        visibilityTimeout,
                        waitTimeSeconds,
                        peek,
                    },
                );
                
                // Deduplicate messages by messageId
                const uniqueMessages = Array.from(
                    new Map(messages.map(m => [m.messageId, m])).values()
                );
                
                store.setMessages(uniqueMessages);
            } else if (activeTab === "dlq") {
                if (!store.selectedQueue.dlqUrl) {
                    error = "No DLQ configured for this queue";
                    return;
                }
                const messages = await api.receiveDlqMessages(
                    store.selectedQueue.id,
                    {
                        maxMessages,
                        visibilityTimeout,
                        peek,
                    },
                );
                
                // Deduplicate messages by messageId
                const uniqueMessages = Array.from(
                    new Map(messages.map(m => [m.messageId, m])).values()
                );
                
                store.setDlqMessages(uniqueMessages);
            }
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to load messages";
        } finally {
            loading = false;
        }
    }

    async function pollForMessages() {
        if (!store.selectedQueue) return;

        try {
            polling = true;
            error = null;
            pollCount = 0;
            pollProgress = 0;

            // Clear existing messages
            if (activeTab === "main") {
                store.setMessages([]);
            } else {
                store.setDlqMessages([]);
            }

            let allMessages: Message[] = [];
            let seenMessageIds = new Set<string>();
            const startTime = Date.now();
            const maxDuration = pollDuration * 1000; // Convert to milliseconds

            // Progress update interval
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.min(
                    (elapsed / maxDuration) * 100,
                    100,
                );
                pollProgress = newProgress;
            }, 1000); // Update every second

            // Loop for the specified duration or until stopped
            while (polling && Date.now() - startTime < maxDuration) {
                pollCount++;

                let batch: Message[];

                if (activeTab === "main") {
                    batch = await api.receiveMessages(store.selectedQueue.id, {
                        maxMessages: 10,
                        visibilityTimeout,
                        waitTimeSeconds: 20,
                        peek,
                    });
                } else {
                    if (!store.selectedQueue.dlqUrl) {
                        error = "No DLQ configured for this queue";
                        clearInterval(progressInterval);
                        return;
                    }
                    batch = await api.receiveDlqMessages(
                        store.selectedQueue.id,
                        {
                            maxMessages: 10,
                            visibilityTimeout,
                            peek,
                        },
                    );
                }

                if (batch.length > 0) {
                    // Deduplicate messages by messageId
                    const newMessages = batch.filter((msg) => {
                        if (seenMessageIds.has(msg.messageId)) {
                            return false;
                        }
                        seenMessageIds.add(msg.messageId);
                        return true;
                    });

                    if (newMessages.length > 0) {
                        allMessages = [...allMessages, ...newMessages];

                        // Update store with accumulated messages in real-time
                        if (activeTab === "main") {
                            store.setMessages(allMessages);
                        } else {
                            store.setDlqMessages(allMessages);
                        }
                    }
                }

                // Small delay between calls
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            clearInterval(progressInterval);
            pollProgress = 100;

            if (allMessages.length === 0) {
                error = "No messages found in the queue";
            }
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to poll messages";
        } finally {
            polling = false;
            pollCount = 0;
            pollProgress = 0;
        }
    }

    function stopPolling() {
        polling = false;
    }

    async function deleteSelected() {
        if (!store.selectedQueue || store.selectedMessageIds.size === 0) return;
        confirmDelete = true;
    }

    async function confirmDeleteSelected() {
        if (!store.selectedQueue || store.selectedMessageIds.size === 0) return;

        const messages =
            activeTab === "main" ? store.messages : store.dlqMessages;
        const toDelete = messages.filter((m) =>
            store.selectedMessageIds.has(m.messageId),
        );

        for (const msg of toDelete) {
            try {
                await api.deleteMessage(
                    store.selectedQueue.id,
                    msg.receiptHandle,
                    activeTab === 'dlq',
                );
                if (activeTab === "main") {
                    store.removeMessage(msg.receiptHandle);
                } else {
                    store.setDlqMessages(
                        store.dlqMessages.filter(
                            (m) => m.receiptHandle !== msg.receiptHandle,
                        ),
                    );
                }
            } catch (err) {
                console.error(
                    `Failed to delete message ${msg.messageId}:`,
                    err,
                );
            }
        }

        successMessage = "The selected messages were deleted successfully";
        setTimeout(() => (successMessage = null), 5000);

        store.clearSelection();
        confirmDelete = false;
    }

    async function confirmDeleteSingleMessage() {
        if (!store.selectedQueue || !confirmDeleteSingle) return;

        try {
            await api.deleteMessage(
                store.selectedQueue.id,
                confirmDeleteSingle,
                activeTab === 'dlq',
            );
            if (activeTab === "main") {
                store.removeMessage(confirmDeleteSingle);
            } else {
                store.setDlqMessages(
                    store.dlqMessages.filter(
                        (m) => m.receiptHandle !== confirmDeleteSingle,
                    ),
                );
            }
            successMessage = "Message deleted successfully";
            setTimeout(() => (successMessage = null), 10000);
            confirmDeleteSingle = null;
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to delete message";
        }
    }

    function cancelDelete() {
        confirmDelete = false;
    }

    async function redriveSelected() {
        if (!store.selectedQueue || store.selectedMessageIds.size === 0) return;
        confirmRedrive = true;
    }

    async function confirmRedriveSelected() {
        if (!store.selectedQueue || store.selectedMessageIds.size === 0) return;

        try {
            loading = true;
            error = null;
            successMessage = null;
            confirmRedrive = false;

            // Get the full message objects for selected messages
            const selectedMessages = store.dlqMessages
                .filter((m) => store.selectedMessageIds.has(m.messageId))
                .map((m) => ({
                    messageId: m.messageId,
                    receiptHandle: m.receiptHandle,
                    body: m.body,
                    messageAttributes: m.messageAttributes,
                    attributes: m.attributes,
                }));

            const result = await api.redriveSelectedMessages(
                store.selectedQueue.id,
                selectedMessages,
            );

            // Handle the detailed response
            if (result.successCount === 0 && result.failureCount > 0) {
                // All failed
                error = `Failed to redrive all ${result.failureCount} message(s). ${result.failed.map((f) => `${f.messageId}: ${f.error}`).join("; ")}`;
            } else if (result.failureCount === 0) {
                // All succeeded
                successMessage = `Successfully redriven ${result.successCount} message(s)`;
                setTimeout(() => (successMessage = null), 5000);
            } else {
                // Partial success
                successMessage = `Successfully redriven ${result.successCount} of ${result.processedCount} message(s). ${result.failureCount} failed.`;
                setTimeout(() => (successMessage = null), 5000);
                if (result.failed.length > 0) {
                    error = `Failed messages: ${result.failed.map((f) => `${f.messageId}: ${f.error}`).join("; ")}`;
                }
            }

            // Remove only successfully redriven messages from the DLQ table
            if (result.succeeded.length > 0) {
                const succeededIds = new Set(
                    result.succeeded.map((s) => s.messageId),
                );
                store.setDlqMessages(
                    store.dlqMessages.filter(
                        (m) => !succeededIds.has(m.messageId),
                    ),
                );

                // Clear selection for successfully redriven messages
                succeededIds.forEach((id) =>
                    store.selectedMessageIds.delete(id),
                );
                store.selectedMessageIds = new Set(store.selectedMessageIds);
            }

            // If all messages were successfully redriven, clear the entire selection
            if (result.failureCount === 0) {
                store.clearSelection();
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to redrive messages";
        } finally {
            loading = false;
        }
    }

    function cancelRedrive() {
        confirmRedrive = false;
    }

    function toggleSelectAll() {
        if (allSelected) {
            paginatedMessages.forEach((m) =>
                store.selectedMessageIds.delete(m.messageId),
            );
        } else {
            paginatedMessages.forEach((m) =>
                store.selectedMessageIds.add(m.messageId),
            );
        }
        store.selectedMessageIds = new Set(store.selectedMessageIds);
    }

    function formatTimestamp(timestamp: string): string {
        return new Date(parseInt(timestamp)).toLocaleString();
    }

    function truncate(text: string, length: number): string {
        return text.length > length ? text.substring(0, length) + "..." : text;
    }

    function switchTab(tab: "queue" | "main" | "dlq") {
        store.setActiveTab(tab);
        currentPage = 1;
        store.clearSelection();
    }

    $effect(() => {
        // Only auto-load once per tab when first switching to a message tab
        // Don't auto-load after polling stops or on subsequent reactive updates
        if (!store.selectedQueue) return;

        if (
            activeTab === "main" &&
            !hasLoadedMain &&
            store.messages.length === 0 &&
            !loading
        ) {
            hasLoadedMain = true;
            loadMessages();
        }
        if (
            activeTab === "dlq" &&
            !hasLoadedDlq &&
            store.dlqMessages.length === 0 &&
            !loading
        ) {
            hasLoadedDlq = true;
            loadMessages();
        }
    });
</script>

<div class="message-table">
    <div class="tabs-container">
        <div class="tabs">
            <button
                class:active={activeTab === "queue"}
                onclick={() => switchTab("queue")}
                data-testid="tab-queue"
            >
                📊 Queue Info
            </button>
            <button
                class:active={activeTab === "main"}
                onclick={() => switchTab("main")}
                data-testid="tab-main"
            >
                📬 Main Queue ({store.messages.length})
            </button>
            <button
                class:active={activeTab === "dlq"}
                onclick={() => switchTab("dlq")}
                disabled={!store.hasDLQ}
                data-testid="tab-dlq"
            >
                ⚠️ DLQ ({store.dlqMessages.length})
            </button>
        </div>
    </div>

    {#if activeTab === "queue"}
        <QueueDetailsExtension />
    {:else}
        <div class="controls">
            <div class="control-group">
                <label>
                    Visibility (s):
                    <input
                        type="number"
                        bind:value={visibilityTimeout}
                        min="0"
                        max="43200"
                        class="input-small"
                    />
                </label>
                <label>
                    Wait Time (s):
                    <input
                        type="number"
                        bind:value={waitTimeSeconds}
                        min="0"
                        max="20"
                        class="input-small"
                    />
                </label>

                <label class="checkbox-label" title="Immediately reset visibility timeout to 0 so message stays available for other consumers">
                    <input type="checkbox" bind:checked={peek} />
                    Peek Mode (keep available)
                </label>

                <button
                    onclick={pollForMessages}
                    class="btn-primary poll-button"
                    disabled={loading || polling}
                >
                    {polling
                        ? `Polling... (${pollCount} calls)`
                        : "🔄 Poll for Messages"}
                </button>

                {#if polling}
                    <button onclick={stopPolling} class="btn-danger stop-button">
                        Stop
                    </button>
                {/if}

                <button
                    onclick={loadMessages}
                    class="btn-secondary"
                    disabled={loading || polling}
                >
                    {loading ? "Loading..." : "Receive Once"}
                </button>
            </div>

            <div class="message-count">
                Showing {paginatedMessages.length} of {totalMessages} received
            </div>
        </div>

        {#if polling}
            <div class="progress-container">
                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        style="width: {pollProgress}%"
                    ></div>
                </div>
                <div class="progress-text">
                    Polling for messages... {Math.round(pollProgress)}% complete
                    ({totalMessages} found so far)
                </div>
            </div>
        {/if}

        <div class="info-banner">
            💡 <strong>Poll for Messages:</strong> Continuously receives for up
            to {pollDuration}s (like AWS Console).
            <strong>Receive Once:</strong> Gets a single batch. Messages are deduplicated
            by ID. <strong>Peek Mode:</strong> Immediately resets visibility timeout to 0.
        </div>

        {#if error}
            <div class="error">{error}</div>
        {/if}

        {#if successMessage}
            <div class="success">{successMessage}</div>
        {/if}

        {#if confirmDelete}
            <div class="confirm-dialog">
                <div class="confirm-content">
                    <p>
                        Delete {store.selectedMessageIds.size} selected message(s)?
                    </p>
                    <div class="confirm-actions">
                        <button
                            onclick={confirmDeleteSelected}
                            class="btn-danger"
                        >
                            Delete
                        </button>
                        <button
                            onclick={cancelDelete}
                            class="btn-secondary-action"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        {#if confirmDeleteSingle}
            <div class="confirm-dialog">
                <div class="confirm-content">
                    <p>
                        Are you sure you want to delete this message? This
                        action cannot be undone.
                    </p>
                    <div class="confirm-actions">
                        <button
                            onclick={confirmDeleteSingleMessage}
                            class="btn-danger"
                        >
                            Delete
                        </button>
                        <button
                            onclick={() => (confirmDeleteSingle = null)}
                            class="btn-secondary-action"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        {#if confirmRedrive}
            <div class="confirm-dialog">
                <div class="confirm-content">
                    <p>
                        Redrive {store.selectedMessageIds.size} selected message(s)?
                    </p>
                    <div class="confirm-actions">
                        <button
                            onclick={confirmRedriveSelected}
                            class="btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Redrive"}
                        </button>
                        <button
                            onclick={cancelRedrive}
                            class="btn-secondary-action"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        {#if store.selectedMessageIds.size > 0}
            <div class="bulk-actions">
                <span>{store.selectedMessageIds.size} selected</span>
                <button onclick={deleteSelected} class="btn-danger"
                    >Delete Selected</button
                >
                {#if activeTab === "dlq"}
                    <button onclick={redriveSelected} class="btn-primary"
                        >Redrive Selected</button
                    >
                {/if}
                <button
                    onclick={() => store.clearSelection()}
                    class="btn-secondary">Clear Selection</button
                >
            </div>
        {/if}

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onchange={toggleSelectAll}
                            />
                        </th>
                        <th>Message ID</th>
                        <th>Body Preview</th>
                        <th>Timestamp</th>
                        <th>Receive Count</th>
                        <th>Attributes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each paginatedMessages as message (message.messageId)}
                        <tr
                            class:selected={store.selectedMessageIds.has(
                                message.messageId,
                            )}
                            data-receipt-handle={message.receiptHandle}
                            onclick={() => (selectedMessage = message)}
                        >
                            <td onclick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={store.selectedMessageIds.has(
                                        message.messageId,
                                    )}
                                    onchange={() =>
                                        store.toggleMessageSelection(
                                            message.messageId,
                                        )}
                                />
                            </td>
                            <td class="message-id"
                                >{truncate(message.messageId, 20)}</td
                            >
                            <td class="body-preview"
                                >{truncate(message.body, 50)}</td
                            >
                            <td
                                >{message.attributes.SentTimestamp
                                    ? formatTimestamp(
                                          message.attributes.SentTimestamp,
                                      )
                                    : "N/A"}</td
                            >
                            <td class="receive-count"
                                >{message.attributes.ApproximateReceiveCount ??
                                    "0"}</td
                            >
                            <td
                                >{Object.keys(message.messageAttributes || {})
                                    .length}</td
                            >
                            <td class="message-actions">
                                <button
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        confirmDeleteSingle = message.receiptHandle;
                                    }}
                                    class="btn-small btn-danger-small"
                                    title="Delete message"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            {#if paginatedMessages.length === 0}
                <div class="empty">No messages available</div>
            {/if}
        </div>

        {#if totalPages > 1}
            <div class="pagination">
                <button
                    onclick={() => (currentPage = Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                    onclick={() =>
                        (currentPage = Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
                <select
                    bind:value={pageSize}
                    onchange={() => (currentPage = 1)}
                >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                </select>
            </div>
        {/if}

        {#if selectedMessage}
            <div class="message-details">
                <div class="details-header">
                    <h3>Message Details</h3>
                    <button
                        onclick={() => (selectedMessage = null)}
                        class="btn-close">×</button
                    >
                </div>
                <div class="details-content">
                    <div class="detail-row">
                        <strong>Message ID:</strong>
                        <span>{selectedMessage.messageId}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Receipt Handle:</strong>
                        <span class="monospace"
                            >{selectedMessage.receiptHandle}</span
                        >
                    </div>
                    {#if selectedMessage.attributes?.MessageGroupId}
                        <div class="detail-row">
                            <strong>Message Group ID:</strong>
                            <span class="fifo-value">{selectedMessage.attributes.MessageGroupId}</span>
                        </div>
                    {/if}
                    {#if selectedMessage.attributes?.MessageDeduplicationId}
                        <div class="detail-row">
                            <strong>Message Deduplication ID:</strong>
                            <span class="fifo-value">{selectedMessage.attributes.MessageDeduplicationId}</span>
                        </div>
                    {/if}
                    {#if selectedMessage.messageAttributes && Object.keys(selectedMessage.messageAttributes).length > 0}
                        <div class="detail-row">
                            <strong>Message Attributes:</strong>
                            <div class="attributes">
                                {#each Object.entries(selectedMessage.messageAttributes) as [key, value]}
                                    <div class="attribute">
                                        <span class="attr-key">{key}:</span>
                                        <span class="attr-value"
                                            >{value.stringValue ||
                                                value.binaryValue ||
                                                "N/A"}</span
                                        >
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    <div class="detail-row">
                        <strong>Body:</strong>
                        <pre class="body-content">{selectedMessage.body}</pre>
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Send Message Section -->
        <MessageComposerExtension />
    {/if}
</div>

<style>
    .message-table {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 0;
        padding: 0;
    }

    .tabs-container {
        position: sticky;
        top: -20px;
        z-index: 100;
        background: var(--vscode-editor-background);
        border-radius: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 0.5rem 0;
        margin: -20px -20px 0 -20px;
        padding-left: 20px;
        padding-right: 20px;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
    }

    .tabs button {
        padding: 0.75rem 1.5rem;
        border: 1px solid var(--vscode-panel-border);
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s;
    }

    .tabs button.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .tabs button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .tabs button:hover:not(:disabled):not(.active) {
        background: var(--vscode-button-secondaryHoverBackground);
    }

    .controls {
        background: var(--vscode-editor-background);
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .control-group {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
    }

    .message-count {
        font-size: 0.9rem;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }

    .info-banner {
        background: var(--vscode-textBlockQuote-background);
        border-left: 4px solid var(--vscode-textLink-foreground);
        padding: 0.75rem 1rem;
        border-radius: 4px;
        font-size: 0.9rem;
        color: var(--vscode-editor-foreground);
    }

    .info-banner strong {
        color: var(--vscode-editor-foreground);
        font-weight: 600;
    }

    .progress-container {
        position: sticky;
        top: 50px;
        z-index: 99;
        background: var(--vscode-editor-background);
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
        width: 100%;
        height: 24px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: var(--vscode-progressBar-background);
        transition: width 0.3s ease;
        border-radius: 12px;
    }

    .progress-text {
        text-align: center;
        font-size: 0.9rem;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.9rem;
        color: var(--vscode-descriptionForeground);
    }

    .input-small {
        padding: 0.5rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 0.9rem;
        width: 100px;
    }

    .btn-primary,
    .btn-danger,
    .btn-secondary {
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }

    .btn-primary:hover:not(:disabled) {
        background: var(--vscode-button-hoverBackground);
    }

    .btn-danger {
        background: var(--vscode-errorForeground);
        color: var(--vscode-editor-background);
    }

    .btn-danger:hover {
        opacity: 0.9;
    }

    .btn-secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error {
        padding: 0.75rem;
        background: var(--vscode-inputValidation-errorBackground);
        color: var(--vscode-errorForeground);
        border-radius: 4px;
        border-left: 4px solid var(--vscode-errorForeground);
    }

    .success {
        padding: 0.75rem;
        background: var(--vscode-textBlockQuote-background);
        color: var(--vscode-textLink-foreground);
        border-radius: 4px;
        border-left: 4px solid var(--vscode-textLink-foreground);
    }

    .confirm-dialog {
        background: var(--vscode-inputValidation-warningBackground);
        border-left: 4px solid var(--vscode-inputValidation-warningBorder);
        padding: 1rem;
        border-radius: 4px;
    }

    .confirm-content p {
        margin: 0 0 1rem 0;
        color: var(--vscode-editor-foreground);
        font-weight: 600;
    }

    .confirm-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-secondary-action {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-secondary-action:hover:not(:disabled) {
        background: var(--vscode-button-secondaryHoverBackground);
    }

    .btn-secondary-action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .bulk-actions {
        background: var(--vscode-textBlockQuote-background);
        padding: 0.75rem 1rem;
        border-radius: 4px;
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .bulk-actions span {
        font-weight: 600;
        color: var(--vscode-editor-foreground);
    }

    .table-container {
        background: var(--vscode-editor-background);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    thead {
        background: var(--vscode-editorGroupHeader-tabsBackground);
        border-bottom: 2px solid var(--vscode-panel-border);
    }

    th {
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--vscode-descriptionForeground);
    }

    tbody tr {
        border-bottom: 1px solid var(--vscode-panel-border);
        cursor: pointer;
        transition: background 0.2s;
    }

    tbody tr:hover {
        background: var(--vscode-list-hoverBackground);
    }

    tbody tr.selected {
        background: var(--vscode-list-activeSelectionBackground);
    }

    td {
        padding: 0.75rem;
        font-size: 0.9rem;
        color: var(--vscode-editor-foreground);
    }

    .message-id {
        font-family: monospace;
        color: var(--vscode-descriptionForeground);
    }

    .body-preview {
        color: var(--vscode-editor-foreground);
    }

    .receive-count {
        font-weight: 600;
        text-align: center;
    }

    .empty {
        text-align: center;
        padding: 3rem;
        color: var(--vscode-descriptionForeground);
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
        user-select: none;
    }

    .checkbox-label input {
        width: 1.2rem;
        height: 1.2rem;
        cursor: pointer;
    }

    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--vscode-editor-background);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .pagination button {
        padding: 0.5rem 1rem;
        border: 1px solid var(--vscode-panel-border);
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border-radius: 4px;
        cursor: pointer;
    }

    .pagination button:hover:not(:disabled) {
        background: var(--vscode-button-secondaryHoverBackground);
    }

    .pagination button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .pagination select {
        padding: 0.5rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
    }

    .message-details {
        background: var(--vscode-editor-background);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 1rem;
    }

    .details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--vscode-panel-border);
    }

    .details-header h3 {
        margin: 0;
        color: var(--vscode-editor-foreground);
    }

    .btn-close {
        background: var(--vscode-errorForeground);
        color: var(--vscode-editor-background);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.5rem;
        line-height: 1;
    }

    .btn-close:hover {
        opacity: 0.9;
    }

    .details-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .detail-row {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detail-row strong {
        color: var(--vscode-descriptionForeground);
        font-size: 0.9rem;
    }

    .monospace {
        font-family: monospace;
        font-size: 0.85rem;
        color: var(--vscode-editor-foreground);
        word-break: break-all;
    }

    .attributes {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .attribute {
        background: var(--vscode-editorGroupHeader-tabsBackground);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
    }

    .attr-key {
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
    }

    .attr-value {
        color: var(--vscode-editor-foreground);
        margin-left: 0.25rem;
    }

    .fifo-value {
        font-family: monospace;
        font-size: 0.9rem;
        color: var(--vscode-textLink-foreground);
        background: var(--vscode-editorGroupHeader-tabsBackground);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        display: inline-block;
    }

    .body-content {
        background: var(--vscode-textCodeBlock-background);
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        margin: 0;
        font-family: monospace;
        font-size: 0.85rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
        color: var(--vscode-editor-foreground);
    }

    .message-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-small {
        padding: 0.25rem 0.5rem;
        font-size: 0.85rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .btn-danger-small {
        background: var(--vscode-errorForeground);
        color: var(--vscode-editor-background);
    }

    .btn-danger-small:hover {
        opacity: 0.9;
    }

    .poll-button {
        font-weight: 600;
    }

    .stop-button {
        font-weight: 600;
    }
</style>
