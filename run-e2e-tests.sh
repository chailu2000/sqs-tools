#!/bin/bash

# run-e2e-tests.sh
# Orchestrates backend startup and Playwright test execution locally.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Building backend...${NC}"
cd backend
./gradlew bootJar --no-daemon
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}Starting backend...${NC}"
# Clear and recreate data directory for a clean slate
rm -rf data
mkdir -p data
# Start backend in background
java -jar build/libs/*.jar --spring.profiles.active=test > backend-test.log 2>&1 &
BACKEND_PID=$!

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID 2>/dev/null
}
trap cleanup EXIT

echo -e "${YELLOW}Waiting for backend to be ready (http://localhost:8080/api/queues)...${NC}"
READY=0
for i in {1..30}; do
    if curl -sf http://localhost:8080/api/queues > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        READY=1
        break
    fi
    echo -ne "Attempt $i/30: Backend not ready yet...\r"
    sleep 2
done

if [ $READY -ne 1 ]; then
    echo -e "\n${RED}Backend failed to start within 60 seconds.${NC}"
    echo "Last 20 lines of backend-test.log:"
    tail -n 20 backend-test.log
    exit 1
fi

echo -e "\n${GREEN}Running Playwright tests...${NC}"
cd ../frontend
pnpm exec playwright test "$@"
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Tests passed!${NC}"
else
    echo -e "${RED}Tests failed with exit code $TEST_EXIT_CODE${NC}"
fi

exit $TEST_EXIT_CODE
