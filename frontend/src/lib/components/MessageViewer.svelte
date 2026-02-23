<script lang="ts">
    import { onMount } from "svelte";
    import { api, type Message } from "../api";
    import { store } from "../stores.svelte";
    import Prism from "prismjs";
    import "prismjs/components/prism-json";

    let maxMessages = $state(10);
    let visibilityTimeout = $state(30);
    let waitTimeSeconds = $state(0);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let viewMode = $state<"formatted" | "raw">("formatted");
    let expandedMessages = $state<Set<string>>(new Set());
    let searchTerm = $state("");
    let confirmDelete = $state<string | null>(null);
    let successMessage = $state<string | null>(null);

    async function loadMessages() {
        if (!store.selectedQueue) return;

        try {
            loading = true;
            error = null;
            const messages = await api.receiveMessages(store.selectedQueue.id, {
                maxMessages,
                visibilityTimeout,
                waitTimeSeconds,
            });
            store.setMessages(messages);
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to load messages";
        } finally {
            loading = false;
        }
    }

    async function deleteMessage(receiptHandle: string) {
        if (!store.selectedQueue) return;
        confirmDelete = receiptHandle;
    }

    async function confirmDeleteMessage(receiptHandle: string) {
        if (!store.selectedQueue) return;

        try {
            await api.deleteMessage(store.selectedQueue.id, receiptHandle);
            store.removeMessage(receiptHandle);
            successMessage = "Message deleted successfully";
            setTimeout(() => (successMessage = null), 10000);
            confirmDelete = null;
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to delete message";
        }
    }

    function cancelDelete() {
        confirmDelete = null;
    }

    async function changeVisibility(receiptHandle: string) {
        if (!store.selectedQueue) return;

        const newTimeout = prompt(
            "Enter new visibility timeout (seconds):",
            "30",
        );
        if (!newTimeout) return;

        const timeout = parseInt(newTimeout, 10);
        if (isNaN(timeout) || timeout < 0 || timeout > 43200) {
            error = "Visibility timeout must be between 0 and 43200 seconds";
            setTimeout(() => (error = null), 5000);
            return;
        }

        try {
            await api.changeMessageVisibility(
                store.selectedQueue.id,
                receiptHandle,
                timeout,
            );
            successMessage = "Visibility timeout updated successfully";
            setTimeout(() => (successMessage = null), 10000);
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to change visibility";
        }
    }

    function toggleExpand(messageId: string) {
        if (expandedMessages.has(messageId)) {
            expandedMessages.delete(messageId);
        } else {
            expandedMessages.add(messageId);
        }
        expandedMessages = new Set(expandedMessages);
    }

    function formatJson(body: string): string {
        try {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return body;
        }
    }

    function highlightJson(body: string): string {
        try {
            const formatted = formatJson(body);
            return Prism.highlight(formatted, Prism.languages.json, "json");
        } catch {
            return body;
        }
    }

    $effect(() => {
        store.setSearchTerm(searchTerm);
    });

    onMount(() => {
        if (store.selectedQueue) {
            loadMessages();
        }
    });
</script>

