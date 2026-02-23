# Testing Guide

## Prerequisites

1. **Java 21+** installed
2. **Node.js 18+** installed
3. **AWS Credentials** configured (one of):
   - Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - AWS CLI profile: `~/.aws/credentials`

## Backend Testing

### Run Unit Tests
```bash
cd backend
./gradlew test
```

Expected: All 23 tests should pass ✅

### Start Backend Server
```bash
cd backend
./gradlew bootRun
```

Expected output:
```
===========================================
SQS Management Tool is running!
Access URL: http://localhost:8080
===========================================
```

### Test Backend API (Optional)
With backend running, test endpoints:

```bash
# Test credentials
curl http://localhost:8080/api/config/test-credentials

# Get profiles
curl http://localhost:8080/api/config/profiles

# Get queues (should be empty initially)
curl http://localhost:8080/api/queues
```

## Frontend Testing

### Install Dependencies
```bash
cd frontend
npm install
```

### Start Dev Server
```bash
npm run dev
```

Expected output:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Access Application
Open browser to: `http://localhost:5173`

## Integration Testing

With both backend and frontend running:

### 1. Test Queue Addition
- Backend should be accessible at `http://localhost:8080`
- Frontend should be accessible at `http://localhost:5173`
- Frontend should be able to call backend APIs (CORS configured)

### 2. Test with Real AWS Queue (if available)
If you have an SQS queue:
1. Add queue by name or URL
2. View queue attributes
3. Send/receive messages
4. Test redrive operations (if DLQ configured)

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9
```

**Database errors:**
- Database is created at `./data/sqs-management.db`
- Delete it to reset: `rm -rf ./data/`

**AWS credential errors:**
```bash
# Check AWS CLI configuration
aws configure list

# Test credentials
aws sts get-caller-identity
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Kill process
lsof -ti:5173 | xargs kill -9
```

**CORS errors:**
- Ensure backend is running on port 8080
- Check backend CORS configuration in `application.properties`

**Module not found errors:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Quick Start (Both Services)

### Terminal 1 - Backend
```bash
cd backend && ./gradlew bootRun
```

### Terminal 2 - Frontend
```bash
cd frontend && npm install && npm run dev
```

### Terminal 3 - Tests
```bash
# Backend tests
cd backend && ./gradlew test

# Frontend tests (when implemented)
cd frontend && npm test
```

## Next Steps

Currently implemented:
- ✅ Backend API (all endpoints)
- ✅ Backend tests (23 passing)
- ✅ Frontend API client
- ✅ Frontend state management
- ⏳ Frontend UI components (in progress)

To fully test the application, we need to complete the UI components (Tasks 13-20).
