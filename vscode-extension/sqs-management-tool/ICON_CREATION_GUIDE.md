# Extension Icon Creation Guide

## Requirements

- **Size**: 128x128 pixels
- **Format**: PNG
- **Location**: `vscode-extension/sqs-management-tool/images/icon.png`
- **Background**: Transparent recommended
- **Theme**: Should represent AWS SQS or message queuing

---

## Option 1: Use Online Icon Generators (Easiest)

### Canva (Free, No Design Skills Required)

1. Go to https://www.canva.com/
2. Create account (free)
3. Search for "app icon" template
4. Choose 128x128 size
5. Design your icon:
   - Use queue/message symbols
   - Use AWS orange (#FF9900) or blue (#232F3E)
   - Keep it simple and recognizable
6. Download as PNG
7. Save to `images/icon.png`

### Favicon Generator (Quick and Simple)

1. Go to https://www.favicon-generator.org/
2. Upload a simple image or logo
3. Generate icon
4. Download 128x128 version
5. Save to `images/icon.png`

---

## Option 2: Use Free Icon Libraries

### Flaticon (Free with Attribution)

1. Go to https://www.flaticon.com/
2. Search for "queue" or "message queue"
3. Download PNG (128x128)
4. Save to `images/icon.png`
5. **Note**: Check license requirements

### Icons8 (Free with Attribution)

1. Go to https://icons8.com/
2. Search for "queue icon"
3. Download PNG (128x128)
4. Save to `images/icon.png`
5. **Note**: Check license requirements

---

## Option 3: Design Custom Icon

### Figma (Free, Professional)

1. Go to https://www.figma.com/
2. Create new file
3. Create 128x128 frame
4. Design your icon:
   - Use simple shapes
   - AWS color palette:
     - Orange: #FF9900
     - Dark Blue: #232F3E
     - Light Blue: #146EB4
   - Consider queue/message symbols:
     - Stacked rectangles (queue)
     - Envelope (message)
     - Arrow (flow)
5. Export as PNG (128x128)
6. Save to `images/icon.png`

### Sketch (macOS, Professional)

1. Open Sketch
2. Create 128x128 artboard
3. Design icon (similar to Figma)
4. Export as PNG
5. Save to `images/icon.png`

---

## Option 4: Hire a Designer (Professional)

### Fiverr (Budget-Friendly)

1. Go to https://www.fiverr.com/
2. Search for "app icon design"
3. Choose designer ($5-$20)
4. Provide brief:
   - Extension name: AWS SQS Management Tool
   - Theme: AWS SQS, message queuing
   - Size: 128x128 PNG
   - Colors: AWS orange/blue
5. Receive icon in 1-3 days

### Upwork (Professional)

1. Go to https://www.upwork.com/
2. Post job for icon design
3. Hire designer ($20-$100)
4. Receive professional icon

---

## Icon Design Tips

### Do's
- ✅ Keep it simple and recognizable
- ✅ Use high contrast colors
- ✅ Make it work at small sizes (16x16)
- ✅ Use AWS brand colors if possible
- ✅ Test on light and dark backgrounds
- ✅ Use symbols related to queuing/messaging

### Don'ts
- ❌ Don't use too many details
- ❌ Don't use thin lines (won't scale well)
- ❌ Don't use gradients (may not scale well)
- ❌ Don't use text (hard to read at small sizes)
- ❌ Don't violate AWS trademark guidelines

---

## AWS Brand Guidelines

If using AWS logos or colors:

1. Check AWS trademark guidelines: https://aws.amazon.com/trademark-guidelines/
2. AWS allows use of logos in certain contexts
3. Consider using AWS color palette without official logos
4. When in doubt, use generic queue/message symbols

**AWS Color Palette**:
- Orange: #FF9900
- Dark Blue: #232F3E
- Light Blue: #146EB4
- Squid Ink: #161E2D
- Smile Orange: #FF9900

---

## Icon Concept Ideas

### Concept 1: Queue Symbol
- Three stacked horizontal rectangles
- AWS orange color
- Transparent background
- Simple and clean

### Concept 2: Message Flow
- Envelope icon with arrow
- AWS blue and orange
- Represents message movement
- Clear purpose

### Concept 3: SQS Letters
- Stylized "SQS" text
- AWS orange
- Modern font
- Simple and direct

### Concept 4: Queue + Cloud
- Queue symbol with cloud
- Represents AWS cloud service
- AWS colors
- Professional look

---

## Quick DIY Icon (No Design Skills)

If you need something quick and simple:

1. Use a free icon from https://www.flaticon.com/
2. Search for "queue icon" or "message icon"
3. Download 128x128 PNG
4. Use online tool to change color to AWS orange (#FF9900)
5. Save to `images/icon.png`

**Recommended free icons**:
- Queue/stack icon
- Message/envelope icon
- Arrow/flow icon
- Cloud with queue icon

---

## Testing Your Icon

After creating the icon:

1. Save to `vscode-extension/sqs-management-tool/images/icon.png`
2. Verify size: 128x128 pixels
3. Verify format: PNG
4. Test in VS Code:
   ```bash
   vsce package
   code --install-extension sqs-management-tool-1.0.0.vsix
   ```
5. Check icon appears in:
   - Extensions view
   - Extension details page
   - VS Code marketplace (after publishing)

---

## Temporary Solution

If you want to publish without an icon initially:

1. Remove icon field from package.json:
   ```json
   // Remove this line:
   "icon": "images/icon.png",
   ```
2. Publish without icon
3. Add icon in next version update

**Note**: Having an icon is highly recommended for better discoverability and professionalism.

---

## Example Icon Specifications

```
Filename: icon.png
Size: 128x128 pixels
Format: PNG
Color Mode: RGB
Bit Depth: 24-bit (or 32-bit with alpha)
Background: Transparent (recommended)
File Size: < 50 KB (recommended)
```

---

## Resources

- **Canva**: https://www.canva.com/
- **Figma**: https://www.figma.com/
- **Flaticon**: https://www.flaticon.com/
- **Icons8**: https://icons8.com/
- **Favicon Generator**: https://www.favicon-generator.org/
- **Fiverr**: https://www.fiverr.com/
- **AWS Brand Guidelines**: https://aws.amazon.com/trademark-guidelines/

---

## Summary

**Easiest**: Use Canva or download from Flaticon
**Best Quality**: Design in Figma or hire on Fiverr
**Fastest**: Download free icon and change color

Choose the option that fits your timeline and budget. A simple, clean icon is better than no icon!
