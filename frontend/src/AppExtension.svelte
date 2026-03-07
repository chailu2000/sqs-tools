<script lang="ts">
    import MessageTableExtension from "./lib/components/MessageTableExtension.svelte";
    import { store } from "./lib/stores-extension.svelte";
</script>

<div class="app-extension">
    {#if store.selectedQueue}
        <MessageTableExtension />
    {:else}
        <div class="placeholder">
            <p>Loading queue information...</p>
        </div>
    {/if}

    {#if store.error}
        <div class="toast error">
            {store.error}
            <button onclick={() => store.clearError()}>×</button>
        </div>
    {/if}
</div>

<style>
    .app-extension {
        min-height: 100vh;
        width: 100%;
        background-color: var(--vscode-editor-background, #fff);
        color: var(--vscode-editor-foreground, #000);
        margin: 0;
        padding: 20px;
        box-sizing: border-box;
    }

    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: var(--vscode-descriptionForeground, #999);
        font-size: 1.1rem;
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--vscode-errorForeground, #f44336);
        color: var(--vscode-editor-background, white);
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
        z-index: 1000;
    }

    .toast button {
        background: none;
        border: none;
        color: inherit;
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
</style>
