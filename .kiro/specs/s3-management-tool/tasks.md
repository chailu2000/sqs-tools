# Implementation Plan: S3 Management Tool

## Overview

Standalone VS Code extension for managing AWS S3 buckets and objects. Follows the same architectural patterns as the SQS Management Tool: no backend server, AWS SDK v3, SecretStorage for credentials, GlobalState for persistence, and a tree view as the primary navigation surface. TypeScript throughout, Jest for unit/property tests, LocalStack for E2E.

## Tasks

- [x] 1. Project scaffolding and core types
  - Create `vscode-extension/s3-management-tool/` directory mirroring the SQS tool layout: `src/aws/`, `src/commands/`, `src/models/`, `src/services/`, `src/utils/`, `src/views/`, `src/tests/`
  - Write `package.json` with VS Code engine `^1.88.0`, activation event `onView:s3ManagementBuckets`, main `./out/extension-standalone.js`, and dependencies: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/credential-providers`, `@aws-sdk/client-sts`; devDependencies: `fast-check`, `jest`, `ts-jest`, `esbuild`, `typescript`, `@types/vscode`, `@types/node`
  - Write `tsconfig.json` and `jest.config.js` matching the SQS tool configuration
  - Write `src/models/s3-models.ts` defining all shared interfaces: `BucketConfig`, `SyncProfile`, `SyncResult`, `SyncError`, `ObjectMetadata`, `ObjectSummary`, `ListObjectsPage`, `SyncOptions`, `VersioningStatus`, `ValidationResult`, `BucketSummary`, `S3ToolError`
  - Write `src/utils/logger.ts` (thin wrapper around VS Code output channel, same pattern as SQS tool)
  - Write `src/utils/webview-sanitizer.ts` — `sanitizeForWebview` strips any field named `accessKeyId`, `secretAccessKey`, or `sessionToken` from postMessage payloads
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Input validators and utility functions
  - [x] 2.1 Implement `src/utils/validation.ts` with four exported functions:
    - `validateBucketName(name: string): ValidationResult` — rejects names outside 3–63 chars, containing uppercase, starting/ending with hyphen, or containing characters other than lowercase letters, numbers, and hyphens
    - `validateArn(arn: string): ValidationResult` — accepts only `arn:aws:s3:::<bucket-name>` format
    - `validateObjectKey(key: string): ValidationResult` — rejects keys containing null bytes or whose UTF-8 byte length exceeds 1024
    - `normalizePrefix(prefix: string): string` — appends `/` if non-empty and not already ending with `/`; idempotent
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [x]* 2.2 Write property test for `validateBucketName` (Property 5)
    - **Property 5: Bucket name validation rejects invalid names**
    - **Validates: Requirements 19.1**
    - Use `fc.string()` to generate arbitrary strings; assert validator result matches S3 naming rules exactly
    - Tag: `// Feature: s3-management-tool, Property 5: Bucket name validation rejects invalid names`

  - [x]* 2.3 Write property test for ARN round-trip (Property 6)
    - **Property 6: ARN parsing round-trip**
    - **Validates: Requirements 4.2, 19.2**
    - Generate valid bucket names with `fc.stringMatching(/^[a-z][a-z0-9-]{1,61}[a-z0-9]$/)`, construct ARN, parse, re-format, assert equality
    - Tag: `// Feature: s3-management-tool, Property 6: ARN parsing round-trip`

  - [x]* 2.4 Write property test for `validateObjectKey` (Property 11)
    - **Property 11: Object key UTF-8 length validation**
    - **Validates: Requirements 19.3**
    - Generate strings including null bytes and strings exceeding 1024 UTF-8 bytes; assert validator rejects iff null byte present or byte length > 1024
    - Tag: `// Feature: s3-management-tool, Property 11: Object key UTF-8 length validation`

  - [x]* 2.5 Write property test for `normalizePrefix` idempotency (Property 12)
    - **Property 12: Prefix normalization is idempotent**
    - **Validates: Requirements 19.4**
    - Generate arbitrary strings; assert `normalizePrefix(normalizePrefix(s)) === normalizePrefix(s)`
    - Tag: `// Feature: s3-management-tool, Property 12: Prefix normalization is idempotent`

