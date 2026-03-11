#!/bin/bash
set -e

echo "🧪 Testing CI workflow steps locally..."
echo ""

# Navigate to extension directory
cd vscode-extension/sqs-management-tool

echo "✅ Step 1: Check pnpm-lock.yaml exists"
if [ -f "pnpm-lock.yaml" ]; then
    echo "   ✓ pnpm-lock.yaml found"
else
    echo "   ✗ pnpm-lock.yaml NOT found"
    exit 1
fi

echo ""
echo "✅ Step 2: Test pnpm install with frozen lockfile"
pnpm install --frozen-lockfile
echo "   ✓ Dependencies installed successfully"

echo ""
echo "✅ Step 3: Check if LocalStack docker-compose file exists"
if [ -f "tests/e2e/config/docker-compose.localstack.yml" ]; then
    echo "   ✓ docker-compose.localstack.yml found"
else
    echo "   ✗ docker-compose.localstack.yml NOT found"
    exit 1
fi

echo ""
echo "✅ Step 4: Start LocalStack (optional - press Ctrl+C to skip)"
read -t 5 -p "   Start LocalStack? (auto-skip in 5s) [y/N]: " response || response="n"
if [[ "$response" =~ ^[Yy]$ ]]; then
    docker compose -f tests/e2e/config/docker-compose.localstack.yml up -d
    echo "   ✓ LocalStack started"
    
    echo ""
    echo "✅ Step 5: Wait for LocalStack health check"
    for i in {1..30}; do
        if curl -s http://localhost:4566/_localstack/health | grep -q '"sqs": "available"'; then
            echo "   ✓ LocalStack is ready!"
            break
        fi
        echo "   Attempt $i: waiting..."
        sleep 2
    done
    
    echo ""
    echo "✅ Step 6: Run E2E tests"
    export AWS_ENDPOINT_URL=http://localhost:4566
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    export AWS_REGION=us-east-1
    export CI=true
    
    pnpm run test:e2e:ci
    
    echo ""
    echo "🧹 Cleanup: Stopping LocalStack"
    docker compose -f tests/e2e/config/docker-compose.localstack.yml down
else
    echo "   ⊘ Skipped LocalStack and tests"
fi

echo ""
echo "🎉 All CI workflow steps validated successfully!"
