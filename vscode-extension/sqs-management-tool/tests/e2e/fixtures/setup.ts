/**
 * Global Setup and Teardown
 * 
 * Manages test environment setup and cleanup.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LocalStackFixture } from './localstack';
import { QueueFixture, QueueConfig } from './test-data';
import { ExtensionTestContext, createExtensionContext } from './extension-context';
import { getExtensionContext as getExtensionContextUtil, findExtension } from './extension-finder';

export interface TestSetup {
    localstack: LocalStackFixture;
    queueFixture: QueueFixture;
    testContext: ExtensionTestContext;
    queues: Map<string, QueueConfig>;
    workspacePath: string;
    extensionApi: any; // Extension API returned from activate()
}

let globalSetupInstance: TestSetup | null = null;

/**
 * Get the extension context from the activated extension
 */
function getExtensionContext(): vscode.ExtensionContext {
    const extension = findExtension();

    if (!extension || !extension.isActive) {
        const allExtensionIds = vscode.extensions.all
            .filter(ext => ext.id.includes('sqs'))
            .map(ext => ext.id);
        console.log('Available SQS extensions:', allExtensionIds);
        throw new Error('Extension not activated');
    }

    const api = extension.exports;
    if (!api || !api.context) {
        throw new Error('Extension context not available in API');
    }

    return api.context;
}

/**
 * Configure AWS credentials in VS Code SecretStorage
 */
async function configureAwsCredentials(): Promise<void> {
    const credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    };

    try {
        const context = getExtensionContext();
        await context.secrets.store('aws-credentials', JSON.stringify(credentials));
        console.log('AWS credentials configured in SecretStorage');
    } catch (error) {
        console.warn('Could not configure credentials:', error);
    }
}

/**
 * Add queue to extension storage
 */
async function addQueueToStorage(queueConfig: QueueConfig): Promise<void> {
    try {
        const context = getExtensionContext();
        // Use 'queues' key to match QueueStorage service
        const queues = context.globalState.get<QueueConfig[]>('queues', []);

        queues.push(queueConfig);
        await context.globalState.update('queues', queues);
        console.log(`Added queue ${queueConfig.name} to storage`);
    } catch (error) {
        console.warn(`Could not add queue to storage:`, error);
        throw error;
    }
}

/**
 * Global setup - runs once before all tests
 */
export async function globalSetup(): Promise<TestSetup> {
    // Guard against multiple calls
    if (globalSetupInstance) {
        console.log('Global setup already initialized, returning existing instance');
        return globalSetupInstance;
    }

    console.log('Running global setup...');

    try {
        // Create test workspace
        const workspacePath = path.resolve(__dirname, '../../../.test-workspace');
        if (!fs.existsSync(workspacePath)) {
            fs.mkdirSync(workspacePath, { recursive: true });
        }

        // Start LocalStack
        const localstack = new LocalStackFixture();
        await localstack.start();

        // Create queue fixture
        const queueFixture = new QueueFixture(localstack);

        // Create extension test context (this will activate the extension)
        const testContext = await createExtensionContext();

        // Configure AWS credentials AFTER extension activation
        await configureAwsCredentials();

        // Get extension API
        const extension = findExtension();
        const extensionApi = extension?.exports || null;

        const setup: TestSetup = {
            localstack,
            queueFixture,
            testContext,
            queues: new Map(),
            workspacePath,
            extensionApi
        };

        globalSetupInstance = setup;
        console.log('Global setup completed');
        return setup;
    } catch (error) {
        console.error('Global setup failed:', error);
        throw error;
    }
}

/**
 * Global teardown - runs once after all tests
 */
export async function globalTeardown(setup: TestSetup): Promise<void> {
    console.log('Running global teardown...');

    try {
        // Clear storage
        try {
            const context = getExtensionContext();
            // Use 'queues' key to match QueueStorage service
            await context.globalState.update('queues', undefined);
            await context.secrets.delete('aws-credentials');
        } catch (error) {
            console.warn('Could not clear storage:', error);
        }

        // Dispose test context
        await setup.testContext.dispose();

        // Clean up all queues
        for (const [_, queueConfig] of setup.queues) {
            try {
                await setup.queueFixture.deleteQueue(queueConfig.url);
                if (queueConfig.dlqUrl) {
                    await setup.queueFixture.deleteQueue(queueConfig.dlqUrl);
                }
            } catch (error) {
                console.warn(`Failed to delete queue ${queueConfig.name}:`, error);
            }
        }

        // Stop LocalStack
        await setup.localstack.stop();

        // Clean up workspace
        if (fs.existsSync(setup.workspacePath)) {
            fs.rmSync(setup.workspacePath, { recursive: true, force: true });
        }

        globalSetupInstance = null;
        console.log('Global teardown completed');
    } catch (error) {
        console.error('Global teardown failed:', error);
        // Don't throw - cleanup should be best-effort
    }
}

/**
 * Get global setup instance
 */
export function getGlobalSetup(): TestSetup {
    if (!globalSetupInstance) {
        throw new Error('Global setup not initialized');
    }
    return globalSetupInstance;
}

/**
 * Test-level setup helper
 * Creates queue in LocalStack AND adds it to extension storage
 */
export async function createTestQueue(
    name?: string,
    withDLQ: boolean = false
): Promise<QueueConfig> {
    const setup = getGlobalSetup();
    const queueName = name || QueueFixture.generateQueueName();

    let queueConfig: QueueConfig;

    if (withDLQ) {
        const { main, dlq } = await setup.queueFixture.createQueueWithDLQ(queueName);
        queueConfig = main;
        setup.queues.set(queueName, main);
        setup.queues.set(`${queueName}-dlq`, dlq);

        // Add DLQ to storage first
        await addQueueToStorage(dlq);
    } else {
        queueConfig = await setup.queueFixture.createStandardQueue(queueName);
        setup.queues.set(queueName, queueConfig);
    }

    // Add main queue to storage
    await addQueueToStorage(queueConfig);

    // Refresh tree view if extension API is available
    if (setup.extensionApi?.queueTreeDataProvider) {
        setup.extensionApi.queueTreeDataProvider.refresh();
    }

    return queueConfig;
}

/**
 * Test-level cleanup helper
 */
export async function cleanupTestQueue(queueConfig: QueueConfig): Promise<void> {
    const setup = getGlobalSetup();

    try {
        // Remove from storage
        try {
            const context = getExtensionContext();
            // Use 'queues' key to match QueueStorage service
            const queues = context.globalState.get<QueueConfig[]>('queues', []);
            const filtered = queues.filter((q: QueueConfig) => q.id !== queueConfig.id);
            await context.globalState.update('queues', filtered);
        } catch (error) {
            console.warn('Could not remove queue from storage:', error);
        }

        // Delete from LocalStack
        await setup.queueFixture.deleteQueue(queueConfig.url);
        if (queueConfig.dlqUrl) {
            await setup.queueFixture.deleteQueue(queueConfig.dlqUrl);
        }
        setup.queues.delete(queueConfig.name);

        // Refresh tree view
        if (setup.extensionApi?.queueTreeDataProvider) {
            setup.extensionApi.queueTreeDataProvider.refresh();
        }
    } catch (error) {
        console.warn(`Failed to cleanup queue ${queueConfig.name}:`, error);
    }
}
