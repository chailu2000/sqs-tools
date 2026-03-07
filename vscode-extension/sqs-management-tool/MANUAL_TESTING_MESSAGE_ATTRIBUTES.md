# Manual Testing Guide: Message Attributes Enhancement

## Overview
This guide helps you manually test the enhanced message attributes feature that now supports all AWS SQS data types.

## Quick Reference

| Data Type | Use Case | Example Value | Notes |
|-----------|----------|---------------|-------|
| **String** | Text, IDs, enums | `premium`, `user-123` | Most common type |
| **Number** | Whole numbers | `42`, `100` | Stored as string, parse as int |
| **Number.int** | Explicit integers | `5`, `1000` | Same as Number, more explicit |
| **Number.float** | Decimals | `3.14`, `99.99` | For precise values |
| **String.json** | Complex objects | `{"key":"value"}` | Must be valid JSON |
| **String.xml** | XML data | `<root>data</root>` | For XML systems |
| **Binary** | Binary data | `base64string==` | Must be base64 encoded |

**Quick Tips:**
- Maximum 10 attributes per message
- Use String.json for complex nested data
- Number types are stored as strings in SQS
- Attribute names: 1-256 chars, alphanumeric + underscore/hyphen/period

---

## Prerequisites
- VS Code with the extension installed
- AWS credentials configured (or LocalStack running on port 4566)
- At least one SQS queue available

## Supported Data Types

The message composer now supports the following AWS SQS message attribute data types:

1. **String** - Plain text value
2. **Number** - Numeric value (stored as string in SQS)
3. **Binary** - Binary data (base64 encoded)
4. **String.json** - JSON formatted string
5. **String.xml** - XML formatted string
6. **Number.int** - Integer number
7. **Number.float** - Floating point number

## Understanding Message Body vs Message Attributes

### What's the Difference?

**Message Body** (the main content):
- The actual data/payload you're sending
- Can be any format: JSON, XML, plain text, etc.
- This is what your application processes
- Example: Order details, sensor readings, transaction data

**Message Attributes** (metadata about the message):
- Additional information ABOUT the message
- Used for filtering, routing, and processing decisions
- Consumers can read attributes WITHOUT downloading the full message body
- Example: Priority level, message type, routing info

### Why Use Both?

Think of it like an envelope and a letter:
- **Message Body** = The letter inside (the actual content)
- **Message Attributes** = Labels on the envelope (priority, destination, type)

You can filter/route messages based on the envelope labels without opening every letter!

### Real Example: E-Commerce Order

**Message Body** (the order data):
```json
{
  "orderId": "ORD-2024-001234",
  "customerId": "CUST-789",
  "items": [
    {"sku": "WIDGET-A", "quantity": 2},
    {"sku": "GADGET-B", "quantity": 1}
  ],
  "totalAmount": 149.99
}
```
This is the actual order that needs to be processed.

**Message Attributes** (metadata for routing/filtering):
- `orderType: "standard"` - What KIND of order is this? (standard vs express vs wholesale)
- `priority: 5` - How urgent is this order? (1=urgent, 10=low priority)
- `customerTier: "premium"` - What type of customer? (affects processing rules)
- `estimatedWeight: 2.45` - Package weight (for shipping calculations)

### Why Not Put Everything in the Body?

**Without Attributes** (everything in body):
```json
{
  "orderId": "ORD-2024-001234",
  "orderType": "standard",
  "priority": 5,
  "customerTier": "premium",
  "customerId": "CUST-789",
  "items": [...],
  "totalAmount": 149.99
}
```

**Problems:**
- ❌ Must download entire message to check priority
- ❌ Can't filter messages by type without reading body
- ❌ Harder to route messages to different processors
- ❌ Mixing business data with routing metadata

**With Attributes** (separation of concerns):

**Body** = Business data only
```json
{
  "orderId": "ORD-2024-001234",
  "customerId": "CUST-789",
  "items": [...],
  "totalAmount": 149.99
}
```

**Attributes** = Routing/filtering metadata
- `orderType: "standard"`
- `priority: 5`
- `customerTier: "premium"`

**Benefits:**
- ✅ Filter by priority without downloading message
- ✅ Route by orderType to different processors
- ✅ Clear separation: body = data, attributes = metadata
- ✅ Can change routing logic without changing message format

### Use Cases for Attributes

**1. Message Filtering**
```javascript
// Consumer can filter messages by attribute
const params = {
  QueueUrl: queueUrl,
  MessageAttributeNames: ['priority'],
  // Only process high-priority messages
  ReceiveRequestAttemptId: 'high-priority-consumer'
};
```

