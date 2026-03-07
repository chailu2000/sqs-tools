/**
 * LocalStack Fixture
 * 
 * Manages LocalStack container lifecycle for E2E tests.
 * Provides AWS SQS mocking without requiring real AWS credentials.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LocalStackConfig {
    services: string[];
    port: number;
    hostname: string;
    startTimeout: number;
}

export class LocalStackFixture {
    private readonly config: LocalStackConfig;
    private readonly composeFile: string;

    constructor(config: Partial<LocalStackConfig> = {}) {
        this.config = {
            services: ['sqs'],
            port: 4566,
            hostname: 'localhost',
            startTimeout: 60000,
            ...config
        };
        this.composeFile = require('path').resolve(__dirname, '../config/docker-compose.localstack.yml');
    }

    /**
     * Start LocalStack container
     * Note: Assumes LocalStack is already running on port 4566
     */
    async start(): Promise<void> {
        console.log('Verifying LocalStack is available...');
        console.log(`LocalStack endpoint: ${this.getEndpoint()}`);

        try {
            await this.waitForReady();
            console.log('LocalStack is ready');

            this.configureAwsSdk();
            console.log('AWS SDK configured for LocalStack');
        } catch (error) {
            console.error('Failed to connect to LocalStack:', error);
            throw new Error(`LocalStack connection failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Wait for LocalStack to be ready
     */
    async waitForReady(): Promise<void> {
        const startTime = Date.now();
        const endpoint = this.getEndpoint();
        let lastError: any = null;
        let attemptCount = 0;

        console.log(`Checking LocalStack health at ${endpoint}/_localstack/health`);

        while (Date.now() - startTime < this.config.startTimeout) {
            attemptCount++;
            try {
                const response = await fetch(`${endpoint}/_localstack/health`);
                const health = await response.json() as { services: Record<string, string> };

                const sqsStatus = health.services.sqs;
                console.log(`Attempt ${attemptCount}: SQS status = ${sqsStatus}`);

                if (sqsStatus === 'running' || sqsStatus === 'available') {
                    console.log(`LocalStack ready after ${attemptCount} attempts`);
                    return;
                }
            } catch (error) {
                lastError = error;
                if (attemptCount === 1) {
                    console.log(`First connection attempt failed: ${error instanceof Error ? error.message : String(error)}`);
                }
                // Not ready yet, continue waiting
            }

            await this.sleep(1000);
        }

        const elapsed = Date.now() - startTime;
        throw new Error(`LocalStack failed to start within timeout (${elapsed}ms, ${attemptCount} attempts). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }

    /**
     * Stop LocalStack container
     * Note: Does nothing since LocalStack is managed externally
     */
    async stop(): Promise<void> {
        console.log('LocalStack cleanup skipped (managed externally)');
    }

    /**
     * Check if LocalStack is ready
     */
    async isReady(): Promise<boolean> {
        try {
            const response = await fetch(`${this.getEndpoint()}/_localstack/health`);
            const health = await response.json() as { services: Record<string, string> };
            const sqsStatus = health.services.sqs;
            return sqsStatus === 'running' || sqsStatus === 'available';
        } catch {
            return false;
        }
    }

    /**
     * Get LocalStack endpoint URL
     */
    getEndpoint(): string {
        return `http://${this.config.hostname}:${this.config.port}`;
    }

    /**
     * Configure AWS SDK to use LocalStack
     */
    private configureAwsSdk(): void {
        process.env.AWS_ENDPOINT_URL = this.getEndpoint();
        process.env.AWS_ACCESS_KEY_ID = 'test';
        process.env.AWS_SECRET_ACCESS_KEY = 'test';
        process.env.AWS_REGION = 'us-east-1';
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
