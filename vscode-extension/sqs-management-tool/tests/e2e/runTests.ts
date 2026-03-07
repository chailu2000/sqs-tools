/**
 * Test Runner for VS Code Extension E2E Tests
 * 
 * This file configures and launches VS Code with the extension loaded,
 * then runs the E2E test suite using @vscode/test-electron.
 */

import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // __dirname is out/tests/e2e, so we need to go up to the extension root
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

        // The path to the extension test script
        const extensionTestsPath = path.resolve(__dirname, './index');

        // Create a temporary workspace for tests
        const testWorkspace = path.resolve(extensionDevelopmentPath, '.test-workspace');

        // Determine if running in headed or headless mode
        const isHeaded = process.env.HEADED === 'true';
        const isCI = process.env.CI === 'true';

        // Configure launch arguments
        const launchArgs = [
            testWorkspace,
            // Note: Don't use --disable-extensions as it disables the extension under test
            // The extension under development is loaded via extensionDevelopmentPath
            '--disable-gpu',        // Disable GPU for headless mode
        ];

        // Add no-sandbox for CI environments
        if (isCI) {
            launchArgs.push('--no-sandbox');
        }

        // Configure environment variables for LocalStack
        const extensionTestsEnv = {
            AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'test',
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'test',
            AWS_REGION: process.env.AWS_REGION || 'us-east-1',
            VSCODE_TEST_MODE: 'true',  // Disable auto-discovery in test mode
        };

        console.log('Starting E2E tests...');
        console.log('Extension path:', extensionDevelopmentPath);
        console.log('Test path:', extensionTestsPath);
        console.log('Workspace:', testWorkspace);
        console.log('Mode:', isHeaded ? 'headed' : 'headless');
        console.log('Environment:', extensionTestsEnv);

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs,
            extensionTestsEnv,
        });

        console.log('E2E tests completed successfully');
    } catch (err) {
        console.error('Failed to run E2E tests:', err);
        process.exit(1);
    }
}

main();
