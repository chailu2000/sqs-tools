# Change Log

All notable changes to the "AWS SQS Management Tool" extension will be documented in this file.

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
