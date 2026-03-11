# Playwright E2E Testing - Local Setup Guide

This guide covers running the frontend/backend Playwright E2E tests locally.

## Prerequisites

- Java 17+ (for backend)
- Node.js 20+ (for frontend)
- pnpm installed globally
- Docker (optional, for LocalStack if testing with AWS)

## Step-by-Step Local Testing

### 1. Build the Backend

```bash
cd backend
./gradlew bootJar --no-daemon
```

This creates a JAR file in `backend/build/libs/`

### 2. Start the Backend

In a separate terminal:

```bash
cd backend
java -jar build/libs/*.jar --spring.profiles.active=test
```

Or use the Gradle wrapper:

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=test'
```

**Environment variables (if needed):**
```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

**Wait for backend to be ready:**
- Check: `curl http://localhost:8080/actuator/health`
- Should return: `{"status":"UP"}`

### 3. Install Frontend Dependencies

In a new terminal:

```bash
cd frontend
pnpm install
```

### 4. Install Playwright Browsers (First Time Only)

```bash
cd frontend
pnpm exec playwright install --with-deps chromium
```

Or install all browsers:

```bash
pnpm exec playwright install --with-deps
```

### 5. Start Frontend Dev Server

In the same terminal (or a new one):

```bash
cd frontend
pnpm run dev
```

**Wait for frontend to be ready:**
- Check: `curl http://localhost:5173`
- Or open browser: http://localhost:5173

### 6. Run Playwright Tests

In a new terminal:

```bash
cd frontend
pnpm exec playwright test
```

**Run specific browser:**
```bash
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
```

**Run in headed mode (see browser):**
```bash
pnpm exec playwright test --headed
```

**Run specific test file:**
```bash
pnpm exec playwright test tests/e2e/example.spec.ts
```

**Debug mode:**
```bash
pnpm exec playwright test --debug
```

### 7. View Test Report

After tests complete:

```bash
cd frontend
pnpm exec playwright show-report
```

This opens an HTML report in your browser.

## Quick Start Script

Create a script to run everything (save as `run-e2e-tests.sh`):

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building backend...${NC}"
cd backend
./gradlew bootJar --no-daemon
if [ $? -ne 0 ]; then
    echo "Backend build failed"
    exit 1
fi

echo -e "${GREEN}Starting backend...${NC}"
java -jar build/libs/*.jar --spring.profiles.active=test &
BACKEND_PID=$!
cd ..

echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    echo "Attempt $i: Backend not ready yet..."
    sleep 2
done

echo -e "${GREEN}Installing frontend dependencies...${NC}"
cd frontend
pnpm install

echo -e "${GREEN}Starting frontend dev server...${NC}"
pnpm run dev &
FRONTEND_PID=$!

echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -sf http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}Frontend is ready!${NC}"
        break
    fi
    echo "Attempt $i: Frontend not ready yet..."
    sleep 2
done

echo -e "${GREEN}Running Playwright tests...${NC}"
pnpm exec playwright test --project=chromium

# Cleanup
echo -e "${YELLOW}Stopping servers...${NC}"
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null

echo -e "${GREEN}Done!${NC}"
```

Make it executable:
```bash
chmod +x run-e2e-tests.sh
./run-e2e-tests.sh
```

## Troubleshooting

### Backend won't start
- Check if port 8080 is already in use: `lsof -i :8080`
- Kill existing process: `kill -9 <PID>`
- Check Java version: `java -version` (need 17+)

### Frontend won't start
- Check if port 5173 is already in use: `lsof -i :5173`
- Kill existing process: `kill -9 <PID>`
- Clear node_modules: `rm -rf node_modules && pnpm install`

### Playwright tests fail
- Make sure both backend and frontend are running
- Check browser installation: `pnpm exec playwright install --with-deps`
- Run in headed mode to see what's happening: `pnpm exec playwright test --headed`
- Check test output: `pnpm exec playwright show-report`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if backend/frontend are responding
- Run tests one at a time: `pnpm exec playwright test --workers=1`

## Manual Verification

Before running automated tests, verify manually:

1. **Backend health:** http://localhost:8080/actuator/health
2. **Frontend loads:** http://localhost:5173
3. **API works:** 
   ```bash
   curl http://localhost:8080/api/queues
   ```

## CI vs Local Differences

The GitHub Actions workflow (`.github/workflows/e2e.yml`) does the same steps but:
- Uses `ubuntu-latest` runner
- Runs in headless mode
- Only tests Chromium (for speed)
- Has stricter timeouts

To simulate CI locally:
```bash
cd frontend
CI=true pnpm exec playwright test --project=chromium
```
