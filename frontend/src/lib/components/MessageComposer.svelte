<script lang="ts">
    import { api } from "../api";
    import { store } from "../stores.svelte";

    let messageBody = $state("");
    let validateJson = $state(false);
    let delaySeconds = $state(0);
    let attributes = $state<Array<{ key: string; value: string; dataType: string }>>([]);
    let sending = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    let messageGroupId = $state("");
    let messageDeduplicationId = $state("");

    const isFifo = $derived(store.selectedQueue?.queueName.endsWith(".fifo") || false);

    function addAttribute() {
        attributes = [...attributes, { key: "", value: "", dataType: "String" }];
    }

    function removeAttribute(index: number) {
        attributes = attributes.filter((_, i) => i !== index);
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

        if (isFifo && !messageGroupId.trim()) {
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
                isFifo ? messageGroupId : undefined,
                isFifo ? messageDeduplicationId : undefined,
                store.activeTab === 'dlq'
            );

            success = `Message sent successfully! Message ID: ${result.messageId}`;

            // Reset form
            messageBody = "";
            attributes = [];
            delaySeconds = 0;
            messageGroupId = "";
            messageDeduplicationId = "";
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

        {#if !isFifo}
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
        {/if}
    </div>

    {#if isFifo}
        <div class="fifo-section">
            <div class="form-row">
                <div class="form-group flex-1">
                    <label for="message-group-id">Message Group ID *:</label>
                    <input
                        id="message-group-id"
                        type="text"
                        bind:value={messageGroupId}
                        placeholder="Enter group ID..."
                        class="input-full"
                    />
                </div>
                <div class="form-group flex-1">
                    <label for="message-dedupe-id">Message Deduplication ID:</label>
                    <input
                        id="message-dedupe-id"
                        type="text"
                        bind:value={messageDeduplicationId}
                        placeholder="Enter deduplication ID (optional)..."
                        class="input-full"
                    />
                </div>
            </div>
            <p class="help-text">FIFO queues require a Message Group ID. Deduplication ID is optional if content-based deduplication is enabled.</p>
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
                {#each attributes as attr, index}
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
                            onclick={() => removeAttribute(index)}
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
        background: #fff;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        color: #333;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #666;
        font-weight: 600;
    }

    .textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
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
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        width: 120px;
    }

    .attributes-section {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }

    .attributes-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .btn-small {
        background: #4caf50;
        color: white;
        border: none;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }

    .btn-small:hover {
        background: #45a049;
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
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .input-attr-type {
        flex: 0 0 140px;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .input-attr-value {
        flex: 2;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .btn-remove-attr {
        background: #f44336;
        color: white;
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
        background: #d32f2f;
    }

    .error {
        padding: 0.75rem;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        border-left: 4px solid #f44336;
        margin-bottom: 1rem;
    }

    .success {
        padding: 0.75rem;
        background: #e8f5e9;
        color: #2e7d32;
        border-radius: 4px;
        border-left: 4px solid #4caf50;
        margin-bottom: 1rem;
    }

    .btn-primary {
        background: #2196f3;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        width: 100%;
    }

    .btn-primary:hover:not(:disabled) {
        background: #0b7dda;
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .fifo-section {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #e3f2fd;
        border-radius: 4px;
        border-left: 4px solid #2196f3;
    }

    .help-text {
        font-size: 0.8rem;
        color: #666;
        margin: 0.5rem 0 0 0;
        font-style: italic;
    }

    .flex-1 {
        flex: 1;
    }

    .input-full {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    @media (prefers-color-scheme: dark) {
        .message-composer {
            background: #2a2a2a;
        }

        h3 {
            color: #fff;
        }

        label {
            color: #aaa;
        }

        .textarea,
        .input-small,
        .input-attr-key,
        .input-attr-type,
        .input-attr-value {
            background: #333;
            color: #fff;
            border-color: #555;
        }

        .attributes-section {
            background: #1a1a1a;
        }
    }
</style>
