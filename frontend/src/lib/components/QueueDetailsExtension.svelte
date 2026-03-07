<script lang="ts">
    import { api } from "../api-adapter";
    import { store } from "../stores-extension.svelte";

    let purging = $state(false);
    let purgeError = $state<string | null>(null);
    let confirmPurge = $state(false);
    let successMessage = $state<string | null>(null);

    // Refresh not supported in extension - queue data comes from extension host
    async function handleRefresh() {
        purgeError = "Refresh not supported in extension. Close and reopen the queue view to refresh.";
        setTimeout(() => (purgeError = null), 5000);
    }

    async function handlePurge() {
        if (!store.selectedQueue) return;
        confirmPurge = true;
    }

    async function confirmPurgeQueue() {
        if (!store.selectedQueue) return;

        try {
            purging = true;
            purgeError = null;
            successMessage = null;
            confirmPurge = false;
            await api.purgeQueue(store.selectedQueue.id);
            successMessage = "Queue purged successfully";
            setTimeout(() => (successMessage = null), 5000);
        } catch (error) {
            purgeError =
                error instanceof Error
                    ? error.message
                    : "Failed to purge queue";
        } finally {
            purging = false;
        }
    }

    function cancelPurge() {
        confirmPurge = false;
    }
</script>

{#if store.selectedQueue}
    <div class="queue-details">
        <div class="header">
            <h2>{store.selectedQueue.queueName}</h2>
            <div class="header-actions">
                <button
                    onclick={handleRefresh}
                    class="btn-secondary"
                    title="Close and reopen queue view to refresh"
                >
                    🔄 Refresh
                </button>
                <button
                    onclick={handlePurge}
                    class="btn-danger"
                    disabled={purging}
                >
                    {purging ? "Purging..." : "Purge Queue"}
                </button>
            </div>
        </div>

        {#if confirmPurge}
            <div class="confirm-dialog">
                <div class="confirm-content">
                    <p>
                        Are you sure you want to purge all messages from "{store
                            .selectedQueue.queueName}"? This action cannot be
                        undone.
                    </p>
                    <div class="confirm-actions">
                        <button
                            onclick={confirmPurgeQueue}
                            class="btn-danger"
                            disabled={purging}
                        >
                            {purging ? "Purging..." : "Purge"}
                        </button>
                        <button
                            onclick={cancelPurge}
                            class="btn-secondary-action"
                            disabled={purging}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        {#if successMessage}
            <div class="success">{successMessage}</div>
        {/if}

        <div class="details-grid">
            <div class="detail-item">
                <span class="label">Queue URL:</span>
                <span class="value">{store.selectedQueue.queueUrl}</span>
            </div>

            <div class="detail-item">
                <span class="label">Region:</span>
                <span class="value">{store.selectedQueue.region}</span>
            </div>

            <div class="detail-item">
                <span class="label">Messages Available:</span>
                <span class="value">
                    {store.selectedQueue.attributes
                        ?.ApproximateNumberOfMessages ?? "N/A"}
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Messages In Flight:</span>
                <span class="value">
                    {store.selectedQueue.attributes
                        ?.ApproximateNumberOfMessagesNotVisible ?? "N/A"}
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Messages Delayed:</span>
                <span class="value">
                    {store.selectedQueue.attributes
                        ?.ApproximateNumberOfMessagesDelayed ?? "N/A"}
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Visibility Timeout:</span>
                <span class="value">
                    {store.selectedQueue.attributes?.VisibilityTimeout ??
                        "N/A"}s
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Message Retention:</span>
                <span class="value">
                    {store.selectedQueue.attributes?.MessageRetentionPeriod
                        ? `${Math.floor(Number(store.selectedQueue.attributes.MessageRetentionPeriod) / 86400)} days`
                        : "N/A"}
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Max Message Size:</span>
                <span class="value">
                    {store.selectedQueue.attributes?.MaximumMessageSize
                        ? `${Math.floor(Number(store.selectedQueue.attributes.MaximumMessageSize) / 1024)} KB`
                        : "N/A"}
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Receive Wait Time:</span>
                <span class="value">
                    {store.selectedQueue.attributes
                        ?.ReceiveMessageWaitTimeSeconds ?? "N/A"}s
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Delay Seconds:</span>
                <span class="value">
                    {store.selectedQueue.attributes?.DelaySeconds ?? "N/A"}s
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Created:</span>
                <span class="value">
                    {store.selectedQueue.attributes?.CreatedTimestamp
                        ? new Date(
                              Number(
                                  store.selectedQueue.attributes
                                      .CreatedTimestamp,
                              ) * 1000,
                          ).toLocaleString()
                        : "N/A"}
                </span>
            </div>

            <div class="detail-item">
                <span class="label">Last Modified:</span>
                <span class="value">
                    {store.selectedQueue.attributes?.LastModifiedTimestamp
                        ? new Date(
                              Number(
                                  store.selectedQueue.attributes
                                      .LastModifiedTimestamp,
                              ) * 1000,
                          ).toLocaleString()
                        : "N/A"}
                </span>
            </div>

            {#if store.selectedQueue.dlqUrl}
                <div class="detail-item dlq">
                    <span class="label">Dead Letter Queue:</span>
                    <span class="value">{store.selectedQueue.dlqName}</span>
                </div>

                <div class="detail-item dlq">
                    <span class="label">DLQ URL:</span>
                    <span class="value">{store.selectedQueue.dlqUrl}</span>
                </div>
            {/if}
        </div>

        <div class="info-box">
            <strong>ℹ️ About Message Counts:</strong>
            <p>
                <strong>Messages Available:</strong> Total messages in the queue
                (from when queue was loaded).<br />
                <strong>Messages In Flight:</strong> Messages currently
                invisible (being processed or within visibility timeout).<br />
                <br />
                <strong>Why you may see fewer messages in the table:</strong><br
                />
                • Each "Receive Messages" call gets <em>up to</em> the max
                messages you request<br />
                • SQS doesn't guarantee you'll get all available messages in one
                call<br />
                • Messages become invisible for the visibility timeout after being
                received<br />
                • Queue attributes are cached - reload the queue from sidebar to
                refresh<br />
                <br />
                💡 <strong>Tip:</strong> To see more messages, click "Receive Messages"
                multiple times or increase "Max Messages" to 10.
            </p>
        </div>

        {#if purgeError}
            <div class="error">{purgeError}</div>
        {/if}
    </div>
{/if}

<style>
    .queue-details {
        background: var(--vscode-editor-background);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--vscode-panel-border);
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--vscode-editor-foreground);
    }

    .btn-secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-secondary:hover:not(:disabled) {
        background: var(--vscode-button-secondaryHoverBackground);
    }

    .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-danger {
        background: var(--vscode-errorForeground);
        color: var(--vscode-editor-background);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-danger:hover:not(:disabled) {
        opacity: 0.9;
    }

    .btn-danger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        background: var(--vscode-editorGroupHeader-tabsBackground);
        border-radius: 4px;
    }

    .detail-item.dlq {
        background: var(--vscode-inputValidation-warningBackground);
        border-left: 4px solid var(--vscode-inputValidation-warningBorder);
    }

    .label {
        font-size: 0.85rem;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
    }

    .value {
        font-size: 0.95rem;
        color: var(--vscode-editor-foreground);
        word-break: break-all;
    }

    .info-box {
        margin-top: 1.5rem;
        padding: 1rem;
        background: var(--vscode-textBlockQuote-background);
        border-left: 4px solid var(--vscode-textLink-foreground);
        border-radius: 4px;
    }

    .info-box strong {
        color: var(--vscode-textLink-foreground);
        display: block;
        margin-bottom: 0.5rem;
    }

    .info-box p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--vscode-editor-foreground);
        line-height: 1.6;
    }

    .error {
        margin-top: 1rem;
        padding: 0.75rem;
        background: var(--vscode-inputValidation-errorBackground);
        color: var(--vscode-errorForeground);
        border-radius: 4px;
        border-left: 4px solid var(--vscode-errorForeground);
    }

    .success {
        margin-top: 1rem;
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
        margin-bottom: 1rem;
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
</style>
