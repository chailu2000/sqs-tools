import { faker } from '@faker-js/faker';

/**
 * Queue test data generators
 * Generates random but realistic queue configurations for E2E tests
 */

/**
 * Generates a valid queue name
 * Queue names can be up to 80 characters, alphanumeric, hyphens, and underscores
 */
export function generateQueueName(): string {
    return `test-queue-${faker.string.alphanumeric(8).toLowerCase()}`;
}

/**
 * Generates a valid AWS region
 */
export function generateRegion(): string {
    return faker.helpers.arrayElement([
        'us-east-1',
        'us-west-2',
        'eu-west-1',
        'ap-southeast-1',
        'ap-northeast-1',
        'sa-east-1'
    ]);
}

/**
 * Generates a complete valid queue configuration
 */
export function generateValidQueueData(): { name: string; region: string } {
    return {
        name: generateQueueName(),
        region: generateRegion()
    };
}

/**
 * Generates a valid queue URL
 */
export function generateQueueUrl(region: string = generateRegion()): string {
    const queueName = generateQueueName();
    return `https://sqs.${region}.amazonaws.com/123456789012/${queueName}`;
}
