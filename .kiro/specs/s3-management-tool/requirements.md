# Requirements Document

## Introduction

The S3 Management Tool is a standalone VS Code extension for managing AWS S3 buckets and objects directly from the IDE. It follows the same architectural patterns as the existing SQS Management Tool but is distributed as a separate extension. A key design principle is permission-aware architecture: the extension must work for users who do not have `s3:ListAllMyBuckets` permission, supporting manual bucket addition by name, ARN, or prefix. The extension supports two access modes — bucket-level and prefix-level — to accommodate both full-access and shared-bucket scenarios. It includes object operations, sync functionality (local ↔ S3), watch mode, and sync profiles.

## Glossary

- **Extension**: The S3 Management Tool VS Code extension
- **S3_Service**: The service layer that communicates with AWS S3 APIs
- **S3_Client_Factory**: The component that creates and caches AWS S3 clients per region
- **Bucket_Storage**: The component that persists bucket configurations in VS Code's global state
- **Sync_Service**: The component that performs incremental file synchronization between local filesystem and S3
- **Sync_Profile**: A named, saved sync configuration pairing a local directory with an S3 bucket/prefix
- **Credential_Provider**: The component that manages AWS credentials using VS Code's SecretStorage
- **Tree_Provider**: The VS Code TreeDataProvider that renders the S3 bucket/object tree view
- **Bucket_Config**: A persisted record representing a user-added S3 bucket, including optional prefix scope
- **Object_Key**: The full path identifier of an S3 object within a bucket
- **Prefix**: An S3 key prefix used to scope access to a subset of objects within a bucket
- **ETag**: The S3 entity tag used as a checksum for object change detection during sync
- **Dry_Run**: A sync execution mode that previews changes without performing any actual transfers or deletions
- **Watch_Mode**: A continuous sync mode that monitors the local filesystem for changes and auto-uploads to S3
- **Conflict**: A sync state where both the local file and the S3 object have been modified since the last sync

---

## Requirements

### Requirement 1: Standalone Extension Setup

**User Story:** As a developer, I want a standalone VS Code extension for S3 management, so that I can manage S3 buckets without installing the SQS tool or any backend server.

#### Acceptance Criteria

1. THE Extension SHALL activate when the S3 bucket tree view is opened in VS Code.
2. THE Extension SHALL operate without any backend server, communicating directly with AWS S3 APIs via the AWS SDK v3.
3. THE Extension SHALL display an S3 Buckets panel in the VS Code Explorer sidebar.
4. WHEN no buckets are configured, THE Tree_Provider SHALL display a welcome message with links to configure AWS credentials and add a bucket.
5. THE Extension SHALL store all configuration data in VS Code's global state, persisted across sessions.

---

### Requirement 2: AWS Credential Management

**User Story:** As a developer, I want to configure AWS credentials within the extension, so that I can authenticate with AWS without leaving VS Code.

#### Acceptance Criteria

1. THE Credential_Provider SHALL store AWS credentials using VS Code's SecretStorage API so that credentials are never written to disk in plaintext.
2. WHEN the user selects an AWS profile, THE Credential_Provider SHALL load credentials from the local AWS credentials file (`~/.aws/credentials`).
3. WHEN the user chooses manual entry, THE Credential_Provider SHALL prompt for Access Key ID and Secret Access Key via password-masked input fields.
4. THE Extension SHALL display the active AWS profile name in the VS Code status bar.
5. IF no credentials are configured, THEN THE Extension SHALL display a warning indicator in the status bar and prompt the user to configure credentials.
6. THE Credential_Provider SHALL never expose raw AWS credentials to any webview panel.

---

### Requirement 3: Permission-Aware Bucket Discovery

**User Story:** As a developer, I want the extension to work even when I lack `s3:ListAllMyBuckets` permission, so that I can manage buckets in restricted enterprise environments.

#### Acceptance Criteria

