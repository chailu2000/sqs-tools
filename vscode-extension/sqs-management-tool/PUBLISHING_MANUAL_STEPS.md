# Manual Steps Required Before Publishing

This document lists all the manual steps you need to complete before publishing the extension to the VS Code Marketplace.

## Status: Ready for Manual Input

The extension has been prepared for publishing. The following items require your input:

---

## 1. Update package.json with Your Information

**File**: `vscode-extension/sqs-management-tool/package.json`

Replace the following placeholders:

```json
{
  "publisher": "YOUR-PUBLISHER-ID",  // ← Replace with your publisher ID (from Step 2)
  "author": {
    "name": "Your Name",  // ← Replace with your name
    "email": "your.email@example.com"  // ← Replace with your email
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/sqs-management-tool"  // ← Replace with your repo URL
  },
  "bugs": {
    "url": "https://github.com/your-username/sqs-management-tool/issues"  // ← Replace with your issues URL
  },
  "homepage": "https://github.com/your-username/sqs-management-tool#readme"  // ← Replace with your homepage URL
}
```

---

## 2. Update LICENSE with Your Name

**File**: `vscode-extension/sqs-management-tool/LICENSE`

Replace `[Your Name]` with your actual name:

```
Copyright (c) 2024 [Your Name]  // ← Replace with your name
```

---

## 3. Create Extension Icon

**Required**: Create a 128x128 PNG icon

**Location**: `vscode-extension/sqs-management-tool/images/icon.png`

**Requirements**:
- Size: 128x128 pixels
- Format: PNG
- Transparent background recommended
- Should represent AWS SQS or queuing concept
- Simple, recognizable design

