#!/bin/bash

# Script to organize commits into logical groups
# This uses the soft reset approach for safety

set -e  # Exit on error

echo "🔄 Git Commit Organization Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "Current branch: ${GREEN}${CURRENT_BRANCH}${NC}"
echo ""

# Confirm with user
echo -e "${YELLOW}⚠️  Warning: This will reorganize your commits${NC}"
echo "This script will:"
echo "  1. Create a backup branch (${CURRENT_BRANCH}-backup)"
echo "  2. Reset to origin HEAD (a2893dbf)"
echo "  3. Create new organized commits"
echo ""
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Step 1: Commit any untracked publishing docs
echo ""
echo "📝 Step 1: Committing untracked files..."
if [ -f "vscode-extension/sqs-management-tool/PUBLISHING_GUIDE.md" ] || [ -f "vscode-extension/sqs-management-tool/PUBLISHING_CHECKLIST.md" ]; then
    git add vscode-extension/sqs-management-tool/PUBLISHING_*.md 2>/dev/null || true
    git commit -m "docs: add extension publishing guide

- Add comprehensive publishing guide
- Add publishing checklist
- Document marketplace setup process
- Include troubleshooting for common issues" || echo "No publishing docs to commit"
fi

# Step 2: Create backup branch
echo ""
echo "💾 Step 2: Creating backup branch..."
BACKUP_BRANCH="${CURRENT_BRANCH}-backup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
echo -e "${GREEN}✓ Backup created: ${BACKUP_BRANCH}${NC}"

# Step 3: Soft reset to origin HEAD
echo ""
echo "🔄 Step 3: Resetting to origin HEAD..."
git reset --soft a2893dbf1ee6fa7163d4f1eaecdee7fb4916c484
echo -e "${GREEN}✓ Reset complete. All changes are staged.${NC}"

# Step 4: Unstage everything
echo ""
echo "📦 Step 4: Unstaging all changes..."
git reset HEAD
echo -e "${GREEN}✓ All changes unstaged.${NC}"

# Now we'll create organized commits
echo ""
echo "📝 Step 5: Creating organized commits..."
echo ""

# Commit 1: Architecture Documentation
echo "Creating commit 1/14: Architecture Documentation..."
git add vscode-extension/sqs-management-tool/ARCHITECTURE.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/STANDALONE_EXTENSION_PLAN.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/README.md 2>/dev/null || true
git commit -m "docs: add standalone VS Code extension architecture and planning

- Add comprehensive architecture documentation
- Document standalone extension approach
- Emphasize visual management for users without AWS Console access" || echo "Skipping commit 1"

