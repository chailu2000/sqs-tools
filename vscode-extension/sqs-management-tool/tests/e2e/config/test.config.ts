/**
 * E2E Test Configuration
 * 
 * Central configuration for E2E tests.
 */

export interface LocalStackConfig {
    port: number;
    services: string[];
    timeout: number;
    healthCheckInterval: number;
    healthCheckRetries: number;
}

export interface VSCodeConfig {
    version: string;
    headless: boolean;
    launchArgs: string[];
    extensionDevelopmentPath: string;
    extensionTestsPath: string;
}

export interface TestExecutionConfig {
    timeout: number;
    retries: number;
    parallel: boolean;
    bail: boolean;
    slow: number;
}

export interface CoverageConfig {
    enabled: boolean;
    thresholds: {
        lines: number;
        branches: number;
        functions: number;
        statements: number;
    };
    exclusions: string[];
}

export interface ArtifactConfig {
    screenshots: boolean;
    logs: boolean;
    videos: boolean;
    outputDirectory: string;
}

export interface E2ETestConfig {
    localstack: LocalStackConfig;
    vscode: VSCodeConfig;
    testExecution: TestExecutionConfig;
    coverage: CoverageConfig;
    artifacts: ArtifactConfig;
}

/**
 * Default E2E test configuration
 */
export const defaultConfig: E2ETestConfig = {
    localstack: {
        port: 4566,
        services: ['sqs'],
        timeout: 60000,
        healthCheckInterval: 5000,
        healthCheckRetries: 12
    },
    vscode: {
        version: '1.88.0',
        headless: process.env.CI === 'true' || process.env.HEADED !== 'true',
        launchArgs: [
            '--disable-extensions',
            '--disable-gpu',
            '--no-sandbox'
        ],
        extensionDevelopmentPath: process.cwd(),
        extensionTestsPath: './out/tests/e2e/index.js'
    },
    testExecution: {
        timeout: 60000,
        retries: 0,
        parallel: false,
        bail: false,
        slow: 5000
    },
    coverage: {
        enabled: process.env.COVERAGE === 'true',
        thresholds: {
            lines: 70,
            branches: 65,
            functions: 70,
            statements: 70
        },
        exclusions: [
            '**/tests/**',
            '**/node_modules/**',
            '**/*.test.ts',
            '**/*.spec.ts',
            '**/*.d.ts'
        ]
    },
    artifacts: {
        screenshots: true,
        logs: true,
        videos: false,
        outputDirectory: 'test-results'
    }
};

/**
 * Get test configuration
 */
export function getTestConfig(): E2ETestConfig {
    // Allow environment variable overrides
    const config = { ...defaultConfig };

    // Override LocalStack port
    if (process.env.LOCALSTACK_PORT) {
        config.localstack.port = parseInt(process.env.LOCALSTACK_PORT, 10);
    }

    // Override VS Code version
    if (process.env.VSCODE_VERSION) {
        config.vscode.version = process.env.VSCODE_VERSION;
    }

    // Override headless mode
    if (process.env.HEADED === 'true') {
        config.vscode.headless = false;
    }

    // Override parallel execution
    if (process.env.PARALLEL === 'true') {
        config.testExecution.parallel = true;
    }

    // Override bail on first failure
    if (process.env.BAIL === 'true') {
        config.testExecution.bail = true;
    }

    return config;
}

/**
 * CI-specific configuration
 */
export const ciConfig: Partial<E2ETestConfig> = {
    vscode: {
        ...defaultConfig.vscode,
        headless: true,
        launchArgs: [
            ...defaultConfig.vscode.launchArgs,
            '--disable-dev-shm-usage'
        ]
    },
    testExecution: {
        ...defaultConfig.testExecution,
        bail: true,
        retries: 1
    },
    coverage: {
        ...defaultConfig.coverage,
        enabled: true
    }
};

/**
 * Get CI configuration
 */
export function getCIConfig(): E2ETestConfig {
    return {
        ...defaultConfig,
        ...ciConfig
    };
}
