import { faker } from '@faker-js/faker';

/**
 * Invalid input data generators for error testing
 * Generates invalid inputs to test validation and error handling
 */

/**
 * Generates invalid queue names
 */
export function generateInvalidQueueName(): string {
    return faker.helpers.arrayElement([
        '',                    // Empty string
        '   ',                 // Whitespace only
        'invalid@queue',       // Invalid characters
        'a'.repeat(256),       // Too long (max is 80)
        'queue with spaces',   // Spaces not allowed
        '.invalid',            // Cannot start with .
        '-invalid',            // Cannot start with -
        'invalid-',            // Cannot end with -
        'invalid--name'        // Cannot have consecutive -
    ]);
}

/**
 * Generates invalid regions
 */
export function generateInvalidRegion(): string {
    return faker.helpers.arrayElement([
        '',
        '   ',
        'invalid-region',
        'us-east-999',         // Non-existent region
        'eu-west',             // Incomplete region
        'ap-southeast-9'       // Non-existent availability zone
    ]);
}

/**
 * Generates invalid message bodies
 */
export function generateInvalidMessageBody(): string {
    return faker.helpers.arrayElement([
        '',                    // Empty body
        '   ',                 // Whitespace only
        'not-json',            // Not valid JSON
        JSON.stringify({       // Too large (max is 256KB)
            data: 'x'.repeat(300000)
        })
    ]);
}

/**
 * Generates invalid queue URLs
 */
export function generateInvalidQueueUrl(): string {
    return faker.helpers.arrayElement([
        '',
        '   ',
        'not-a-url',
        'https://invalid.url/queue',
        'https://sqs.us-east-1.amazonaws.com/',  // Missing queue name
        'ftp://sqs.us-east-1.amazonaws.com/test' // Wrong protocol
    ]);
}

/**
 * Generates invalid queue configuration
 */
export function generateInvalidQueueData(): { name?: string; region?: string; url?: string } {
    return {
        name: generateInvalidQueueName(),
        region: generateInvalidRegion(),
        url: generateInvalidQueueUrl()
    };
}
