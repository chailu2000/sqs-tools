/**
 * Screenshot Utilities
 * 
 * Provides utilities for capturing screenshots on test failure.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
    outputDir?: string;
    filename?: string;
    timestamp?: boolean;
}

const DEFAULT_OUTPUT_DIR = 'test-results/screenshots';

/**
 * Capture a screenshot
 * 
 * Note: VS Code Extension Host doesn't provide direct screenshot API.
 * This is a placeholder for future implementation or integration with
 * external screenshot tools.
 */
export async function captureScreenshot(
    testName: string,
    options: ScreenshotOptions = {}
): Promise<string | null> {
    const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
    const timestamp = options.timestamp !== false;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate filename
    const sanitizedTestName = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestampStr = timestamp ? `-${Date.now()}` : '';
    const filename = options.filename || `${sanitizedTestName}${timestampStr}.png`;
    const filepath = path.join(outputDir, filename);

    // TODO: Implement actual screenshot capture
    // This would require integration with VS Code's screenshot API or external tools
    // For now, we'll create a placeholder file
    try {
        fs.writeFileSync(filepath, `Screenshot placeholder for: ${testName}\nTimestamp: ${new Date().toISOString()}`);
        return filepath;
    } catch (error) {
        console.error('Failed to capture screenshot:', error);
        return null;
    }
}

/**
 * Capture screenshot on test failure
 * 
 * This should be called from an afterEach hook in test files.
 */
export async function captureOnFailure(
    testContext: Mocha.Context
): Promise<string | null> {
    if (testContext.currentTest?.state === 'failed') {
        const testName = testContext.currentTest.fullTitle();
        return await captureScreenshot(testName);
    }
    return null;
}

/**
 * Clean up old screenshots
 */
export function cleanupScreenshots(
    outputDir: string = DEFAULT_OUTPUT_DIR,
    maxAgeMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): void {
    if (!fs.existsSync(outputDir)) {
        return;
    }

    const now = Date.now();
    const files = fs.readdirSync(outputDir);

    for (const file of files) {
        const filepath = path.join(outputDir, file);
        const stats = fs.statSync(filepath);

        if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filepath);
        }
    }
}
