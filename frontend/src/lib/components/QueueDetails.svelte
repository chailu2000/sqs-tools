<script lang="ts">
    import { api } from "../api";
    import { store } from "../stores.svelte";

    let purging = $state(false);
    let refreshing = $state(false);
    let purgeError = $state<string | null>(null);
    let confirmPurge = $state(false);
    let successMessage = $state<string | null>(null);

    async function handleRefresh() {
        if (!store.selectedQueue) return;

        try {
            refreshing = true;
            purgeError = null;
            // Fetch fresh attributes from AWS
            const updatedQueue = await api.refreshQueue(store.selectedQueue.id);

            // Update the selected queue in the store
            const queueIndex = store.queues.findIndex(
                (q) => q.id === store.selectedQueue!.id,
            );
            if (queueIndex !== -1) {
                const updatedQueues = [...store.queues];
                updatedQueues[queueIndex] = updatedQueue;
                store.setQueues(updatedQueues);
                store.selectQueue(updatedQueue);
            }
        } catch (error) {
            purgeError =
                error instanceof Error
                    ? error.message
                    : "Failed to refresh queue";
        } finally {
            refreshing = false;
        }
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
            // Refresh queue attributes after purge
            await handleRefresh();
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
                    disabled={refreshing}
                >
                    {refreshing ? "Refreshing..." : "🔄 Refresh"}
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
        background: #fff;
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
        border-bottom: 2px solid #e0e0e0;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
    }

    .btn-secondary {
        background: #757575;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #616161;
    }

    .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

    .btn-danger:hover:not(:disabled) {
        background: #d32f2f;
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
        background: #f5f5f5;
        border-radius: 4px;
    }

    .detail-item.dlq {
        background: #fff3e0;
        border-left: 4px solid #ff9800;
    }

    .label {
        font-size: 0.85rem;
        color: #666;
        font-weight: 600;
    }

    .value {
        font-size: 0.95rem;
        color: #333;
        word-break: break-all;
    }

    .info-box {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
        border-radius: 4px;
    }

    .info-box strong {
        color: #1976d2;
        display: block;
        margin-bottom: 0.5rem;
    }

    .info-box p {
        margin: 0;
        font-size: 0.9rem;
        color: #333;
        line-height: 1.6;
    }

    .error {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        border-left: 4px solid #f44336;
    }

    .success {
        margin-top: 1rem;
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
        margin-bottom: 1rem;
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

    .btn-secondary-action {
        background: #e0e0e0;
        color: #333;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-secondary-action:hover:not(:disabled) {
        background: #d0d0d0;
    }

    .btn-secondary-action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (prefers-color-scheme: dark) {
        .queue-details {
            background: #2a2a2a;
        }

        h2 {
            color: #fff;
        }

        .header {
            border-bottom-color: #444;
        }

        .detail-item {
            background: #1a1a1a;
        }

        .detail-item.dlq {
            background: #2a2410;
        }

        .label {
            color: #aaa;
        }

        .value {
            color: #fff;
        }

        .info-box {
            background: #1a3a52;
        }

        .info-box p {
            color: #fff;
        }
    }
</style>