**Options**:
1. Design custom icon in Figma/Sketch/Canva
2. Use AWS SQS logo (check AWS branding guidelines first)
3. Hire designer on Fiverr ($5-20)
4. Use icon generator tools (e.g., https://www.favicon-generator.org/)

**Quick tip**: Search for "queue icon" or "message queue icon" on icon sites like:
- https://www.flaticon.com/
- https://icons8.com/
- https://www.iconfinder.com/

**After creating the icon**:
```bash
mkdir -p vscode-extension/sqs-management-tool/images
# Place your icon.png in the images/ directory
```

---

## 4. Add Screenshots/GIFs to README

**Recommended**: Add visual content to make your extension more appealing

**Location**: `vscode-extension/sqs-management-tool/images/`

**Suggested screenshots**:
1. Queue tree view with multiple queues
2. Message composer with attributes
3. Message list view
4. DLQ redrive in action (GIF)
5. AWS profile selection

**Tools for screenshots**:
- macOS: Cmd+Shift+4
- Windows: Snipping Tool
- Linux: gnome-screenshot or Flameshot

**Tools for GIF recording**:
- macOS: Kap (https://getkap.co/)
- Windows: ScreenToGif (https://www.screentogif.com/)
- Cross-platform: LICEcap (https://www.cockos.com/licecap/)

**After creating screenshots**, update README.md:

```markdown
## Screenshots

### Queue Management
![Queue View](images/queue-view.png)

### Message Composer
![Message Composer](images/message-composer.png)

### DLQ Redrive
![DLQ Redrive](images/dlq-redrive.gif)
```

---

## 5. Create Azure DevOps Account and Publisher

Follow these steps in order:

### 5.1 Create Microsoft Account (if you don't have one)
1. Go to https://signup.live.com/
2. Create a new Microsoft account
3. Verify your email

### 5.2 Create Azure DevOps Organization
1. Go to https://dev.azure.com
2. Sign in with your Microsoft account
3. Click "Create new organization"
4. Choose organization name (e.g., "your-name-extensions")
5. Select region closest to you
6. Click "Continue"

### 5.3 Create Personal Access Token (PAT)
1. In Azure DevOps, click your profile icon (top right)
2. Select "Personal access tokens"
3. Click "+ New Token"
4. Configure token:
   - **Name**: "VS Code Marketplace Publishing"
   - **Organization**: Select your organization
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Select "Custom defined"
   - Check "Marketplace" → "Manage"
5. Click "Create"
6. **CRITICAL**: Copy the token immediately and save it securely
   - You won't be able to see it again!
   - Store in password manager or secure note

### 5.4 Create Publisher on VS Code Marketplace
1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with the same Microsoft account
3. Click "Create publisher"
4. Fill in details:
   - **Publisher ID**: Unique identifier (e.g., "your-name" or "your-company")
     - This will be in your extension URL
     - Cannot be changed later!
     - Must be lowercase, alphanumeric, hyphens only
     - Example: "john-doe" or "acme-corp"
   - **Publisher Name**: Display name (e.g., "John Doe")
   - **Email**: Your contact email
5. Click "Create"

**Save your Publisher ID** - you'll need it for package.json (Step 1)

---

## 6. Install Publishing Tools

```bash
# Install vsce globally
npm install -g @vscode/vsce

# Or with pnpm
pnpm add -g @vscode/vsce

# Verify installation
vsce --version
```

---

## 7. Login to Publisher Account

```bash
# Navigate to extension directory
cd vscode-extension/sqs-management-tool

# Login with your PAT
vsce login YOUR-PUBLISHER-ID

# When prompted, paste your Personal Access Token from Step 5.3
```

---

## 8. Build and Package

```bash
# Navigate to extension directory
cd vscode-extension/sqs-management-tool

# Clean previous builds (optional)
rm -f *.vsix

# Build frontend Svelte bundle (from frontend directory)
cd ../../frontend
pnpm run build:extension
cd ../vscode-extension/sqs-management-tool

# Package extension (this will automatically run bundle script via prepublish)
pnpm run package
```

**What happens**:
1. `pnpm run package` triggers `vscode:prepublish` script
2. `vscode:prepublish` runs `pnpm run bundle`
3. `bundle` uses esbuild to bundle extension with all AWS SDK dependencies
4. `vsce package --no-dependencies` creates the .vsix file

**Expected output**: `sqs-management-tool-1.0.0.vsix` (approximately 828 KB)

---

## 9. Test Locally

```bash
# Install the .vsix file locally
code --install-extension sqs-management-tool-1.0.0.vsix
```

**Test thoroughly**:
- [ ] Extension activates without errors
- [ ] All commands work
- [ ] Webview loads correctly
- [ ] AWS credentials can be configured
- [ ] Queues can be added/removed
- [ ] Messages can be sent/received
- [ ] No console errors (Help → Toggle Developer Tools)
- [ ] Icon displays correctly
- [ ] README displays correctly in Extensions view

---

## 10. Publish to Marketplace

```bash
# Publish to marketplace using the npm script (recommended)
pnpm run publish

# Or publish directly with vsce (must include --no-dependencies flag)
pnpm vsce publish --no-dependencies

# Or publish with version bump
pnpm vsce publish patch --no-dependencies  # 1.0.0 → 1.0.1
pnpm vsce publish minor --no-dependencies  # 1.0.0 → 1.1.0
pnpm vsce publish major --no-dependencies  # 1.0.0 → 2.0.0
```

**Important**: Always use `--no-dependencies` flag because:
- The extension uses pnpm (not npm)
- All dependencies are already bundled via esbuild
- Without this flag, vsce will fail with npm dependency errors

**What happens**:
1. Extension is uploaded to marketplace
2. Automated validation runs (usually completes within minutes)
3. Extension becomes immediately available on marketplace
4. You'll see output with marketplace URL and hub URL

**Expected output**:
```
INFO  Publishing 'your-publisher.sqs-management-tool v1.0.0'...
INFO  Extension URL: https://marketplace.visualstudio.com/items?itemName=your-publisher.sqs-management-tool
INFO  Hub URL: https://marketplace.visualstudio.com/manage/publishers/your-publisher/extensions/sqs-management-tool/hub
DONE  Published your-publisher.sqs-management-tool v1.0.0.
```

**Note about warnings**:
- You may see a warning about credential store - this is safe to ignore
- You may see a deprecation warning about `url.parse()` - this is from vsce itself, not your extension

---

## 11. Verify Publication

1. Go to https://marketplace.visualstudio.com/
2. Search for "AWS SQS Management Tool"
3. Verify:
   - [ ] Extension appears in search
   - [ ] Icon displays correctly
   - [ ] README renders properly
   - [ ] Screenshots/GIFs display
   - [ ] Install button works

---

## Quick Checklist

Use this checklist to track your progress:

- [ ] Step 1: Updated package.json with publisher, author, repository URLs
- [ ] Step 2: Updated LICENSE with your name
- [ ] Step 3: Created extension icon (128x128 PNG)
- [ ] Step 4: Added screenshots/GIFs to README (optional but recommended)
- [ ] Step 5: Created Azure DevOps account and publisher
- [ ] Step 6: Installed vsce tool
- [ ] Step 7: Logged in with vsce
- [ ] Step 8: Built and packaged extension
- [ ] Step 9: Tested locally
- [ ] Step 10: Published to marketplace
- [ ] Step 11: Verified publication

---

## Troubleshooting

### "ERROR: Missing publisher name"
- Fix: Complete Step 1 (update package.json with publisher ID)

### "ERROR: Missing README.md"
- Fix: README.md already exists, ensure it has content

### "ERROR: Missing LICENSE"
- Fix: LICENSE already exists, ensure it has content

### "ERROR: Icon not found"
- Fix: Complete Step 3 (create icon) or temporarily remove icon field from package.json

### "ERROR: npm list --production failed"
- Fix: Use `pnpm run publish` or add `--no-dependencies` flag
- Reason: Extension uses pnpm and dependencies are bundled via esbuild
- Command: `pnpm vsce publish --no-dependencies`

### "WARNING: Failed to open credential store"
- This is safe to ignore - vsce will store credentials in `~/.vsce`
- Your Personal Access Token is still secure
- Does not affect publishing functionality

### "ERROR: Marketplace validation failed"
- Fix: Check marketplace dashboard for specific errors
- Common issues: broken links in README, invalid icon, security vulnerabilities

---

## Next Steps After Publishing

1. Update README.md with marketplace link
2. Create GitHub release with tag v1.0.0
3. Share on social media (Twitter, LinkedIn, Reddit)
4. Monitor for issues and feedback
5. Plan next version features

---

## Resources

- **Publishing Guide**: `PUBLISHING_GUIDE.md` (comprehensive guide)
- **Publishing Checklist**: `PUBLISHING_CHECKLIST.md` (detailed checklist)
- **VS Code Docs**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Marketplace Management**: https://marketplace.visualstudio.com/manage
- **Azure DevOps**: https://dev.azure.com

---

## Summary

**What's Done**:
- ✅ package.json prepared with metadata
- ✅ LICENSE file created
- ✅ CHANGELOG.md created
- ✅ .vscodeignore configured
- ✅ README.md updated with badges and development section
- ✅ All documentation complete

**What You Need to Do**:
1. Fill in your personal information (Steps 1-2)
2. Create extension icon (Step 3)
3. Optionally add screenshots (Step 4)
4. Set up Azure DevOps and publisher account (Step 5)
5. Build, test, and publish (Steps 6-11)

**Estimated Time**: 1-2 hours for first-time setup

Good luck with your extension! 🚀
