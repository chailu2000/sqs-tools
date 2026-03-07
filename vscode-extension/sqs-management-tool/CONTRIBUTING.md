# Contributing to SQS Management Tool

Thank you for your interest in contributing! This document explains our development methodology and how to contribute effectively.

## Development Methodology

This project uses **AI-assisted, spec-driven development** with a focus on quality and systematic testing.

### Tools & Workflow

1. **AI-Enabled IDE**: We use [Kiro](https://kiro.ai) for development
   - Intelligent code generation and refactoring
   - Automated test generation
   - Documentation generation
   - Spec-driven workflow support

2. **Spec Files**: Features are defined in `.kiro/specs/` before implementation
   - Requirements document
   - Design document
   - Task breakdown
   - Implementation tracking

3. **Property-Based Testing**: We verify correctness through systematic testing
   - Define formal properties
   - Generate test cases automatically
   - Catch edge cases

4. **Iterative Refinement**: Requirements → Design → Tasks → Implementation

### Why This Approach?

- **Quality**: Systematic approach catches edge cases early
- **Documentation**: Specs serve as living documentation
- **Collaboration**: Clear requirements enable better teamwork
- **AI Assistance**: Kiro helps with implementation and testing
- **Maintainability**: Future developers understand the evolution

## How to Contribute

### For New Features

1. **Create a Spec**
   ```bash
   mkdir -p .kiro/specs/your-feature-name
   cd .kiro/specs/your-feature-name
   ```

2. **Define Requirements** (`requirements.md`)
   - What problem does this solve?
   - What are the user stories?
   - What are the acceptance criteria?
   - What correctness properties must hold?

3. **Create Design** (`design.md`)
   - How will this be implemented?
   - What components are needed?
   - What are the technical decisions?
   - What are the trade-offs?

4. **Break Down Tasks** (`tasks.md`)
   - List implementation tasks
   - Include sub-tasks
   - Mark optional tasks with `*`

5. **Implement**
   - Follow the spec
   - Write tests (including property-based tests)
   - Update documentation

6. **Verify**
   - Run all tests
   - Check code coverage
   - Verify against correctness properties
   - Update spec if needed

### For Bug Fixes

1. **Create a Bugfix Spec**
   ```bash
   mkdir -p .kiro/specs/bugfix-description
   ```

2. **Define Bug Condition** (`requirements.md`)
   - What is the bug?
   - How to reproduce?
   - What is the expected behavior?
   - What is the actual behavior?

3. **Write Exploration Test**
   - Test that fails on unfixed code
   - Confirms the bug exists
   - Provides counterexamples

4. **Design Fix** (`design.md`)
   - Root cause analysis
   - Proposed solution
   - Why this approach?

5. **Implement Fix**
   - Fix the bug
   - Ensure exploration test passes
   - Add regression tests

### Code Style

- **TypeScript**: Follow existing patterns
- **Tests**: Use Jest for unit tests
- **Naming**: Descriptive names, camelCase for variables/functions
- **Comments**: Explain why, not what
- **Documentation**: Update relevant docs

### Testing Requirements

All contributions must include tests:

- **Unit Tests**: For individual functions/classes
- **Integration Tests**: For component interactions
- **E2E Tests**: For user-facing features (when applicable)
- **Property-Based Tests**: For correctness properties (when applicable)

Run tests before submitting:
```bash
pnpm test
pnpm test:e2e
```

### Documentation Requirements

Update documentation for:

- **README.md**: User-facing features
- **CHANGELOG.md**: All changes
- **Code Comments**: Complex logic
- **Spec Files**: Requirements and design

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- VS Code 1.88.0+
- AWS account (for testing)

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/sqs-management-tool
cd sqs-management-tool

# Install dependencies
cd vscode-extension/sqs-management-tool
pnpm install

# Install frontend dependencies
cd ../../frontend
pnpm install

# Build frontend
pnpm run build:extension

# Compile TypeScript
cd ../vscode-extension/sqs-management-tool
pnpm run compile

# Run tests
pnpm test
```

### Running Locally

1. Open `vscode-extension/sqs-management-tool` in VS Code
2. Press F5 to launch Extension Development Host
3. Test your changes

### Running E2E Tests

```bash
# Start LocalStack (in separate terminal)
docker-compose -f docker-compose.test.yml up

# Run E2E tests
pnpm test:e2e

# Run with UI (for debugging)
pnpm test:e2e:headed
```

## Spec Examples

Check out existing specs for reference:

- **Feature Spec**: `.kiro/specs/standalone-aws-sqs-extension/`
- **E2E Tests Spec**: `.kiro/specs/vscode-extension-e2e-tests/`
- **UI Parity Spec**: `.kiro/specs/vscode-extension-web-ui-parity/`

Each spec shows the complete workflow from requirements to implementation.

## AI-Assisted Development Tips

If you're using Kiro or similar AI tools:

1. **Start with Specs**: Let AI help generate requirements and design
2. **Review AI Output**: Always review and refine AI-generated code
3. **Test Thoroughly**: AI can miss edge cases, use property-based testing
4. **Document Decisions**: Explain why you chose certain approaches
5. **Iterate**: Refine specs and implementation based on testing

## Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow spec-driven process
   - Write tests
   - Update documentation

3. **Test Locally**
   ```bash
   pnpm test
   pnpm test:e2e
   pnpm run compile
   ```

4. **Commit with Conventional Commits**
   ```
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   test: add tests
   chore: maintenance tasks
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Description**
   - Link to spec (if applicable)
   - Describe changes
   - List tests added
   - Note any breaking changes

7. **Code Review**
   - Address feedback
   - Update tests if needed
   - Keep commits clean

## Questions?

- **General Questions**: Open a GitHub Discussion
- **Bug Reports**: Open a GitHub Issue
- **Feature Requests**: Open a GitHub Issue with spec proposal
- **Development Help**: Check existing specs or ask in Discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to SQS Management Tool! Your efforts help make AWS SQS management easier for everyone. 🚀