**2. Message Routing**
```javascript
// Route based on orderType attribute
if (message.MessageAttributes.orderType.StringValue === 'express') {
  sendToExpressProcessor(message);
} else {
  sendToStandardProcessor(message);
}
```

**3. Processing Decisions**
```javascript
// Check customer tier without parsing body
const tier = message.MessageAttributes.customerTier.StringValue;
if (tier === 'premium') {
  applyPremiumProcessing(message);
}
```

**4. Monitoring & Metrics**
```javascript
// Track message types without reading body
const messageType = message.MessageAttributes.orderType.StringValue;
metrics.increment(`orders.${messageType}`);
```

### When to Use Attributes vs Body

**Use Message Attributes for:**
- ✅ Message type/category
- ✅ Priority levels
- ✅ Routing information
- ✅ Processing flags
- ✅ Timestamps
- ✅ Retry counts
- ✅ Source/destination info
- ✅ Any metadata used for filtering/routing

**Use Message Body for:**
- ✅ Actual business data
- ✅ Order details
- ✅ Customer information
- ✅ Transaction data
- ✅ Sensor readings
- ✅ Any data that needs to be processed

**Rule of Thumb:**
- If you need it to DECIDE whether to process → Attribute
- If you need it to PERFORM the processing → Body

### JSON Validation Note

When you check "Validate JSON format" in the UI, it validates the **message body** only, not the attributes. This ensures your body is valid JSON before sending.

Attributes are separate - if you use `String.json` type for an attribute, make sure that attribute value is valid JSON, but it's not validated by the checkbox.

## Real-World Examples

### Example 1: E-Commerce Order Processing

**Use Case**: Processing an order with metadata about the customer, order priority, and fulfillment details.

**Message Body**:
```json
{
  "orderId": "ORD-2024-001234",
  "customerId": "CUST-789",
  "items": [
    {"sku": "WIDGET-A", "quantity": 2},
    {"sku": "GADGET-B", "quantity": 1}
  ],
  "totalAmount": 149.99
}
```

**Message Attributes**:
| Key | Type | Value | Purpose |
|-----|------|-------|---------|
| `orderType` | String | `standard` | Categorize order type |
| `priority` | Number.int | `5` | Processing priority (1-10) |
| `customerTier` | String | `premium` | Customer loyalty level |
| `estimatedWeight` | Number.float | `2.45` | Package weight in kg |
| `shippingMetadata` | String.json | `{"carrier":"UPS","service":"ground","insurance":true}` | Shipping details |
| `timestamp` | Number.float | `1709856000.123` | Unix timestamp with milliseconds |
| `requiresSignature` | String | `true` | Delivery requirement |

**Why These Types?**
- `Number.int` for priority allows numeric comparison in message filtering
- `Number.float` for weight enables precise calculations
- `String.json` for complex nested data that consumers can parse
- `Number.float` for timestamp preserves millisecond precision

---

### Example 2: IoT Sensor Data

**Use Case**: Processing temperature sensor readings from multiple devices with metadata.

**Message Body**:
```json
{
  "deviceId": "SENSOR-TEMP-42",
  "reading": 23.7,
  "unit": "celsius",
  "location": "warehouse-A-zone-3"
}
```

**Message Attributes**:
| Key | Type | Value | Purpose |
|-----|------|-------|---------|
| `sensorType` | String | `temperature` | Type of sensor |
| `alertThreshold` | Number.float | `25.5` | Temperature alert threshold |
| `readingCount` | Number.int | `1547` | Number of readings from this sensor |
| `calibrationData` | String.json | `{"lastCalibration":"2024-01-15","offset":0.2,"accuracy":0.1}` | Calibration metadata |
| `deviceMetadata` | String.xml | `<device><model>TH-2000</model><firmware>v2.1.3</firmware></device>` | Device info in XML |
| `batteryLevel` | Number.int | `87` | Battery percentage |
| `isAnomalous` | String | `false` | Anomaly detection flag |

**Why These Types?**
- `Number.float` for precise temperature thresholds
- `String.xml` demonstrates XML format support for legacy systems
- `String.json` for complex calibration data
- `Number.int` for countable values (battery %, reading count)

---

### Example 3: Financial Transaction Processing

**Use Case**: Processing a payment transaction with compliance and routing metadata.

**Message Body**:
```json
{
  "transactionId": "TXN-20240307-9876",
  "amount": 1250.00,
  "currency": "USD",
  "merchantId": "MERCH-12345",
  "cardLast4": "4242"
}
```

