/**
 * Logger Utilities
 * 
 * Provides utilities for capturing logs on test failure.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LogOptions {
    outputDir?: string;
    filename?: string;
    timestamp?: boolean;
}

const DEFAULT_OUTPUT_DIR = 'test-results/logs';

/**
 * Log entry interface
 */
export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
}

/**
 * Test logger class
 */
export class TestLogger {
    private logs: LogEntry[] = [];

    /**
     * Log info message
     */
    info(message: string, data?: any): void {
        this.log('info', message, data);
    }

    /**
     * Log warning message
     */
    warn(message: string, data?: any): void {
        this.log('warn', message, data);
    }

    /**
     * Log error message
     */
    error(message: string, data?: any): void {
        this.log('error', message, data);
    }

    /**
     * Log debug message
     */
    debug(message: string, data?: any): void {
        this.log('debug', message, data);
    }

    /**
     * Add log entry
     */
    private log(level: LogEntry['level'], message: string, data?: any): void {
        this.logs.push({
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        });
    }

    /**
     * Get all logs
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Clear logs
     */
    clear(): void {
        this.logs = [];
    }

    /**
     * Save logs to file
     */
    async saveLogs(filepath: string): Promise<void> {
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const content = this.logs.map(entry => {
            const dataStr = entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : '';
            return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${dataStr}`;
        }).join('\n\n');

        fs.writeFileSync(filepath, content, 'utf-8');
    }
}

/**
 * Global test logger instance
 */
export const testLogger = new TestLogger();

/**
 * Capture logs for a test
 */
export async function captureLogs(
    testName: string,
    logs: LogEntry[],
    options: LogOptions = {}
): Promise<string> {
    const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
    const timestamp = options.timestamp !== false;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate filename
    const sanitizedTestName = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestampStr = timestamp ? `-${Date.now()}` : '';
    const filename = options.filename || `${sanitizedTestName}${timestampStr}.log`;
    const filepath = path.join(outputDir, filename);

    // Write logs to file
    const content = logs.map(entry => {
        const dataStr = entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : '';
        return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${dataStr}`;
    }).join('\n\n');

    fs.writeFileSync(filepath, content, 'utf-8');
    return filepath;
}

/**
 * Capture logs on test failure
 * 
 * This should be called from an afterEach hook in test files.
 */
export async function captureLogsOnFailure(
    testContext: Mocha.Context,
    logger: TestLogger = testLogger
): Promise<string | null> {
    if (testContext.currentTest?.state === 'failed') {
        const testName = testContext.currentTest.fullTitle();
        const logs = logger.getLogs();

        if (logs.length > 0) {
            return await captureLogs(testName, logs);
        }
    }
    return null;
}

/**
 * Clean up old log files
 */
export function cleanupLogs(
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