1. WHEN the extension activates, THE S3_Service SHALL attempt auto-discovery by calling `s3:ListAllMyBuckets`.
2. IF the `s3:ListAllMyBuckets` call returns an `AccessDenied` error, THEN THE S3_Service SHALL return an empty bucket list without throwing an error.
3. THE Extension SHALL allow users to add buckets manually regardless of whether auto-discovery succeeded.
4. WHEN a bucket is added manually, THE S3_Service SHALL validate access by calling `s3:ListObjectsV2` with a `MaxKeys` of 1 to confirm the user has at least read permission.
5. IF the access validation call fails with `AccessDenied`, THEN THE Extension SHALL display an error message stating the required permissions and SHALL NOT add the bucket.
6. IF the access validation call succeeds, THEN THE Extension SHALL add the bucket to the tree view and persist the Bucket_Config.

---

### Requirement 4: Bucket Registration

**User Story:** As a developer, I want to add S3 buckets by name, ARN, or prefix, so that I can manage buckets regardless of how I identify them.

#### Acceptance Criteria

1. WHEN the user invokes "Add Bucket by Name", THE Extension SHALL prompt for a bucket name and AWS region, then validate access and add the bucket.
2. WHEN the user invokes "Add Bucket by ARN", THE Extension SHALL parse the ARN to extract the bucket name and region, then validate access and add the bucket.
3. IF an ARN is provided in an invalid format, THEN THE Extension SHALL display a descriptive error message and SHALL NOT attempt to add the bucket.
4. WHEN the user invokes "Add Bucket with Prefix", THE Extension SHALL prompt for a bucket name, region, and prefix path, then validate that the user can list objects under that prefix.
5. THE Bucket_Storage SHALL persist each Bucket_Config with a unique ID, bucket name, region, optional prefix, and timestamps.
6. IF a bucket with the same name and region already exists in storage, THEN THE Extension SHALL display an informational message and SHALL NOT create a duplicate entry.
7. WHEN the user removes a bucket, THE Bucket_Storage SHALL delete the Bucket_Config from storage without performing any AWS deletion operation.

---

### Requirement 5: Bucket Attributes Display

**User Story:** As a developer, I want to view bucket metadata, so that I can understand the configuration of buckets I manage.

#### Acceptance Criteria

1. WHEN a bucket is selected in the tree view, THE S3_Service SHALL retrieve and display the bucket's region, creation date, and versioning status.
2. THE S3_Service SHALL retrieve versioning status using `s3:GetBucketVersioning`.
3. IF the `s3:GetBucketVersioning` call returns `AccessDenied`, THEN THE Extension SHALL display "Versioning: Unknown (insufficient permissions)" rather than an error.
4. WHEN the user requests bucket policy view, THE S3_Service SHALL retrieve the policy using `s3:GetBucketPolicy` and display it as formatted JSON.
5. IF the `s3:GetBucketPolicy` call returns `NoSuchBucketPolicy`, THEN THE Extension SHALL display "No bucket policy configured".

---

### Requirement 6: Object Listing

**User Story:** As a developer, I want to browse objects in a bucket using a tree view, so that I can navigate the bucket's contents without leaving VS Code.

#### Acceptance Criteria

1. WHEN a bucket node is expanded in the tree view, THE S3_Service SHALL call `s3:ListObjectsV2` to retrieve objects and common prefixes at the bucket root (or configured prefix root).
2. WHEN a prefix node is expanded, THE S3_Service SHALL call `s3:ListObjectsV2` with the selected prefix as the `Prefix` parameter and `/` as the `Delimiter`.
3. THE S3_Service SHALL handle paginated results by following `NextContinuationToken` until all objects are retrieved.
4. WHILE a prefix scope is configured for a bucket, THE S3_Service SHALL restrict all listing operations to keys that begin with the configured prefix.
5. IF a listing call returns `AccessDenied`, THEN THE Extension SHALL display an error node in the tree view with a message indicating insufficient permissions.
6. THE Tree_Provider SHALL display objects with their key name, size, and last-modified date as tree item descriptions.