**Message Attributes**:
| Key | Type | Value | Purpose |
|-----|------|-------|---------|
| `transactionType` | String | `purchase` | Type of transaction |
| `amountCents` | Number.int | `125000` | Amount in cents (avoids float precision issues) |
| `riskScore` | Number.float | `0.23` | Fraud risk score (0.0-1.0) |
| `routingInfo` | String.json | `{"processor":"stripe","gateway":"primary","region":"us-east"}` | Payment routing |
| `complianceFlags` | String.json | `{"pciCompliant":true,"3dsVerified":true,"avsCheck":"pass"}` | Compliance metadata |
| `merchantCategory` | String | `retail` | Merchant category code |
| `processingPriority` | Number.int | `1` | Priority (1=high, 5=low) |
| `timestamp` | Number.float | `1709856123.456` | Transaction timestamp |

**Why These Types?**
- `Number.int` for cents avoids floating-point precision issues
- `Number.float` for risk scores (decimal values between 0-1)
- `String.json` for complex nested compliance data
- Multiple attributes enable flexible message filtering and routing

---

### Example 4: Video Processing Pipeline

**Use Case**: Processing video upload with encoding specifications and metadata.

**Message Body**:
```json
{
  "videoId": "VID-2024-ABC123",
  "sourceUrl": "s3://videos/raw/video.mp4",
  "uploadedBy": "user-456",
  "duration": 3600
}
```

**Message Attributes**:
| Key | Type | Value | Purpose |
|-----|------|-------|---------|
| `contentType` | String | `video/mp4` | MIME type |
| `fileSize` | Number.int | `524288000` | File size in bytes (500MB) |
| `targetBitrate` | Number.int | `5000` | Target bitrate in kbps |
| `aspectRatio` | Number.float | `1.778` | Aspect ratio (16:9 = 1.778) |
| `encodingProfile` | String.json | `{"codec":"h264","preset":"medium","crf":23,"audio":"aac"}` | Encoding settings |
| `thumbnailTimestamps` | String.json | `[0, 30, 60, 120, 300]` | Seconds for thumbnail generation |
| `priority` | String | `normal` | Processing priority |
| `requiresTranscription` | String | `true` | Whether to generate subtitles |
| `targetResolutions` | String.json | `["1080p","720p","480p","360p"]` | Output resolutions |

**Why These Types?**
- `Number.int` for file sizes and bitrates (whole numbers)
- `Number.float` for aspect ratios (precise decimals)
- `String.json` for complex arrays and objects
- Multiple attributes enable parallel processing decisions

---

### Example 5: Healthcare Appointment Reminder

**Use Case**: Sending appointment reminders with patient and scheduling metadata.

**Message Body**:
```json
{
  "appointmentId": "APPT-2024-5678",
  "patientId": "PAT-9012",
  "doctorId": "DOC-3456",
  "appointmentDate": "2024-03-15T14:30:00Z",
  "type": "follow-up"
}
```

**Message Attributes**:
| Key | Type | Value | Purpose |
|-----|------|-------|---------|
| `notificationType` | String | `appointment-reminder` | Message category |
| `hoursBeforeAppointment` | Number.int | `24` | Reminder timing |
| `patientPreferences` | String.json | `{"channel":"sms","language":"en","timezone":"America/New_York"}` | Communication preferences |
| `appointmentMetadata` | String.json | `{"department":"cardiology","room":"3B","floor":3,"parkingRequired":true}` | Appointment details |
| `priority` | Number.int | `2` | Notification priority |
| `requiresConfirmation` | String | `true` | Whether patient must confirm |
| `retryCount` | Number.int | `0` | Number of retry attempts |
| `hipaaCompliant` | String | `true` | Compliance flag |

**Why These Types?**
- `String.json` for complex patient preferences and metadata
- `Number.int` for countable values (hours, retries, priority)
- Demonstrates healthcare-specific use case with compliance considerations

---

## How to Test Complex Examples

### Testing Example 1: E-Commerce Order (Step-by-Step)

1. **Open the Extension**
   - Open VS Code
   - Navigate to the SQS Management Tool view
   - Select your test queue

2. **Enter Message Body**
   - Click "Send Message"
   - Paste the JSON message body:
   ```json
   {
     "orderId": "ORD-2024-001234",
     "customerId": "CUST-789",
     "items": [
       {"sku": "WIDGET-A", "quantity": 2},
       {"sku": "GADGET-B", "quantity": 1}
     ],
     "totalAmount": 149.99
   }
   ```
   - Check "Validate JSON format"

