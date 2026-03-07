# Security Guidelines

## Credential Protection

This extension implements multiple layers of security to protect AWS credentials from exposure.

### 1. Credential Storage

- **SecretStorage**: AWS credentials entered manually are stored in VS Code's SecretStorage API, which provides encrypted storage
- **Never in GlobalState**: Credentials are NEVER stored in GlobalState or WorkspaceState (unencrypted)
- **Never in logs**: Credentials are NEVER logged to the Output panel or Debug Console

### 2. Credential Sanitization

All logging goes through the `SafeLogger` utility (`src/utils/logger.ts`) which automatically sanitizes:
- AWS Access Key IDs (AKIA...)
- AWS Secret Access Keys
- AWS Session Tokens
- Any field with names like: `accessKeyId`, `secretAccessKey`, `sessionToken`, `password`, `secret`, `token`, `credential`, `auth`

**Usage:**
```typescript
import { log, error } from './utils/logger';

// Safe - credentials will be automatically redacted
log('User data:', userData);
error('Operation failed:', errorObject);
```

### 3. Webview Isolation

The webview is completely isolated from credentials:

- **No credentials in postMessage**: The extension NEVER sends credentials to the webview via `postMessage`
- **All AWS operations in Extension Host**: AWS SDK operations are performed exclusively in the Extension Host (Node.js process)
- **Only results sent to webview**: The webview only receives operation results (messages, success/error status)

**Architecture:**
```
┌─────────────────────────────────────┐
│ Extension Host (Node.js)            │
│ - Has access to credentials         │
│ - Performs AWS SDK operations       │
│ - Sanitizes all logs                │
└──────────────┬──────────────────────┘
               │ postMessage (no credentials)
               │ - messages
               │ - success/error status
               │ - queue metadata
               ▼
┌─────────────────────────────────────┐
│ Webview (Sandboxed)                 │
│ - NO access to credentials          │
│ - NO direct AWS SDK access          │
│ - Only displays data from host      │
└─────────────────────────────────────┘
```

### 4. Code Review Checklist

When adding new code, ensure:

- [ ] All `console.log/error/warn` calls use `SafeLogger` from `utils/logger.ts`
- [ ] No credentials are passed to `panel.webview.postMessage()`
- [ ] Credentials are only stored in `SecretStorage`, never in `GlobalState`
- [ ] Error messages don't expose credentials (use `sanitizeError()`)
- [ ] New credential-related fields are added to sanitizer patterns

### 5. Testing Credential Security

The extension includes property-based tests to verify:

- **Property 26**: Credentials never appear in logs
- **Property 27**: Credentials never appear in postMessage calls

Run tests:
```bash
npm test
```

### 6. Reporting Security Issues

If you discover a security vulnerability, please report it privately to the maintainers. Do not open a public issue.

## Best Practices

### DO:
✅ Use `SafeLogger` for all logging
✅ Store credentials in `SecretStorage`
✅ Perform AWS operations in Extension Host
✅ Send only operation results to webview
✅ Sanitize error messages before displaying

### DON'T:
❌ Use `console.log/error` directly
❌ Store credentials in `GlobalState` or `WorkspaceState`
❌ Send credentials via `postMessage`
❌ Log raw error objects without sanitization
❌ Display credentials in UI or notifications
