/**
 * Custom Assertions
 * 
 * Provides custom assertion helpers for E2E tests.
 */

import * as vscode from 'vscode';
import { ExtensionTestContext, WebviewHandle } from '../fixtures/extension-context';

/**
 * Assert that a command exists
 */
export async function assertCommandExists(commandId: string): Promise<void> {
    const commands = await vscode.commands.getCommands();
    if (!commands.includes(commandId)) {
        throw new Error(`Command not found: ${commandId}`);
    }
}

/**
 * Assert that a tree item exists
 */
export async function assertTreeItemExists(
    context: ExtensionTestContext,
    label: string
): Promise<void> {
    const items = await context.getTreeItems();
    const found = items.some(item => item.label === label);
    if (!found) {
        throw new Error(`Tree item not found: ${label}`);
    }
}

/**
 * Assert webview title
 */
export async function assertWebviewTitle(
    handle: WebviewHandle,
    expectedTitle: string
): Promise<void> {
    if (handle.panel.title !== expectedTitle) {
        throw new Error(`Expected title "${expectedTitle}", got "${handle.panel.title}"`);
    }
}

/**
 * Assert webview is visible
 */
export function assertWebviewVisible(handle: WebviewHandle): void {
    if (!handle.panel.visible) {
        throw new Error('Expected webview to be visible');
    }
}

/**
 * Assert webview is disposed
 */
export function assertWebviewDisposed(handle: WebviewHandle): void {
    // Check if panel is still accessible
    try {
        const _ = handle.panel.title;
        throw new Error('Expected webview to be disposed');
    } catch (error) {
        // Expected - panel is disposed
    }
}
