/**
 * SQS Client Factory with Region-Based Caching
 * 
 * Manages SQS client instances with caching per region to avoid repeated client creation.
 * Validates: Requirements 1.5, 1.6, 11.5
 * 
 * Usage Example:
 * ```typescript
 * // Create factory with default credentials
 * const factory = new SQSClientFactory({ credentials });
 * 
 * // Get client for a region (cached)
 * const usEast1Client = factory.getClient('us-east-1');
 * const service1 = new SQSService(usEast1Client);
 * 
 * // Get client for another region (creates new client)
 * const usWest2Client = factory.getClient('us-west-2');
 * const service2 = new SQSService(usWest2Client);
 * 
 * // Getting same region returns cached client
 * const cachedClient = factory.getClient('us-east-1'); // Returns usEast1Client
 * 
 * // Clean up when extension deactivates
 * factory.dispose();
 * ```
 */

import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';

/**
 * Factory for creating and caching SQS clients by region
 */
export class SQSClientFactory {
    private clientCache: Map<string, SQSClient> = new Map();
    private defaultConfig: Omit<SQSClientConfig, 'region'>;

    /**
     * Create a new SQS client factory
     * @param defaultConfig - Default configuration to apply to all clients (excluding region)
     */
    constructor(defaultConfig: Omit<SQSClientConfig, 'region'> = {}) {
        this.defaultConfig = defaultConfig;
    }

    /**
     * Get an SQS client for the specified region
     * Returns cached client if available, creates new one otherwise
     * 
     * @param region - AWS region (e.g., 'us-east-1')
     * @returns SQS client instance for the region
     * 
     * Validates: Requirements 1.5, 1.6
     */
    getClient(region: string): SQSClient {
        // Check if client already exists in cache
        const cachedClient = this.clientCache.get(region);

        if (cachedClient) {
            return cachedClient;
        }

        // Create new client for this region
        const newClient = new SQSClient({
            ...this.defaultConfig,
            region
        });

        // Cache the client
        this.clientCache.set(region, newClient);

        return newClient;
    }

    /**
     * Clear all cached clients and dispose of them
     * Should be called when the extension deactivates
     * 
     * Validates: Requirements 12.5
     */
    dispose(): void {
        for (const client of this.clientCache.values()) {
            client.destroy();
        }
        this.clientCache.clear();
    }

    /**
     * Get the number of cached clients
     * Useful for testing and monitoring
     */
    getCacheSize(): number {
        return this.clientCache.size;
    }

    /**
     * Check if a client exists in cache for a specific region
     * Useful for testing
     */
    hasClient(region: string): boolean {
        return this.clientCache.has(region);
    }

    /**
     * Clear a specific client from cache
     * Useful for testing or when credentials change
     */
    clearClient(region: string): void {
        const client = this.clientCache.get(region);
        if (client) {
            client.destroy();
            this.clientCache.delete(region);
        }
    }

    /**
     * Update the default configuration
     * Note: This does not affect already cached clients
     * Clear cache first if you need to update existing clients
     */
    updateDefaultConfig(config: Omit<SQSClientConfig, 'region'>): void {
        this.defaultConfig = config;
    }

    /**
     * Update credentials and clear all cached clients
     * This forces recreation of all clients with new credentials
     * 
     * @param credentials - New AWS credentials to use
     */
    updateCredentials(credentials: { accessKeyId: string; secretAccessKey: string; sessionToken?: string }): void {
        // Dispose of all existing clients
        this.dispose();

        // Update default config with new credentials
        this.defaultConfig = {
            ...this.defaultConfig,
            credentials
        };
    }
}