---

### Requirement 7: Object Download

**User Story:** As a developer, I want to download S3 objects to my local filesystem, so that I can inspect or use object contents locally.

#### Acceptance Criteria

1. WHEN the user invokes "Download Object" on an object node, THE Extension SHALL open a save dialog pre-populated with the object's filename (the last segment of the Object_Key).
2. WHEN a save path is confirmed, THE S3_Service SHALL call `s3:GetObject` and stream the response body to the selected local file path.
3. THE Extension SHALL display a progress notification during download with the object key and transfer status.
4. IF the download fails, THEN THE Extension SHALL display an error message with the failure reason and SHALL NOT create a partial file at the destination path.
5. WHEN the download completes successfully, THE Extension SHALL display a success notification with the local file path.

---

### Requirement 8: Object Upload

**User Story:** As a developer, I want to upload local files to S3, so that I can store and share files without leaving VS Code.

#### Acceptance Criteria

1. WHEN the user invokes "Upload Object", THE Extension SHALL open a file picker dialog allowing selection of one or more local files.
2. WHEN files are selected, THE Extension SHALL prompt for a destination prefix within the bucket (defaulting to the currently selected prefix).
3. THE S3_Service SHALL use multipart upload for files larger than 5 MB to ensure reliable transfer of large files.
4. THE Extension SHALL display a progress notification during upload showing the filename and percentage complete.
5. IF an upload fails, THEN THE Extension SHALL display an error message with the filename and failure reason.
6. WHEN all uploads complete, THE Tree_Provider SHALL refresh the affected prefix node to show the newly uploaded objects.
7. WHILE a prefix scope is configured, THE S3_Service SHALL prepend the configured prefix to all upload destination keys.

---

### Requirement 9: Object Deletion

**User Story:** As a developer, I want to delete S3 objects, so that I can remove unwanted files from buckets I manage.

#### Acceptance Criteria

1. WHEN the user invokes "Delete Object" on an object node, THE Extension SHALL display a confirmation dialog showing the full Object_Key before proceeding.
2. WHEN the user confirms deletion, THE S3_Service SHALL call `s3:DeleteObject` with the bucket name and Object_Key.
3. IF the deletion fails, THEN THE Extension SHALL display an error message with the failure reason.
4. WHEN deletion succeeds, THE Tree_Provider SHALL remove the deleted object node from the tree view without requiring a full refresh.

---

### Requirement 10: Object Copy

**User Story:** As a developer, I want to copy S3 objects between prefixes or buckets, so that I can reorganize content without downloading and re-uploading.

#### Acceptance Criteria

1. WHEN the user invokes "Copy Object", THE Extension SHALL prompt for a destination bucket name and destination key.
2. THE S3_Service SHALL call `s3:CopyObject` with the source bucket, source key, destination bucket, and destination key.
3. IF the source and destination are in different regions, THEN THE S3_Service SHALL use the destination bucket's regional client for the copy operation.
4. IF the copy fails, THEN THE Extension SHALL display an error message with the failure reason.

---

### Requirement 11: Object Metadata View

**User Story:** As a developer, I want to view object metadata, so that I can inspect content type, size, ETag, and storage class without downloading the object.

#### Acceptance Criteria

1. WHEN the user invokes "View Metadata" on an object node, THE S3_Service SHALL call `s3:HeadObject` to retrieve object metadata.
2. THE Extension SHALL display the object's size, last modified date, content type, ETag, storage class, and any user-defined metadata.
3. IF the `s3:HeadObject` call fails, THEN THE Extension SHALL display an error message with the failure reason.

---

### Requirement 12: Presigned URL Generation

**User Story:** As a developer, I want to generate presigned URLs for S3 objects, so that I can share temporary access links without modifying bucket permissions.

#### Acceptance Criteria

