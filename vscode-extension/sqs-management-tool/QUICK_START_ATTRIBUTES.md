# Quick Start: Message Attributes

## 30-Second Tutorial

1. Open a queue in the extension
2. Click "Send Message"
3. Enter your message body (the actual data)
4. Click "+ Add Attribute" (to add metadata)
5. Fill in: Key, Type (dropdown), Value
6. Click "Send Message"

Done! Your message is sent with attributes.

## What Are Message Attributes?

**Message Body** = The actual data (like the letter in an envelope)
**Message Attributes** = Metadata about the message (like labels on the envelope)

**Why use attributes?**
- Filter messages without reading the body
- Route messages to different processors
- Make processing decisions faster
- Separate business data from routing metadata

**Example:**
- Body: `{"orderId": "123", "amount": 99.99}` ← The order data
- Attribute: `priority: 5` ← How urgent is this order?
- Attribute: `orderType: "express"` ← What kind of order?

You can route "express" orders to a fast processor without opening every message!

## 5-Minute Example: Send an Order

### Message Body
```json
{
  "orderId": "ORD-001",
  "amount": 99.99
}
```

### Add These Attributes

| Key | Type | Value |
|-----|------|-------|
| `priority` | Number.int | `5` |
| `customerTier` | String | `premium` |
| `metadata` | String.json | `{"source":"web"}` |

### Result
Your message will have 3 attributes that can be used for:
- Filtering messages by priority
- Routing based on customer tier
- Tracking message source

## Common Use Cases

### Use Case 1: Priority Queue
**Goal**: Process high-priority messages first

Add attribute:
- Key: `priority`
- Type: `Number.int`
- Value: `1` (high) to `10` (low)

### Use Case 2: Message Routing
**Goal**: Route messages to different processors

Add attribute:
- Key: `messageType`
- Type: `String`
- Value: `order`, `payment`, `notification`, etc.

### Use Case 3: Metadata Tracking
**Goal**: Track message origin and context

Add attribute:
- Key: `metadata`
- Type: `String.json`
- Value: `{"source":"mobile","version":"2.1","userId":"123"}`

### Use Case 4: Retry Logic
**Goal**: Track retry attempts

Add attribute:
- Key: `retryCount`
- Type: `Number.int`
- Value: `0` (first attempt)

### Use Case 5: Timestamp Tracking
**Goal**: Track when message was created

Add attribute:
- Key: `timestamp`
- Type: `Number.float`
- Value: `1709856000.123` (Unix timestamp with milliseconds)

## Data Type Cheat Sheet

| Type | When to Use | Example |
|------|-------------|---------|
| **String** | Text, IDs, categories | `premium`, `user-123` |
| **Number.int** | Whole numbers, counts | `5`, `100` |
| **Number.float** | Decimals, measurements | `3.14`, `99.99` |
| **String.json** | Complex objects | `{"key":"value"}` |

## Tips

✅ **DO:**
- Use descriptive attribute names
- Keep attribute count under 10
- Use String.json for complex data
- Validate JSON before sending

❌ **DON'T:**
- Use special characters in keys (except _ - .)
- Exceed 256 KB total attribute size
- Forget to select the correct type
- Leave key or value empty

## Next Steps

- Read full guide: `MANUAL_TESTING_MESSAGE_ATTRIBUTES.md`
- See UI details: `ATTRIBUTE_UI_EXAMPLE.md`
- Try complex examples: See "Real-World Examples" in manual testing guide

## Troubleshooting

**Error: "Message attribute must contain a non-empty attribute type"**
- Fix: Make sure both key and value are filled in

**Attributes not showing in received messages**
- Fix: Use `MessageAttributeNames: "All"` when receiving

**JSON validation error**
- Fix: Validate your JSON at jsonlint.com or uncheck "Validate JSON format"

## Need Help?

1. Check the manual testing guide for detailed examples
2. Review the UI example document for visual guidance
3. Verify your AWS credentials are configured
4. Test with a simple String attribute first
