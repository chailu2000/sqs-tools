# Publishing Checklist

Use this checklist to ensure you're ready to publish your extension.

## Pre-Publishing Checklist

### Documentation
- [ ] README.md is complete and well-formatted
- [ ] README includes screenshots/GIFs
- [ ] CHANGELOG.md exists with version history
- [ ] LICENSE file exists
- [ ] TROUBLESHOOTING.md is up to date
- [ ] All links in documentation work

### package.json
- [ ] `publisher` field is set
- [ ] `version` is set (start with 1.0.0)
- [ ] `displayName` is descriptive
- [ ] `description` is clear and concise (under 200 chars)
- [ ] `author` information is complete
- [ ] `license` field is set
- [ ] `repository` URL is correct
- [ ] `bugs` URL is correct
- [ ] `homepage` URL is correct
- [ ] `icon` path is correct
- [ ] `keywords` are relevant and searchable
- [ ] `categories` are appropriate
- [ ] `engines.vscode` version is correct

### Assets
- [ ] Icon exists (128x128 PNG)
- [ ] Icon is professional and recognizable
- [ ] Screenshots are high quality
- [ ] GIFs demonstrate key features
- [ ] All images are optimized (not too large)

### Code Quality
- [ ] All TypeScript compiles without errors
- [ ] No console.log statements in production code
- [ ] All tests pass
- [ ] No security vulnerabilities (`pnpm audit`)
- [ ] Code is properly formatted
- [ ] No TODO/FIXME comments in critical code

### Functionality
- [ ] Extension activates without errors
- [ ] All commands work as expected
- [ ] Webview loads correctly
- [ ] No errors in Developer Tools console
- [ ] Works on clean VS Code install
- [ ] Tested on multiple operating systems
- [ ] Tested with different VS Code themes
- [ ] Error handling is comprehensive
- [ ] User feedback is clear (success/error messages)

### .vscodeignore
- [ ] `.vscodeignore` file exists
- [ ] Development files are excluded
- [ ] Test files are excluded
- [ ] node_modules is excluded (if using --no-dependencies)
- [ ] Essential docs are included
- [ ] Package size is reasonable (<50MB)

### Azure DevOps Setup
- [ ] Microsoft account created
- [ ] Azure DevOps organization created
- [ ] Personal Access Token (PAT) created
- [ ] PAT has "Marketplace (Manage)" scope
- [ ] PAT is saved securely

### Marketplace Setup
- [ ] Publisher account created
- [ ] Publisher ID is unique and appropriate
- [ ] Publisher profile is complete
- [ ] Logged in with vsce (`vsce login`)

## Publishing Steps

### 1. Final Build
```bash
- [ ] cd vscode-extension/sqs-management-tool
- [ ] rm -rf out/ *.vsix
- [ ] pnpm run compile
- [ ] cd ../../frontend && pnpm run build:extension
- [ ] cd ../vscode-extension/sqs-management-tool
```

### 2. Package
```bash
- [ ] vsce package
- [ ] Verify .vsix file created
- [ ] Check package size (should be reasonable)
```

### 3. Local Testing
```bash
- [ ] code --install-extension sqs-management-tool-1.0.0.vsix
- [ ] Test all features thoroughly
- [ ] Check for console errors
- [ ] Verify icon displays
- [ ] Verify README displays
- [ ] Uninstall test version
```

### 4. Publish
```bash
- [ ] vsce publish
- [ ] Wait for validation (1-2 hours)
- [ ] Check email for publication confirmation
```

### 5. Verification
- [ ] Extension appears in marketplace search
- [ ] Extension page displays correctly
- [ ] Icon displays correctly
- [ ] README renders properly
- [ ] Screenshots/GIFs display
- [ ] Install button works
- [ ] Can install from marketplace

### 6. Post-Publication
- [ ] Update README with marketplace link
- [ ] Create GitHub release
- [ ] Tag version in git
- [ ] Share on social media
- [ ] Monitor for issues/feedback

## Version Update Checklist

When publishing updates:

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md with changes
- [ ] Test all changes thoroughly
- [ ] Build and package
- [ ] Test .vsix locally
- [ ] Publish with `vsce publish`
- [ ] Verify update appears in marketplace
- [ ] Test update installation

## Emergency Unpublish

If you need to unpublish:

```bash
# Unpublish specific version
vsce unpublish YOUR-PUBLISHER-ID.sqs-management-tool@1.0.0

# Unpublish entire extension
vsce unpublish YOUR-PUBLISHER-ID.sqs-management-tool
```

**Warning**: Only unpublish if absolutely necessary (critical bug, security issue).

## Common Issues

### Package Too Large
- [ ] Check .vscodeignore
- [ ] Remove unnecessary files
- [ ] Use `--no-dependencies` flag
- [ ] Optimize images

### Validation Failed
- [ ] Check marketplace dashboard for errors
- [ ] Fix reported issues
- [ ] Re-package and publish

### Extension Not Found
- [ ] Wait 1-2 hours for indexing
- [ ] Check publisher ID is correct
- [ ] Verify extension is published (not unpublished)

## Quick Commands Reference

```bash
# Login
vsce login YOUR-PUBLISHER-ID

# Package
vsce package

# Publish
vsce publish

# Publish with version bump
vsce publish patch  # 1.0.0 → 1.0.1
vsce publish minor  # 1.0.0 → 1.1.0
vsce publish major  # 1.0.0 → 2.0.0

# Show info
vsce show YOUR-PUBLISHER-ID.sqs-management-tool

# List versions
vsce ls YOUR-PUBLISHER-ID.sqs-management-tool
```

## Resources

- Publishing Guide: `PUBLISHING_GUIDE.md`
- VS Code Docs: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Marketplace: https://marketplace.visualstudio.com/manage
- Azure DevOps: https://dev.azure.com

---

**Ready to publish?** Start with the Pre-Publishing Checklist and work your way down!
