/**
 * Unit tests for CredentialProvider
 */

import { CredentialProvider } from '../credential-provider';
import { AwsCredentials } from '../../models/credential-provider';

// Mock VS Code SecretStorage
class MockSecretStorage {
    private storage = new Map<string, string>();

    async get(key: string): Promise<string | undefined> {
        return this.storage.get(key);
    }

    async store(key: string, value: string): Promise<void> {
        this.storage.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.storage.delete(key);
    }
}

describe('CredentialProvider', () => {
    let credentialProvider: CredentialProvider;
    let mockSecretStorage: MockSecretStorage;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };

        mockSecretStorage = new MockSecretStorage();
        credentialProvider = new CredentialProvider(mockSecretStorage as any);

        // Clear AWS environment variables
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_SESSION_TOKEN;
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('environment variable credentials', () => {
        it('should load credentials from environment variables with session token', async () => {
            process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
            process.env.AWS_SESSION_TOKEN = 'test-session-token';

            const credentials = await credentialProvider.getCredentials();

            expect(credentials.accessKeyId).toBe('test-access-key');
            expect(credentials.secretAccessKey).toBe('test-secret-key');
            expect(credentials.sessionToken).toBe('test-session-token');
        });

        it('should load credentials from environment variables without session token', async () => {
            process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
            process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

            const credentials = await credentialProvider.getCredentials();

            expect(credentials.accessKeyId).toBe('test-access-key');
            expect(credentials.secretAccessKey).toBe('test-secret-key');
            expect(credentials.sessionToken).toBeUndefined();
        });
    });

    describe('SecretStorage credentials', () => {
        it('should store and retrieve credentials from SecretStorage', async () => {
            const testCredentials: AwsCredentials = {
                accessKeyId: 'stored-access-key',
                secretAccessKey: 'stored-secret-key',
                sessionToken: 'stored-session-token'
            };

            await credentialProvider.storeCredentials(testCredentials);

            // Verify stored in mock storage
            const storedAccessKey = await mockSecretStorage.get('aws-access-key-id');
            const storedSecretKey = await mockSecretStorage.get('aws-secret-access-key');
            const storedSessionToken = await mockSecretStorage.get('aws-session-token');

            expect(storedAccessKey).toBe('stored-access-key');
            expect(storedSecretKey).toBe('stored-secret-key');
            expect(storedSessionToken).toBe('stored-session-token');
        });

        it('should store credentials without session token', async () => {
            const testCredentials: AwsCredentials = {
                accessKeyId: 'stored-access-key',
                secretAccessKey: 'stored-secret-key'
            };

            await credentialProvider.storeCredentials(testCredentials);

            const storedAccessKey = await mockSecretStorage.get('aws-access-key-id');
            const storedSecretKey = await mockSecretStorage.get('aws-secret-access-key');
            const storedSessionToken = await mockSecretStorage.get('aws-session-token');

            expect(storedAccessKey).toBe('stored-access-key');
            expect(storedSecretKey).toBe('stored-secret-key');
            expect(storedSessionToken).toBeUndefined();
        });

        it('should retrieve credentials from SecretStorage when env vars not set', async () => {
            // Store credentials
            await mockSecretStorage.store('aws-access-key-id', 'stored-access-key');
            await mockSecretStorage.store('aws-secret-access-key', 'stored-secret-key');
            await mockSecretStorage.store('aws-session-token', 'stored-session-token');

            const credentials = await credentialProvider.getCredentials();

            expect(credentials.accessKeyId).toBe('stored-access-key');
            expect(credentials.secretAccessKey).toBe('stored-secret-key');
            expect(credentials.sessionToken).toBe('stored-session-token');
        });
    });

    describe('clearCredentials', () => {
        it('should clear all stored credentials', async () => {
            const testCredentials: AwsCredentials = {
                accessKeyId: 'stored-access-key',
                secretAccessKey: 'stored-secret-key',
                sessionToken: 'stored-session-token'
            };

            await credentialProvider.storeCredentials(testCredentials);
            await credentialProvider.clearCredentials();

            const accessKeyId = await mockSecretStorage.get('aws-access-key-id');
            const secretAccessKey = await mockSecretStorage.get('aws-secret-access-key');
            const sessionToken = await mockSecretStorage.get('aws-session-token');

            expect(accessKeyId).toBeUndefined();
            expect(secretAccessKey).toBeUndefined();
            expect(sessionToken).toBeUndefined();
        });
    });

    describe('listProfiles', () => {
        it('should return an array', async () => {
            const profiles = await credentialProvider.listProfiles();
            expect(Array.isArray(profiles)).toBe(true);
        });
    });

    describe('credential priority chain', () => {
        it('should prioritize environment variables over SecretStorage', async () => {
            // Store credentials in SecretStorage
            await mockSecretStorage.store('aws-access-key-id', 'stored-access-key');
            await mockSecretStorage.store('aws-secret-access-key', 'stored-secret-key');

            // Set environment variables (higher priority)
            process.env.AWS_ACCESS_KEY_ID = 'env-access-key';
            process.env.AWS_SECRET_ACCESS_KEY = 'env-secret-key';

            const credentials = await credentialProvider.getCredentials();

            // Should get environment variables, not SecretStorage
            expect(credentials.accessKeyId).toBe('env-access-key');
            expect(credentials.secretAccessKey).toBe('env-secret-key');
        });
    });
});
