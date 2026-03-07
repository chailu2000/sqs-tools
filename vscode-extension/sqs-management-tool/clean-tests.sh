#!/bin/bash
# Clean all E2E test artifacts for a fresh start

echo "🧹 Cleaning E2E test artifacts..."

rm -rf test-results && echo "  ✓ Removed test-results/"
rm -rf .test-workspace && echo "  ✓ Removed .test-workspace/"
rm -rf .vscode-test && echo "  ✓ Removed .vscode-test/"
rm -rf out/tests && echo "  ✓ Removed out/tests/"

echo "✨ Clean! Ready for fresh test run."
echo ""
echo "Run tests with: pnpm run test:e2e"
