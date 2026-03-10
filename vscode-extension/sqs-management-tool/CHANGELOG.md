# Change Log

All notable changes to the "AWS SQS Management Tool" extension will be documented in this file.

## [1.0.4] - 2024-03-07

### Added
- FIFO queue support for sending messages
- Auto-detection of FIFO queues (queues ending with `.fifo`)
- MessageGroupId field (required for FIFO queues)
- MessageDeduplicationId field (optional, shown only when ContentBasedDeduplication is disabled)
- Visual FIFO badge and section in message composer
- Helpful tooltips and validation for FIFO parameters

### Changed
- Message composer now adapts UI based on queue type (Standard vs FIFO)
- MessageGroupId is preserved after sending for convenience
- MessageDeduplicationId is cleared after sending

## [1.0.3] - 2024-03-07

### Fixed
- Improved empty queue list UX with inline welcome message
- Added "Configure AWS Credentials" and "Add Queue" buttons in empty state
- Removed outdated popup message about "+" button

## [1.0.2] - 2024-03-07

### Fixed
- Updated README with correct GitHub repository URL
- Updated license information in README

## [1.0.1] - 2024-03-07

### Fixed
- Fixed broken screenshots in VS Code Marketplace by using absolute GitHub URLs instead of relative paths

## [1.0.0] - 2024-03-07

### Added
- Initial release
- Direct AWS SQS integration without backend server
- Queue management (add, remove, refresh)
- Message operations (send, receive, delete, change visibility)
- DLQ redrive functionality with progress tracking and cancellation
- Multi-region support
- AWS profile selection with status bar indicator
- Secure credential storage using VS Code SecretStorage
- Message attributes support for all 7 AWS SQS data types:
  - String
  - Number
  - Binary
  - String.json
  - String.xml
  - Number.int
  - Number.float
- Import/export queue configurations
- Queue auto-discovery (when ListQueues permission available)
- Manual queue entry by name or URL (works without ListQueues)
- Workspace vs global storage toggle

### Features
- Support for Standard and FIFO queues
- Dead Letter Queue detection and management
- Real-time message polling with configurable intervals
- JSON validation for message bodies
- Comprehensive error handling with user-friendly messages
- Minimal IAM permissions support
- Queue grouping by region
- Visual indicators for queue types (Standard, FIFO, DLQ)
- Copy queue URL to clipboard
- Refresh queue attributes on demand
- Virtual scrolling for large message tables

### Testing
- Comprehensive E2E test suite (55 passing tests, 93% coverage)
- Property-based testing for critical operations
- Bug condition exploration tests for DLQ redrive
- Preservation tests ensuring correctness

### Documentation
- Complete user documentation
- IAM permissions guide
- Message attributes documentation with examples
- Body vs Attributes explanation
- Manual testing guide
- Troubleshooting guide
- Publishing guide
- Contributing guide
- AI development disclosure

## [Unreleased]

### Planned Features
- Message filtering and search
- Batch operations for multiple queues
- Queue metrics and monitoring
- CloudWatch integration
- SNS topic subscription management
- Message scheduling
- Custom message templates
