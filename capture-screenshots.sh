#!/bin/bash

# capture-screenshots.sh
# Runs specific e2e tests to capture screenshots for README.md

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Screenshot Capture for README.md                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ensure we're in the frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    pnpm install
fi

# Check if Playwright browsers are installed
if ! pnpm exec playwright install --dry-run 2>&1 | grep -q "chromium"; then
    echo -e "${YELLOW}Installing Playwright browsers (first time only)...${NC}"
    pnpm exec playwright install --with-deps chromium
fi

echo -e "${GREEN}Running screenshot capture tests...${NC}"
echo -e "${YELLOW}This will:${NC}"
echo -e "  - Start the frontend dev server (if not running)"
echo -e "  - Run screenshot tests"
echo -e "  - Save screenshots to docs/screenshots/"
echo ""

# Run the screenshot tests
pnpm exec playwright test screenshots-for-readme.spec.ts --project=chromium

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ Screenshots captured successfully!                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Screenshots saved to:${NC} docs/screenshots/"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Review the screenshots in docs/screenshots/"
    echo "  2. Update README.md to include them"
    echo "  3. Commit the screenshots to git"
    echo ""
    
    # List captured screenshots
    echo -e "${GREEN}Captured screenshots:${NC}"
    if [ -d "../docs/screenshots" ]; then
        ls -lh ../docs/screenshots/*.png 2>/dev/null || echo "No screenshots found"
    fi
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ Screenshot capture failed                         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Check the test output above for errors.${NC}"
    echo -e "${YELLOW}You can also run in headed mode to debug:${NC}"
    echo "  pnpm exec playwright test screenshots-for-readme.spec.ts --headed"
fi
