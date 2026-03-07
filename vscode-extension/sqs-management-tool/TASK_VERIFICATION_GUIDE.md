# Task Verification Guide

## Problem Statement

Tasks marked as complete `[x]` in `tasks.md` may not actually be fully implemented. This creates:
- **Spec-implementation mismatches** (e.g., commands declared but not implemented)
- **False confidence** in project completion status
- **Technical debt** that's hard to track
- **Wasted time** discovering incomplete work later

## Solution: Multi-Layer Verification

### Layer 1: Automated Verification Script

Run before marking tasks complete:

```bash
pnpm run verify
```

This checks:
- ✅ Commands declared in package.json are implemented
- ✅ Tests compile successfully
- ✅ Required dependencies exist
- ✅ Documentation files exist

**When to run**: Before marking any task as `[x]` complete

### Layer 2: Task Completion Checklist

Use `.github/TASK_COMPLETION_TEMPLATE.md` for each task:

```markdown
## Pre-Completion Verification
- [ ] Code compiles without errors
- [ ] All sub-tasks complete
- [ ] Tests exist and pass
- [ ] Manual testing performed
- [ ] Documentation updated

## Evidence of Completion
- Commit hash
- Files changed
- Test results
- Verification command
```

**When to use**: For every task marked complete

### Layer 3: Acceptance Criteria in Tasks

Add testable criteria to each task:

```markdown
- [ ] 1. Implement copyQueueUrl command
  **Acceptance Criteria**:
  - [ ] Command registered in package.json
  - [ ] Handler in extension-standalone.ts
  - [ ] Test exists and passes
  - [ ] Manual verification successful
  
  **Verify**: `pnpm run verify && pnpm run test:e2e -- --grep "copyQueueUrl"`
```

### Layer 4: Definition of Done

Standard checklist for all tasks:

```markdown
## Definition of Done

- [ ] Code written and compiles
- [ ] Tests pass
- [ ] Manual testing done
- [ ] Code committed
- [ ] Documentation updated
- [ ] No known bugs
- [ ] Peer reviewed (if applicable)
```

## Workflow for Marking Tasks Complete

### Step 1: Complete the Work
Write code, tests, documentation.

### Step 2: Run Verification
```bash
# Compile and test
pnpm run compile
pnpm run test:e2e

# Run verification script
pnpm run verify
```

### Step 3: Fill Out Completion Template
Copy `.github/TASK_COMPLETION_TEMPLATE.md` and fill it out:
- List files changed
- Paste test results
- Add verification command
- Include evidence (commits, screenshots)

### Step 4: Manual Verification
Actually use the feature:
- For UI: Click through the interface
- For commands: Execute them manually
- For APIs: Test with real data

### Step 5: Mark Complete
Only after all above steps, mark task as `[x]`.

### Step 6: Commit Evidence
```bash
git add tasks.md
git commit -m "Complete task X: [description]

Evidence:
- Tests: 55/59 passing
- Verification: pnpm run verify ✅
- Manual testing: Confirmed working
- Files: src/extension.ts, tests/commands.test.ts"
```

## Common Pitfalls to Avoid

### ❌ Marking Complete Too Early
**Problem**: Marking `[x]` when code is written but not tested

**Solution**: Always run tests before marking complete

### ❌ Partial Implementation
**Problem**: Implementing service layer but not wiring up commands

**Solution**: Use verification script to catch missing wiring

### ❌ No Evidence
**Problem**: Can't prove task was completed

**Solution**: Always include commit hash and test results

### ❌ Skipping Manual Testing
**Problem**: Tests pass but feature doesn't work in real usage

**Solution**: Always manually test UI/UX features

### ❌ Incomplete Sub-tasks
**Problem**: Parent task marked complete with incomplete sub-tasks

**Solution**: Check all sub-tasks before marking parent complete

## Verification Commands by Task Type

### For Command Implementation
```bash
# Check declaration
grep "command.*myCommand" package.json

# Check implementation
grep "registerCommand.*myCommand" src/extension-standalone.ts

# Run tests
pnpm run test:e2e -- --grep "myCommand"

# Manual test
# 1. Open VS Code
# 2. Run command from palette
# 3. Verify behavior
```