<div class="message-viewer">
    <div class="controls">
        <div class="control-group">
            <label>
                Search:
                <input
                    type="text"
                    bind:value={searchTerm}
                    placeholder="Search messages..."
                    class="input-search"
                />
            </label>

            <label>
                Max Messages:
                <input
                    type="number"
                    bind:value={maxMessages}
                    min="1"
                    max="10"
                    class="input-small"
                />
            </label>

            <label>
                Visibility Timeout (s):
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
        </div>

        <div class="control-group">
            <label>
                View:
                <select bind:value={viewMode} class="select-small">
                    <option value="formatted">Formatted</option>
                    <option value="raw">Raw</option>
                </select>
            </label>

            <button
                onclick={loadMessages}
                class="btn-primary"
                disabled={loading || !store.selectedQueue}
            >
                {loading ? "Loading..." : "Receive Messages"}
            </button>
        </div>
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
                <p>Are you sure you want to delete this message?</p>
                <div class="confirm-actions">
                    <button
                        onclick={() => confirmDeleteMessage(confirmDelete!)}
                        class="btn-danger"
                    >
                        Delete
                    </button>
                    <button onclick={cancelDelete} class="btn-secondary-action">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    {/if}

    {#if store.messages.length === 0 && !loading}
        <div class="empty">
            No messages available. Click "Receive Messages" to poll the queue.
        </div>
    {:else if store.filteredMessages.length === 0 && searchTerm}
        <div class="empty">
            No messages match your search term "{searchTerm}".
        </div>
    {:else}
        <div class="messages">
            {#each store.filteredMessages as message (message.receiptHandle)}
                <div class="message-card" data-receipt-handle={message.receiptHandle}>
                    <div class="message-header">
                        <div class="message-id">
                            <strong>Message ID:</strong>
                            {message.messageId}
                        </div>
                        <div class="message-actions">
                            <button
                                onclick={() =>
                                    changeVisibility(message.receiptHandle)}
                                class="btn-small"
                                title="Change visibility timeout"
                            >
                                👁️
                            </button>
                            <button
                                onclick={() =>
                                    deleteMessage(message.receiptHandle)}
                                class="btn-small btn-danger-small"
                                title="Delete message"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>

                    {#if message.messageAttributes && Object.keys(message.messageAttributes).length > 0}
                        <div class="message-attributes">
                            <strong>Attributes:</strong>
                            <div class="attributes-list">
                                {#each Object.entries(message.messageAttributes) as [key, value]}
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

                    <div class="message-body">
                        <div class="body-header">
                            <strong>Body:</strong>
                            <button
                                onclick={() => toggleExpand(message.messageId)}
                                class="btn-expand"
                            >
                                {expandedMessages.has(message.messageId)
                                    ? "Collapse"
                                    : "Expand"}
                            </button>
                        </div>

                        {#if expandedMessages.has(message.messageId)}
                            {#if viewMode === "formatted"}
                                <pre class="code-block"><code
                                        class="language-json"
                                        >{@html highlightJson(
                                            message.body,
                                        )}</code
                                    ></pre>
                            {:else}
                                <pre class="code-block raw">{message.body}</pre>
                            {/if}
                        {:else}
                            <div class="body-preview">
                                {message.body.substring(0, 100)}
                                {message.body.length > 100 ? "..." : ""}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .message-viewer {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .controls {
        background: #fff;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-between;
        align-items: flex-end;
    }

    .control-group {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        flex-wrap: wrap;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.9rem;
        color: #666;
    }

    .input-small,
    .select-small,
    .input-search {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        width: 120px;
    }

    .input-search {
        width: 250px;
    }

    .btn-primary {
        background: #2196f3;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-primary:hover:not(:disabled) {
        background: #0b7dda;
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error {
        padding: 0.75rem;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        border-left: 4px solid #f44336;
    }

    .success {
        padding: 0.75rem;
        background: #e8f5e9;
        color: #2e7d32;
        border-radius: 4px;
        border-left: 4px solid #4caf50;
    }

    .confirm-dialog {
        background: #fff3e0;
        border-left: 4px solid #ff9800;
        padding: 1rem;
        border-radius: 4px;
    }

    .confirm-content p {
        margin: 0 0 1rem 0;
        color: #e65100;
        font-weight: 600;
    }

    .confirm-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-danger {
        background: #f44336;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-danger:hover {
        background: #d32f2f;
    }

    .btn-secondary-action {
        background: #e0e0e0;
        color: #333;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-secondary-action:hover {
        background: #d0d0d0;
    }

    .empty {
        text-align: center;
        padding: 3rem;
        color: #999;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .messages {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .message-card {
        background: #fff;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #2196f3;
    }

    .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e0e0e0;
    }

    .message-id {
        font-size: 0.9rem;
        color: #666;
        word-break: break-all;
    }

    .message-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-small {
        background: #e0e0e0;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
    }

    .btn-small:hover {
        background: #d0d0d0;
    }

    .btn-danger-small:hover {
        background: #ffcdd2;
    }

    .message-attributes {
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
    }

    .attributes-list {
        margin-top: 0.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .attribute {
        background: #f5f5f5;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
    }

    .attr-key {
        color: #666;
        font-weight: 600;
    }

    .attr-value {
        color: #333;
        margin-left: 0.25rem;
    }

    .message-body {
        font-size: 0.9rem;
    }

    .body-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .btn-expand {
        background: none;
        border: 1px solid #ddd;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        color: #666;
    }

    .btn-expand:hover {
        background: #f5f5f5;
        border-color: #2196f3;
        color: #2196f3;
    }

    .body-preview {
        background: #f5f5f5;
        padding: 0.75rem;
        border-radius: 4px;
        color: #666;
        font-family: monospace;
        font-size: 0.85rem;
    }

    .code-block {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        margin: 0;
        font-family: "Courier New", monospace;
        font-size: 0.85rem;
        line-height: 1.5;
    }

    .code-block.raw {
        white-space: pre-wrap;
        word-break: break-all;
    }

    .code-block code {
        background: none;
        padding: 0;
    }

    @media (prefers-color-scheme: dark) {
        .controls,
        .empty,
        .message-card {
            background: #2a2a2a;
        }

        label {
            color: #aaa;
        }

        .input-small,
        .select-small,
        .input-search {
            background: #333;
            color: #fff;
            border-color: #555;
        }

        .message-header {
            border-bottom-color: #444;
        }

        .message-id {
            color: #aaa;
        }

        .btn-small {
            background: #444;
        }

        .btn-small:hover {
            background: #555;
        }

        .attribute {
            background: #1a1a1a;
        }

        .attr-key {
            color: #aaa;
        }

        .attr-value {
            color: #fff;
        }

        .body-preview,
        .code-block {
            background: #1a1a1a;
            color: #fff;
        }

        .btn-expand {
            background: #333;
            border-color: #555;
            color: #aaa;
        }

        .btn-expand:hover {
            background: #444;
            border-color: #2196f3;
            color: #2196f3;
        }
    }
</style>
