/**
 * Credential Provider Interface and Type Definitions
 * 
 * This file defines the interfaces for AWS credential management with support
 * for multiple credential sources (environment variables, AWS profiles, 
 * VS Code SecretStorage, IAM roles).
 */

/**
 * AWS Credentials structure
 */
export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}

/**
 * AWS Profile information
 */
export interface AwsProfile {
    name: string;
    region?: string;
}

/**
 * Credential Provider Interface
 * 
 * Manages AWS credential loading from multiple sources with priority chain:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. AWS profile from ~/.aws/credentials
 * 3. VS Code SecretStorage
 * 4. IAM role (EC2/ECS metadata)
 * 5. Manual user input (stored in SecretStorage)
 */
export interface ICredentialProvider {
    /**
     * Get AWS credentials from the priority chain
     * @param profile Optional AWS profile name to use
     * @returns AWS credentials
     */
    getCredentials(profile?: string): Promise<AwsCredentials>;

    /**
     * List available AWS profiles from ~/.aws/credentials
     * @returns Array of profile names
     */
    listProfiles(): Promise<string[]>;

    /**
     * Validate that credentials are valid by calling STS GetCallerIdentity
     * @param credentials Credentials to validate
     * @returns True if credentials are valid, false otherwise
     */
    validateCredentials(credentials: AwsCredentials): Promise<boolean>;

    /**
     * Store credentials in VS Code SecretStorage (encrypted)
     * @param credentials Credentials to store
     */
    storeCredentials(credentials: AwsCredentials): Promise<void>;

    /**
     * Clear stored credentials from VS Code SecretStorage
     */
    clearCredentials(): Promise<void>;
}
