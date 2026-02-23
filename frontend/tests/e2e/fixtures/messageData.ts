import { faker } from '@faker-js/faker';

/**
 * Message test data generators
 * Generates random but realistic message payloads for E2E tests
 */

/**
 * Generates a valid message body as JSON string
 */
export function generateMessageBody(): string {
    return JSON.stringify({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['order', 'payment', 'notification', 'user_action']),
        data: {
            message: faker.lorem.sentence(),
            value: faker.number.int({ min: 1, max: 1000 }),
            timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    });
}

/**
 * Generates a complete valid message configuration
 */
export function generateValidMessageData(): { body: string } {
    return {
        body: generateMessageBody()
    };
}

/**
 * Generates a message with custom attributes
 */
export function generateMessageWithAttributes(attributes: Record<string, string> = {}): { body: string; attributes?: Record<string, string> } {
    return {
        body: generateMessageBody(),
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined
    };
}
