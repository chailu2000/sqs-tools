<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "../api";
    import { store } from "../stores.svelte";

    let showAddForm = $state(false);
    let queueIdentifier = $state("");
    let region = $state("us-east-1");
    let addError = $state<string | null>(null);
    let confirmRemove = $state<string | null>(null);

    const regions = [
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "eu-west-1",
        "eu-central-1",
        "ap-southeast-1",
        "ap-northeast-1",
    ];

    onMount(async () => {
        await loadQueues();
    });

    async function loadQueues() {
        try {
            store.setLoading("queues", true);
            const queues = await api.getAllQueues();
            store.setQueues(queues);
        } catch (error) {
            store.setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load queues",
            );
        } finally {
            store.setLoading("queues", false);
        }
    }

    async function handleAddQueue() {
        if (!queueIdentifier.trim()) {
            addError = "Queue name or URL is required";
            return;
        }

        try {
            store.setLoading("operation", true);
            addError = null;
            const queue = await api.addQueue(queueIdentifier.trim(), region);
            store.addQueue(queue);

            // Reset form
            queueIdentifier = "";
            region = "us-east-1";
            showAddForm = false;
        } catch (error) {
            addError =
                error instanceof Error ? error.message : "Failed to add queue";
        } finally {
            store.setLoading("operation", false);
        }
    }

    async function handleRemoveQueue(queueId: string) {
        confirmRemove = queueId;
    }

    async function confirmRemoveQueue(queueId: string) {
        try {
            store.setLoading("operation", true);
            await api.removeQueue(queueId);
            store.removeQueue(queueId);
            confirmRemove = null;
        } catch (error) {
            store.setError(
                error instanceof Error
                    ? error.message
                    : "Failed to remove queue",
            );
        } finally {
            store.setLoading("operation", false);
        }
    }

    function cancelRemove() {
        confirmRemove = null;
    }

    function handleSelectQueue(queue: (typeof store.queues)[0]) {
        store.selectQueue(queue);
    }
</script>

<div class="queue-list">
    <div class="header">
        <h2>Queues</h2>
        <button onclick={() => (showAddForm = !showAddForm)} class="btn-add">
            {showAddForm ? "Cancel" : "+ Add Queue"}
        </button>
    </div>

    {#if showAddForm}
        <div class="add-form">
            <input
                type="text"
                bind:value={queueIdentifier}
                placeholder="Queue name or URL"
                class="input"
            />
            <select bind:value={region} class="select">
                {#each regions as r}
                    <option value={r}>{r}</option>
                {/each}
            </select>
            <button
                onclick={handleAddQueue}
                class="btn-primary"
                disabled={store.loading.operation}
            >
                {store.loading.operation ? "Adding..." : "Add"}
            </button>
            {#if addError}
                <div class="error">{addError}</div>
            {/if}
        </div>
    {/if}

    {#if confirmRemove}
        <div class="confirm-dialog">
            <div class="confirm-content">
                <p>Are you sure you want to remove this queue?</p>
                <div class="confirm-actions">
                    <button
                        onclick={() => confirmRemoveQueue(confirmRemove!)}
                        class="btn-danger"
                        disabled={store.loading.operation}
                    >
                        {store.loading.operation ? "Removing..." : "Remove"}
                    </button>
                    <button
                        onclick={cancelRemove}
                        class="btn-secondary"
                        disabled={store.loading.operation}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    {/if}

    {#if store.loading.queues}
        <div class="loading">Loading queues...</div>
    {:else if store.queues.length === 0}
        <div class="empty">
            No queues added yet. Click "Add Queue" to get started.
        </div>
    {:else}
        <div class="queue-items">
            {#each store.queues as queue (queue.id)}
                <div
                    class="queue-item"
                    class:selected={store.selectedQueue?.id === queue.id}
                    role="button"
                    tabindex="0"
                    onclick={() => handleSelectQueue(queue)}
                    onkeydown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        handleSelectQueue(queue)}
                >
                    <div class="queue-info">
                        <div class="queue-name">{queue.queueName}</div>
                        <div class="queue-region">{queue.region}</div>
                        {#if queue.dlqName}
                            <div class="queue-dlq">DLQ: {queue.dlqName}</div>
                        {/if}
                    </div>
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            handleRemoveQueue(queue.id);
                        }}
                        class="btn-remove"
                        title="Remove queue"
                    >
                        ×
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .queue-list {
        background: #fff;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .btn-add {
        background: #4caf50;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-add:hover {
        background: #45a049;
    }

    .add-form {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input,
    .select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .btn-primary {
        background: #2196f3;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .btn-primary:hover:not(:disabled) {
        background: #0b7dda;
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error {
        color: #f44336;
        font-size: 0.85rem;
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

    .btn-secondary {
        background: #e0e0e0;
        color: #333;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #d0d0d0;
    }

    .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .loading,
    .empty {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    .queue-items {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .queue-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .queue-item:hover {
        background: #f5f5f5;
        border-color: #2196f3;
    }

    .queue-item.selected {
        background: #e3f2fd;
        border-color: #2196f3;
    }

    .queue-info {
        flex: 1;
    }

    .queue-name {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .queue-region {
        font-size: 0.85rem;
        color: #666;
    }

    .queue-dlq {
        font-size: 0.8rem;
        color: #ff9800;
        margin-top: 0.25rem;
    }

    .btn-remove {
        background: #f44336;
        color: white;
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-remove:hover {
        background: #d32f2f;
    }

    @media (prefers-color-scheme: dark) {
        .queue-list {
            background: #2a2a2a;
        }

        .add-form {
            background: #1a1a1a;
        }

        .input,
        .select {
            background: #333;
            color: #fff;
            border-color: #555;
        }

        .queue-item {
            border-color: #555;
        }

        .queue-item:hover {
            background: #333;
        }

        .queue-item.selected {
            background: #1a3a52;
        }
    }
</style>
