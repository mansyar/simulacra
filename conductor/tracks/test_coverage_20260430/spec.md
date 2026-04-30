# Specification: Increase Test Coverage

## Overview

Improve test coverage across the Simulacra codebase by writing missing unit and integration tests for currently untested modules, ensuring coverage thresholds are meaningful and enforceable.

## Motivation

The project has a mature test infrastructure (63 existing test files) with a >80% coverage target, but:
1. Several source modules have zero test coverage
2. The vitest coverage configuration excludes most frontend source code (`src/lib/**`, `src/components/**`, `src/routes/**`) from measurement, making the >80% threshold misleading

## Modules Requiring Tests (Ordered by Complexity)

### Phase 1: Utility Modules (Low Complexity)
| Module | Type | Location | Reason |
|--------|------|----------|--------|
| `convex.ts` | Unit + Integration | `src/lib/convex.ts` | Convex client utilities - core infrastructure used by game components |
| `server-functions.ts` | Unit + Integration | `src/lib/server-functions.ts` | TanStack Start server function wrappers |

### Phase 2: UI Components (Medium Complexity)
| Module | Type | Location | Reason |
|--------|------|----------|--------|
| `NeedsBar.tsx` | Unit (React component) | `src/components/ui/NeedsBar.tsx` | Agent needs visualization - currently the only untested UI component |

### Phase 3: Backend Functions (Medium Complexity)
| Module | Type | Location | Reason |
|--------|------|----------|--------|
| `ai_helpers.ts` | Unit + Integration | `convex/functions/ai_helpers.ts` | Core AI helper functions (LLM calls, embedding logic, retry logic) |

### Phase 4: Coverage Configuration Fix

- Update `vitest.config.ts` to remove exclusion of `src/lib/**`, `src/components/**`, `src/routes/**` from coverage measurement
- Keep legitimate exclusions (node_modules, config files, generated files, test files)
- Verify thresholds (80% lines, 80% functions, 70% branches, 80% statements) are actually enforceable

## Success Criteria

1. All target modules have unit and/or integration tests following project conventions
2. Coverage thresholds are enforceable (fixed coverage config)
3. Running `pnpm test:coverage` reports meaningful coverage numbers that reflect actual codebase coverage
4. No regressions — all existing tests continue to pass

## Out of Scope

- Writing additional tests for already-tested modules (existing 63 test files are sufficient)
- Adding `test:watch` scripts to package.json
- Refactoring source code to make it more testable
- Integration/E2E tests requiring a running server
