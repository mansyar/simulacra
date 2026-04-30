# Specification: Increase Test Coverage

## Overview

Improve test coverage across the Simulacra codebase by writing missing unit and integration tests for currently untested or under-covered modules. Coverage configuration has already been fixed to include frontend source code.

## Motivation

The project has a mature test infrastructure (69 existing test files) with a >80% coverage target. After fixing the coverage configuration (previously excluded `src/lib/**`, `src/components/**`, `src/routes/**`), running `pnpm test:coverage` now reveals the true coverage picture:

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

## Completed Work

The following scope items have already been completed:

1. **Coverage Configuration Fix** — Removed blanket `src/lib/**`, `src/routes/**`, `src/components/**` exclusions from `vitest.config.ts` coverage config. Legitimate exclusions (generated files, config files, test files) retained.
2. **Coverage Verified** — `pnpm test:coverage` now reports meaningful frontend coverage. Overall: 81.71% lines / 80.25% functions / 77.56% branches / 81.71% statements.
3. **`NeedsBar.tsx`** — Already at 100% coverage via existing integration tests. No tests needed.

## Success Criteria

1. All target modules have unit and/or integration tests following project conventions
2. Running `pnpm test:coverage` reports measurable improvement on target modules
3. Overall coverage thresholds continue to be met (80% lines, 80% functions, 70% branches, 80% statements)
4. No regressions — all existing tests continue to pass

## Out of Scope

- Writing additional tests for already-tested modules (existing test files are sufficient)
- Adding `test:watch` scripts to package.json
- Refactoring source code to make it more testable
- Integration/E2E tests requiring a running server
- `AdminPanel.tsx` (discovered at 0% but not in original scope)
