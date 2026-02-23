<script lang="ts">
    import QueueList from "./lib/components/QueueList.svelte";
    import QueueDetails from "./lib/components/QueueDetails.svelte";
    import MessageViewer from "./lib/components/MessageViewer.svelte";
    import MessageTable from "./lib/components/MessageTable.svelte";
    import MessageComposer from "./lib/components/MessageComposer.svelte";
    import RedrivePanel from "./lib/components/RedrivePanel.svelte";
    import SettingsPanel from "./lib/components/SettingsPanel.svelte";
    import { store } from "./lib/stores.svelte";

    let showSettings = $state(false);
</script>

<div class="app">
    <header>
        <h1>SQS Management Tool</h1>
        <div class="header-actions">
            {#if store.selectedQueue}
                <div class="view-toggle">
                    <button
                        class:active={store.viewMode === "cards"}
                        onclick={() => store.setViewMode("cards")}
                        title="Card View"
                        data-testid="view-mode-cards"
                    >
                        📋 Cards
                    </button>
                    <button
                        class:active={store.viewMode === "table"}
                        onclick={() => store.setViewMode("table")}
                        title="Table View"
                        data-testid="view-mode-table"
                    >
                        📊 Table
                    </button>
                </div>
            {/if}
            <button
                onclick={() => (showSettings = !showSettings)}
                class="btn-settings"
                data-testid="settings-button"
            >
                ⚙️ Settings
            </button>
        </div>
    </header>

    <div class="container">
        <aside class="sidebar">
            <QueueList />
        </aside>

        <main class="content">
            {#if store.selectedQueue}
                <div class="main-content">
                    {#if store.viewMode === "cards"}
                        <QueueDetails />
                        <RedrivePanel />
                        <MessageComposer />
                        <MessageViewer />
                    {:else}
                        <MessageTable />
                        <MessageComposer />
                    {/if}
                </div>
            {:else}
                <div class="placeholder">
                    <p>Select a queue from the sidebar to get started</p>
                </div>
            {/if}
        </main>
    </div>

    {#if store.error}
        <div class="toast error">
            {store.error}
            <button onclick={() => store.clearError()}>×</button>
        </div>
    {/if}

    {#if showSettings}
        <div
            class="modal-overlay"
            role="button"
            tabindex="0"
            onclick={() => (showSettings = false)}
            onkeydown={(e: KeyboardEvent) =>
                e.key === "Escape" && (showSettings = false)}
        >
            <div
                class="modal-content"
                role="dialog"
                aria-modal="true"
                tabindex="-1"
                onclick={(e: MouseEvent) => e.stopPropagation()}
                onkeydown={(e: KeyboardEvent) => e.stopPropagation()}
            >
                <button
                    class="modal-close"
                    onclick={() => (showSettings = false)}
                >
                    ×
                </button>
                <SettingsPanel />
            </div>
        </div>
    {/if}
</div>

<style>
    .app {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    header {
        background: #1976d2;
        color: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    header h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .view-toggle {
        display: flex;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        padding: 0.25rem;
        border-radius: 4px;
    }

    .view-toggle button {
        background: transparent;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
    }

    .view-toggle button:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .view-toggle button.active {
        background: rgba(255, 255, 255, 0.3);
        font-weight: 600;
    }

    .btn-settings {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-settings:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .container {
        display: flex;
        flex: 1;
        gap: 1rem;
        padding: 1rem;
        max-width: 1400px;
        width: 100%;
        margin: 0 auto;
    }

    .sidebar {
        width: 300px;
        flex-shrink: 0;
    }

    .content {
        flex: 1;
        overflow-y: auto;
    }

    .main-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #999;
        font-size: 1.1rem;
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #f44336;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    }

    .toast button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @media (prefers-color-scheme: dark) {
        .placeholder {
            color: #999;
        }
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: #fff;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    }

    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: #f44336;
        color: white;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.5rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
    }

    .modal-close:hover {
        background: #d32f2f;
    }

    @media (prefers-color-scheme: dark) {
        .modal-content {
            background: #2a2a2a;
        }
    }

    @media (max-width: 768px) {
        .container {
            flex-direction: column;
        }

        .sidebar {
            width: 100%;
        }
    }
</style>
