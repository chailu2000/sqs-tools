<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "../api";

    let profiles = $state<string[]>([]);
    let selectedProfile = $state("");
    let credentialStatus = $state<{
        valid: boolean;
        accountId?: string;
        method?: string;
        error?: string;
    } | null>(null);
    let loading = $state(false);
    let testing = $state(false);
    let error = $state<string | null>(null);
    let successMessage = $state<string | null>(null);

    async function loadProfiles() {
        try {
            loading = true;
            error = null;
            const profileList = await api.getProfiles();
            profiles = profileList;
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to load AWS profiles";
        } finally {
            loading = false;
        }
    }

    async function setProfile() {
        if (!selectedProfile) return;

        try {
            loading = true;
            error = null;
            successMessage = null;
            await api.setProfile(selectedProfile);
            credentialStatus = null;
            successMessage = `AWS profile set to: ${selectedProfile}`;
            setTimeout(() => (successMessage = null), 5000);
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to set profile";
        } finally {
            loading = false;
        }
    }

    async function testCredentials() {
        try {
            testing = true;
            error = null;
            const status = await api.testCredentials();
            credentialStatus = status;
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to test credentials";
            credentialStatus = null;
        } finally {
            testing = false;
        }
    }

    onMount(() => {
        loadProfiles();
        testCredentials();
    });
</script>

<div class="settings-panel">
    <h3>AWS Credentials Settings</h3>

    <div class="section">
        <h4>AWS Profile</h4>
        <div class="profile-selector">
            <select
                bind:value={selectedProfile}
                class="select"
                disabled={loading}
            >
                <option value="">Select a profile...</option>
                {#each profiles as profile}
                    <option value={profile}>{profile}</option>
                {/each}
            </select>
            <button
                onclick={setProfile}
                class="btn-primary"
                disabled={loading || !selectedProfile}
            >
                {loading ? "Setting..." : "Set Profile"}
            </button>
        </div>
    </div>

    <div class="section">
        <h4>Credential Status</h4>
        <button
            onclick={testCredentials}
            class="btn-secondary"
            disabled={testing}
        >
            {testing ? "Testing..." : "Test Credentials"}
        </button>

        {#if credentialStatus}
            <div
                class="status-card"
                class:valid={credentialStatus.valid}
                class:invalid={!credentialStatus.valid}
            >
                <div class="status-header">
                    <span class="status-icon">
                        {credentialStatus.valid ? "✓" : "✗"}
                    </span>
                    <span class="status-text">
                        {credentialStatus.valid
                            ? "Credentials Valid"
                            : "Credentials Invalid"}
                    </span>
                </div>

                {#if credentialStatus.valid}
                    {#if credentialStatus.accountId}
                        <div class="status-detail">
                            <span class="detail-label">Account ID:</span>
                            <span class="detail-value"
                                >{credentialStatus.accountId}</span
                            >
                        </div>
                    {/if}
                    {#if credentialStatus.method}
                        <div class="status-detail">
                            <span class="detail-label">Method:</span>
                            <span class="detail-value"
                                >{credentialStatus.method}</span
                            >
                        </div>
                    {/if}
                {:else if credentialStatus.error}
                    <div class="status-error">
                        {credentialStatus.error}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if successMessage}
        <div class="success">{successMessage}</div>
    {/if}
</div>

<style>
    .settings-panel {
        background: #fff;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h3 {
        margin: 0 0 1.5rem 0;
        font-size: 1.25rem;
        color: #333;
    }

    h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        color: #666;
    }

    .section {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
    }

    .section:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
    }

    .profile-selector {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .select {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .btn-primary,
    .btn-secondary {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .btn-primary {
        background: #2196f3;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #0b7dda;
    }

    .btn-secondary {
        background: #e0e0e0;
        color: #333;
        margin-bottom: 1rem;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #d0d0d0;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .status-card {
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid;
    }

    .status-card.valid {
        background: #e8f5e9;
        border-left-color: #4caf50;
    }

    .status-card.invalid {
        background: #ffebee;
        border-left-color: #f44336;
    }

    .status-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .status-icon {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .status-card.valid .status-icon {
        color: #4caf50;
    }

    .status-card.invalid .status-icon {
        color: #f44336;
    }

    .status-text {
        font-size: 1rem;
        font-weight: 600;
    }

    .status-card.valid .status-text {
        color: #2e7d32;
    }

    .status-card.invalid .status-text {
        color: #c62828;
    }

    .status-detail {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .status-detail:last-child {
        margin-bottom: 0;
    }

    .detail-label {
        font-size: 0.85rem;
        color: #666;
        font-weight: 600;
    }

    .detail-value {
        font-size: 0.85rem;
        color: #333;
    }

    .status-error {
        font-size: 0.9rem;
        color: #c62828;
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

    @media (prefers-color-scheme: dark) {
        .settings-panel {
            background: #2a2a2a;
        }

        h3 {
            color: #fff;
        }

        h4 {
            color: #aaa;
        }

        .section {
            border-bottom-color: #444;
        }

        .select {
            background: #333;
            color: #fff;
            border-color: #555;
        }

        .btn-secondary {
            background: #444;
            color: #fff;
        }

        .btn-secondary:hover:not(:disabled) {
            background: #555;
        }

        .status-card.valid {
            background: #1a2a1a;
        }

        .status-card.invalid {
            background: #2a1a1a;
        }

        .detail-label {
            color: #aaa;
        }

        .detail-value {
            color: #fff;
        }

        .status-error {
            color: #ff6b6b;
        }
    }
</style>
