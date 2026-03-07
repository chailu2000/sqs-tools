# Git Commit Organization Plan

## Current Situation
- **Origin HEAD**: `a2893dbf1ee6fa7163d4f1eaecdee7fb4916c484`
- **Current HEAD**: `58e38ab`
- **Commits to organize**: 29 commits

## Proposed Commit Structure

After reorganization, we'll have these logical commits:

### 1. Initial Extension Architecture
**Combines:**
- docs: Add comprehensive VS Code extension architecture documentation
- docs: Add comprehensive plan for standalone VS Code extension
- docs: Emphasize visual management for users without Console access

**New commit message:**
```
docs: add standalone VS Code extension architecture and planning

- Add comprehensive architecture documentation
- Document standalone extension approach
- Emphasize visual management for users without AWS Console access
```

### 2. Svelte Bundle Migration
**Combines:**
- feat: Complete Svelte bundle migration for VS Code extension
- button styles
- feat: Improve Webview UI, fix CSS, HTML structure, and message display logic
- feat: Implement VS Code native input for message visibility timeout and fix Webview syntax error

**New commit message:**
```
feat: migrate to Svelte bundle for webview UI

- Complete Svelte bundle migration
- Improve webview UI with proper CSS and HTML structure
- Fix message display logic
- Implement VS Code native inputs
- Add proper button styles
```

### 3. Core AWS Integration (Phase 1)
**Combines:**
- feat: implement SQS service layer with queue operations and unit tests
- feat: implement SQS message operations with unit tests
- feat: Complete Phase 1 - Core AWS Integration

**New commit message:**
```
feat: implement core AWS SQS integration

- Add SQS service layer with queue operations
- Implement message operations (send, receive, delete, visibility)
- Add comprehensive unit tests
- Complete Phase 1 of standalone extension
```

### 4. Credential Management (Phase 2)
**Combines:**
- feat: Complete Phase 2 - Credential Management
- feat: Improve VS Code extension's AWS profile management and Webview message refresh

**New commit message:**
```
feat: implement AWS credential management

- Add support for multiple credential sources
- Implement AWS profile selection
- Add secure credential storage with VS Code SecretStorage
- Improve webview message refresh
```

### 5. Queue Storage and Management (Phase 3)
**Combines:**
- feat: Complete Phase 3 - Queue Storage and Management
- feat: Implement remove queue functionality, client-side duplicate queue check, and add queue button to view title

**New commit message:**
```
feat: implement queue storage and management

- Add queue storage with VS Code storage API
- Implement add/remove queue functionality
- Add duplicate queue detection
- Add queue management UI to tree view
```

### 6. Visual Management Interface (Phase 4)
**Combines:**
- feat: Complete Phase 4 - Visual Management Interface
- feat: Implement send message functionality and fix message body parameter

**New commit message:**
```
feat: implement visual management interface

- Add queue tree view with region grouping
- Implement message composer with send functionality
- Add message list view with operations
- Complete Phase 4 of standalone extension
```

### 7. Error Handling and User Feedback (Phase 5)
**Combines:**
- feat: Complete Phase 5 - Error handling and user feedback complete

**New commit message:**
```
feat: implement error handling and user feedback

- Add comprehensive error handling
- Implement user notifications
- Add validation for user inputs
- Complete Phase 5 of standalone extension
```

### 8. Testing Infrastructure (Phase 6)
**Combines:**
- feat: Complete Phase 6 - Testing infrastructure setup complete

**New commit message:**
```
feat: setup testing infrastructure

- Add unit test framework with Jest
- Configure test environment
- Add test utilities and fixtures
- Complete Phase 6 of standalone extension
```

### 9. Documentation (Phase 7)
**Combines:**
- Phase 7: Documentation complete

**New commit message:**
```
docs: complete extension documentation

- Add comprehensive README
- Add troubleshooting guide
- Add security documentation
- Add IAM permissions guide
- Complete Phase 7 of standalone extension
```

