/**
 * Unit tests for sync profile CRUD commands.
 *
 * NOTE: These tests are skipped in unit test environment because they require
 * the vscode module which is only available in the VS Code Extension Host.
 * These should be tested via E2E tests with LocalStack instead.
 */

describe('Sync Profile Commands (Skipped - Requires E2E Environment)', () => {
    it.skip('createSyncProfile creates and saves a new profile', () => {
        // Requires VS Code Extension Host
    });

    it.skip('runSyncProfile executes selected profile', () => {
        // Requires VS Code Extension Host
    });

    it.skip('editSyncProfile updates profile fields', () => {
        // Requires VS Code Extension Host
    });

    it.skip('deleteSyncProfile deletes selected profile after confirmation', () => {
        // Requires VS Code Extension Host
    });
});
