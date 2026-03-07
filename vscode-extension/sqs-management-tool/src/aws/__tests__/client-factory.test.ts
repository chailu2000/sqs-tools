/**
 * Unit tests for SQS Client Factory
 * 
 * Tests client caching behavior and region management
 */

import { SQSClientFactory } from '../client-factory';
import { SQSClient } from '@aws-sdk/client-sqs';

describe('SQSClientFactory', () => {
    let factory: SQSClientFactory;

    beforeEach(() => {
        factory = new SQSClientFactory();
    });

    afterEach(() => {
        factory.dispose();
    });

    describe('getClient', () => {
        it('should create a new client for a region', () => {
            const client = factory.getClient('us-east-1');

            expect(client).toBeInstanceOf(SQSClient);
            expect(factory.hasClient('us-east-1')).toBe(true);
        });

        it('should return the same cached client for the same region', () => {
            const client1 = factory.getClient('us-east-1');
            const client2 = factory.getClient('us-east-1');

            expect(client1).toBe(client2);
            expect(factory.getCacheSize()).toBe(1);
        });

        it('should create different clients for different regions', () => {
            const clientEast = factory.getClient('us-east-1');
            const clientWest = factory.getClient('us-west-2');

            expect(clientEast).not.toBe(clientWest);
            expect(factory.getCacheSize()).toBe(2);
            expect(factory.hasClient('us-east-1')).toBe(true);
            expect(factory.hasClient('us-west-2')).toBe(true);
        });

        it('should cache clients for multiple regions', () => {
            const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
            const clients = regions.map(region => factory.getClient(region));

            expect(factory.getCacheSize()).toBe(4);

            // Verify all clients are cached
            regions.forEach(region => {
                expect(factory.hasClient(region)).toBe(true);
            });

            // Verify getting clients again returns cached instances
            regions.forEach((region, index) => {
                expect(factory.getClient(region)).toBe(clients[index]);
            });
        });
    });

    describe('dispose', () => {
        it('should clear all cached clients', () => {
            factory.getClient('us-east-1');
            factory.getClient('us-west-2');

            expect(factory.getCacheSize()).toBe(2);

            factory.dispose();

            expect(factory.getCacheSize()).toBe(0);
            expect(factory.hasClient('us-east-1')).toBe(false);
            expect(factory.hasClient('us-west-2')).toBe(false);
        });

        it('should allow creating new clients after disposal', () => {
            const client1 = factory.getClient('us-east-1');
            factory.dispose();

            const client2 = factory.getClient('us-east-1');

            expect(client2).toBeInstanceOf(SQSClient);
            expect(client2).not.toBe(client1);
            expect(factory.getCacheSize()).toBe(1);
        });
    });

    describe('clearClient', () => {
        it('should remove a specific client from cache', () => {
            factory.getClient('us-east-1');
            factory.getClient('us-west-2');

            expect(factory.getCacheSize()).toBe(2);

            factory.clearClient('us-east-1');

            expect(factory.getCacheSize()).toBe(1);
            expect(factory.hasClient('us-east-1')).toBe(false);
            expect(factory.hasClient('us-west-2')).toBe(true);
        });

        it('should handle clearing non-existent client gracefully', () => {
            factory.clearClient('non-existent-region');

            expect(factory.getCacheSize()).toBe(0);
        });
    });

    describe('hasClient', () => {
        it('should return true for cached regions', () => {
            factory.getClient('us-east-1');

            expect(factory.hasClient('us-east-1')).toBe(true);
        });

        it('should return false for non-cached regions', () => {
            expect(factory.hasClient('us-east-1')).toBe(false);
        });
    });

    describe('getCacheSize', () => {
        it('should return 0 for empty cache', () => {
            expect(factory.getCacheSize()).toBe(0);
        });

        it('should return correct count of cached clients', () => {
            factory.getClient('us-east-1');
            expect(factory.getCacheSize()).toBe(1);

            factory.getClient('us-west-2');
            expect(factory.getCacheSize()).toBe(2);

            factory.getClient('us-east-1'); // Should not increase count
            expect(factory.getCacheSize()).toBe(2);
        });
    });

    describe('updateDefaultConfig', () => {
        it('should allow updating default configuration', () => {
            const newConfig = {
                maxAttempts: 5,
                requestHandler: undefined
            };

            factory.updateDefaultConfig(newConfig);

            // Create a new client to verify config is applied
            const client = factory.getClient('us-east-1');
            expect(client).toBeInstanceOf(SQSClient);
        });

        it('should not affect already cached clients', () => {
            const client1 = factory.getClient('us-east-1');

            factory.updateDefaultConfig({ maxAttempts: 5 });

            const client2 = factory.getClient('us-east-1');

            // Should return the same cached client
            expect(client2).toBe(client1);
        });
    });

    describe('constructor with default config', () => {
        it('should accept default configuration', () => {
            const config = {
                maxAttempts: 3
            };

            const factoryWithConfig = new SQSClientFactory(config);
            const client = factoryWithConfig.getClient('us-east-1');

            expect(client).toBeInstanceOf(SQSClient);

            factoryWithConfig.dispose();
        });
    });
});
