<script lang="ts">
    import { api } from "../api-adapter";
    import { store } from "../stores-extension.svelte";

    let messageBody = $state("");
    let validateJson = $state(false);
    let delaySeconds = $state(0);
    let attributes = $state<Array<{ id: number; key: string; value: string; dataType: string }>>([]);
    let nextAttributeId = $state(0);
    let sending = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    function addAttribute() {
        attributes = [...attributes, { id: nextAttributeId++, key: "", value: "", dataType: "String" }];
    }

    function removeAttribute(id: number) {
        attributes = attributes.filter((attr) => attr.id !== id);
    }

    function validateJsonFormat(): boolean {
        if (!validateJson) return true;

        try {
            JSON.parse(messageBody);
            return true;
        } catch {
            return false;
        }
    }

    async function sendMessage() {
        if (!store.selectedQueue) return;

        if (!messageBody.trim()) {
            error = "Message body is required";
            return;
        }

        if (validateJson && !validateJsonFormat()) {
            error = "Invalid JSON format";
            return;
        }

        try {
            sending = true;
            error = null;
            success = null;

            const messageAttributes: Record<
                string,
                { dataType: string; stringValue: string }
            > = {};

            attributes
                .filter((attr) => attr.key.trim() && attr.value.trim())
                .forEach((attr) => {
                    messageAttributes[attr.key] = {
                        dataType: attr.dataType || "String",
                        stringValue: attr.value,
                    };
                });

            const result = await api.sendMessage(
                store.selectedQueue.id,
                messageBody,
                messageAttributes,
                delaySeconds,
            );

            success = `Message sent successfully!`;
            setTimeout(() => (success = null), 5000);

            // Reset form
            messageBody = "";
            attributes = [];
            delaySeconds = 0;
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to send message";
        } finally {
            sending = false;
        }
    }
</script>

<div class="message-composer">
    <h3>Send Message</h3>

    <div class="form-group">
        <label for="message-body">Message Body:</label>
        <textarea
            id="message-body"
            bind:value={messageBody}
            placeholder="Enter message body..."
            rows="8"
            class="textarea"
        ></textarea>
    </div>

    <div class="form-row">
        <label class="checkbox-label">
            <input type="checkbox" bind:checked={validateJson} />
            Validate JSON format
        </label>

        <label>
            Delay (seconds):
            <input
                type="number"
                bind:value={delaySeconds}
                min="0"
                max="900"
                class="input-small"
            />
        </label>
    </div>

    <div class="attributes-section">
        <div class="attributes-header">
            <strong>Message Attributes:</strong>
            <button onclick={addAttribute} class="btn-small">
                + Add Attribute
            </button>
        </div>

        {#if attributes.length > 0}
            <div class="attributes-list">
                {#each attributes as attr (attr.id)}
                    <div class="attribute-row">
                        <input
                            type="text"
                            bind:value={attr.key}
                            placeholder="Key (e.g., type)"
                            class="input-attr-key"
                            title="Attribute name"
                        />
                        <select
                            bind:value={attr.dataType}
                            class="input-attr-type"
                            title="Data type"
                        >
                            <option value="String">String</option>
                            <option value="Number">Number</option>
                            <option value="Binary">Binary</option>
                            <option value="String.json">String.json</option>
                            <option value="String.xml">String.xml</option>
                            <option value="Number.int">Number.int</option>
                            <option value="Number.float">Number.float</option>
                        </select>
                        <input
                            type="text"
                            bind:value={attr.value}
                            placeholder={attr.dataType === 'Number' || attr.dataType === 'Number.int' || attr.dataType === 'Number.float' ? 'Value (number)' : attr.dataType === 'Binary' ? 'Value (base64)' : 'Value'}
                            class="input-attr-value"
                            title="Attribute value"
                        />
                        <button
                            onclick={() => removeAttribute(attr.id)}
                            class="btn-remove-attr"
                            title="Remove attribute"
                        >
                            ×
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if success}
        <div class="success">{success}</div>
    {/if}

    <button
        onclick={sendMessage}
        class="btn-primary"
        disabled={sending || !store.selectedQueue}
    >
        {sending ? "Sending..." : "Send Message"}
    </button>
</div>

<style>
    .message-composer {
        background: var(--vscode-editor-background);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        color: var(--vscode-editor-foreground);
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
    }

    .textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 0.9rem;
        font-family: "Courier New", monospace;
        resize: vertical;
    }

    .form-row {
        display: flex;
        gap: 2rem;
        align-items: center;
        margin-bottom: 1rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: normal;
        cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
        cursor: pointer;
    }

    .input-small {
        padding: 0.5rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 0.9rem;
        width: 120px;
    }

    .attributes-section {
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--vscode-editorGroupHeader-tabsBackground);
        border-radius: 4px;
    }

    .attributes-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .btn-small {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }

    .btn-small:hover {
        background: var(--vscode-button-hoverBackground);
    }

    .attributes-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .attribute-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .input-attr-key {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .input-attr-type {
        flex: 0 0 140px;
        padding: 0.5rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .input-attr-value {
        flex: 2;
        padding: 0.5rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .btn-remove-attr {
        background: var(--vscode-errorForeground);
        color: var(--vscode-editor-background);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-remove-attr:hover {
        opacity: 0.9;
    }

    .error {
        padding: 0.75rem;
        background: var(--vscode-inputValidation-errorBackground);
        color: var(--vscode-errorForeground);
        border-radius: 4px;
        border-left: 4px solid var(--vscode-errorForeground);
        margin-bottom: 1rem;
    }

    .success {
        padding: 0.75rem;
        background: var(--vscode-textBlockQuote-background);
        color: var(--vscode-textLink-foreground);
        border-radius: 4px;
        border-left: 4px solid var(--vscode-textLink-foreground);
        margin-bottom: 1rem;
    }

    .btn-primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        width: 100%;
    }

    .btn-primary:hover:not(:disabled) {
        background: var(--vscode-button-hoverBackground);
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