### 10. UI Improvements
**Combines:**
- fix: webview UI improvements - padding and scrolling
- fix: add box-sizing to prevent content overflow on right side
- fix: consistent padding across all sections
- fix: auto-dismiss success message after 5 seconds

**New commit message:**
```
fix: improve webview UI layout and UX

- Fix padding and scrolling issues
- Add box-sizing to prevent overflow
- Ensure consistent padding across sections
- Auto-dismiss success messages after 5 seconds
```

### 11. Redrive Operation Fixes
**Combines:**
- fix: resolve redrive operation issues in standalone extension

**New commit message:**
```
fix: resolve DLQ redrive operation issues

- Fix message redriving from DLQ to main queue
- Improve error handling in redrive operations
- Add proper progress tracking
```

### 12. E2E Test Migration
**Combines:**
- wip: update E2E tests for standalone architecture
- fix: add global setup/teardown to E2E test runner
- chore: add test cleanup and LocalStack setup
- chore: finalize E2E test migration and documentation

**New commit message:**
```
test: migrate E2E tests to standalone architecture

- Update E2E tests for standalone extension
- Add global setup/teardown
- Configure LocalStack for testing
- Add test cleanup utilities
- Complete E2E test migration with documentation
```

### 13. Message Attributes Enhancement
**Combines:**
- feat(message-attributes): add support for all AWS SQS data types

**New commit message:**
```
feat: add support for all AWS SQS message attribute types

- Support all 7 AWS SQS data types (String, Number, Binary, etc.)
- Add data type dropdown selector in UI
- Update attribute transformation logic
- Add comprehensive documentation with examples
- Add unit tests for multiple data types
```

### 14. Publishing Documentation (New - Untracked Files)
**New commit:**
```
docs: add extension publishing guide

- Add comprehensive publishing guide
- Add publishing checklist
- Document marketplace setup process
- Include troubleshooting for common issues
```

---

## How to Execute the Rebase

### Step 1: Commit Untracked Files First

```bash
git add vscode-extension/sqs-management-tool/PUBLISHING_CHECKLIST.md
git add vscode-extension/sqs-management-tool/PUBLISHING_GUIDE.md
git commit -m "docs: add extension publishing guide

- Add comprehensive publishing guide
- Add publishing checklist
- Document marketplace setup process
- Include troubleshooting for common issues"
```

### Step 2: Create a Backup Branch

```bash
git branch extension-backup
```

### Step 3: Start Interactive Rebase

```bash
git rebase -i a2893dbf1ee6fa7163d4f1eaecdee7fb4916c484
```

### Step 4: In the Rebase Editor

You'll see all 30 commits (29 + 1 new). Use these commands:
- `pick` - Keep commit as-is
- `squash` (or `s`) - Merge with previous commit
- `reword` (or `r`) - Change commit message
- `fixup` (or `f`) - Merge with previous, discard message

**Example rebase plan:**

