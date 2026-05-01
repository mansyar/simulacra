# Implementation Plan: LLM Sees Its Own Trajectory

## Phase 1: Structured trajectory data in `decision` action

### Task 1.1: Write failing test for `currentAction` in `agentState`
- [ ] Write a unit test that verifies the `decision` action's `agentState` args schema includes `currentAction` as a required `v.string()` field
- [ ] Run the test and confirm it FAILS (Red phase)

### Task 1.2: Add `currentAction` to `agentState` schema
- [ ] In `convex/functions/ai.ts`, add `currentAction: v.string()` to the `agentState` `v.object()` in the `decision` action args
- [ ] Run the test and confirm it PASSES (Green phase)

### Task 1.3: Update `world.ts` to pass `currentAction` to `decision`
- [ ] In `convex/functions/world.ts`, update the `decision` call to pass `currentAction: agent.currentAction`
- [ ] Write a test verifying that `world.ts`'s `processAgent` includes `currentAction` when calling `decision`

- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Trajectory context in `buildAgentContext`

### Task 2.1: Write failing tests for trajectory fields in `agentContext`
- [ ] Write a test that `buildAgentContext` output contains `"Current Action"` and `"Current Position"` strings
- [ ] Write a test that `buildAgentContext` shows `"None"` when no target is set
- [ ] Write a test that `buildAgentContext` includes `"Distance Remaining"` when target is set and omits it when not set
- [ ] Run the tests and confirm they FAIL (Red phase)

### Task 2.2: Add trajectory fields to `buildAgentContext`
- [ ] In `convex/functions/ai.ts`, modify `buildAgentContext` to append:
    - `Current Action: <agent.currentAction>`
    - `Current Position: (<agent.gridX>, <agent.gridY>)`
    - `Destination: (<agent.targetX>, <agent.targetY>)` or `"None"` when undefined
    - `Distance Remaining: ~N tiles` (Euclidean) when target exists (omitted otherwise)
- [ ] Run the tests and confirm they PASS (Green phase)

- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Integration & verification

### Task 3.1: Write integration test for full LLM context
- [ ] Write an integration test that simulates a full decision pipeline and verifies the user prompt contains trajectory information (`"Current Action"`, `"Current Position"`, `"Destination"`)
- [ ] Run the test and confirm it FAILS then PASSES

### Task 3.2: Run full test suite and coverage
- [ ] Run `CI=true pnpm test && pnpm test:coverage` and confirm all existing tests still pass with >80% coverage
- [ ] Document any test updates needed

- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
