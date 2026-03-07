/**
 * Entry point for VS Code Extension Webview
 * This file mounts the Svelte app and sets up the extension-specific context
 */

import { mount } from 'svelte';
import AppExtension from './AppExtension.svelte';
// Don't import app.css for extension - it has body styles that conflict with webview
// import './app.css';
import { store } from './lib/stores-extension.svelte';

// Get queue from window context (passed by extension)
declare global {
    interface Window {
        initialQueue: any;
        vscode: any;
    }
}

// Wait for DOM to be ready
function init() {
    // Initialize store with queue from extension
    if (window.initialQueue) {
        store.selectQueue(window.initialQueue);
    }

    // Mount the Svelte app
    const appElement = document.getElementById('app');

    if (!appElement) {
        document.body.innerHTML = '<h1 style="color: red;">ERROR: Could not find #app element</h1>';
        return;
    }

    try {
        mount(AppExtension, {
            target: appElement,
        });
    } catch (error) {
        appElement.innerHTML = `<h1 style="color: red;">ERROR: ${error}</h1><pre>${error instanceof Error ? error.stack : ''}</pre>`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