3. **Add Attributes One by One**
   
   Click "+ Add Attribute" and enter:
   
   **Attribute 1:**
   - Key: `orderType`
   - Type: `String`
   - Value: `standard`
   
   **Attribute 2:**
   - Key: `priority`
   - Type: `Number.int`
   - Value: `5`
   
   **Attribute 3:**
   - Key: `customerTier`
   - Type: `String`
   - Value: `premium`
   
   **Attribute 4:**
   - Key: `estimatedWeight`
   - Type: `Number.float`
   - Value: `2.45`
   
   **Attribute 5:**
   - Key: `shippingMetadata`
   - Type: `String.json`
   - Value: `{"carrier":"UPS","service":"ground","insurance":true}`
   
   **Attribute 6:**
   - Key: `timestamp`
   - Type: `Number.float`
   - Value: `1709856000.123`
   
   **Attribute 7:**
   - Key: `requiresSignature`
   - Type: `String`
   - Value: `true`

4. **Send the Message**
   - Click "Send Message"
   - Wait for success confirmation

5. **Verify the Message**
   - Click "Poll Messages" in the extension
   - Select the message you just sent
   - Verify all attributes appear with correct types

6. **Verify with AWS CLI** (Optional)
   ```bash
   aws sqs receive-message \
     --queue-url <your-queue-url> \
     --attribute-names All \
     --message-attribute-names All \
     --max-number-of-messages 1
   ```
   
   Expected output should show:
   ```json
   {
     "Messages": [
       {
         "MessageId": "...",
         "Body": "{\"orderId\":\"ORD-2024-001234\",...}",
         "MessageAttributes": {
           "orderType": {
             "DataType": "String",
             "StringValue": "standard"
           },
           "priority": {
             "DataType": "Number.int",
             "StringValue": "5"
           },
           "estimatedWeight": {
             "DataType": "Number.float",
             "StringValue": "2.45"
           },
           "shippingMetadata": {
             "DataType": "String.json",
             "StringValue": "{\"carrier\":\"UPS\",\"service\":\"ground\",\"insurance\":true}"
           }
         }
       }
     ]
   }
   ```

---

## Common Patterns and Best Practices

### When to Use Each Data Type

**String**
- Use for: Text values, enums, flags, IDs
- Examples: `orderType`, `status`, `category`, `userId`
- Best for: Simple categorization and filtering

**Number / Number.int**
- Use for: Whole numbers, counts, priorities, percentages
- Examples: `priority`, `retryCount`, `quantity`, `batteryLevel`
- Best for: Numeric comparisons and sorting
- Note: Stored as string in SQS but consumers can parse as integer

**Number.float**
- Use for: Decimal values, measurements, scores, timestamps
- Examples: `weight`, `temperature`, `riskScore`, `latitude`
- Best for: Precise numeric values
- Note: Stored as string in SQS but consumers can parse as float

**String.json**
- Use for: Complex nested objects, arrays, structured data
- Examples: `metadata`, `preferences`, `configuration`
- Best for: Rich data that needs to be parsed by consumers
- Note: Must be valid JSON string

**String.xml**
- Use for: XML formatted data, legacy system integration
- Examples: `soapEnvelope`, `deviceConfig`, `legacyData`
- Best for: Systems that require XML format

**Binary**
- Use for: Binary data, encrypted content, compressed data
- Examples: `encryptedToken`, `thumbnail`, `signature`
- Best for: Non-text data
- Note: Must be base64 encoded

### Attribute Naming Conventions

**Recommended Patterns:**
- Use camelCase: `orderType`, `customerId`, `shippingAddress`
- Be descriptive: `requiresSignature` instead of `sig`
- Use consistent prefixes: `is*` for booleans, `*Count` for counters
- Avoid special characters except underscore and hyphen

**Examples:**
- ✅ Good: `orderType`, `customerTier`, `isUrgent`, `retryCount`
- ❌ Avoid: `type`, `tier`, `urgent`, `retries` (too generic)

### Attribute Limits

**AWS SQS Limits:**
- Maximum 10 message attributes per message
- Attribute name: 1-256 characters
- Attribute value: Up to 256 KB (for all attributes combined)
- Valid characters in names: A-Z, a-z, 0-9, underscore, hyphen, period

**Best Practices:**
- Keep attribute names short but descriptive
- Use String.json for complex data instead of many individual attributes
- Consider message body for large data, attributes for metadata
- Don't exceed 10 attributes - consolidate related data into JSON

---

