/**
 * Profile Selection Command
 * 
 * Allows users to select an AWS profile from available profiles.
 * Updates the active profile, refreshes the SQS client, and updates the status bar.
 */

import * as vscode from 'vscode';
import { CredentialProvider } from '../services/credential-provider';
import { SQSClientFactory } from '../aws/client-factory';
import { displayCredentialError } from '../utils/credential-error-handler';
import { error as logError } from '../utils/logger';

export async function selectProfileCommand(
    context: vscode.ExtensionContext,
    credentialProvider: CredentialProvider,
    clientFactory: SQSClientFactory,
    statusBarItem: vscode.StatusBarItem,
    refreshCallback: () => void
): Promise<void> {
    try {
        // Get list of available AWS profiles
        const profiles = await credentialProvider.listProfiles();

        if (profiles.length === 0) {
            const action = await vscode.window.showInformationMessage(
                'No AWS profiles found in ~/.aws/credentials. Would you like to enter credentials manually?',
                'Enter Credentials',
                'Cancel'
            );

            if (action === 'Enter Credentials') {
                const credentials = await credentialProvider.promptForCredentials();
                if (credentials) {
                    // Validate the credentials
                    const isValid = await credentialProvider.validateCredentials(credentials);
                    if (isValid) {
                        vscode.window.showInformationMessage('Credentials validated and stored successfully!');

                        // Update status bar to show manual credentials
                        statusBarItem.text = '$(cloud) AWS: Manual Credentials';
                        statusBarItem.tooltip = 'Using manually entered credentials';

                        // Clear any stored profile selection
                        await context.globalState.update('awsProfile', undefined);

                        // Refresh client factory with new credentials
                        clientFactory.updateCredentials(credentials);

                        // Refresh the queue tree view
                        refreshCallback();
                    } else {
                        vscode.window.showErrorMessage('Invalid credentials. Please check your AWS Access Key ID and Secret Access Key.');
                    }
                }
            }
            return;
        }

        // Get currently selected profile
        const currentProfile = context.globalState.get<string>('awsProfile');

        // Show QuickPick with available profiles
        const selectedProfile = await vscode.window.showQuickPick(profiles, {
            placeHolder: 'Select an AWS profile',
            title: 'AWS Profile Selection',
            ignoreFocusOut: true,
            // Mark the current profile with a checkmark
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selectedProfile) {
            // User cancelled
            return;
        }

        // Load credentials for the selected profile
        const credentials = await credentialProvider.getCredentials(selectedProfile);

        // Validate the credentials
        const isValid = await credentialProvider.validateCredentials(credentials);
        if (!isValid) {
            vscode.window.showErrorMessage(
                `Failed to validate credentials for profile '${selectedProfile}'. Please check your AWS configuration.`
            );
            return;
        }

        // Store the selected profile
        await context.globalState.update('awsProfile', selectedProfile);

        // Update status bar
        statusBarItem.text = `$(cloud) AWS: ${selectedProfile}`;
        statusBarItem.tooltip = `Active AWS profile: ${selectedProfile}`;

        // Update client factory with new credentials
        clientFactory.updateCredentials(credentials);

        // Show success message
        vscode.window.showInformationMessage(`AWS profile set to: ${selectedProfile}`);

        // Refresh the queue tree view to reload queues with new credentials
        refreshCallback();

    } catch (error: any) {
        // Use the credential error handler for user-friendly error messages
        await displayCredentialError(error);
        logError('Error in selectProfileCommand:', error);
    }
}
