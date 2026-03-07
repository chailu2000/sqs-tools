#!/usr/bin/env python3
import re

# Read the file
with open('tests/e2e/specs/dlq-operations.test.ts', 'r') as f:
    content = f.read()

# Pattern to match DLQ queue creation
pattern = r"const queueName = QueueFixture\.generateQueueName\('([^']+)'\);\s*const \{ main, dlq \} = await queueFixture\.createQueueWithDLQ\(queueName\);\s*createdQueues\.push\(main\.url, dlq\.url\);"

# Replacement - use createTestQueue with DLQ flag
replacement = r"const queueConfig = await createTestQueue('\1', true);\n            createdQueues.push(queueConfig);"

# Replace all occurrences
content = re.sub(pattern, replacement, content)

# Replace main.url references with queueConfig
content = re.sub(
    r"await context\.executeCommand\('sqs-management-tool\.selectQueue', main\.url\);",
    r"await context.executeCommand('sqs-management-tool.selectQueue', queueConfig);",
    content
)

# Replace queueName references in waitFor
content = re.sub(
    r"tab\.label\.includes\(queueName\)",
    r"tab.label.includes(queueConfig.name)",
    content
)

# Replace sendMessages calls with main.url
content = re.sub(
    r"await queueFixture\.sendMessages\(main\.url,",
    r"await queueFixture.sendMessages(queueConfig.url,",
    content
)

# Replace sendMessages calls with dlq.url
content = re.sub(
    r"await queueFixture\.sendMessages\(dlq\.url,",
    r"await queueFixture.sendMessages(queueConfig.dlqUrl!,",
    content
)

# Write back
with open('tests/e2e/specs/dlq-operations.test.ts', 'w') as f:
    f.write(content)

print("Updated dlq-operations.test.ts")
