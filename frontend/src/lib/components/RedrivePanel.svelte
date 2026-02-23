<script lang="ts">
    import { api } from "../api";
    import { store } from "../stores.svelte";

    let redriving = $state(false);
    let error = $state<string | null>(null);
    let result = $state<{
        processedCount: number;
        successCount: number;
        failureCount: number;
        errors: Array<{ messageId: string; error: string }>;
    } | null>(null);
    let confirmAction = $state<"single" | "all" | null>(null);

    async function redriveSingle() {
        if (!store.selectedQueue?.dlqUrl) return;
        confirmAction = "single";
    }

    async function redriveAll() {
        if (!store.selectedQueue?.dlqUrl) return;
        confirmAction = "all";
    }

    async function confirmRedrive() {
        if (!store.selectedQueue?.dlqUrl || !confirmAction) return;

        try {
            redriving = true;
            error = null;
            result = null;

            const redriveResult = await api.redriveMessages(
                store.selectedQueue.id,
                confirmAction === "single" ? 1 : undefined,
            );
            result = redriveResult;
            confirmAction = null;
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to redrive message";
        } finally {
            redriving = false;
        }
    }

    function cancelRedrive() {
        confirmAction = null;
    }
</script>

{#if store.hasDLQ}
    <div class="redrive-panel">
        <h3>Dead Letter Queue Redrive</h3>

        <div class="dlq-info">
            <div class="info-item">
                <span class="label">DLQ Name:</span>
                <span class="value">{store.selectedQueue?.dlqName}</span>
            </div>
            <div class="info-item">
                <span class="label">DLQ URL:</span>
                <span class="value">{store.selectedQueue?.dlqUrl}</span>
            </div>
        </div>

        <div class="actions">
            <button
                onclick={redriveSingle}
                class="btn-secondary"
                disabled={redriving}
            >
                {redriving ? "Processing..." : "Redrive Single Message"}
            </button>

            <button
                onclick={redriveAll}
                class="btn-primary"
                disabled={redriving}
            >
                {redriving ? "Processing..." : "Redrive All Messages"}
            </button>
        </div>

        {#if confirmAction}
            <div class="confirm-dialog">
                <div class="confirm-content">
                    <p>
                        {#if confirmAction === "single"}
                            Redrive a single message from the DLQ back to the
                            main queue?
                        {:else}
                            Are you sure you want to redrive ALL messages from
                            the DLQ? This may take a while for large queues.
                        {/if}
                    </p>
                    <div class="confirm-actions">
                        <button
                            onclick={confirmRedrive}
                            class="btn-primary"
                            disabled={redriving}
                        >
                            {redriving ? "Processing..." : "Confirm"}
                        </button>
                        <button
                            onclick={cancelRedrive}
                            class="btn-secondary-action"
                            disabled={redriving}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        {#if error}
            <div class="error">{error}</div>
        {/if}

        {#if result}
            <div class="result">
                <h4>Redrive Results</h4>
                <div class="result-stats">
                    <div class="stat">
                        <span class="stat-label">Processed:</span>
                        <span class="stat-value">{result.processedCount}</span>
                    </div>
                    <div class="stat success">
                        <span class="stat-label">Success:</span>
                        <span class="stat-value">{result.successCount}</span>
                    </div>
                    <div class="stat failure">
                        <span class="stat-label">Failed:</span>
                        <span class="stat-value">{result.failureCount}</span>
                    </div>
                </div>

                {#if result.errors.length > 0}
                    <div class="errors-list">
                        <strong>Errors:</strong>
                        {#each result.errors as err}
                            <div class="error-item">
                                <span class="error-id"
                                    >Message ID: {err.messageId}</span
                                >
                                <span class="error-msg">{err.error}</span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{:else if store.selectedQueue}
    <div class="redrive-panel disabled">
        <h3>Dead Letter Queue Redrive</h3>
        <p class="no-dlq">
            This queue does not have a Dead Letter Queue configured.
        </p>
    </div>
{/if}

<style>
    .redrive-panel {
        background: #fff;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #ff9800;
    }

    .redrive-panel.disabled {
        border-left-color: #ccc;
        opacity: 0.7;
    }

    h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        color: #333;
    }

    .dlq-info {
        background: #fff3e0;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
    }

    .info-item:last-child {
        margin-bottom: 0;
    }

    .label {
        font-size: 0.85rem;
        color: #666;
        font-weight: 600;
    }

    .value {
        font-size: 0.9rem;
        color: #333;
        word-break: break-all;
    }

    .actions {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .btn-primary,
    .btn-secondary {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-primary {
        background: #ff9800;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #f57c00;
    }

    .btn-secondary {
        background: #e0e0e0;
        color: #333;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #d0d0d0;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error {
        padding: 0.75rem;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        border-left: 4px solid #f44336;
        margin-bottom: 1rem;
    }

    .result {
        background: #e8f5e9;
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid #4caf50;
    }

    .result h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        color: #2e7d32;
    }

    .result-stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .stat {
        flex: 1;
        background: #fff;
        padding: 0.75rem;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .stat.success {
        border-left: 4px solid #4caf50;
    }

    .stat.failure {
        border-left: 4px solid #f44336;
    }

    .stat-label {
        font-size: 0.85rem;
        color: #666;
        font-weight: 600;
    }

    .stat-value {
        font-size: 1.5rem;
        color: #333;
        font-weight: bold;
    }

    .errors-list {
        background: #fff;
        padding: 0.75rem;
        border-radius: 4px;
    }

    .errors-list strong {
        display: block;
        margin-bottom: 0.5rem;
        color: #c62828;
    }

    .error-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        background: #ffebee;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }

    .error-item:last-child {
        margin-bottom: 0;
    }

    .error-id {
        font-size: 0.85rem;
        color: #666;
        font-weight: 600;
    }

    .error-msg {
        font-size: 0.9rem;
        color: #c62828;
    }

    .no-dlq {
        color: #666;
        font-style: italic;
        margin: 0;
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
        padding: 0.75rem 1rem;
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
        .redrive-panel {
            background: #2a2a2a;
        }

        h3 {
            color: #fff;
        }

        .dlq-info {
            background: #2a2410;
        }

        .label {
            color: #aaa;
        }

        .value {
            color: #fff;
        }

        .btn-secondary {
            background: #444;
            color: #fff;
        }

        .btn-secondary:hover:not(:disabled) {
            background: #555;
        }

        .result {
            background: #1a2a1a;
        }

        .result h4 {
            color: #4caf50;
        }

        .stat {
            background: #1a1a1a;
        }

        .stat-label {
            color: #aaa;
        }

        .stat-value {
            color: #fff;
        }

        .errors-list {
            background: #1a1a1a;
        }

        .error-item {
            background: #2a1a1a;
        }

        .error-msg {
            color: #ff6b6b;
        }

        .no-dlq {
            color: #aaa;
        }
    }
</style>
