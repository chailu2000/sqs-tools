<script lang="ts">
    import { api } from "../api-adapter";
    import { store } from "../stores-extension.svelte";

    let messageBody = $state("");
    let validateJson = $state(false);
    let delaySeconds = $state(0);
    let messageGroupId = $state("");
    let messageDeduplicationId = $state("");
    let attributes = $state<Array<{ id: number; key: string; value: string; dataType: string }>>([]);
    let nextAttributeId = $state(0);
    let sending = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    // Detect if current queue is FIFO
    const isFifoQueue = $derived.by(() => {
        return store.selectedQueue?.queueName?.endsWith('.fifo') ?? false;
    });

    // Check if ContentBasedDeduplication is enabled
    const hasContentBasedDeduplication = $derived.by(() => {
        return store.selectedQueue?.attributes?.ContentBasedDeduplication === 'true';
    });

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

        // FIFO queue validation
        if (isFifoQueue && !messageGroupId.trim()) {
            error = "Message Group ID is required for FIFO queues";
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
                isFifoQueue ? messageGroupId : undefined,
                isFifoQueue && messageDeduplicationId ? messageDeduplicationId : undefined,
            );

            success = `Message sent successfully!`;
            setTimeout(() => (success = null), 5000);

            // Reset form
            messageBody = "";
            attributes = [];
            delaySeconds = 0;
            if (isFifoQueue) {
                // Keep messageGroupId for convenience, clear deduplication ID
                messageDeduplicationId = "";
            }
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

    {#if isFifoQueue}
        <div class="fifo-section">
            <div class="fifo-header">
                <strong>FIFO Queue Parameters</strong>
                <span class="fifo-badge">FIFO</span>
            </div>
            
            <div class="form-group">
                <label for="message-group-id">
                    Message Group ID: <span class="required">*</span>
                </label>
                <input
                    id="message-group-id"
                    type="text"
                    bind:value={messageGroupId}
                    placeholder="e.g., order-processing-group"
                    class="input-text"
                    title="Messages with the same Message Group ID are processed in order"
                />
                <small class="help-text">
                    Messages with the same group ID are processed in FIFO order
                </small>
            </div>

            {#if !hasContentBasedDeduplication}
                <div class="form-group">
                    <label for="message-dedup-id">
                        Message Deduplication ID: <span class="optional">(optional)</span>
                    </label>
                    <input
                        id="message-dedup-id"
                        type="text"
                        bind:value={messageDeduplicationId}
                        placeholder="e.g., unique-message-id-123"
                        class="input-text"
                        title="Token for deduplication of sent messages"
                    />
                    <small class="help-text">
                        Leave empty to use content-based deduplication
                    </small>
                </div>
            {:else}
                <div class="info-message">
                    <strong>ℹ️ Content-Based Deduplication Enabled</strong>
                    <p>This queue uses content-based deduplication. Message Deduplication ID is not required.</p>
                </div>
            {/if}
        </div>
    {/if}

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

    .fifo-section {
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--vscode-editorGroupHeader-tabsBackground);
        border-radius: 4px;
        border-left: 3px solid var(--vscode-textLink-foreground);
    }

    .fifo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .fifo-badge {
        background: var(--vscode-textLink-foreground);
        color: var(--vscode-editor-background);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
    }

    .input-text {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .help-text {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
    }

    .info-message {
        padding: 0.75rem;
        background: var(--vscode-textBlockQuote-background);
        border-radius: 4px;
        border-left: 3px solid var(--vscode-textLink-foreground);
    }

    .info-message strong {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--vscode-textLink-foreground);
    }

    .info-message p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--vscode-descriptionForeground);
    }

    .required {
        color: var(--vscode-errorForeground);
        font-weight: bold;
    }

    .optional {
        color: var(--vscode-descriptionForeground);
        font-size: 0.85rem;
        font-weight: normal;
    }
</style>
