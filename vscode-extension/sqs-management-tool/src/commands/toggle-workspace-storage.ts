import * as vscode from 'vscode';
import { QueueStorage } from '../services/queue-storage';
import { log } from '../utils/logger';

/**
 * Toggle between global and workspace-specific queue storage
 * 
 * This command allows users to switch between storing queues globally
 * (across all workspaces) or workspace-specifically (per workspace).
 * 
 * @param context - VS Code extension context
 * @param queueStorage - Queue storage service instance
 * @param refreshCallback - Callback to refresh the tree view after toggling
 */
export async function toggleWorkspaceStorageCommand(
    context: vscode.ExtensionContext,
    queueStorage: QueueStorage,
    refreshCallback: () => void
): Promise<void> {
    try {
        // Get current storage mode
        const currentMode = context.globalState.get<boolean>('useWorkspaceStorage', false);

        // Show quick pick to select storage mode
        const options = [
            {
                label: '$(globe) Global Storage',
                description: 'Store queues globally across all workspaces',
                picked: !currentMode
            },
            {
                label: '$(folder) Workspace Storage',
                description: 'Store queues specific to this workspace',
                picked: currentMode
            }
        ];

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select queue storage mode',
            title: 'Queue Storage Mode'
        });

        if (!selected) {
            return; // User cancelled
        }

        const useWorkspace = selected.label.includes('Workspace');

        // Update storage mode
        await context.globalState.update('useWorkspaceStorage', useWorkspace);
        queueStorage.useWorkspaceStorage(useWorkspace);

        // Log the change
        log(`Queue storage mode changed to: ${useWorkspace ? 'Workspace' : 'Global'}`);

        // Show confirmation message
        vscode.window.showInformationMessage(
            `Queue storage mode changed to ${useWorkspace ? 'Workspace' : 'Global'}. Queues will now be ${useWorkspace ? 'workspace-specific' : 'shared across all workspaces'}.`
        );

        // Refresh the tree view to show queues from the new storage
        refreshCallback();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to toggle storage mode: ${error.message}`);
    }
}
