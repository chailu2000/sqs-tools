# E2E Test Commands

## Web App E2E Tests (Playwright)

### Prerequisites
- Backend and frontend must be running (via docker-compose or manually)
- Backend: http://localhost:8080
- Frontend: http://localhost:5173

### Commands
```bash
# Navigate to frontend directory
cd frontend

# Run all E2E tests
pnpm exec playwright test

# Run specific test file
pnpm exec playwright test tests/e2e/error-handling.spec.ts

# Run with specific browser
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit

# Run in headed mode (visible browser)
pnpm exec playwright test --headed

# Run in debug mode
pnpm exec playwright test --debug

# Run with UI mode (interactive)
pnpm exec playwright test --ui

# Generate HTML report
pnpm exec playwright show-report

# Run specific test by name
pnpm exec playwright test -g "should display error"
```

### Using Docker Compose
```bash
# Start backend and frontend
docker-compose up

# In another terminal, run tests
cd frontend
pnpm exec playwright test
```

---

## VS Code Extension E2E Tests

### Prerequisites
- Extension must be compiled
- Tests use @vscode/test-electron to launch VS Code

### Commands
```bash
# Navigate to extension directory
cd vscode-extension/sqs-management-tool

# Run E2E tests (headless mode)
pnpm run test:e2e

# Run E2E tests with visible VS Code window
pnpm run test:e2e:headed

# Run E2E tests in CI mode
pnpm run test:e2e:ci

# Run E2E tests with coverage
pnpm run test:e2e:coverage

# Run E2E tests with debugging
pnpm run test:e2e:debug

# Compile TypeScript before running tests
pnpm run compile
pnpm run compile:e2e
```

### Test Structure
- Test files: `tests/e2e/**/*.test.ts`
- Test runner: `tests/e2e/runTests.js`
- Fixtures: `tests/e2e/fixtures/`

---

## Quick Start

### Web App E2E
```bash
# Terminal 1: Start services
docker-compose up

# Terminal 2: Run tests
cd frontend && pnpm exec playwright test
```

### Extension E2E
```bash
cd vscode-extension/sqs-management-tool
pnpm run test:e2e:headed
```

---

## Troubleshooting

### Web App Tests
- **Backend not ready**: Ensure backend is running on port 8080
- **Frontend not ready**: Ensure frontend is running on port 5173
- **Test timeout**: Increase timeout in playwright.config.ts
- **AWS credentials**: Tests use mock AWS credentials (test/test)

### Extension Tests
- **Extension not found**: Run `pnpm run compile` first
- **VS Code download fails**: Check internet connection
- **X server error (Linux)**: Install Xvfb or run in headed mode
- **Permission denied**: Check file permissions on test files

---

## CI/CD

### GitHub Actions
- Web App E2E: `.github/workflows/webapp-e2e.yml`
- Extension E2E: `.github/workflows/vscode-extension-e2e.yml`

### Local CI Simulation (using act)
```bash
# Install act: https://github.com/nektos/act

# Run web app E2E workflow
act -j e2e --container-architecture linux/amd64

# Run extension E2E workflow
act -j e2e-tests --container-architecture linux/amd64
```
