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
    console.log('Extension entry: Initializing...');
    console.log('window.initialQueue:', window.initialQueue);
    console.log('window.vscode:', window.vscode);

    // Initialize store with queue from extension
    if (window.initialQueue) {
        console.log('Setting queue in store:', window.initialQueue.queueName);
        store.selectQueue(window.initialQueue);
    } else {
        console.warn('No initialQueue found on window');
    }

    // Mount the Svelte app
    const appElement = document.getElementById('app');
    console.log('App element:', appElement);

    if (!appElement) {
        console.error('Could not find #app element');
        document.body.innerHTML = '<h1 style="color: red;">ERROR: Could not find #app element</h1>';
        return;
    }

    try {
        console.log('About to mount AppExtension...');
        const app = mount(AppExtension, {
            target: appElement,
        });
        console.log('App mounted successfully:', app);
    } catch (error) {
        console.error('Error mounting app:', error);
        appElement.innerHTML = `<h1 style="color: red;">ERROR: ${error}</h1><pre>${error instanceof Error ? error.stack : ''}</pre>`;
    }
}

// Initialize when DOM is ready
console.log('Extension entry loaded, readyState:', document.readyState);
if (document.readyState === 'loading') {
    console.log('Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', init);
} else {
    console.log('DOM already ready, initializing now...');
    init();
}
