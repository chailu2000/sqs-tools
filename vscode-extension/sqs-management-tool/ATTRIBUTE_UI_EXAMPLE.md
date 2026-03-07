# Message Attributes UI - Visual Example

## What the UI Looks Like

When you add message attributes, the UI displays them in a clean 3-column layout:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Send Message                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Message Body:                                                                │
│ ┌──────────────────────────────────────────────────────────────────────┐   │
│ │ {                                                                     │   │
│ │   "orderId": "ORD-2024-001234",                                      │   │
│ │   "customerId": "CUST-789",                                          │   │
│ │   "totalAmount": 149.99                                              │   │
│ │ }                                                                     │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│ ☑ Validate JSON format          Delay (seconds): [0    ]                   │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Message Attributes:                              [+ Add Attribute]    │ │
│ ├────────────────────────────────────────────────────────────────────────┤ │
│ │                                                                        │ │
│ │ [orderType        ▼] [String      ▼] [standard                    ] [×]│ │
│ │                                                                        │ │
│ │ [priority         ▼] [Number.int  ▼] [5                           ] [×]│ │
│ │                                                                        │ │
│ │ [customerTier     ▼] [String      ▼] [premium                     ] [×]│ │
│ │                                                                        │ │
│ │ [estimatedWeight  ▼] [Number.float▼] [2.45                        ] [×]│ │
│ │                                                                        │ │
│ │ [shippingMetadata ▼] [String.json ▼] [{"carrier":"UPS","service":…] [×]│ │
│ │                                                                        │ │
│ │ [timestamp        ▼] [Number.float▼] [1709856000.123              ] [×]│ │
│ │                                                                        │ │
│ │ [requiresSignature▼] [String      ▼] [true                        ] [×]│ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                          [Send Message]                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Column Layout

Each attribute row has 4 elements:

1. **Key Input** (flex: 1) - Attribute name
   - Placeholder: "Key (e.g., type)"
   - Width: Flexible, takes available space

2. **Type Dropdown** (140px fixed) - Data type selector
   - Options: String, Number, Binary, String.json, String.xml, Number.int, Number.float
   - Width: Fixed at 140px for consistency

3. **Value Input** (flex: 2) - Attribute value
   - Placeholder: Changes based on selected type
     - String: "Value"
     - Number/Number.int/Number.float: "Value (number)"
     - Binary: "Value (base64)"
   - Width: Flexible, takes 2x the space of key input

4. **Remove Button** (32px) - Delete attribute
   - Icon: × (multiplication sign)
   - Width: Fixed at 32px
   - Color: Red/Error color

## Type Dropdown Options

When you click the type dropdown, you see:

```
┌─────────────────┐
│ String          │ ← Default, most common
│ Number          │
│ Binary          │
│ String.json     │ ← For JSON objects
│ String.xml      │ ← For XML data
│ Number.int      │ ← Explicit integer
│ Number.float    │ ← Explicit decimal
└─────────────────┘
```

## Dynamic Placeholders

The value input placeholder changes based on the selected type:

| Selected Type | Placeholder Text |
|---------------|------------------|
| String | "Value" |
| Number | "Value (number)" |
| Number.int | "Value (number)" |
| Number.float | "Value (number)" |
| Binary | "Value (base64)" |
| String.json | "Value" |
| String.xml | "Value" |

## Real Example: E-Commerce Order

Here's what it looks like when you're entering the e-commerce order example:

### Step 1: Empty Form
```
Message Attributes:                              [+ Add Attribute]
(no attributes yet)
```

### Step 2: After clicking "+ Add Attribute" once
```
Message Attributes:                              [+ Add Attribute]

[Key (e.g., type) ] [String      ▼] [Value                        ] [×]
```

### Step 3: After filling in first attribute
```
Message Attributes:                              [+ Add Attribute]

[orderType        ] [String      ▼] [standard                     ] [×]
```

### Step 4: After adding all 7 attributes
```
Message Attributes:                              [+ Add Attribute]

[orderType        ] [String      ▼] [standard                     ] [×]
[priority         ] [Number.int  ▼] [5                            ] [×]
[customerTier     ] [String      ▼] [premium                      ] [×]
[estimatedWeight  ] [Number.float▼] [2.45                         ] [×]
[shippingMetadata ] [String.json ▼] [{"carrier":"UPS","service":…] [×]
[timestamp        ] [Number.float▼] [1709856000.123               ] [×]
[requiresSignature] [String      ▼] [true                         ] [×]
```

## Color Scheme

### VS Code Extension (Dark Theme)
- Background: VS Code editor background
- Input borders: VS Code input border color
- Input background: VS Code input background
- Text: VS Code foreground color
- Remove button: VS Code error foreground (red)
- Add button: VS Code button background (blue)

### Standalone Web App
- Light mode: White background, gray borders
- Dark mode: Dark gray background, lighter borders
- Remove button: Red (#f44336)
- Add button: Green (#4caf50)

## Responsive Behavior

The layout adapts to different widths:

**Wide Screen (>1200px)**
```
[Key (30%)        ] [Type (140px)] [Value (60%)                  ] [×]
```

**Medium Screen (800-1200px)**
```
[Key (25%)    ] [Type (140px)] [Value (65%)              ] [×]
```

**Narrow Screen (<800px)**
```
[Key (20%)] [Type (140px)] [Value (70%)        ] [×]
```

The type dropdown always stays at 140px to ensure all option names are readable.

## Keyboard Navigation

- **Tab**: Move between inputs (Key → Type → Value → Remove → Next Key)
- **Enter**: In Key or Value input, does nothing (prevents accidental form submission)
- **Escape**: Blur current input
- **Arrow Up/Down**: In Type dropdown, navigate options
- **Space/Enter**: In Type dropdown, select option

## Accessibility Features

- All inputs have proper labels (via title attribute)
- Type dropdown is keyboard navigable
- Remove button has descriptive title: "Remove attribute"
- Color contrast meets WCAG AA standards
- Focus indicators visible on all interactive elements

## Tips for Using the UI

1. **Start with the key**: Always fill in the attribute name first
2. **Select the type**: Choose the appropriate data type from dropdown
3. **Enter the value**: The placeholder will guide you on what format to use
4. **Add more**: Click "+ Add Attribute" to add another row
5. **Remove mistakes**: Click the × button to remove an attribute
6. **Reorder**: Currently not supported - delete and re-add if needed

## Common Workflows

### Adding a Simple String Attribute
1. Click "+ Add Attribute"
2. Type key: `status`
3. Leave type as `String` (default)
4. Type value: `pending`
5. Done!

### Adding a JSON Attribute
1. Click "+ Add Attribute"
2. Type key: `metadata`
3. Change type to `String.json`
4. Type value: `{"user":"john","action":"login"}`
5. Ensure JSON is valid (use JSON validator if needed)
6. Done!

### Adding Multiple Attributes Quickly
1. Click "+ Add Attribute" multiple times to create empty rows
2. Fill in all keys first (tab through)
3. Go back and select types
4. Fill in all values
5. Review and send

### Fixing a Mistake
- **Wrong key/value**: Click in the input and edit
- **Wrong type**: Click dropdown and select correct type
- **Want to delete**: Click the × button on the right
- **Want to start over**: Click × on all attributes and start fresh