# Commit 2: Svelte Bundle Migration
echo "Creating commit 2/14: Svelte Bundle Migration..."
git add frontend/vite.config.extension.ts 2>/dev/null || true
git add frontend/src/main-extension.ts 2>/dev/null || true
git add frontend/src/lib/api-adapter.ts 2>/dev/null || true
git add frontend/src/lib/stores-extension.svelte.ts 2>/dev/null || true
git add frontend/src/lib/components/*Extension.svelte 2>/dev/null || true
git add vscode-extension/sqs-management-tool/media/ 2>/dev/null || true
git commit -m "feat: migrate to Svelte bundle for webview UI

- Complete Svelte bundle migration
- Improve webview UI with proper CSS and HTML structure
- Fix message display logic
- Implement VS Code native inputs
- Add proper button styles" || echo "Skipping commit 2"

# Commit 3: Core AWS Integration
echo "Creating commit 3/14: Core AWS Integration..."
git add vscode-extension/sqs-management-tool/src/services/sqs-service.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/models/sqs-service.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/services/__tests__/sqs-service*.test.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/aws/ 2>/dev/null || true
git commit -m "feat: implement core AWS SQS integration

- Add SQS service layer with queue operations
- Implement message operations (send, receive, delete, visibility)
- Add comprehensive unit tests
- Complete Phase 1 of standalone extension" || echo "Skipping commit 3"

# Commit 4: Credential Management
echo "Creating commit 4/14: Credential Management..."
git add vscode-extension/sqs-management-tool/src/services/credential-provider.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/services/__tests__/credential-provider.test.ts 2>/dev/null || true
git commit -m "feat: implement AWS credential management

- Add support for multiple credential sources
- Implement AWS profile selection
- Add secure credential storage with VS Code SecretStorage
- Improve webview message refresh" || echo "Skipping commit 4"

# Commit 5: Queue Storage and Management
echo "Creating commit 5/14: Queue Storage and Management..."
git add vscode-extension/sqs-management-tool/src/services/queue-storage.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/models/queue-storage.ts 2>/dev/null || true
git commit -m "feat: implement queue storage and management

- Add queue storage with VS Code storage API
- Implement add/remove queue functionality
- Add duplicate queue detection
- Add queue management UI to tree view" || echo "Skipping commit 5"

# Commit 6: Visual Management Interface
echo "Creating commit 6/14: Visual Management Interface..."
git add vscode-extension/sqs-management-tool/src/extension-standalone.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/package.json 2>/dev/null || true
git commit -m "feat: implement visual management interface

- Add queue tree view with region grouping
- Implement message composer with send functionality
- Add message list view with operations
- Complete Phase 4 of standalone extension" || echo "Skipping commit 6"

# Commit 7: Error Handling
echo "Creating commit 7/14: Error Handling..."
git add vscode-extension/sqs-management-tool/src/utils/ 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/exception/ 2>/dev/null || true
git commit -m "feat: implement error handling and user feedback

- Add comprehensive error handling
- Implement user notifications
- Add validation for user inputs
- Complete Phase 5 of standalone extension" || echo "Skipping commit 7"

# Commit 8: Testing Infrastructure
echo "Creating commit 8/14: Testing Infrastructure..."
git add vscode-extension/sqs-management-tool/jest.config.js 2>/dev/null || true
git add vscode-extension/sqs-management-tool/jest.setup.js 2>/dev/null || true
git add vscode-extension/sqs-management-tool/tsconfig.json 2>/dev/null || true
git commit -m "feat: setup testing infrastructure

- Add unit test framework with Jest
- Configure test environment
- Add test utilities and fixtures
- Complete Phase 6 of standalone extension" || echo "Skipping commit 8"

# Commit 9: Documentation
echo "Creating commit 9/14: Documentation..."
git add vscode-extension/sqs-management-tool/TROUBLESHOOTING.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/SECURITY.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/IAM_PERMISSIONS.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/MANUAL_TESTING_GUIDE.md 2>/dev/null || true
git commit -m "docs: complete extension documentation

- Add comprehensive README
- Add troubleshooting guide
- Add security documentation
- Add IAM permissions guide
- Complete Phase 7 of standalone extension" || echo "Skipping commit 9"

# Commit 10: UI Improvements
echo "Creating commit 10/14: UI Improvements..."
git add frontend/src/lib/components/*.svelte 2>/dev/null || true
git add frontend/src/App-extension.svelte 2>/dev/null || true
git commit -m "fix: improve webview UI layout and UX

- Fix padding and scrolling issues
- Add box-sizing to prevent overflow
- Ensure consistent padding across sections
- Auto-dismiss success messages after 5 seconds" || echo "Skipping commit 10"

# Commit 11: Redrive Fixes
echo "Creating commit 11/14: Redrive Operation Fixes..."
git add vscode-extension/sqs-management-tool/src/services/sqs-service.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/extension-standalone.ts 2>/dev/null || true
git commit -m "fix: resolve DLQ redrive operation issues

- Fix message redriving from DLQ to main queue
- Improve error handling in redrive operations
- Add proper progress tracking" || echo "Skipping commit 11"

# Commit 12: E2E Tests
echo "Creating commit 12/14: E2E Test Migration..."
git add vscode-extension/sqs-management-tool/tests/ 2>/dev/null || true
git add vscode-extension/sqs-management-tool/tsconfig.e2e.json 2>/dev/null || true
git add vscode-extension/sqs-management-tool/docker-compose.test.yml 2>/dev/null || true
git add vscode-extension/sqs-management-tool/E2E_TEST*.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/clean-tests.sh 2>/dev/null || true
git commit -m "test: migrate E2E tests to standalone architecture

- Update E2E tests for standalone extension
- Add global setup/teardown
- Configure LocalStack for testing
- Add test cleanup utilities
- Complete E2E test migration with documentation" || echo "Skipping commit 12"

# Commit 13: Message Attributes
echo "Creating commit 13/14: Message Attributes Enhancement..."
git add frontend/src/lib/components/MessageComposer*.svelte 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/extension-standalone.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/src/services/__tests__/sqs-service-verification.test.ts 2>/dev/null || true
git add vscode-extension/sqs-management-tool/MANUAL_TESTING_MESSAGE_ATTRIBUTES.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/QUICK_START_ATTRIBUTES.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/MESSAGE_ATTRIBUTES_DOCS.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/BODY_VS_ATTRIBUTES_EXPLAINED.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/ATTRIBUTE_UI_EXAMPLE.md 2>/dev/null || true
git add MESSAGE_ATTRIBUTES_ENHANCEMENT_SUMMARY.md 2>/dev/null || true
git commit -m "feat: add support for all AWS SQS message attribute types

- Support all 7 AWS SQS data types (String, Number, Binary, etc.)
- Add data type dropdown selector in UI
- Update attribute transformation logic
- Add comprehensive documentation with examples
- Add unit tests for multiple data types" || echo "Skipping commit 13"

# Commit 14: Publishing Documentation
echo "Creating commit 14/14: Publishing Documentation..."
git add vscode-extension/sqs-management-tool/PUBLISHING_GUIDE.md 2>/dev/null || true
git add vscode-extension/sqs-management-tool/PUBLISHING_CHECKLIST.md 2>/dev/null || true
git commit -m "docs: add extension publishing guide

- Add comprehensive publishing guide
- Add publishing checklist
- Document marketplace setup process
- Include troubleshooting for common issues" || echo "Skipping commit 14"

# Commit any remaining files
echo ""
echo "📦 Checking for remaining files..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  There are remaining uncommitted files${NC}"
    git status --short
    echo ""
    read -p "Commit all remaining files? (yes/no): " COMMIT_REMAINING
    if [ "$COMMIT_REMAINING" = "yes" ]; then
        git add .
        git commit -m "chore: add remaining files"
    fi
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ Commit organization complete!${NC}"
echo "=================================="
echo ""
echo "Summary:"
echo "  - Backup branch: ${BACKUP_BRANCH}"
echo "  - New commits: $(git log --oneline a2893dbf1ee6fa7163d4f1eaecdee7fb4916c484..HEAD | wc -l | tr -d ' ')"
echo ""
echo "Next steps:"
echo "  1. Review commits: git log --oneline -15"
echo "  2. Compare with backup: git diff ${BACKUP_BRANCH}"
echo "  3. If satisfied, delete backup: git branch -D ${BACKUP_BRANCH}"
echo "  4. If not satisfied, restore: git reset --hard ${BACKUP_BRANCH}"
echo ""