### For Service Layer
```bash
# Check implementation
grep "class MyService" src/services/

# Run unit tests
pnpm run test -- MyService

# Check integration
pnpm run test:e2e
```

### For UI Features
```bash
# Compile
pnpm run compile

# Run in headed mode
pnpm run test:e2e:headed

# Manual verification required
```

### For Documentation
```bash
# Check file exists
ls docs/MY_DOC.md

# Check content
grep "expected content" docs/MY_DOC.md

# Verify links work
# (manual check)
```

## Periodic Audits

### Monthly Audit Checklist

Run this monthly or before releases:

```bash
# 1. Run full verification
pnpm run verify

# 2. Run all tests
pnpm run test:e2e

# 3. Check for spec mismatches
./scripts/verify-implementation.sh

# 4. Review completed tasks
# - Pick 10% randomly
# - Verify they actually work
# - Check evidence exists

# 5. Update tasks.md
# - Mark any incomplete tasks as [ ]
# - Add notes about issues found
```

### Audit Report Template

```markdown
## Task Audit Report - [Date]

**Auditor**: [Name]
**Tasks Reviewed**: [X/Y]
**Issues Found**: [N]

### Issues
1. Task X: Marked complete but tests failing
2. Task Y: No evidence of completion
3. Task Z: Partial implementation

### Actions Taken
- [ ] Unmarked incomplete tasks
- [ ] Created issues for problems
- [ ] Updated documentation

### Recommendations
[Any process improvements]
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Verify Implementation

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run verification
        run: pnpm run verify
      
      - name: Run tests
        run: pnpm run test:e2e:ci
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if tasks.md was modified
if git diff --cached --name-only | grep -q "tasks.md"; then
    echo "tasks.md modified, running verification..."
    
    cd vscode-extension/sqs-management-tool
    pnpm run verify
    
    if [ $? -ne 0 ]; then
        echo "❌ Verification failed! Fix issues before committing."
        exit 1
    fi
fi
```

## Best Practices

### ✅ DO

1. **Run verification before marking complete**
   ```bash
   pnpm run verify
   ```

2. **Include evidence in commits**
   ```bash
   git commit -m "Complete task: Add feature X
   
   Evidence:
   - Tests: passing
   - Verification: ✅
   - Manual: confirmed"
   ```

3. **Test manually for UI features**
   - Actually click the buttons
   - Try edge cases
   - Test error scenarios

4. **Update documentation**
   - README
   - API docs
   - Code comments

5. **Get peer review for complex tasks**
   - Have someone else verify
   - Pair program on critical features

### ❌ DON'T

1. **Don't mark complete without testing**
   - "It compiles" ≠ "It works"

2. **Don't skip verification script**
   - Takes 5 seconds
   - Catches common issues

3. **Don't assume sub-tasks are done**
   - Check each one explicitly

4. **Don't commit without evidence**
   - Future you will thank you

5. **Don't skip manual testing**
   - Automated tests don't catch everything

## Summary

### Quick Checklist

Before marking any task as `[x]` complete:

- [ ] Code compiles: `pnpm run compile`
- [ ] Tests pass: `pnpm run test:e2e`
- [ ] Verification passes: `pnpm run verify`
- [ ] Manual testing done
- [ ] Documentation updated
- [ ] Evidence collected
- [ ] Commit with evidence

### Key Principle

**"If you can't demonstrate it working, it's not complete."**

## Tools Created

1. **`scripts/verify-implementation.sh`** - Automated verification
2. **`.github/TASK_COMPLETION_TEMPLATE.md`** - Completion checklist
3. **`pnpm run verify`** - Quick verification command
4. **This guide** - Process documentation

## Questions?

If unsure whether a task is complete, ask:

1. Can I demonstrate this feature working right now?
2. Do tests prove it works?
3. Would a new developer understand what was done?
4. Is there evidence of completion?
5. Would I bet money this is actually done?

If any answer is "no", the task is not complete.