- [x] 3. CredentialProvider and S3ClientFactory
  - [x] 3.1 Implement `src/services/credential-provider.ts`
    - Priority chain: env vars → AWS profile file (`~/.aws/credentials`) → SecretStorage → IAM role
    - Expose `getCredentials(profile?)`, `storeCredentials`, `clearCredentials`, `listProfiles`
    - Never expose raw credentials to callers outside the service
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [x] 3.2 Implement `src/aws/client-factory.ts` as `S3ClientFactory`
    - Cache one `S3Client` per region; `getClient(region)` returns cached or creates new
    - `updateCredentials(credentials)` disposes all cached clients and recreates with new credentials
    - `dispose()` destroys all cached clients
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [x]* 3.3 Write unit tests for `S3ClientFactory`
    - Test cache hit returns same instance; cache miss creates new client; `updateCredentials` clears cache
    - _Requirements: 20.1, 20.4_

  - [x]* 3.4 Write unit tests for `CredentialProvider`
    - Test priority chain, SecretStorage store/retrieve, profile listing
    - _Requirements: 2.1, 2.2_

- [x] 4. BucketStorage
  - [x] 4.1 Implement `src/services/bucket-storage.ts`
    - Persist `BucketConfig[]` and `SyncProfile[]` in VS Code `globalState` under separate keys
    - `addBucket` rejects duplicates (same name + region) with an informational error
    - `removeBucket(id)` deletes only the config record — no AWS API calls
    - Full CRUD for `SyncProfile`: `addSyncProfile`, `updateSyncProfile`, `deleteSyncProfile`, `getSyncProfiles`
    - _Requirements: 4.5, 4.6, 4.7, 16.2, 16.4_

  - [x]* 4.2 Write unit tests for `BucketStorage`
    - Test add/remove/duplicate detection; sync profile CRUD; persistence across calls
    - _Requirements: 4.5, 4.6, 4.7, 16.2_

- [x] 5. S3Service — core operations
  - [x] 5.1 Implement `src/services/s3-service.ts` with retry logic and error mapping
    - Implement `src/aws/retry-handler.ts`: exponential backoff for `ThrottlingException` and `ServiceUnavailable`, max 3 retries (delays 1 s, 2 s, 4 s)
    - Map all AWS SDK errors to human-readable `S3ToolError`; never expose raw SDK errors
    - Implement `tryListBuckets()`: calls `ListBuckets`; on `AccessDenied` returns `{ buckets: [], hasPermission: false }`
    - Implement `validateBucketAccess(bucket, prefix?)`: calls `ListObjectsV2` with `MaxKeys: 1`; returns `ValidationResult`
    - Implement `getBucketRegion`, `getBucketVersioning` (graceful `AccessDenied` → `"Unknown"`), `getBucketPolicy` (graceful `NoSuchBucketPolicy` → `null`)
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 23.1, 23.2, 23.4_

  - [x] 5.2 Implement object listing in `S3Service`
    - `listObjects(bucket, prefix, continuationToken?)`: calls `ListObjectsV2` with `Delimiter: '/'`; follows `NextContinuationToken` for pagination
    - Enforce prefix scope: prepend `BucketConfig.prefix` to all listing calls; restrict results to keys beginning with configured prefix
    - On `AccessDenied` return a result that the tree provider renders as an error node
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 18.1, 18.5_

  - [x] 5.3 Implement object CRUD operations in `S3Service`
    - `getObject(bucket, key)`: calls `GetObject`, returns readable stream
    - `putObject(bucket, key, body, contentType?)`: calls `PutObject`
    - `putObjectMultipart(bucket, key, filePath, onProgress)`: uses multipart upload for files > 5 MB
    - `deleteObject(bucket, key)`: calls `DeleteObject`
    - `copyObject(srcBucket, srcKey, dstBucket, dstKey)`: calls `CopyObject`; uses destination bucket's regional client for cross-region copies
    - `headObject(bucket, key)`: calls `HeadObject`, returns `ObjectMetadata`
    - `getPresignedUrl(bucket, key, expirySeconds)`: uses `@aws-sdk/s3-request-presigner` `getSignedUrl`
    - All methods enforce prefix scope via `validateBucketAccess` guard before making the API call
    - _Requirements: 7.2, 8.3, 9.2, 10.2, 10.3, 11.1, 12.2, 18.1, 18.2, 18.3_

  - [x]* 5.4 Write unit tests for `S3Service`
    - Test `tryListBuckets` with `AccessDenied` returns empty list with `hasPermission: false`
    - Test `validateBucketAccess` success and failure paths
    - Test retry logic: mock 2 throttle errors then success; assert 3 total calls
    - Test prefix scope enforcement: key outside prefix returns error, zero AWS calls made
    - _Requirements: 3.1, 3.2, 23.1, 23.2_

  - [x]* 5.5 Write property test for prefix scope enforcement (Property 4)
    - **Property 4: Prefix scope enforcement — no out-of-scope keys reach the API**
    - **Validates: Requirements 18.1, 18.2, 18.3**
    - Generate random `BucketConfig` with non-empty prefix and random object keys; assert keys not starting with prefix never reach mock S3 client
    - Tag: `// Feature: s3-management-tool, Property 4: Prefix scope enforcement — no out-of-scope keys reach the API`

