# Specification: Git Hooks Setup (Pre-commit & Pre-push)

## Overview

This track sets up Git hooks using Husky to enforce code quality checks before commits and pushes. The hooks will run automatically on `git commit` and `git push` to ensure code quality standards are met.

## Functional Requirements

### 1. Pre-commit Hooks

The following checks run on every `git commit`:

| Check | Tool | Behavior |
|-------|------|----------|
| Linting | ESLint | Block if errors exist |
| TypeScript Type Check | tsc | Block if type errors exist |
| Unit Tests | Vitest | Block if tests fail |
| File Line Count | Custom script | Block if any .ts/.js/.tsx/.jsx file exceeds 500 lines |

### 2. Pre-push Hooks

The following checks run on every `git push`:

| Check | Tool | Behavior |
|-------|------|----------|
| Test Coverage | Vitest | Block if coverage < 80% |
| TypeScript Type Check | tsc | Block if type errors exist |

### 3. File Line Count Check Script

A custom script that:
- Scans all `.ts`, `.js`, `.tsx`, `.jsx` files in `src/` and `convex/` directories
- Counts lines in each file (excluding node_modules)
- Reports files exceeding 500 lines
- Returns non-zero exit code to block the commit
- Provides clear feedback on which files need refactoring

### 4. Husky Configuration

- Install and configure Husky v9+
- Initialize Husky in `.husky/` directory
- Set up `pre-commit` and `pre-push` hook files
- Make hooks easy to disable temporarily if needed

## Non-Functional Requirements

- Hooks should execute within reasonable time (< 2 minutes)
- Clear, actionable error messages when checks fail
- Easy to skip hooks temporarily (with warning)
- Works on macOS, Linux, and Windows

## Acceptance Criteria

1. **Pre-commit hook runs successfully** when committing code
2. **Pre-push hook runs successfully** when pushing code
3. **ESLint blocks commits** with lint errors
4. **TypeScript blocks commits** with type errors
5. **Vitest blocks commits** with failing tests
6. **File line count script blocks commits** for files > 500 lines in src/ and convex/
7. **Coverage check blocks pushes** when coverage < 80%
8. **Typecheck blocks pushes** with type errors
9. **Hooks can be bypassed** using `--no-verify` flag (with warning)
10. **Clear error output** shows which checks failed

## Out of Scope

- Setting up CI/CD pipeline checks (separate track)
- Prettier formatting (can be added later)
- Commit message validation
- Branch protection rules
