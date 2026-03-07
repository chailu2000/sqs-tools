/**
 * Retry Utilities
 * 
 * Provides retry logic with exponential backoff for flaky operations.
 */

export interface RetryConfig {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    onRetry: () => { }
};

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: Error;
    let delay = finalConfig.initialDelay;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt === finalConfig.maxRetries) {
                throw new Error(
                    `Operation failed after ${finalConfig.maxRetries + 1} attempts: ${lastError.message}`
                );
            }

            finalConfig.onRetry(attempt + 1, lastError);

            // Wait before retrying
            await sleep(delay);

            // Calculate next delay with exponential backoff
            delay = Math.min(
                delay * finalConfig.backoffMultiplier,
                finalConfig.maxDelay
            );
        }
    }

    throw lastError!;
}

/**
 * Retry with custom predicate to determine if retry should happen
 */
export async function retryWithPredicate<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error) => boolean,
    config: RetryConfig = {}
): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: Error;
    let delay = finalConfig.initialDelay;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt === finalConfig.maxRetries || !shouldRetry(lastError)) {
                throw lastError;
            }

            finalConfig.onRetry(attempt + 1, lastError);

            // Wait before retrying
            await sleep(delay);

            // Calculate next delay with exponential backoff
            delay = Math.min(
                delay * finalConfig.backoffMultiplier,
                finalConfig.maxDelay
            );
        }
    }

    throw lastError!;
}

/**
 * Retry until a condition is met
 */
export async function retryUntil<T>(
    operation: () => Promise<T>,
    condition: (result: T) => boolean,
    config: RetryConfig = {}
): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let delay = finalConfig.initialDelay;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        const result = await operation();

        if (condition(result)) {
            return result;
        }

        if (attempt === finalConfig.maxRetries) {
            throw new Error(
                `Condition not met after ${finalConfig.maxRetries + 1} attempts`
            );
        }

        // Wait before retrying
        await sleep(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(
            delay * finalConfig.backoffMultiplier,
            finalConfig.maxDelay
        );
    }

    throw new Error('Retry failed');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Common retry configurations
 */
export const RetryConfigs = {
    /**
     * Quick retry for fast operations
     */
    quick: {
        maxRetries: 3,
        initialDelay: 500,
        maxDelay: 2000,
        backoffMultiplier: 1.5
    },

    /**
     * Standard retry for most operations
     */
    standard: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
    },

    /**
     * Patient retry for slow operations
     */
    patient: {
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2
    },

    /**
     * Aggressive retry for critical operations
     */
    aggressive: {
        maxRetries: 10,
        initialDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 1.5
    }
};