- [x] 6. Checkpoint — core services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. S3TreeProvider
  - [x] 7.1 Implement `src/views/s3-tree-provider.ts`
    - Implement `vscode.TreeDataProvider<S3TreeItem>` with three node types: `S3BucketItem` (`contextValue: 's3Bucket'`), `S3PrefixItem` (`contextValue: 's3Prefix'`), `S3ObjectItem` (`contextValue: 's3Object'`), and `S3ErrorItem` (`contextValue: 's3Error'`)
    - `getChildren(undefined)` returns bucket nodes from `BucketStorage`; `getChildren(bucket)` calls `S3Service.listObjects` lazily
    - `getChildren(prefix)` calls `S3Service.listObjects` with the prefix as the `Prefix` parameter
    - Object nodes display key name, size, and last-modified date as `description`
    - `refresh(item?)` fires `onDidChangeTreeData` for the given item or the full tree
    - When no buckets are configured, the welcome view (defined in `package.json` `viewsWelcome`) handles the empty state — `getChildren` returns `[]`
    - _Requirements: 1.3, 1.4, 6.1, 6.2, 6.5, 6.6, 18.5_

  - [x]* 7.2 Write unit tests for `S3TreeProvider`
    - Test empty state returns `[]`; test bucket node expansion calls `listObjects`; test error node rendered on `AccessDenied`
    - _Requirements: 1.4, 6.5_

- [x] 8. Bucket management commands
  - [x] 8.1 Implement `src/commands/add-bucket-by-name.ts`
    - Prompt for bucket name (validate with `validateBucketName`) and region; call `S3Service.validateBucketAccess`; on success call `BucketStorage.addBucket` and refresh tree
    - On `AccessDenied` display error with required permissions; do not add bucket
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 4.1_

  - [x] 8.2 Implement `src/commands/add-bucket-by-arn.ts`
    - Validate ARN format with `validateArn`; parse bucket name; prompt for region; call `validateBucketAccess`; add to storage
    - On invalid ARN format display descriptive error and abort
    - _Requirements: 4.2, 4.3_

  - [x] 8.3 Implement `src/commands/add-bucket-with-prefix.ts`
    - Prompt for bucket name, region, and prefix; normalize prefix with `normalizePrefix`; call `validateBucketAccess(bucket, prefix)`; add to storage
    - _Requirements: 4.4, 19.4_

  - [x] 8.4 Implement `src/commands/remove-bucket.ts`
    - Show confirmation dialog; call `BucketStorage.removeBucket(id)`; refresh tree; no AWS API calls
    - _Requirements: 4.7_

  - [x] 8.5 Implement `src/commands/select-profile.ts`
    - List AWS profiles from `CredentialProvider.listProfiles` plus a manual entry option
    - On profile selection call `CredentialProvider.storeCredentials`; update `S3ClientFactory` credentials; refresh tree
    - On manual entry prompt for Access Key ID (plain) and Secret Access Key (password-masked)
    - Update status bar after credential change
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 8.6 Implement `src/commands/refresh-buckets.ts`
    - Calls `treeProvider.refresh()` and optionally re-runs auto-discovery
    - _Requirements: 1.1_

