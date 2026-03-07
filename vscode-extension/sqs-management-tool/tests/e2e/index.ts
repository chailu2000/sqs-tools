/**
 * Test Suite Entry Point
 * 
 * This file is the entry point for the E2E test suite.
 * It configures Mocha and sets up global test hooks.
 */

import * as path from 'path';
import * as fs from 'fs';
import Mocha from 'mocha';
import { glob } from 'glob';
import { globalSetup, globalTeardown, TestSetup } from './fixtures/setup';

let testSetup: TestSetup | null = null;

export async function run(): Promise<void> {
    // Create test results directory
    const testResultsDir = path.resolve(__dirname, '../../../test-results');
    if (!fs.existsSync(testResultsDir)) {
        fs.mkdirSync(testResultsDir, { recursive: true });
    }

    // Run global setup BEFORE creating mocha instance
    console.log('Running global setup...');
    try {
        testSetup = await globalSetup();
        console.log('Global setup completed successfully');
    } catch (error) {
        console.error('Global setup failed:', error);
        throw error;
    }

    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 60000, // 60 seconds for extension activation and operations
        reporter: process.env.CI ? 'spec' : 'spec', // Use spec reporter for both
        slow: 5000, // Mark tests as slow if they take more than 5 seconds
    });

    const testsRoot = path.resolve(__dirname, '.');

    // Global after each hook to capture failure details
    mocha.suite.afterEach(function () {
        if (this.currentTest?.state === 'failed') {
            const testName = this.currentTest.fullTitle();
            const error = this.currentTest.err;

            console.error(`\n❌ Test Failed: ${testName}`);
            if (error) {
                console.error(`Error: ${error.message}`);
                if (error.stack) {
                    console.error(`Stack: ${error.stack}`);
                }
            }

            // Save failure details to file
            const failureFile = path.join(testResultsDir, `failure-${Date.now()}.txt`);
            const failureDetails = `Test: ${testName}\nTime: ${new Date().toISOString()}\nError: ${error?.message}\n\nStack:\n${error?.stack}`;
            fs.writeFileSync(failureFile, failureDetails);
            console.log(`Failure details saved to: ${failureFile}`);
        }
    });

    return new Promise((resolve, reject) => {
        // Find all test files
        glob('**/**.test.js', { cwd: testsRoot })
            .then((files) => {
                // Add files to the test suite
                files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

                try {
                    // Run the mocha test
                    mocha.run(async (failures) => {
                        // Run global teardown AFTER all tests complete
                        if (testSetup) {
                            console.log('Running global teardown...');
                            try {
                                await globalTeardown(testSetup);
                                console.log('Global teardown completed');
                            } catch (error) {
                                console.error('Global teardown failed:', error);
                            }
                        }

                        if (failures > 0) {
                            reject(new Error(`${failures} tests failed.`));
                        } else {
                            resolve();
                        }
                    });
                } catch (err) {
                    console.error(err);
                    reject(err);
                }
            })
            .catch((err) => {
                console.error('Error finding test files:', err);
                reject(err);
            });
    });
}
