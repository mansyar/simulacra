# Specification: Code Quality Improvement

## Overview

A comprehensive code quality improvement pass across the entire codebase. This track addresses three dimensions: **Type Safety** (replace all `any` types with proper interfaces), **Lint Compliance** (remove all `eslint-disable` and `@ts-ignore`/`@ts-expect-error` comments), and **Test Coverage** (add integration tests for critical user-facing flows).

## Scope

### Phase 1: Define Core Type Interfaces
- Define proper TypeScript interfaces for:
  - `ActionCtx` (replacing `ctx: any` in Convex functions)
  - `AgentState` / `AgentDoc` (replacing `agent: any`)
  - `WorldStateConfig` (replacing `worldState: any`, `config: any`)
  - `ProcessedAgentDecision` (replacing raw decision objects)
  - `AiConfig` (for provider/model configuration)
- Create a shared types module at `convex/functions/types.ts`

### Phase 2: Fix Production Backend Code
**Files to fix:**
- `convex/functions/world.ts` — Replace all `ctx: any`, `agent: any`, `agents: any[]` with typed interfaces; remove file-level eslint-disable
- `convex/functions/ai.ts` — Replace `(m: any)` with typed event/memory iterators; remove file-level eslint-disable
- `convex/functions/agents.ts` — Replace `const patch: any` with proper partial type
- `convex/functions/ai_helpers.ts` — Replace `body: any` with typed request/response interfaces
- `convex/functions/memory.ts` — Replace `as any` cast with proper type assertion

### Phase 3: Fix Frontend Code
- `src/lib/usePresenceWithSessionStorage.ts` — Replace all `any` casts with proper Convex presence types; remove file-level eslint-disable
- `src/components/game/` — Audit PixiJS game components for type issues

### Phase 4: Fix Test Files
- Remove file-level eslint-disable from:
  - `src/__tests__/AgentDetailRoute.test.tsx`
  - `src/__tests__/GameCanvas_navigation.test.tsx`
  - `convex/conversation_ttl.test.ts`
  - `convex/conversation_state.test.ts`
- Replace all inline eslint-disable with proper typed mocks (`vi.mocked`, proper mock interfaces)
- Create reusable test utility types/mocks

### Phase 5: Add Integration Tests
1. **World Tick Lifecycle** — Integration test: cron tick → agent decision → state update → real-time sync
2. **Agent Interaction Flow** — Integration test: two agents meet → conversation triggers → relationship updates → thought stream
3. **Admin/Master Flows** — Integration test: weather change → world state update → client sees change; manual tick
4. **UI Integration** — Integration test: page load → game canvas renders → agents appear → click agent → detail panel

## Non-Functional Requirements

- **No regressions:** All existing tests must continue to pass after changes
- **No new eslint-disable:** All new code must be lint-compliant without suppression comments
- **Editor compatibility:** All types should be IDE-friendly (Ctrl+click navigation, autocomplete)
- **Backward compatibility:** Public Convex API shapes must remain unchanged

## Acceptance Criteria

- [ ] Zero file-level `eslint-disable` comments in production code
- [ ] Zero file-level `eslint-disable` comments in test code
- [ ] Zero inline `eslint-disable` or `@ts-ignore`/`@ts-expect-error` in production code
- [ ] All Convex function signatures use proper typed `ctx` parameters
- [ ] Integration tests exist and pass for all 4 specified flows
- [ ] All existing tests still pass
- [ ] No `any` type annotations in production source code (exception: generated files)

## Out of Scope
- Refactoring or restructuring business logic
- Adding new features or functionality
- Performance optimization
- Documentation updates (beyond type annotations)