- [x] 9. Object operation commands
  - [x] 9.1 Implement `src/commands/download-object.ts`
    - Open save dialog pre-populated with the object's filename (last segment of key)
    - Stream `S3Service.getObject` response to the selected path using VS Code progress notification
    - On failure display error and do not leave a partial file
    - On success display notification with local path
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.2 Implement `src/commands/upload-object.ts`
    - Open file picker (multi-select); prompt for destination prefix (default: currently selected prefix)
    - Use `putObjectMultipart` for files > 5 MB, `putObject` otherwise
    - Show progress notification with filename and percentage
    - On completion refresh the affected prefix node
    - Prepend configured prefix scope to all destination keys
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 9.3 Implement `src/commands/delete-object.ts`
    - Show confirmation dialog with full object key
    - Call `S3Service.deleteObject`; on success remove node from tree without full refresh
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 9.4 Implement `src/commands/copy-object.ts`
    - Prompt for destination bucket name and destination key
    - Call `S3Service.copyObject`; use destination bucket's regional client for cross-region copies
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 9.5 Implement `src/commands/view-metadata.ts`
    - Call `S3Service.headObject`; open webview panel displaying size, last modified, content type, ETag, storage class, and user-defined metadata
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 9.6 Implement `src/commands/generate-presigned-url.ts`
    - Prompt for expiry in minutes (default 60, max 10080); validate range
    - Call `S3Service.getPresignedUrl`; copy URL to clipboard; show notification with expiry time
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x]* 9.7 Write property test for presigned URL expiry validation (Property 10)
    - **Property 10: Presigned URL expiry validation**
    - **Validates: Requirements 12.1, 12.4**
    - Generate random integers; assert validation rejects > 10080 and accepts 1–10080
    - Tag: `// Feature: s3-management-tool, Property 10: Presigned URL expiry validation`

- [x] 10. Checkpoint — object operations complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. SyncService — checksum and core sync
  - [x] 11.1 Implement `src/services/sync-service.ts` — checksum utilities
    - `computeLocalMd5(filePath: string): Promise<string>` — reads file with Node.js `fs` streams, computes MD5 using `crypto` module, returns hex string
    - `normalizeEtag(etag: string): string` — strips surrounding double-quotes from S3 ETag
    - `isMultipartEtag(etag: string): boolean` — returns `true` if ETag contains a `-` suffix
    - `matchesExcludePattern(filePath: string, patterns: string[]): boolean` — tests file path against glob patterns
    - _Requirements: 21.1, 21.2, 21.4_

  - [x]* 11.2 Write property test for ETag normalization (Property 2)
    - **Property 2: ETag normalization strips quotes**
    - **Validates: Requirements 21.2**
    - Generate random hex strings with/without surrounding double-quotes; assert `normalizeEtag` always returns bare hex string
    - Tag: `// Feature: s3-management-tool, Property 2: ETag normalization strips quotes`

  - [x]* 11.3 Write property test for multipart ETag detection (Property 3)
    - **Property 3: Multipart ETags are never compared as MD5**
    - **Validates: Requirements 21.4**
    - Generate ETags with `-N` suffix; assert `isMultipartEtag` returns `true` and sync decision is `download`
    - Tag: `// Feature: s3-management-tool, Property 3: Multipart ETags are never compared as MD5`

  - [x]* 11.4 Write property test for exclude pattern filtering (Property 7)
    - **Property 7: Exclude pattern filtering is consistent**
    - **Validates: Requirements 13.7, 14.7**
    - Generate random file path lists and glob patterns; assert the matched and unmatched sets are exhaustive and disjoint (no path in both, all paths in one)
    - Tag: `// Feature: s3-management-tool, Property 7: Exclude pattern filtering is consistent`

  - [x] 11.5 Implement `syncLocalToS3` in `SyncService`
    - Walk local directory recursively; compute MD5 for each file; compare against S3 ETag (via `listObjects`); upload only changed files
    - Respect `dryRun`: compute plan but make zero S3 API calls
    - Respect `deleteMissing`: delete S3 objects with no local counterpart
    - Apply exclude patterns; report progress via `onProgress` callback; record per-file errors in `SyncResult` and continue
    - Handle cancellation via `CancellationToken`
    - Prepend configured prefix scope to all S3 keys
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 18.4_

  - [x]* 11.6 Write property test for dry-run produces zero mutations (Property 8)
    - **Property 8: Dry-run produces zero AWS mutations**
    - **Validates: Requirements 13.6, 14.6**
    - Generate random local file lists and S3 object lists; run `syncLocalToS3` and `syncS3ToLocal` with `dryRun: true`; assert zero calls to `putObject`, `deleteObject`, `getObject` on mock S3 service; assert returned plan is non-empty when files differ
    - Tag: `// Feature: s3-management-tool, Property 8: Dry-run produces zero AWS mutations`

  - [x]* 11.7 Write property test for checksum round-trip (Property 1)
    - **Property 1: Checksum round-trip — unchanged file is classified as skipped**
    - **Validates: Requirements 21.1, 21.2, 21.3**
    - Generate random file content; compute MD5; mock S3 ETag to match; assert sync classifies file as `skipped` (not `uploaded`)
    - Tag: `// Feature: s3-management-tool, Property 1: Checksum round-trip — unchanged file is classified as skipped`

  - [x] 11.8 Implement `syncS3ToLocal` in `SyncService`
    - List all objects under source prefix; compare ETag against local MD5; download only changed objects
    - Preserve S3 key structure as local directory structure relative to sync root
    - Treat multipart ETags as always requiring re-download
    - Respect `dryRun`, `deleteMissing`, exclude patterns, cancellation, and prefix scope
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 21.4_

  - [x]* 11.9 Write unit tests for `SyncService` checksum utilities
    - Test `computeLocalMd5` against known fixture files; test `normalizeEtag` with quoted/unquoted inputs; test `deleteMissing` behavior
    - _Requirements: 21.1, 21.2_