## Test Scenarios

### Test 1: String Attribute
1. Open a queue in the extension
2. Click "Send Message"
3. Enter message body: `Test message with string attribute`
4. Click "+ Add Attribute"
5. Enter:
   - Key: `type`
   - Type: `String` (default)
   - Value: `test-message`
6. Click "Send Message"
7. **Expected**: Message sent successfully

### Test 2: Number Attribute
1. Open a queue in the extension
2. Click "Send Message"
3. Enter message body: `Test message with number attribute`
4. Click "+ Add Attribute"
5. Enter:
   - Key: `priority`
   - Type: `Number`
   - Value: `42`
6. Click "Send Message"
7. **Expected**: Message sent successfully

### Test 3: JSON Attribute
1. Open a queue in the extension
2. Click "Send Message"
3. Enter message body: `Test message with JSON attribute`
4. Click "+ Add Attribute"
5. Enter:
   - Key: `metadata`
   - Type: `String.json`
   - Value: `{"user":"john","action":"login"}`
6. Click "Send Message"
7. **Expected**: Message sent successfully

### Test 4: Multiple Attributes with Different Types
1. Open a queue in the extension
2. Click "Send Message"
3. Enter message body: `{"action":"process","data":"test"}`
4. Check "Validate JSON format"
5. Add multiple attributes:
   - Attribute 1:
     - Key: `type`
     - Type: `String`
     - Value: `order`
   - Attribute 2:
     - Key: `priority`
     - Type: `Number.int`
     - Value: `5`
   - Attribute 3:
     - Key: `timestamp`
     - Type: `Number.float`
     - Value: `1234567890.123`
   - Attribute 4:
     - Key: `metadata`
     - Type: `String.json`
     - Value: `{"source":"web"}`
6. Click "Send Message"
7. **Expected**: Message sent successfully with all attributes

### Test 5: Delay with Attributes
1. Open a queue in the extension
2. Click "Send Message"
3. Enter message body: `Delayed message`
4. Set Delay: `10` seconds
5. Add attribute:
   - Key: `delayed`
   - Type: `String`
   - Value: `true`
6. Click "Send Message"
7. **Expected**: Message sent successfully with 10-second delay

## Verification

After sending messages, you can verify the attributes were correctly sent by:

1. **Using AWS CLI**:
   ```bash
   aws sqs receive-message \
     --queue-url <your-queue-url> \
     --attribute-names All \
     --message-attribute-names All
   ```

2. **Using LocalStack CLI** (if using LocalStack):
   ```bash
   aws --endpoint-url=http://localhost:4566 sqs receive-message \
     --queue-url <your-queue-url> \
     --attribute-names All \
     --message-attribute-names All
   ```

3. **In the Extension**: Poll messages and inspect the message details to see the attributes

## Expected Attribute Format in AWS

When you receive messages, the attributes should appear in this format:

```json
{
  "MessageAttributes": {
    "type": {
      "DataType": "String",
      "StringValue": "order"
    },
    "priority": {
      "DataType": "Number.int",
      "StringValue": "5"
    },
    "metadata": {
      "DataType": "String.json",
      "StringValue": "{\"source\":\"web\"}"
    }
  }
}
```

## Troubleshooting

### Error: "Message (user) attribute 'X' must contain a non-empty attribute type"
- **Cause**: The attribute key or value is empty
- **Solution**: Ensure both key and value fields are filled before sending

### Error: "Invalid JSON format"
- **Cause**: JSON validation is enabled but message body is not valid JSON
- **Solution**: Either fix the JSON or uncheck "Validate JSON format"

### Attributes not appearing in received messages
- **Cause**: Message attribute names not requested when receiving
- **Solution**: Ensure `MessageAttributeNames: "All"` is used when receiving messages

## Implementation Details

### Frontend Changes
- Added `dataType` field to attribute interface
- Added dropdown selector for data type in UI
- Updated attribute row layout to accommodate 3 columns (key, type, value)
- Dynamic placeholder text based on selected data type

### Backend Changes
- Attribute transformation in `extension-standalone.ts`
- Converts frontend format (`dataType`, `stringValue`) to AWS SDK format (`DataType`, `StringValue`)
- Supports all AWS SQS data types

### Files Modified
- `frontend/src/lib/components/MessageComposerExtension.svelte`
- `frontend/src/lib/components/MessageComposer.svelte`
- `vscode-extension/sqs-management-tool/src/extension-standalone.ts`
- `vscode-extension/sqs-management-tool/src/services/__tests__/sqs-service-verification.test.ts`