```
pick cd9d406 docs: Add comprehensive VS Code extension architecture documentation
squash 042b3c7 docs: Add comprehensive plan for standalone VS Code extension
squash 0fd717b docs: Emphasize visual management for users without Console access
reword <result> docs: add standalone VS Code extension architecture and planning

pick f3793dc feat: Complete Svelte bundle migration for VS Code extension
squash 9199886 button styles
squash 8eddd0d feat: Improve Webview UI, fix CSS, HTML structure
squash 35e26cc feat: Implement VS Code native input for message visibility timeout
reword <result> feat: migrate to Svelte bundle for webview UI

pick 7ef0812 feat: implement SQS service layer with queue operations and unit tests
squash 9a22033 feat: implement SQS message operations with unit tests
squash 6feeae0 feat: Complete Phase 1 - Core AWS Integration
reword <result> feat: implement core AWS SQS integration

pick d9fae5c feat: Complete Phase 2 - Credential Management
squash a5de6bb feat: Improve VS Code extension's AWS profile management
reword <result> feat: implement AWS credential management

pick 5d47761 feat: Complete Phase 3 - Queue Storage and Management
squash c2785eb feat: Implement remove queue functionality
reword <result> feat: implement queue storage and management

pick 90edd26 feat: Complete Phase 4 - Visual Management Interface
squash a5de6bb feat: Implement send message functionality
reword <result> feat: implement visual management interface

pick ae0f0c9 feat: Complete Phase 5 - Error handling and user feedback complete
reword <result> feat: implement error handling and user feedback

pick db5fbb5 feat: Complete Phase 6 - Testing infrastructure setup complete
reword <result> feat: setup testing infrastructure

pick 17eb13f Phase 7: Documentation complete
reword <result> docs: complete extension documentation

pick f33fdf0 fix: webview UI improvements - padding and scrolling
squash e70338c fix: add box-sizing to prevent content overflow
squash 5817dcb fix: consistent padding across all sections
squash 2963a58 fix: auto-dismiss success message after 5 seconds
reword <result> fix: improve webview UI layout and UX

pick 4dcad8b fix: resolve redrive operation issues in standalone extension
reword <result> fix: resolve DLQ redrive operation issues

pick da001b9 wip: update E2E tests for standalone architecture
squash a116eea fix: add global setup/teardown to E2E test runner
squash 111389f chore: add test cleanup and LocalStack setup
squash 7252ff0 chore: finalize E2E test migration and documentation
reword <result> test: migrate E2E tests to standalone architecture

pick 58e38ab feat(message-attributes): add support for all AWS SQS data types
reword <result> feat: add support for all AWS SQS message attribute types

pick <new> docs: add extension publishing guide
```

### Step 5: Save and Close Editor

The rebase will start. For each `reword`, you'll be prompted to edit the commit message.

### Step 6: If Conflicts Occur

```bash
# Fix conflicts in files
git add <resolved-files>
git rebase --continue

# Or abort if needed
git rebase --abort
```

### Step 7: Verify the Result

```bash
# Check commit history
git log --oneline --graph -15

# Compare with backup
git log extension-backup..extension --oneline
```

### Step 8: Force Push (if needed)

```bash
# Only if you've already pushed the branch
git push --force-with-lease origin extension
```

---

## Alternative: Soft Reset and Recommit

If interactive rebase seems complex, here's an easier approach:

### Step 1: Commit Untracked Files

```bash
git add vscode-extension/sqs-management-tool/PUBLISHING_*.md
git commit -m "docs: add publishing guide"
```

### Step 2: Create Backup

```bash
git branch extension-backup
```

### Step 3: Soft Reset to Origin

```bash
git reset --soft a2893dbf1ee6fa7163d4f1eaecdee7fb4916c484
```

This keeps all changes staged but removes commits.

### Step 4: Create New Organized Commits

```bash
# Commit 1: Documentation
git reset HEAD
git add vscode-extension/sqs-management-tool/ARCHITECTURE.md
git add vscode-extension/sqs-management-tool/STANDALONE_*.md
git commit -m "docs: add standalone VS Code extension architecture and planning"

# Commit 2: Svelte Migration
git add frontend/
git add vscode-extension/sqs-management-tool/media/
git commit -m "feat: migrate to Svelte bundle for webview UI"

# Commit 3: Core AWS Integration
git add vscode-extension/sqs-management-tool/src/services/sqs-service.ts
git add vscode-extension/sqs-management-tool/src/services/__tests__/
git commit -m "feat: implement core AWS SQS integration"

# ... continue for each logical group
```

### Step 5: Verify

```bash
git log --oneline -15
git diff extension-backup
```

---

## Recommended Approach

I recommend the **Soft Reset and Recommit** approach because:
1. Easier to control exactly what goes in each commit
2. Less risk of conflicts
3. Can review changes as you commit
4. Can test between commits

## Final Result

After reorganization, you'll have approximately **14 clean, logical commits** instead of 29 small commits.

---

## Need Help?

If you want me to help with the actual rebase, let me know and I can:
1. Generate the exact rebase script
2. Help resolve conflicts
3. Verify the final result