- [x] 12. SyncService — bidirectional sync and conflict detection
  - [x] 12.1 Implement `syncBidirectional` in `SyncService`
    - Compare local files and S3 objects against `SyncProfile.lastSyncAt`
    - Classify each file as exactly one of: `local-only`, `remote-only`, `unchanged`, `local-newer`, `remote-newer`, or `conflicted`
    - Apply conflict strategy: `keep-local` uploads local; `keep-remote` downloads remote; `keep-both` renames local with conflict suffix and downloads remote; `skip` records conflict in `SyncResult`
    - Update `SyncProfile.lastSyncAt` after successful completion
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [x]* 12.2 Write property test for conflict classification (Property 9)
    - **Property 9: Conflict classification covers all cases**
    - **Validates: Requirements 15.2**
    - Generate random `(localMtime, remoteMtime, lastSyncAt)` triples; assert classification is always exactly one of the six valid values — never `undefined`, never two simultaneously
    - Tag: `// Feature: s3-management-tool, Property 9: Conflict classification covers all cases`

  - [x]* 12.3 Write unit tests for bidirectional sync conflict strategies
    - Test each of the four conflict strategies with a concrete conflicted file scenario
    - _Requirements: 15.4, 15.5, 15.6, 15.7_

- [x] 13. Sync commands, profiles, and watch mode
  - [x] 13.1 Implement `src/commands/sync-local-to-s3.ts`
    - Prompt for local directory and destination S3 bucket/prefix; build `SyncOptions`; call `SyncService.syncLocalToS3` with VS Code progress notification and cancellation token
    - Display `SyncResult` summary on completion (info if no errors, warning if errors present)
    - _Requirements: 13.1, 13.8, 13.10, 22.3_

  - [x] 13.2 Implement `src/commands/sync-s3-to-local.ts`
    - Prompt for source S3 bucket/prefix and local destination directory; call `SyncService.syncS3ToLocal`
    - _Requirements: 14.1, 22.3_

  - [x] 13.3 Implement `src/commands/sync-bidirectional.ts`
    - Prompt for local directory, S3 bucket/prefix, and conflict strategy; call `SyncService.syncBidirectional`
    - _Requirements: 15.1_

  - [x] 13.4 Implement sync profile commands in `src/commands/sync-profiles.ts`
    - `createSyncProfile`: prompt for all `SyncProfile` fields; validate; persist via `BucketStorage.addSyncProfile`
    - `runSyncProfile`: show QuickPick of saved profiles; execute selected profile's sync without re-prompting
    - `editSyncProfile`: show profile list; prompt for updated fields; call `BucketStorage.updateSyncProfile`
    - `deleteSyncProfile`: show profile list with confirmation; call `BucketStorage.deleteSyncProfile`
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 13.5 Implement `src/commands/watch-mode.ts`
    - `startWatchMode`: prompt for local directory and S3 bucket/prefix (or select from saved profile); create `vscode.workspace.createFileSystemWatcher`; debounce file change events by 500 ms before uploading; show status bar indicator "S3 Watch: Active [path]"
    - On file deletion with `deleteMissing` enabled, call `S3Service.deleteObject`
    - On upload failure show error notification but keep watcher active
    - `stopWatchMode`: dispose watcher; remove status bar indicator
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [x] 13.6 Implement `src/commands/view-sync-results.ts`
    - Register a command that opens a read-only VS Code output channel displaying the full `SyncResult` detail including all `SyncError` entries
    - _Requirements: 22.4_

  - [x]* 13.7 Write unit tests for sync profile CRUD commands
    - Test create, run, edit, delete profile commands with mocked `BucketStorage`
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [x] 14. Checkpoint — sync and profiles complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Webview panel for object details
  - [x] 15.1 Implement `src/views/object-details-panel.ts`
    - Create webview panel type `s3ObjectDetails`; send object metadata via `postMessage` on open
    - Handle inbound messages: `downloadObject`, `deleteObject`, `copyObject`, `generatePresignedUrl`, `uploadToPrefix` — delegate to the corresponding command handlers
    - Apply Content Security Policy: `default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https:`
    - Pass all outbound payloads through `sanitizeForWebview` to strip credential fields
    - _Requirements: 11.2, 2.6, 23.3_

  - [x]* 15.2 Write unit tests for `sanitizeForWebview`
    - Test that `accessKeyId`, `secretAccessKey`, and `sessionToken` fields are stripped from nested payloads
    - _Requirements: 2.6_

