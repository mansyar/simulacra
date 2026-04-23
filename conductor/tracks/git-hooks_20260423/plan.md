# Implementation Plan: Git Hooks Setup (Pre-commit & Pre-push)

## Phase 1: Project Setup & Tool Installation

### Tasks
- [x] Task: Install required dependencies
    - [x] Task: Install Husky for Git hook management
        - [x] Sub-task: Run `npx husky init` to initialize hooks directory
    - [x] Task: Install ESLint with TypeScript support
        - [x] Sub-task: Install ESLint packages (used pnpm)
        - [x] Sub-task: Initialize ESLint config for TypeScript (eslint.config.js)
    - [x] Task: Ensure Vitest is installed for testing
        - [x] Sub-task: Verify `vitest` is in devDependencies
        - [x] Sub-task: Verify coverage thresholds configured in vitest.config.ts
    - [x] Task: Verify TypeScript compiler is available
        - [x] Sub-task: Confirm `tsc` is in devDependencies
        - [x] Sub-task: Verify `tsconfig.json` is properly configured

- [ ] Task: Conductor - User Manual Verification 'Project Setup & Tool Installation' (Protocol in workflow.md)

## Phase 2: Pre-commit Hook Implementation

### Tasks
    - [x] Task: Configure ESLint linting hook
        - [x] Sub-task: Create pre-commit script that runs `npx eslint`
        - [x] Sub-task: Verify ESLint blocks commits with lint errors
        - [x] Sub-task: Test with intentionally linting code

    - [x] Task: Configure TypeScript type check hook
        - [x] Sub-task: Create pre-commit script that runs `npx tsc --noEmit`
        - [x] Sub-task: Verify type check blocks commits with type errors
        - [x] Sub-task: Test with intentionally typed code

    - [x] Task: Configure Vitest unit test hook
        - [x] Sub-task: Create pre-commit script that runs `npx vitest run`
        - [x] Sub-task: Verify tests block commits when failing
        - [x] Sub-task: Test with intentionally failing tests

    - [x] Task: Create file line count check script
        - [x] Sub-task: Create `scripts/check-line-counts.cjs`
        - [x] Sub-task: Implement recursive file scanning in `src/` directory
        - [x] Sub-task: Implement recursive file scanning in `convex/` directory
        - [x] Sub-task: Implement line counting logic (excluding node_modules)
        - [x] Sub-task: Implement 500-line threshold check
        - [x] Sub-task: Implement clear error reporting for oversized files
        - [x] Sub-task: Test script with files exceeding 500 lines
        - [x] Sub-task: Test script with normal-sized files

    - [x] Task: Configure pre-commit hook to run all checks
        - [x] Sub-task: Update `.husky/pre-commit` to run ESLint, tsc, Vitest, line count script
        - [x] Sub-task: Ensure all checks must pass for commit to succeed
        - [x] Sub-task: Test complete pre-commit workflow

- [x] Task: Conductor - User Manual Verification 'Pre-commit Hook Implementation' (Protocol in workflow.md)

## Phase 3: Pre-push Hook Implementation

### Tasks
    - [x] Task: Configure Vitest coverage check hook
        - [x] Sub-task: Create pre-push script that runs `npx vitest run --coverage`
        - [x] Sub-task: Verify coverage threshold is enforced (80%)
        - [x] Sub-task: Test with insufficient coverage

    - [x] Task: Configure TypeScript type check for pre-push
        - [x] Sub-task: Create pre-push script that runs `npx tsc --noEmit`
        - [x] Sub-task: Verify type check blocks pushes with type errors
        - [x] Sub-task: Test with intentionally typed code

    - [x] Task: Configure pre-push hook to run all checks
        - [x] Sub-task: Update `.husky/pre-push` to run coverage check and tsc
        - [x] Sub-task: Ensure all checks must pass for push to succeed
        - [x] Sub-task: Test complete pre-push workflow

- [x] Task: Conductor - User Manual Verification 'Pre-push Hook Implementation' (Protocol in workflow.md)

## Phase 4: Testing & Documentation

### Tasks
    - [x] Task: End-to-end testing of all hooks
        - [x] Sub-task: Test pre-commit with lint errors (should block)
        - [x] Sub-task: Test pre-commit with type errors (should block)
        - [x] Sub-task: Test pre-commit with failing tests (should block)
        - [x] Sub-task: Test pre-commit with oversized files (should block)
        - [x] Sub-task: Test pre-commit with valid code (should pass)
        - [x] Sub-task: Test pre-push with low coverage (should block)
        - [x] Sub-task: Test pre-push with type errors (should block)
        - [x] Sub-task: Test pre-push with valid code (should pass)

    - [x] Task: Document hook configuration and usage
        - [x] Sub-task: Add README section explaining hooks
        - [x] Sub-task: Document how to bypass hooks with `--no-verify`
        - [x] Sub-task: Document expected error messages

- [x] Task: Conductor - User Manual Verification 'Testing & Documentation' (Protocol in workflow.md)
