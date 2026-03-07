# Message Body vs Message Attributes - Visual Guide

## The Envelope Analogy

```
┌─────────────────────────────────────────────────────────────┐
│  📧 SQS MESSAGE                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🏷️  ATTRIBUTES (Labels on the envelope)                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Priority: 5                                         │    │
│  │ OrderType: "express"                                │    │
│  │ CustomerTier: "premium"                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  📄 BODY (The letter inside)                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   "orderId": "ORD-123",                            │    │
│  │   "customerId": "CUST-789",                        │    │
│  │   "items": [                                       │    │
│  │     {"sku": "WIDGET-A", "quantity": 2}            │    │
│  │   ],                                               │    │
│  │   "totalAmount": 149.99                            │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Processing Flow

### Without Attributes (Inefficient)

```
Consumer receives message
    ↓
Download ENTIRE message body (could be large!)
    ↓
Parse JSON
    ↓
Check if priority is high
    ↓
If not high priority → Ignore message (wasted bandwidth!)
    ↓
If high priority → Process
```

### With Attributes (Efficient)

```
Consumer receives message
    ↓
Read attributes ONLY (tiny, fast!)
    ↓
Check priority attribute
    ↓
If not high priority → Ignore (no body download!)
    ↓
If high priority → Download body and process
```

## Real Example: Order Processing System

### Scenario
You have 3 types of orders:
- **Express** orders (need immediate processing)
- **Standard** orders (process during business hours)
- **Bulk** orders (batch process overnight)

### Bad Approach: Everything in Body

```json
{
  "orderType": "express",
  "orderId": "ORD-123",
  "customerId": "CUST-789",
  "items": [...100 items...],
  "shippingAddress": {...},
  "billingAddress": {...},
  "paymentInfo": {...}
}
```

**Problem:**
- Express processor must download ALL messages (including standard and bulk)
- Must parse entire JSON to find orderType
- Wastes bandwidth and processing time
- Can't use SQS message filtering

### Good Approach: Attributes for Routing

**Attributes:**
```
orderType: "express"
priority: 1
customerTier: "premium"
```

**Body:**
```json
{
  "orderId": "ORD-123",
  "customerId": "CUST-789",
  "items": [...100 items...],
  "shippingAddress": {...},
  "billingAddress": {...},
  "paymentInfo": {...}
}
```

**Benefits:**
- Express processor filters by `orderType="express"` attribute
- Only downloads relevant messages
- Faster, cheaper, more efficient
- Clear separation of concerns

## Common Patterns

### Pattern 1: Priority Queue

**Body:** Order data
**Attributes:**
- `priority: 1` (1=urgent, 10=low)
- `createdAt: 1709856000.123`

**Use Case:** Process high-priority orders first

```javascript
// Consumer code
if (message.MessageAttributes.priority.StringValue <= 3) {
  processImmediately(message);
} else {
  addToQueue(message);
}
```

### Pattern 2: Message Routing

**Body:** Transaction data
**Attributes:**
- `transactionType: "payment"` or "refund" or "chargeback"
- `amount: 1000`

**Use Case:** Route to different processors

```javascript
// Router code
const type = message.MessageAttributes.transactionType.StringValue;
switch(type) {
  case 'payment':
    sendToPaymentProcessor(message);
    break;
  case 'refund':
    sendToRefundProcessor(message);
    break;
  case 'chargeback':
    sendToChargebackProcessor(message);
    break;
}
```

### Pattern 3: Retry Logic

**Body:** API request data
**Attributes:**
- `retryCount: 0`
- `maxRetries: 3`
- `originalTimestamp: 1709856000.123`

**Use Case:** Track retry attempts

```javascript
// Consumer code
const retryCount = parseInt(message.MessageAttributes.retryCount.StringValue);
const maxRetries = parseInt(message.MessageAttributes.maxRetries.StringValue);

if (retryCount >= maxRetries) {
  sendToDeadLetterQueue(message);
} else {
  try {
    processMessage(message);
  } catch (error) {
    // Increment retry count and re-queue
    message.MessageAttributes.retryCount.StringValue = (retryCount + 1).toString();
    requeueMessage(message);
  }
}
```

### Pattern 4: Content Type Routing

**Body:** File data or reference
**Attributes:**
- `contentType: "video/mp4"`
- `fileSize: 524288000`
- `requiresTranscoding: "true"`

**Use Case:** Route to appropriate processor

```javascript
// Router code
const contentType = message.MessageAttributes.contentType.StringValue;

if (contentType.startsWith('video/')) {
  sendToVideoProcessor(message);
} else if (contentType.startsWith('image/')) {
  sendToImageProcessor(message);
} else if (contentType.startsWith('audio/')) {
  sendToAudioProcessor(message);
}
```

## What Goes Where?

### ✅ Put in ATTRIBUTES (Metadata)

| Data | Why Attribute? | Example |
|------|----------------|---------|
| Message type | For routing | `messageType: "order"` |
| Priority | For filtering | `priority: 5` |
| Source system | For tracking | `source: "mobile-app"` |
| Timestamp | For ordering | `timestamp: 1709856000.123` |
| Retry count | For logic | `retryCount: 0` |
| Content type | For routing | `contentType: "application/json"` |
| Customer tier | For processing rules | `tier: "premium"` |
| Region | For geo-routing | `region: "us-east"` |

### ✅ Put in BODY (Actual Data)

| Data | Why Body? | Example |
|------|-----------|---------|
| Order details | Business data | `{"orderId": "123", "items": [...]}` |
| Customer info | Business data | `{"name": "John", "email": "..."}` |
| Transaction data | Business data | `{"amount": 99.99, "currency": "USD"}` |
| Sensor readings | Business data | `{"temperature": 23.5, "humidity": 65}` |
| File content | Actual payload | `{"fileData": "base64..."}` |

## Decision Tree

```
Is this data used to DECIDE whether/how to process the message?
    │
    ├─ YES → Use ATTRIBUTE
    │   Examples:
    │   - Priority level
    │   - Message type
    │   - Routing info
    │   - Processing flags
    │
    └─ NO → Use BODY
        Examples:
        - Order details
        - Customer data
        - Transaction info
        - Actual payload
```

## Performance Comparison

### Scenario: 1000 messages, only 10 are high-priority

**Without Attributes:**
```
Download: 1000 messages × 10 KB = 10 MB
Parse: 1000 JSON documents
Process: 10 messages
Wasted: 990 downloads, 990 parses
```

**With Attributes:**
```
Read attributes: 1000 × 0.1 KB = 100 KB
Download: 10 messages × 10 KB = 100 KB
Parse: 10 JSON documents
Process: 10 messages
Saved: 9.9 MB bandwidth, 990 parses
```

**Result: 99x more efficient!**

## AWS SQS Message Filtering

With attributes, you can use SQS message filtering (SNS → SQS):

```json
{
  "priority": [{"numeric": ["<=", 3]}],
  "orderType": ["express", "urgent"],
  "customerTier": ["premium", "enterprise"]
}
```

This filter policy ensures only matching messages reach your queue!

## Summary

**Message Body:**
- The actual data you're sending
- What your application processes
- Can be any format (JSON, XML, text)
- Think: "The letter inside the envelope"

**Message Attributes:**
- Metadata ABOUT the message
- Used for routing, filtering, decisions
- Maximum 10 attributes per message
- Think: "Labels on the envelope"

**Key Benefit:**
You can make routing/filtering decisions by reading just the attributes, without downloading the entire message body. This saves bandwidth, processing time, and money!

**Remember:**
- Attributes = Metadata for routing/filtering
- Body = Actual data for processing
- Separate concerns = Better architecture
