# Implementation Plan: LLM Sees Its Own Trajectory

## Phase 1: Structured `currentAction` in `agentState` (FR1)

### Task 1.1: Write failing test for `currentAction` in `agentState`
- [x] Write a unit test that verifies the `decision` action's `agentState` args schema includes `currentAction` as a required `v.string()` field
- [x] Run the test and confirm it FAILS (Red phase)

### Task 1.2: Add `currentAction` to `agentState` schema
- [x] In `convex/functions/ai.ts`, add `currentAction: v.string()` to the `agentState` `v.object()` in the `decision` action args
- [x] Run the test and confirm it PASSES (Green phase)

### Task 1.3: Update `world.ts` to pass `currentAction` to `decision`
- [x] In `convex/functions/world.ts`, update the `decision` call to pass `currentAction: agent.currentAction`
- [x] Write a test verifying that `world.ts`'s `processAgent` includes `currentAction` when calling `decision`

## Phase 1: ✅ Complete [checkpoint: 0e2885b]

- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Render `currentAction` in `## Your State` (FR2)

### Task 2.1: Write failing tests for `currentAction` in `## Your State`
- [ ] Write a test that `buildContextPrompt` output contains `"Current Action"` in the `## Your State` section
- [ ] Write a test verifying `currentAction` renders alongside `Hunger`, `Energy`, `Social`
- [ ] Run the tests and confirm they FAIL (Red phase)

### Task 2.2: Update `buildContextPrompt` to render `currentAction`
- [ ] Update the `agentState` parameter type of `buildContextPrompt` to include `currentAction: string`
- [ ] Add `Current Action: ${agentState.currentAction}\n` to the `## Your State` section in `buildContextPrompt`
- [ ] Run the tests and confirm they PASS (Green phase)

- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Position, target & distance in `## Your Identity` (FR3)

### Task 3.1: Write failing tests for trajectory fields in `agentContext`
- [ ] Write a test that `buildAgentContext` output contains `"Current Position"` and `"Destination"` strings
- [ ] Write a test that `buildAgentContext` shows `"None"` when no target is set
- [ ] Write a test that `buildAgentContext` includes `"Distance Remaining"` when target is set and omits it when not set
- [ ] Write a test that trajectory fields appear after `Personality & Instructions` in the context string
- [ ] Run the tests and confirm they FAIL (Red phase)

### Task 3.2: Add trajectory fields to `buildAgentContext`
- [ ] In `convex/functions/ai.ts`, modify `buildAgentContext` to append (after `Personality & Instructions`):
    - `Current Position: (<agent.gridX>, <agent.gridY>)`
    - `Destination: (<agent.targetX>, <agent.targetY>)` or `"None"` when undefined
    - `Distance Remaining: ~N tiles` (Euclidean) when target exists (omitted otherwise)
- [ ] Run the tests and confirm they PASS (Green phase)

- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Integration & verification

### Task 4.1: Write integration test for full LLM context
- [ ] Write an integration test that simulates a full decision pipeline and verifies the user prompt contains both `currentAction` (from `## Your State`) and trajectory info (`Current Position`, `Destination` from `## Your Identity`)
- [ ] Run the test and confirm it FAILS then PASSES

### Task 4.2: Run full test suite and coverage
- [ ] Run `CI=true pnpm test && pnpm test:coverage` and confirm all existing tests still pass with >80% coverage
- [ ] Document any test updates needed

- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)
