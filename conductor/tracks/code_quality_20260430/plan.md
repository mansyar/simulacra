# Implementation Plan: Code Quality Improvement

## Phase 1: Define Core Type Interfaces [checkpoint: dfb5a90]

**Goal:** Create a shared types module with proper interfaces for the entire Convex backend.

- [x] Task 1.1: Create `convex/functions/types.ts` with core type interfaces `[a921076]`
    - [x] Define `ActionCtx` interface (replacing `ctx: any` in top-level action signatures)
    - [x] Define `AgentState` interface with typed fields for hunger, sleep, social, position, etc.
    - [x] Define `WorldStateConfig` interface for world configuration (weather, tick count, etc.)
    - [x] Define `ProcessedAgentDecision` interface for decision objects (thought, action, target, speech, confidence)
    - [x] Define `AiConfig` interface for provider/model configuration
    - [x] Define `ConversationState` interface for active conversation tracking
    - [x] Define `ProcessedAgent` type that extends `Doc<"agents">` with computed fields
    - [x] Define utility types: `DeepPartial`, `Mutable` if needed
    - [x] Write a compile-time type validation test to verify interfaces satisfy Convex constraints
    - [x] Run `npx tsc --noEmit` to confirm types compile without errors
    - [x] Commit with message: `feat(types): Define core type interfaces for Convex backend`
- [x] Task 1.2: Conductor - User Manual Verification 'Define Core Type Interfaces' (Protocol in workflow.md)

## Phase 2: Fix Production Backend Code

**Goal:** Replace all `any` types in Convex backend functions with proper typed interfaces, remove file-level eslint-disable.

- [x] Task 2.1: Fix `convex/functions/world.ts` — remove file-level eslint-disable and replace all `any` `[66682a3]`
    - [x] Write failing test: Create test that validates types compile without `any`
    - [x] Replace `ctx: any` with `ActionCtx` in `handleConversationState`, `processAgent`, `cleanStaleConversations`
    - [x] Replace `agent: any` with `AgentState` in all internal helpers
    - [x] Replace `agents: any[]` with `AgentState[]`
    - [x] Replace `worldState: any` and `config: any` with typed interfaces
    - [x] Remove `/* eslint-disable @typescript-eslint/no-explicit-any */` from file header
    - [x] Run `npx tsc --noEmit` and existing tests to confirm no regressions
    - [x] Commit with message: `fix(types): Replace any with proper types in world.ts`
- [x] Task 2.2: Fix `convex/functions/ai.ts` — remove file-level eslint-disable and replace `any` `[65162eb]`
- [x] Task 2.3: Fix `convex/functions/agents.ts` — replace `const patch: any` with proper partial type `[65162eb]`
- [x] Task 2.4: Fix `convex/functions/ai_helpers.ts` — replace `any` in body/request types `[65162eb]`
- [x] Task 2.5: Fix `convex/functions/memory.ts` — replace `as any` cast `[65162eb]`
- [x] Task 2.6: Conductor - User Manual Verification 'Fix Production Backend Code' (Protocol in workflow.md)

## Phase 3: Fix Frontend Code

**Goal:** Replace `any` types in frontend code, remove file-level eslint-disable.

- [x] Task 3.1: Fix `src/lib/usePresenceWithSessionStorage.ts` `[77e020d]`
- [x] Task 3.2: Audit and fix PixiJS game components types `[—]` (already clean — zero `any`, zero eslint-disable)
- [x] Task 3.3: Conductor - User Manual Verification 'Fix Frontend Code' (Protocol in workflow.md)

## Phase 4: Fix Test Files

**Goal:** Remove file-level eslint-disable from all test files, replace with proper typed mocks.

- [ ] Task 4.1: Create reusable test utilities and shared mock types
- [x] Task 4.2: Fix `src/__tests__/AgentDetailRoute.test.tsx` — remove file-level eslint-disable `[0df7335]`
- [x] Task 4.3: Fix `src/__tests__/GameCanvas_navigation.test.tsx` — remove file-level eslint-disable `[0df7335]`
- [x] Task 4.4: Fix `src/__tests__/GlobalThoughtStream.test.tsx` — remove inline eslint-disable `[c650120]`
- [x] Task 4.5: Fix AgentSprite test files — remove inline eslint-disable `[c650120]`
- [x] Task 4.6: Fix remaining src test files — remove inline eslint-disable `[c650120]`
- [x] Task 4.7: Fix convex test files — remove file-level eslint-disable `[0df7335]`
- [ ] Task 4.8: Conductor - User Manual Verification 'Fix Test Files' (Protocol in workflow.md)

## Phase 5: Add Integration Tests

**Goal:** Add comprehensive integration tests covering critical user-facing flows.

- [x] Task 5.1: Write World Tick Lifecycle integration test `[3e09da0]`
    - [ ] Test: Full world tick — cron fires → agents make decisions → state updates → verify events created
    - [ ] Test: Multiple ticks progress hunger/sleep needs
    - [ ] Test: Agent moves toward target after decision
    - [ ] Run tests to confirm they pass
    - [ ] Commit with message: `test(integration): Add world tick lifecycle integration test`
- [~] Task 5.2: Write Agent Interaction Flow integration test
    - [ ] Test: Two agents within proximity trigger conversation
    - [ ] Test: Conversation updates relationship valence (likes/dislikes)
    - [ ] Test: Thought stream captures agent thoughts during interaction
    - [ ] Test: Conversation termination and cooldown
    - [ ] Run tests to confirm they pass
    - [ ] Commit with message: `test(integration): Add agent interaction flow integration test`
- [ ] Task 5.3: Write Admin/Master Flows integration test
    - [ ] Test: Weather change updates world state and affects agent speed
    - [ ] Test: Manual tick trigger processes agents on demand
    - [ ] Run tests to confirm they pass
    - [ ] Commit with message: `test(integration): Add admin/master flows integration test`
- [ ] Task 5.4: Write UI Integration flow test
    - [ ] Test: App loads → game canvas renders with agents → click agent → detail panel opens with agent info
    - [ ] Test: Thought stream shows agent thoughts in real-time
    - [ ] Run tests to confirm they pass
    - [ ] Commit with message: `test(integration): Add UI integration flow test`
- [ ] Task 5.5: Final verification — run full test suite and coverage
    - [ ] Run `CI=true npx vitest run --coverage` to verify coverage >80%
    - [ ] Run `npx tsc --noEmit` to verify zero type errors
    - [ ] Run linter to verify zero lint errors
    - [ ] Commit with message: `chore(quality): Final verification pass`
- [ ] Task 5.6: Conductor - User Manual Verification 'Add Integration Tests' (Protocol in workflow.md)
