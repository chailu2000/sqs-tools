/**
 * Webview Test Helper
 * 
 * This script is injected into the webview to provide test utilities.
 * It runs in the webview context and provides DOM access for tests.
 */

(function () {
    'use strict';

    // Get VS Code API
    const vscode = acquireVsCodeApi();

    // Test helper API
    window.testHelper = {
        /**
         * Query selector in webview
         */
        querySelector: function (selector) {
            const element = document.querySelector(selector);
            return element ? {
                exists: true,
                visible: element.offsetParent !== null,
                text: element.textContent,
                value: element.value,
                disabled: element.disabled,
                checked: element.checked
            } : {
                exists: false
            };
        },

        /**
         * Query all elements matching selector
         */
        querySelectorAll: function (selector) {
            const elements = document.querySelectorAll(selector);
            return Array.from(elements).map(el => ({
                text: el.textContent,
                value: el.value,
                visible: el.offsetParent !== null
            }));
        },

        /**
         * Click an element
         */
        click: function (selector) {
            const element = document.querySelector(selector);
            if (element) {
                element.click();
                return { success: true };
            }
            return { success: false, error: 'Element not found' };
        },

        /**
         * Type into an input
         */
        type: function (selector, text) {
            const element = document.querySelector(selector);
            if (element) {
                element.value = text;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return { success: true };
            }
            return { success: false, error: 'Element not found' };
        },

        /**
         * Check if element is visible
         */
        isVisible: function (selector) {
            const element = document.querySelector(selector);
            return element && element.offsetParent !== null;
        },

        /**
         * Get text content
         */
        getText: function (selector) {
            const element = document.querySelector(selector);
            return element ? element.textContent : null;
        },

        /**
         * Get element count
         */
        getCount: function (selector) {
            return document.querySelectorAll(selector).length;
        },

        /**
         * Wait for element to exist
         */
        waitForElement: function (selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();

                const check = () => {
                    const element = document.querySelector(selector);
                    if (element) {
                        resolve({ success: true });
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error('Timeout waiting for element: ' + selector));
                    } else {
                        setTimeout(check, 100);
                    }
                };

                check();
            });
        },

        /**
         * Get Svelte store value (if available)
         */
        getStoreValue: function (storeName) {
            // This would need to be implemented based on how stores are exposed
            return null;
        }
    };

    // Listen for test commands from extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'elementExists':
                const result = window.testHelper.querySelector(message.selector);
                vscode.postMessage({
                    command: 'elementExistsResult',
                    exists: result.exists
                });
                break;

            case 'clickElement':
                const clickResult = window.testHelper.click(message.selector);
                vscode.postMessage({
                    command: 'clickResult',
                    success: clickResult.success
                });
                break;

            case 'typeText':
                const typeResult = window.testHelper.type(message.selector, message.text);
                vscode.postMessage({
                    command: 'typeResult',
                    success: typeResult.success
                });
                break;
        }
    });

    // Notify extension that test helper is ready
    vscode.postMessage({
        command: 'testHelperReady'
    });
})();
