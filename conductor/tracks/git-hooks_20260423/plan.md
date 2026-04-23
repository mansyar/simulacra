# Implementation Plan: Git Hooks Setup (Pre-commit & Pre-push)

## Phase 1: Project Setup & Tool Installation

### Tasks
- [ ] Task: Install required dependencies
    - [ ] Task: Install Husky for Git hook management
        - [ ] Sub-task: Run `npm install husky --save-dev`
        - [ ] Sub-task: Run `npx husky init` to initialize hooks directory
    - [ ] Task: Install ESLint with TypeScript support
        - [ ] Sub-task: Run `npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --save-dev`
        - [ ] Sub-task: Initialize ESLint config for TypeScript
    - [ ] Task: Ensure Vitest is installed for testing
        - [ ] Sub-task: Verify `vitest` is in devDependencies
        - [ ] Sub-task: Configure coverage thresholds in vitest.config.ts (80%)
    - [ ] Task: Verify TypeScript compiler is available
        - [ ] Sub-task: Confirm `tsc` is in devDependencies
        - [ ] Sub-task: Verify `tsconfig.json` is properly configured

- [ ] Task: Conductor - User Manual Verification 'Project Setup & Tool Installation' (Protocol in workflow.md)

## Phase 2: Pre-commit Hook Implementation

### Tasks
- [ ] Task: Configure ESLint linting hook
    - [ ] Sub-task: Create pre-commit script that runs `npx eslint`
    - [ ] Sub-task: Verify ESLint blocks commits with lint errors
    - [ ] Sub-task: Test with intentionally linting code

- [ ] Task: Configure TypeScript type check hook
    - [ ] Sub-task: Create pre-commit script that runs `npx tsc --noEmit`
    - [ ] Sub-task: Verify type check blocks commits with type errors
    - [ ] Sub-task: Test with intentionally typed code

- [ ] Task: Configure Vitest unit test hook
    - [ ] Sub-task: Create pre-commit script that runs `npx vitest run`
    - [ ] Sub-task: Verify tests block commits when failing
    - [ ] Sub-task: Test with intentionally failing tests

- [ ] Task: Create file line count check script
    - [ ] Sub-task: Create `scripts/check-line-counts.js`
    - [ ] Sub-task: Implement recursive file scanning in `src/` directory
    - [ ] Sub-task: Implement recursive file scanning in `convex/` directory
    - [ ] Sub-task: Implement line counting logic (excluding node_modules)
    - [ ] Sub-task: Implement 500-line threshold check
    - [ ] Sub-task: Implement clear error reporting for oversized files
    - [ ] Sub-task: Test script with files exceeding 500 lines
    - [ ] Sub-task: Test script with normal-sized files

- [ ] Task: Configure pre-commit hook to run all checks
    - [ ] Sub-task: Update `.husky/pre-commit` to run ESLint, tsc, Vitest, line count script
    - [ ] Sub-task: Ensure all checks must pass for commit to succeed
    - [ ] Sub-task: Test complete pre-commit workflow

- [ ] Task: Conductor - User Manual Verification 'Pre-commit Hook Implementation' (Protocol in workflow.md)

## Phase 3: Pre-push Hook Implementation

### Tasks
- [ ] Task: Configure Vitest coverage check hook
    - [ ] Sub-task: Create pre-push script that runs `npx vitest run --coverage`
    - [ ] Sub-task: Verify coverage threshold is enforced (80%)
    - [ ] Sub-task: Test with insufficient coverage

- [ ] Task: Configure TypeScript type check for pre-push
    - [ ] Sub-task: Create pre-push script that runs `npx tsc --noEmit`
    - [ ] Sub-task: Verify type check blocks pushes with type errors
    - [ ] Sub-task: Test with intentionally typed code

- [ ] Task: Configure pre-push hook to run all checks
    - [ ] Sub-task: Update `.husky/pre-push` to run coverage check and tsc
    - [ ] Sub-task: Ensure all checks must pass for push to succeed
    - [ ] Sub-task: Test complete pre-push workflow

- [ ] Task: Conductor - User Manual Verification 'Pre-push Hook Implementation' (Protocol in workflow.md)

## Phase 4: Testing & Documentation

### Tasks
- [ ] Task: End-to-end testing of all hooks
    - [ ] Sub-task: Test pre-commit with lint errors (should block)
    - [ ] Sub-task: Test pre-commit with type errors (should block)
    - [ ] Sub-task: Test pre-commit with failing tests (should block)
    - [ ] Sub-task: Test pre-commit with oversized files (should block)
    - [ ] Sub-task: Test pre-commit with valid code (should pass)
    - [ ] Sub-task: Test pre-push with low coverage (should block)
    - [ ] Sub-task: Test pre-push with type errors (should block)
    - [ ] Sub-task: Test pre-push with valid code (should pass)

- [ ] Task: Document hook configuration and usage
    - [ ] Sub-task: Add README section explaining hooks
    - [ ] Sub-task: Document how to bypass hooks with `--no-verify`
    - [ ] Sub-task: Document expected error messages

- [ ] Task: Conductor - User Manual Verification 'Testing & Documentation' (Protocol in workflow.md)
