#!/bin/bash
# Verification script to check if declared features are actually implemented

set -e

echo "🔍 Verifying implementation completeness..."
echo ""

ERRORS=0

# Check commands declared in package.json are implemented
echo "📋 Checking commands..."

COMMANDS=(
    "copyQueueUrl"
    "exportQueues"
    "importQueues"
    "addQueue"
    "removeQueue"
    "refreshQueues"
    "selectQueue"
    "selectAwsProfile"
)

for cmd in "${COMMANDS[@]}"; do
    if grep -q "\"sqs-management-tool.$cmd\"" package.json; then
        if grep -q "registerCommand.*sqs-management-tool.$cmd" src/extension-standalone.ts; then
            echo "  ✅ $cmd: Declared and implemented"
        else
            echo "  ❌ $cmd: Declared but NOT implemented"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

echo ""
echo "🧪 Checking tests..."

# Check if tests compile
if pnpm run compile:e2e > /dev/null 2>&1; then
    echo "  ✅ Tests compile successfully"
else
    echo "  ❌ Tests have compilation errors"
    ERRORS=$((ERRORS + 1))
fi

# Check test results
if [ -f "out/tests/e2e/runTests.js" ]; then
    echo "  ✅ Test runner exists"
else
    echo "  ❌ Test runner not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📦 Checking dependencies..."

# Check if required dependencies are installed
DEPS=(
    "@vscode/test-electron"
    "mocha"
    "chai"
)

for dep in "${DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo "  ✅ $dep: Listed in package.json"
    else
        echo "  ❌ $dep: Missing from package.json"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "📝 Checking documentation..."

# Check if key documentation exists
DOCS=(
    "tests/e2e/README.md"
    "tests/e2e/TEST_STATUS.md"
    "E2E_TEST_FINAL_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc: Exists"
    else
        echo "  ❌ $doc: Missing"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "═══════════════════════════════════════"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS issue(s)"
    exit 1
fi