1. WHEN the user invokes "Generate Presigned URL", THE Extension SHALL prompt for an expiry duration in minutes (default: 60, maximum: 10080 minutes / 7 days).
2. THE S3_Service SHALL generate a presigned `GetObject` URL using the AWS SDK v3 `getSignedUrl` utility.
3. WHEN the URL is generated, THE Extension SHALL copy it to the clipboard and display a notification confirming the copy and the expiry time.
4. IF the expiry duration exceeds 10080 minutes, THEN THE Extension SHALL display a validation error and SHALL NOT generate the URL.

---

### Requirement 13: Sync Local to S3

**User Story:** As a developer, I want to sync a local directory to an S3 bucket/prefix, so that I can deploy or back up files without using the AWS CLI.

#### Acceptance Criteria

1. WHEN the user invokes "Sync Local to S3", THE Extension SHALL prompt for a local directory path and a destination S3 bucket/prefix.
2. THE Sync_Service SHALL walk the local directory recursively, collecting all file paths and their MD5 checksums.
3. THE Sync_Service SHALL compare each local file's MD5 checksum against the corresponding S3 object's ETag to determine if the file has changed.
4. THE Sync_Service SHALL upload only files whose checksum does not match the S3 ETag (incremental sync).
5. WHEN `deleteMissing` is enabled, THE Sync_Service SHALL delete S3 objects that have no corresponding local file within the sync scope.
6. WHEN `dryRun` is enabled, THE Sync_Service SHALL compute and display the list of files to be uploaded and deleted WITHOUT performing any S3 operations.
7. THE Sync_Service SHALL apply exclude patterns (glob format) to skip matching files during the directory walk.
8. THE Extension SHALL display a progress notification showing the current file being processed and a count of uploaded/skipped/deleted files.
9. IF any individual file upload fails, THEN THE Sync_Service SHALL record the error in the SyncResult and continue processing remaining files.
10. WHEN the sync completes, THE Extension SHALL display a summary showing counts of uploaded, skipped, deleted, and failed files.

---

### Requirement 14: Sync S3 to Local

**User Story:** As a developer, I want to sync an S3 bucket/prefix to a local directory, so that I can download datasets or shared assets for local development.

#### Acceptance Criteria

1. WHEN the user invokes "Sync S3 to Local", THE Extension SHALL prompt for a source S3 bucket/prefix and a local destination directory.
2. THE Sync_Service SHALL list all objects under the source prefix and compare each object's ETag against the corresponding local file's MD5 checksum.
3. THE Sync_Service SHALL download only objects whose ETag does not match the local file's checksum (incremental sync).
4. THE Sync_Service SHALL preserve the S3 key structure as the local directory structure relative to the sync root.
5. WHEN `deleteMissing` is enabled, THE Sync_Service SHALL delete local files that have no corresponding S3 object within the sync scope.
6. WHEN `dryRun` is enabled, THE Sync_Service SHALL compute and display the list of files to be downloaded and deleted WITHOUT performing any filesystem operations.
7. THE Sync_Service SHALL apply exclude patterns to skip matching object keys during the S3 listing.
8. IF any individual file download fails, THEN THE Sync_Service SHALL record the error in the SyncResult and continue processing remaining objects.

---

### Requirement 15: Bidirectional Sync and Conflict Detection

**User Story:** As a developer, I want bidirectional sync with conflict detection, so that I can safely merge changes between local and S3 without accidentally overwriting work.

#### Acceptance Criteria

1. WHEN bidirectional sync is initiated, THE Sync_Service SHALL compare local files and S3 objects against the last sync timestamp stored in the Sync_Profile.
2. THE Sync_Service SHALL classify each file as: local-only, remote-only, unchanged, local-newer, remote-newer, or conflicted.
3. A file SHALL be classified as conflicted WHEN both the local file and the S3 object have been modified since the last sync timestamp.
4. WHEN the conflict strategy is `keep-local`, THE Sync_Service SHALL upload the local file to S3, overwriting the remote version.
5. WHEN the conflict strategy is `keep-remote`, THE Sync_Service SHALL download the S3 object, overwriting the local file.
6. WHEN the conflict strategy is `keep-both`, THE Sync_Service SHALL rename the local file with a conflict suffix and download the S3 object to the original path.
7. WHEN the conflict strategy is `skip`, THE Sync_Service SHALL leave both the local file and S3 object unchanged and record the conflict in the SyncResult.
8. WHEN a sync completes successfully, THE Sync_Service SHALL update the `lastSyncAt` timestamp in the Sync_Profile.

