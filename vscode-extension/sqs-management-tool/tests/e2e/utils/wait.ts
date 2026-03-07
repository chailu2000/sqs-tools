/**
 * Wait Utilities
 * 
 * Provides utilities for waiting on conditions in E2E tests.
 */

export interface WaitOptions {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    predicate: () => boolean | Promise<boolean>,
    options: WaitOptions = {}
): Promise<void> {
    const {
        timeout = 5000,
        interval = 100,
        errorMessage = 'Timeout waiting for condition'
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await predicate()) {
            return;
        }
        await sleep(interval);
    }

    throw new Error(errorMessage);
}

/**
 * Wait for an element to exist in webview
 */
export async function waitForElement(
    postMessage: (msg: any) => Promise<void>,
    waitForMessage: (command: string, timeout?: number) => Promise<any>,
    selector: string,
    options: WaitOptions = {}
): Promise<void> {
    await waitFor(async () => {
        await postMessage({
            command: 'elementExists',
            selector
        });
        const result = await waitForMessage('elementExistsResult', 1000);
        return result.exists;
    }, options);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
    constructor(message: string, public readonly timeoutMs: number) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage?: string
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            const message = errorMessage || `Operation timed out after ${timeoutMs}ms`;
            reject(new TimeoutError(message, timeoutMs));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
}

/**
 * Wrap an async function with timeout
 */
export function withTimeoutWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    timeoutMs: number,
    errorMessage?: string
): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
        return withTimeout(fn(...args), timeoutMs, errorMessage);
    };
}

/**
 * Create timeout wrappers for common operations
 */
export const TimeoutWrappers = {
    /**
     * Wrap extension activation with timeout
     */
    extensionActivation: <T>(promise: Promise<T>) =>
        withTimeout(promise, 30000, 'Extension activation timed out after 30 seconds'),

    /**
     * Wrap webview operation with timeout
     */
    webviewOperation: <T>(promise: Promise<T>) =>
        withTimeout(promise, 10000, 'Webview operation timed out after 10 seconds'),

    /**
     * Wrap AWS operation with timeout
     */
    awsOperation: <T>(promise: Promise<T>) =>
        withTimeout(promise, 15000, 'AWS operation timed out after 15 seconds'),

    /**
     * Wrap command execution with timeout
     */
    commandExecution: <T>(promise: Promise<T>) =>
        withTimeout(promise, 5000, 'Command execution timed out after 5 seconds'),

    /**
     * Wrap polling operation with timeout
     */
    pollingOperation: <T>(promise: Promise<T>) =>
        withTimeout(promise, 125000, 'Polling operation timed out after 125 seconds')
};
