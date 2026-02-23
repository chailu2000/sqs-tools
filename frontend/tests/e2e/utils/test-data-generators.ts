import { faker } from '@faker-js/faker';

export function generateQueueName(): string {
    return `test-queue-${faker.string.uuid()}`;
}

export function generateMessageBody(): string {
    return faker.lorem.sentence();
}

export function generateRegion(): string {
    return faker.helpers.arrayElement(['us-east-1', 'us-west-2', 'eu-west-1']);
}

export function generateInvalidInput(): string {
    return faker.lorem.word({ length: { min: 257, max: 300 } }); // Example of invalid input for a field with max 256 chars
}