---

### Requirement 16: Sync Profiles

**User Story:** As a developer, I want to save and reuse sync configurations, so that I can quickly re-run common sync operations without re-entering settings each time.

#### Acceptance Criteria

1. WHEN the user invokes "Create Sync Profile", THE Extension SHALL prompt for a profile name, local path, S3 bucket/prefix, direction, delete behavior, exclude patterns, and conflict strategy.
2. THE Bucket_Storage SHALL persist each Sync_Profile with a unique ID and all configuration fields.
3. WHEN the user invokes "Run Sync Profile", THE Extension SHALL display a list of saved profiles and execute the selected profile's sync operation.
4. THE Extension SHALL allow the user to edit or delete existing sync profiles.
5. WHEN a sync profile is run, THE Sync_Service SHALL use the profile's stored configuration without prompting for parameters.
6. THE Sync_Profile SHALL store the `lastSyncAt` timestamp and update it after each successful sync execution.

---

### Requirement 17: Watch Mode

**User Story:** As a developer, I want watch mode to automatically sync local file changes to S3, so that I can see updates reflected in S3 in real time during development.

#### Acceptance Criteria

1. WHEN the user invokes "Watch Mode: Start", THE Extension SHALL prompt for a local directory and S3 bucket/prefix (or select from a saved Sync_Profile).
2. WHEN watch mode is active, THE Extension SHALL use VS Code's `workspace.createFileSystemWatcher` to monitor the local directory for file creation, modification, and deletion events.
3. WHEN a file change event is detected, THE Sync_Service SHALL debounce the event by 500 milliseconds before initiating an upload to prevent redundant transfers from rapid successive changes.
4. WHEN a file deletion event is detected and `deleteMissing` is enabled, THE Sync_Service SHALL delete the corresponding S3 object.
5. THE Extension SHALL display a status bar indicator showing "S3 Watch: Active" with the monitored path while watch mode is running.
6. WHEN the user invokes "Watch Mode: Stop", THE Extension SHALL dispose the filesystem watcher and remove the status bar indicator.
7. IF a file upload fails during watch mode, THEN THE Extension SHALL display an error notification and continue watching for subsequent changes.

---

### Requirement 18: Prefix-Level Access Enforcement

**User Story:** As a developer working in a shared bucket, I want the extension to enforce prefix-level access, so that I cannot accidentally read or write objects outside my allowed prefix.

#### Acceptance Criteria

1. WHILE a prefix scope is configured on a Bucket_Config, THE S3_Service SHALL prepend the configured prefix to all Object_Key parameters before making any S3 API call.
2. WHILE a prefix scope is configured, THE S3_Service SHALL validate that any user-supplied key begins with the configured prefix before executing the operation.
3. IF a user-supplied key does not begin with the configured prefix, THEN THE S3_Service SHALL return an error and SHALL NOT make the S3 API call.
4. THE Sync_Service SHALL apply the configured prefix scope when computing S3 object keys during all sync operations.
5. THE Tree_Provider SHALL display only objects whose keys begin with the configured prefix when a prefix scope is set.

---

### Requirement 19: Input Validation and Sanitization

**User Story:** As a developer, I want the extension to validate all inputs, so that malformed bucket names, keys, or ARNs do not cause unexpected errors.

#### Acceptance Criteria

