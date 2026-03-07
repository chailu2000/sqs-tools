# SQS Management Tool for VS Code

A standalone VS Code extension for managing AWS SQS queues directly from your IDE. No backend required - communicates directly with AWS SQS using the AWS SDK.

## Features

- **Direct AWS Integration**: Connects directly to AWS SQS without requiring a separate backend service
- **Manual Queue Entry**: Add queues by name or URL - perfect for restrictive IAM environments without ListQueues permission
- **Queue Discovery**: Automatically discover queues when ListQueues permission is available
- **Message Management**: View, send, delete, and change visibility of messages
- **DLQ Redrive**: Move messages from Dead Letter Queues back to main queues with progress tracking
- **Multi-Region Support**: Manage queues across different AWS regions
- **Secure Credential Storage**: Supports multiple credential sources with secure VS Code SecretStorage
- **Queue Organization**: Group queues by region with visual indicators for standard, FIFO, and DLQ queues

## Installation

1. Install the extension from the VS Code Marketplace (coming soon)
2. Configure your AWS credentials (see Configuration section below)
3. Start managing your SQS queues!

## Configuration

### AWS Credentials

The extension supports multiple credential sources in the following priority order:

1. **Environment Variables** (highest priority)
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN` (optional)

2. **AWS Profile** (from `~/.aws/credentials`)
   - Use the "Select AWS Profile" command to choose a profile
   - The active profile is displayed in the status bar

3. **VS Code SecretStorage** (encrypted storage)
   - Enter credentials manually when prompted
   - Stored securely in VS Code's encrypted storage

4. **IAM Roles** (lowest priority)
   - Automatically detected on EC2/ECS instances

### Selecting an AWS Profile

1. Click the AWS profile indicator in the status bar, or
2. Open Command Palette (Cmd/Ctrl+Shift+P) and run "Select AWS Profile"
3. Choose from available profiles in your `~/.aws/credentials` file

## Usage

### Adding Queues

#### Option 1: Auto-Discovery (requires `sqs:ListQueues` permission)

On first activation, the extension will attempt to discover queues automatically. If successful, you'll be prompted to import them.

To manually trigger discovery:
1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Run "SQS: Discover Queues"

#### Option 2: Manual Entry (works without `sqs:ListQueues`)

**Add by Queue Name:**
1. Click the "+" icon in the SQS Queues view
2. Select "Add Queue by Name"
3. Enter the queue name (e.g., `my-queue` or `my-queue.fifo`)
4. The extension will resolve the queue URL automatically

**Add by Queue URL:**
1. Click the "+" icon in the SQS Queues view
2. Select "Add Queue by URL"
3. Enter the full queue URL (e.g., `https://sqs.us-east-1.amazonaws.com/123456789012/my-queue`)

### Managing Messages

1. Click on a queue in the SQS Queues view to open the message viewer
2. Use the toolbar buttons to:
   - Receive messages from the queue
   - Send new messages
   - Delete selected messages
   - Change message visibility timeout
   - Purge the queue (delete all messages)

### Redriving Messages from DLQ

1. Select a Dead Letter Queue in the SQS Queues view
2. Click "Redrive Messages"
3. Choose to redrive all messages or a specific number
4. Monitor progress with the cancellable progress indicator

### Queue Operations

Right-click on a queue in the tree view to:
- Refresh queue attributes
- Copy queue URL to clipboard
- Remove queue from the list

## Minimal IAM Permissions

The extension works with minimal IAM permissions. Here's what you need:

### Required Permissions (core functionality)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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

### Optional Permissions (enhanced functionality)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ListQueues",
        "sqs:PurgeQueue"
      ],
      "Resource": "arn:aws:sqs:*:*:*"
    }
  ]
}
```

**Note**: Without `sqs:ListQueues`, you can still use the extension by manually adding queues by name or URL.

## Troubleshooting

### "Access Denied" Errors

If you see AccessDeniedException errors:
1. Check that your IAM user/role has the required permissions (see above)
2. Verify your credentials are correctly configured
3. Check the Output panel (View → Output → "SQS Management Tool") for detailed error messages

### "Queue Not Found" Errors

If you get QueueDoesNotExist errors:
1. Verify the queue name is correct
2. Ensure the queue exists in the selected AWS region
3. Check that you have `sqs:GetQueueUrl` permission

### Network Errors

If you experience connection timeouts or DNS errors:
1. Check your internet connection
2. Verify firewall settings allow AWS SQS access
3. Check if you need to configure a proxy
4. Verify AWS service status at https://status.aws.amazon.com/

### Credential Issues

If credentials are not working:
1. Verify credentials are valid using AWS CLI: `aws sts get-caller-identity`
2. Check the active profile in the status bar
3. Try manually entering credentials via "Select AWS Profile" → "Enter Credentials Manually"

## Workspace vs Global Storage

By default, queues are stored globally across all workspaces. You can switch to workspace-specific storage:

1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Run "SQS: Toggle Workspace Storage"
3. Choose between global and workspace storage

## Import/Export Queue Configurations

### Export Queues
1. Click the export icon in the SQS Queues view toolbar
2. Choose a location to save the JSON file
3. All queue configurations will be exported

### Import Queues
1. Click the import icon in the SQS Queues view toolbar
2. Select a previously exported JSON file
3. Queues will be added to your current list

## Security

- Credentials are never logged to the Output panel or Debug Console
- Credentials are never sent to the webview
- VS Code SecretStorage uses OS-level encryption
- All AWS communication uses HTTPS

## Performance

- Request throttling: Maximum 5 concurrent requests per queue
- Queue refresh throttling: Once per 30 seconds per queue
- Queue storage limit: 1000 queues maximum
- Virtual scrolling for large message tables (>100 messages)

## Requirements

- VS Code 1.88.0 or higher
- AWS account with SQS access
- Valid AWS credentials

## Known Limitations

- Maximum 10 messages can be received per request (AWS SQS limitation)
- Message body size limited to 256 KB (AWS SQS limitation)
- Purge operation limited to once per 60 seconds per queue (AWS SQS limitation)

## Support

For issues, feature requests, or contributions, please visit our [GitHub repository](https://github.com/your-org/sqs-management-tool).

## License

[Your License Here]

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.
