# IAM Permissions Guide

This guide explains the IAM permissions required for the SQS Management Tool extension and provides example policies for different use cases.

## Overview

The extension is designed to work in restrictive IAM environments. You can use it with minimal permissions and add optional permissions for enhanced functionality.

## Permission Levels

### Level 1: Minimal Permissions (Core Functionality)

These permissions are **required** for basic queue management:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSManagementToolMinimal",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:ReceiveMessage",
        "sqs:SendMessage",
        "sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:*:*:*"
    }
  ]
}
```

**What you can do with minimal permissions:**
- Add queues manually by name or URL
- View queue attributes (message count, DLQ info, etc.)
- Receive and view messages
- Send new messages
- Delete messages
- Change message visibility timeout
- Redrive messages from DLQ to main queue

**What you cannot do:**
- Auto-discover queues (requires `sqs:ListQueues`)
- Purge queues (requires `sqs:PurgeQueue`)

### Level 2: Standard Permissions (Recommended)

Add these permissions for the full feature set:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSManagementToolStandard",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:ReceiveMessage",
        "sqs:SendMessage",
        "sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility",
        "sqs:ListQueues",
        "sqs:PurgeQueue"
      ],
      "Resource": "arn:aws:sqs:*:*:*"
    }
  ]
}
```

**Additional capabilities:**
- Auto-discover queues on extension activation
- Purge queues (delete all messages at once)

### Level 3: Resource-Specific Permissions

For production environments, restrict permissions to specific queues:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSManagementToolSpecificQueues",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:ReceiveMessage",
        "sqs:SendMessage",
        "sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": [
        "arn:aws:sqs:us-east-1:123456789012:my-queue",
        "arn:aws:sqs:us-east-1:123456789012:my-queue-dlq",
        "arn:aws:sqs:us-west-2:123456789012:another-queue"
      ]
    },
    {
      "Sid": "SQSManagementToolListQueues",
      "Effect": "Allow",
      "Action": "sqs:ListQueues",
      "Resource": "*"
    }
  ]
}
```

**Note**: `sqs:ListQueues` requires `Resource: "*"` as it's an account-level operation.

## Permission Details

### Required Permissions

| Permission | Purpose | Required For |
|------------|---------|--------------|
| `sqs:GetQueueUrl` | Resolve queue name to URL | Manual queue entry by name |
| `sqs:GetQueueAttributes` | Fetch queue metadata | Queue attribute display, validation |
| `sqs:ReceiveMessage` | Retrieve messages from queue | Message viewing |
| `sqs:SendMessage` | Send messages to queue | Message sending, DLQ redrive |
| `sqs:DeleteMessage` | Remove messages from queue | Message deletion, DLQ redrive |
| `sqs:ChangeMessageVisibility` | Modify message visibility timeout | Message visibility management |

### Optional Permissions

| Permission | Purpose | Required For |
|------------|---------|--------------|
| `sqs:ListQueues` | Enumerate queues in account | Auto-discovery |
| `sqs:PurgeQueue` | Delete all messages at once | Queue purge operation |

## Use Case Examples

### Use Case 1: Development Environment

Full access for developers:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSDevelopmentAccess",
      "Effect": "Allow",
      "Action": "sqs:*",
      "Resource": "arn:aws:sqs:*:*:dev-*"
    }
  ]
}
```

### Use Case 2: Production Support (Read-Only)

View messages without modification:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:ReceiveMessage",
        "sqs:ListQueues"
      ],
      "Resource": "arn:aws:sqs:*:*:prod-*"
    }
  ]
}
```

### Use Case 3: DLQ Management Only

Permissions for DLQ redrive operations:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSDLQManagement",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Resource": "arn:aws:sqs:*:*:*-dlq"
    },
    {
      "Sid": "SQSMainQueueSend",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:*:*:*",
      "Condition": {
        "StringNotLike": {
          "aws:ResourceTag/QueueType": "DLQ"
        }
      }
    }
  ]
}
```

### Use Case 4: Restrictive Environment (No ListQueues)

Minimal permissions without auto-discovery:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSRestrictiveAccess",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:ReceiveMessage",
        "sqs:SendMessage",
        "sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": [
        "arn:aws:sqs:us-east-1:123456789012:allowed-queue-1",
        "arn:aws:sqs:us-east-1:123456789012:allowed-queue-2"
      ]
    }
  ]
}
```

**Usage**: Add queues manually by name or URL. The extension will work without `sqs:ListQueues`.

## Credential Validation

The extension uses AWS STS `GetCallerIdentity` to validate credentials. This requires no additional permissions as it's available to all authenticated AWS principals.

## Testing Your Permissions

### Using AWS CLI

Test your permissions with the AWS CLI:

```bash
# Test GetQueueUrl
aws sqs get-queue-url --queue-name my-queue

# Test GetQueueAttributes
aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/my-queue --attribute-names All

# Test ReceiveMessage
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/my-queue

# Test ListQueues (optional)
aws sqs list-queues
```

### Using the Extension

1. Configure your credentials in the extension
2. Try adding a queue manually by name
3. Check the Output panel (View → Output → "SQS Management Tool") for any permission errors
4. The extension will display specific missing permissions in error messages

## Troubleshooting Permission Issues

### Error: "Access Denied"

**Symptom**: AccessDeniedException when performing operations

**Solutions**:
1. Check that your IAM user/role has the required permissions
2. Verify the resource ARN in your policy matches the queue you're accessing
3. Check for any explicit Deny statements in your policies
4. Verify your credentials are for the correct AWS account

### Error: "Queue Does Not Exist"

**Symptom**: QueueDoesNotExist error when adding queue by name

**Possible Causes**:
1. Missing `sqs:GetQueueUrl` permission
2. Queue doesn't exist in the specified region
3. Queue name is incorrect

**Solutions**:
1. Add `sqs:GetQueueUrl` permission
2. Verify queue exists: `aws sqs list-queues --region us-east-1`
3. Try adding by URL instead of name

### Error: "Cannot List Queues"

**Symptom**: Auto-discovery fails with AccessDeniedException

**Solution**: This is expected if you don't have `sqs:ListQueues` permission. Use manual queue entry instead:
1. Click "+" in SQS Queues view
2. Select "Add Queue by Name" or "Add Queue by URL"
3. Enter queue details manually

## Security Best Practices

1. **Principle of Least Privilege**: Grant only the permissions needed for your use case
2. **Resource-Specific Policies**: Use specific queue ARNs instead of wildcards in production
3. **Separate Roles**: Use different IAM roles for different environments (dev/staging/prod)
4. **Regular Audits**: Review and audit IAM permissions regularly
5. **Temporary Credentials**: Use temporary credentials (STS) when possible
6. **MFA**: Require MFA for sensitive operations in production

## Additional Resources

- [AWS SQS IAM Documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-authentication-and-access-control.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS SQS API Permissions Reference](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-api-permissions-reference.html)