1. WHEN a bucket name is provided, THE Extension SHALL validate that it matches the S3 bucket naming rules: 3–63 characters, lowercase letters, numbers, and hyphens only, not starting or ending with a hyphen.
2. WHEN an ARN is provided, THE Extension SHALL validate that it matches the format `arn:aws:s3:::<bucket-name>` before parsing.
3. WHEN an Object_Key is provided for upload or copy, THE Extension SHALL validate that it does not contain null bytes or exceed 1024 bytes in UTF-8 encoding.
4. WHEN a prefix is provided, THE Extension SHALL normalize the prefix by ensuring it ends with `/` unless it is empty.
5. IF any validation fails, THEN THE Extension SHALL display a descriptive error message identifying the invalid field and the expected format.

---

### Requirement 20: Multi-Region Support

**User Story:** As a developer, I want to manage buckets across multiple AWS regions, so that I can work with all my S3 resources from a single extension.

#### Acceptance Criteria

1. THE S3_Client_Factory SHALL create and cache one S3 client per region to avoid redundant client instantiation.
2. WHEN a bucket is added, THE Extension SHALL store the bucket's region in the Bucket_Config and use the corresponding regional client for all operations on that bucket.
3. THE Extension SHALL support all AWS commercial regions for S3 operations.
4. WHEN the user's credentials are updated, THE S3_Client_Factory SHALL invalidate and recreate all cached regional clients.

---

### Requirement 21: Checksum and Round-Trip Correctness

**User Story:** As a developer, I want the sync checksum logic to be correct, so that files are not unnecessarily re-uploaded or skipped due to checksum mismatches.

#### Acceptance Criteria

1. THE Sync_Service SHALL compute MD5 checksums of local files using the Node.js `crypto` module.
2. THE Sync_Service SHALL compare the local MD5 checksum (hex-encoded) against the S3 ETag value after stripping surrounding quotes from the ETag.
3. FOR ALL local files synced to S3 and then synced back, THE Sync_Service SHALL classify the round-tripped file as unchanged (checksum match) when no modifications have been made.
4. THE Sync_Service SHALL treat multipart-uploaded objects (whose ETags contain a `-` suffix) as always requiring re-download during S3-to-local sync, since their ETags are not simple MD5 hashes.
5. WHEN a file is uploaded and the resulting S3 ETag is retrieved, THE Sync_Service SHALL update its local checksum cache to reflect the new ETag, so a subsequent sync classifies the file as unchanged.

---

### Requirement 22: Sync Result Reporting

**User Story:** As a developer, I want detailed sync result reports, so that I can understand exactly what changed and diagnose any failures.

#### Acceptance Criteria

1. THE Sync_Service SHALL produce a SyncResult record containing counts of uploaded, downloaded, deleted, skipped, and failed files.
2. THE Sync_Service SHALL record each failure as a SyncError with the file path, operation type, error message, and timestamp.
3. WHEN a sync completes, THE Extension SHALL display the SyncResult summary in a VS Code information or warning message (warning if any errors occurred).
4. THE Extension SHALL provide a command to view the full SyncResult detail, including all SyncError entries, in a read-only output channel.
5. WHEN a sync is cancelled by the user, THE Sync_Service SHALL set the SyncResult status to `cancelled` and report counts for operations completed before cancellation.

---

### Requirement 23: Error Handling and Resilience

**User Story:** As a developer, I want the extension to handle AWS errors gracefully, so that transient failures do not crash the extension or leave it in an inconsistent state.

#### Acceptance Criteria

1. THE S3_Service SHALL implement exponential backoff retry logic for `ThrottlingException` and `ServiceUnavailable` errors, with a maximum of 3 retries.
2. IF all retries are exhausted, THEN THE S3_Service SHALL throw the final error with a message indicating the operation failed after retries.
3. WHEN an unexpected error occurs in any command handler, THE Extension SHALL display a user-friendly error message and log the full error details to the VS Code output channel.
4. THE Extension SHALL never display raw AWS SDK error objects directly to the user; all error messages SHALL be human-readable.
5. IF the AWS credentials expire during an operation, THEN THE Extension SHALL display a notification prompting the user to re-configure credentials.
