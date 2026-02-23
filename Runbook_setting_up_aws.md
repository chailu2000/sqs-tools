## AWS Setup Runbook for SQS Management Tool

### Step 1: Create IAM User via AWS CLI

```bash
# 1. Create a new IAM user
aws iam create-user --user-name sqs-tool-user

# 2. Create access keys for the user
aws iam create-access-key --user-name sqs-tool-user
```

**Save the output!** You'll see something like:
```json
{
    "AccessKey": {
        "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        ...
    }
}
```

### Step 2: Create IAM Policy with Required Permissions

Create a policy file:

```bash
cat > sqs-tool-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSManagementToolPermissions",
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:ChangeMessageVisibility",
        "sqs:PurgeQueue"
      ],
      "Resource": "*"
    },
    {
      "Sid": "STSPermissions",
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
EOF
```

### Step 3: Attach Policy to User

```bash
# Create the policy
aws iam create-policy \
  --policy-name SQSManagementToolPolicy \
  --policy-document file://sqs-tool-policy.json

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach the policy to the user
aws iam attach-user-policy \
  --user-name sqs-tool-user \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/SQSManagementToolPolicy
```

### Step 4: Configure AWS CLI Profile

```bash
# Configure a new profile for the SQS tool
aws configure --profile sqs-tool

# You'll be prompted for:
# AWS Access Key ID: [paste the AccessKeyId from Step 1]
# AWS Secret Access Key: [paste the SecretAccessKey from Step 1]
# Default region name: us-east-1 (or your preferred region)
# Default output format: json
```

### Step 5: Verify Credentials

```bash
# Test the credentials
aws sts get-caller-identity --profile sqs-tool

# You should see output like:
# {
#     "UserId": "AIDAI...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/sqs-tool-user"
# }
```

### Step 6: Create Test Queues (Optional)

```bash
# Create a test queue
aws sqs create-queue \
  --queue-name test-queue \
  --profile sqs-tool \
  --region us-east-1

# Create a DLQ for testing redrive functionality
aws sqs create-queue \
  --queue-name test-queue-dlq \
  --profile sqs-tool \
  --region us-east-1

# Get the DLQ ARN
DLQ_URL=$(aws sqs get-queue-url --queue-name test-queue-dlq --profile sqs-tool --region us-east-1 --query QueueUrl --output text)
DLQ_ARN=$(aws sqs get-queue-attributes --queue-url $DLQ_URL --attribute-names QueueArn --profile sqs-tool --region us-east-1 --query 'Attributes.QueueArn' --output text)

# Configure the main queue to use the DLQ
MAIN_QUEUE_URL=$(aws sqs get-queue-url --queue-name test-queue --profile sqs-tool --region us-east-1 --query QueueUrl --output text)
aws sqs set-queue-attributes \
  --queue-url $MAIN_QUEUE_URL \
  --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}" \
  --profile sqs-tool \
  --region us-east-1

echo "Test queues created:"
echo "Main Queue: $MAIN_QUEUE_URL"
echo "DLQ: $DLQ_URL"
```

### Step 7: Configure the SQS Management Tool

**Option A: Use AWS Profile (Recommended)**

The app will automatically detect the `sqs-tool` profile. Just:
1. Start the backend and frontend
2. Open the app at `http://localhost:5173`
3. Click "⚙️ Settings"
4. Select `sqs-tool` from the dropdown
5. Click "Set Profile"
6. Click "Test Credentials" to verify

**Option B: Use Environment Variables**

```bash
# Set environment variables (in the terminal where you run the backend)
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"

# Then start the backend
cd backend
./gradlew bootRun
```

### Step 8: Smoke Test Checklist

Once the app is running, test these features:

1. **Add Queue**
   - Click "+ Add Queue"
   - Enter `test-queue` and select `us-east-1`
   - Verify it appears in the sidebar

2. **View Queue Details**
   - Click on the queue
   - Verify attributes are displayed
   - Check if DLQ info shows up

3. **Send Message**
   - Enter a message body (try JSON: `{"test": "hello"}`)
   - Enable JSON validation
   - Add an attribute (key: `type`, value: `test`)
   - Click "Send Message"

4. **Receive Messages**
   - Click "Receive Messages"
   - Verify your message appears
   - Expand it to see formatted JSON

5. **Search Messages**
   - Type "hello" in the search box
   - Verify filtering works

6. **Delete Message**
   - Click the 🗑️ button
   - Confirm deletion

7. **Test DLQ Redrive** (if you created the DLQ)
   - Send a message to the DLQ manually:
     ```bash
     aws sqs send-message \
       --queue-url $DLQ_URL \
       --message-body "Test DLQ message" \
       --profile sqs-tool
     ```
   - In the app, click "Redrive Single Message"
   - Verify the result shows success

8. **Purge Queue**
   - Click "Purge Queue"
   - Confirm the action

### Cleanup (After Testing)

```bash
# Delete test queues
aws sqs delete-queue --queue-url $MAIN_QUEUE_URL --profile sqs-tool
aws sqs delete-queue --queue-url $DLQ_URL --profile sqs-tool

# Delete IAM user and policy (optional)
aws iam detach-user-policy \
  --user-name sqs-tool-user \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/SQSManagementToolPolicy

aws iam delete-access-key \
  --user-name sqs-tool-user \
  --access-key-id YOUR_ACCESS_KEY_ID

aws iam delete-user --user-name sqs-tool-user

aws iam delete-policy \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/SQSManagementToolPolicy

# Remove the profile
aws configure --profile sqs-tool list
# Then manually edit ~/.aws/credentials and ~/.aws/config to remove [sqs-tool] sections
```

### Troubleshooting

**"Access Denied" errors:**
- Verify the policy is attached: `aws iam list-attached-user-policies --user-name sqs-tool-user`
- Check credentials: `aws sts get-caller-identity --profile sqs-tool`

**Can't see queues:**
- The app doesn't list queues automatically (no ListQueues permission as requested)
- You must manually add queues by name or URL

**Backend can't connect:**
- Check if the profile is set correctly in Settings
- Verify AWS CLI works: `aws sqs list-queues --profile sqs-tool`

Let me know how the smoke test goes!