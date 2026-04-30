# Specification: Increase Test Coverage

## Overview

Improve test coverage across the Simulacra codebase by writing missing unit and integration tests for currently untested or under-covered modules.

## Motivation

The project has a mature test infrastructure (69 existing test files) with a >80% coverage target. Running `pnpm test:coverage` reveals the true coverage picture:

| Module | Current Coverage (Lines) | Target |
|--------|:-----------------------:|:------:|
| `src/lib/convex.ts` | **0%** | >80% |
| `src/lib/server-functions.ts` | **0%** | >80% |
| `convex/functions/ai_helpers.ts` | **61.93%** | >80% |

## Modules Requiring Tests (Ordered by Complexity)

### Phase 1: Utility Modules (Low Complexity)
| Module | Type | Location | Current Coverage |
|--------|------|----------|:----------------:|
| `convex.ts` | Unit + Integration | `src/lib/convex.ts` | 0% |
| `server-functions.ts` | Unit + Integration | `src/lib/server-functions.ts` | 0% |

### Phase 2: Backend Functions (Medium Complexity)
| Module | Type | Location | Current Coverage |
|--------|------|----------|:----------------:|
| `ai_helpers.ts` | Unit + Integration | `convex/functions/ai_helpers.ts` | 61.93% |

## Success Criteria

1. All target modules have unit and/or integration tests following project conventions
2. Running `pnpm test:coverage` reports measurable improvement on target modules
3. No regressions — all existing tests continue to pass

## Out of Scope

- Writing additional tests for already-tested modules (existing test files are sufficient)
- Adding `test:watch` scripts to package.json
- Refactoring source code to make it more testable
- Integration/E2E tests requiring a running server
- `AdminPanel.tsx` (discovered at 0% but not in original scope)
