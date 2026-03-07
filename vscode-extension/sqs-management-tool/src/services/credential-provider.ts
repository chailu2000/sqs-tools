/**
 * Credential Provider Implementation
 * 
 * Manages AWS credential loading from multiple sources with priority chain:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
 * 2. AWS profile from ~/.aws/credentials
 * 3. VS Code SecretStorage
 * 4. IAM role (EC2/ECS metadata)
 * 5. Manual user input (stored in SecretStorage)
 */

import * as vscode from 'vscode';
import { fromEnv, fromIni, fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { ICredentialProvider, AwsCredentials, AwsProfile } from '../models/credential-provider';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { error as logError } from '../utils/logger';

/**
 * Secret Storage keys for AWS credentials
 */
const SECRET_KEYS = {
    ACCESS_KEY_ID: 'aws-access-key-id',
    SECRET_ACCESS_KEY: 'aws-secret-access-key',
    SESSION_TOKEN: 'aws-session-token'
};

export class CredentialProvider implements ICredentialProvider {
    constructor(private readonly secretStorage: vscode.SecretStorage) { }

    /**
     * Get AWS credentials from the priority chain
     * Priority: environment variables → AWS profile → VS Code secrets → IAM role
     */
    async getCredentials(profile?: string): Promise<AwsCredentials> {
        // 1. Try environment variables first (highest priority)
        try {
            const envCredentials = await this.getCredentialsFromEnvironment();
            if (envCredentials) {
                return envCredentials;
            }
        } catch (error) {
            // Continue to next source
        }

        // 2. Try AWS profile
        if (profile) {
            try {
                const profileCredentials = await this.getCredentialsFromProfile(profile);
                if (profileCredentials) {
                    return profileCredentials;
                }
            } catch (error) {
                // Continue to next source
            }
        }

        // 3. Try VS Code SecretStorage
        try {
            const secretCredentials = await this.getCredentialsFromSecretStorage();
            if (secretCredentials) {
                return secretCredentials;
            }
        } catch (error) {
            // Continue to next source
        }

        // 4. Try IAM role (EC2/ECS metadata)
        try {
            const iamCredentials = await this.getCredentialsFromIAMRole();
            if (iamCredentials) {
                return iamCredentials;
            }
        } catch (error) {
            // Continue to next source
        }

        // 5. If all sources fail, prompt for manual entry
        throw new Error('No AWS credentials found. Please configure credentials.');
    }

    /**
     * Load credentials from environment variables
     * Checks: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
     */
    private async getCredentialsFromEnvironment(): Promise<AwsCredentials | null> {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const sessionToken = process.env.AWS_SESSION_TOKEN;

        if (accessKeyId && secretAccessKey) {
            return {
                accessKeyId,
                secretAccessKey,
                sessionToken
            };
        }

        return null;
    }

    /**
     * Load credentials from AWS profile using @aws-sdk/credential-provider-ini
     */
    private async getCredentialsFromProfile(profileName: string): Promise<AwsCredentials | null> {
        try {
            const credentialProvider = fromIni({ profile: profileName });
            const credentials = await credentialProvider();

            return {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey,
                sessionToken: credentials.sessionToken
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Load credentials from VS Code SecretStorage
     */
    private async getCredentialsFromSecretStorage(): Promise<AwsCredentials | null> {
        const accessKeyId = await this.secretStorage.get(SECRET_KEYS.ACCESS_KEY_ID);
        const secretAccessKey = await this.secretStorage.get(SECRET_KEYS.SECRET_ACCESS_KEY);
        const sessionToken = await this.secretStorage.get(SECRET_KEYS.SESSION_TOKEN);

        if (accessKeyId && secretAccessKey) {
            return {
                accessKeyId,
                secretAccessKey,
                sessionToken
            };
        }

        return null;
    }

    /**
     * Load credentials from IAM role (EC2/ECS metadata)
     * Uses @aws-sdk/credential-provider-node which includes EC2 and ECS providers
     */
    private async getCredentialsFromIAMRole(): Promise<AwsCredentials | null> {
        try {
            // fromNodeProviderChain includes EC2 IMDS and ECS credential providers
            const credentialProvider = fromNodeProviderChain();
            const credentials = await credentialProvider();

            return {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey,
                sessionToken: credentials.sessionToken
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * List available AWS profiles from ~/.aws/credentials
     */
    async listProfiles(): Promise<string[]> {
        const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');

        try {
            if (!fs.existsSync(credentialsPath)) {
                return [];
            }

            const content = fs.readFileSync(credentialsPath, 'utf-8');
            const profiles: string[] = [];

            // Parse profile names from [profile_name] sections
            const profileRegex = /^\[([^\]]+)\]/gm;
            let match;

            while ((match = profileRegex.exec(content)) !== null) {
                profiles.push(match[1]);
            }

            return profiles;
        } catch (error) {
            return [];
        }
    }

    /**
     * Validate credentials by calling STS GetCallerIdentity
     */
    async validateCredentials(credentials: AwsCredentials): Promise<boolean> {
        try {
            const stsClient = new STSClient({
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken
                }
            });

            await stsClient.send(new GetCallerIdentityCommand({}));
            return true;
        } catch (error: any) {
            // Log the error for debugging but don't expose credentials
            logError('Credential validation failed:', error.name || error.code);
            return false;
        }
    }

    /**
     * Store credentials in VS Code SecretStorage (encrypted)
     */
    async storeCredentials(credentials: AwsCredentials): Promise<void> {
        await this.secretStorage.store(SECRET_KEYS.ACCESS_KEY_ID, credentials.accessKeyId);
        await this.secretStorage.store(SECRET_KEYS.SECRET_ACCESS_KEY, credentials.secretAccessKey);

        if (credentials.sessionToken) {
            await this.secretStorage.store(SECRET_KEYS.SESSION_TOKEN, credentials.sessionToken);
        } else {
            // Clear session token if not provided
            await this.secretStorage.delete(SECRET_KEYS.SESSION_TOKEN);
        }
    }

    /**
     * Clear stored credentials from VS Code SecretStorage
     */
    async clearCredentials(): Promise<void> {
        await this.secretStorage.delete(SECRET_KEYS.ACCESS_KEY_ID);
        await this.secretStorage.delete(SECRET_KEYS.SECRET_ACCESS_KEY);
        await this.secretStorage.delete(SECRET_KEYS.SESSION_TOKEN);
    }

    /**
     * Prompt user to enter credentials manually
     * Shows input boxes and stores in SecretStorage
     */
    async promptForCredentials(): Promise<AwsCredentials | null> {
        const accessKeyId = await vscode.window.showInputBox({
            prompt: 'Enter AWS Access Key ID',
            password: true,
            ignoreFocusOut: true
        });

        if (!accessKeyId) {
            return null;
        }

        const secretAccessKey = await vscode.window.showInputBox({
            prompt: 'Enter AWS Secret Access Key',
            password: true,
            ignoreFocusOut: true
        });

        if (!secretAccessKey) {
            return null;
        }

        const sessionToken = await vscode.window.showInputBox({
            prompt: 'Enter AWS Session Token (optional, press Enter to skip)',
            password: true,
            ignoreFocusOut: true
        });

        const credentials: AwsCredentials = {
            accessKeyId,
            secretAccessKey,
            sessionToken: sessionToken || undefined
        };

        // Store in SecretStorage
        await this.storeCredentials(credentials);

        return credentials;
    }
}
