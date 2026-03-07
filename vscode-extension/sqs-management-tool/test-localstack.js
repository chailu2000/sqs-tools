#!/usr/bin/env node
/**
 * Quick LocalStack connectivity test
 */

(async () => {
    try {
        console.log('Testing LocalStack connection...');
        console.log('Endpoint: http://localhost:4566');

        const response = await fetch('http://localhost:4566/_localstack/health');
        const data = await response.json();

        console.log('✓ LocalStack is reachable');
        console.log('✓ SQS Status:', data.services.sqs);

        if (data.services.sqs === 'running' || data.services.sqs === 'available') {
            console.log('✓ LocalStack is ready for tests!');
            process.exit(0);
        } else {
            console.error('✗ SQS service is not running');
            process.exit(1);
        }
    } catch (error) {
        console.error('✗ Failed to connect to LocalStack:', error.message);
        console.error('\nMake sure LocalStack is running:');
        console.error('  docker compose -f tests/e2e/config/docker-compose.localstack.yml up -d');
        process.exit(1);
    }
})();
