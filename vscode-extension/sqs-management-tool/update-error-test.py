#!/usr/bin/env python3
import re

# Read the file
with open('tests/e2e/specs/error-handling.test.ts', 'r') as f:
    content = f.read()

# Pattern to match the old queue creation pattern
pattern = r"const queueName = QueueFixture\.generateQueueName\('([^']+)'\);\s*const queueInfo = await queueFixture\.createStandardQueue\(queueName\);\s*createdQueues\.push\(queueInfo\.url\);"

# Replacement
replacement = r"const queueConfig = await createTestQueue('\1');\n            createdQueues.push(queueConfig);"

# Replace all occurrences
content = re.sub(pattern, replacement, content)

# Replace selectQueue calls
content = re.sub(
    r"await context\.executeCommand\('sqs-management-tool\.selectQueue', queueInfo\.url\);",
    r"await context.executeCommand('sqs-management-tool.selectQueue', queueConfig);",
    content
)

# Replace queueName references in waitFor
content = re.sub(
    r"tab\.label\.includes\(queueName\)",
    r"tab.label.includes(queueConfig.name)",
    content
)

# Replace sendMessages calls
content = re.sub(
    r"await queueFixture\.sendMessages\(queueInfo\.url,",
    r"await queueFixture.sendMessages(queueConfig.url,",
    content
)

# Write back
with open('tests/e2e/specs/error-handling.test.ts', 'w') as f:
    f.write(content)

print("Updated error-handling.test.ts")