- [x] 16. Extension entry point and wiring
  - [x] 16.1 Implement `src/extension-standalone.ts`
    - Activate on `onView:s3ManagementBuckets`; initialize `CredentialProvider`, `S3ClientFactory`, `BucketStorage`, `S3Service`, `SyncService`, `S3TreeProvider`
    - Register the tree view with `vscode.window.registerTreeDataProvider('s3ManagementBuckets', treeProvider)`
    - Register all commands from tasks 8, 9, 13, and 15 via `context.subscriptions.push(vscode.commands.registerCommand(...))`
    - Create status bar items: AWS profile indicator (right, priority 100) and watch mode indicator (right, priority 99)
    - Run auto-discovery (`tryListBuckets`) on activation; if `hasPermission: true` and new buckets found, offer to import them
    - `deactivate()` disposes `S3ClientFactory` and any active file watchers
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 2.5_

  - [x] 16.2 Write `package.json` `contributes` section
    - Declare all commands with titles and icons
    - Declare `views.explorer` entry `s3ManagementBuckets` with name "S3 Buckets"
    - Declare `viewsWelcome` for `s3ManagementBuckets` with links to configure credentials and add a bucket
    - Declare `menus.view/title` entries for refresh, add bucket, and credential selection
    - Declare `menus.view/item/context` entries for each `contextValue` (`s3Bucket`, `s3Prefix`, `s3Object`)
    - _Requirements: 1.3, 1.4_

  - [x]* 16.3 Write unit tests for error handling in command handlers
    - Test that unexpected errors display user-friendly messages and log full details to output channel
    - Test that expired credential errors prompt re-configuration
    - _Requirements: 23.3, 23.4, 23.5_

- [x] 17. Checkpoint — extension wired end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. E2E tests with LocalStack
  - [x] 18.1 Set up E2E test infrastructure
    - Create `src/tests/e2e/` directory; write `jest.e2e.config.js` targeting LocalStack endpoint `http://localhost:4566`
    - Write `src/tests/e2e/localstack-helper.ts`: helpers to create/delete test buckets, upload fixture files, and assert S3 object existence using `@aws-sdk/client-s3` directly
    - Write `src/tests/e2e/fixtures/` with small test files (text, binary) for sync tests
    - _Requirements: 1.2_

  - [x] 18.2 Write E2E test: full sync round-trip
    - Upload a local fixture directory to LocalStack S3 via `syncLocalToS3`
    - Verify all objects exist in S3 with correct ETags
    - Sync back to a temp local directory via `syncS3ToLocal`
    - Assert local files are byte-for-byte identical to originals and classified as `unchanged` on a second sync
    - _Requirements: 13.3, 13.4, 14.2, 14.3, 21.3_

  - [x] 18.3 Write E2E test: incremental sync
    - Perform initial sync; modify one fixture file; re-run `syncLocalToS3`
    - Assert only the modified file was uploaded (skipped count = total - 1, uploaded count = 1)
    - _Requirements: 13.4_

  - [x] 18.4 Write E2E test: prefix enforcement
    - Create a `BucketConfig` with a prefix scope; attempt `getObject` with a key outside the prefix
    - Assert the operation returns an error and no S3 API call is made
    - _Requirements: 18.2, 18.3_

  - [x] 18.5 Write E2E test: watch mode upload
    - Start watch mode pointing at a temp directory and LocalStack bucket
    - Write a new file to the watched directory; wait > 500 ms debounce window
    - Assert the file appears in LocalStack S3 with correct content
    - _Requirements: 17.2, 17.3_

- [x] 19. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with `numRuns: 100` and are tagged with `// Feature: s3-management-tool, Property N: ...`
- E2E tests require LocalStack running locally (`docker compose up localstack`)
- The extension follows the SQS Management Tool patterns: same credential chain, same retry handler shape, same webview sanitizer contract
