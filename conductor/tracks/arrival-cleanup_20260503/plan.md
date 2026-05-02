# Implementation Plan: Phase 10 Track C - Arrival Cleanup

## Phase 1: Arrival Cleanup Implementation

- [ ] Task: Write failing tests for early return and target clearing
    - [ ] Sub-task: Add test in `convex/agents.test.ts` to verify `resolveMovement` skips the database patch when distance < 0.1 and returns `arrived: true`.
    - [ ] Sub-task: Add test in `convex/world.test.ts` to verify that when `resolveMovement` returns `arrived: true`, the agent's `targetX` and `targetY` are cleared.
- [ ] Task: Implement early return guard in `resolveMovement`
    - [ ] Sub-task: Update `resolveMovement` in `convex/functions/agents.ts` to explicitly return early without patching the database if `distance < 0.1`.
- [ ] Task: Implement target clearing on arrival
    - [ ] Sub-task: In `convex/functions/agents.ts`, create an internal mutation `clearTarget` that sets `targetX: undefined` and `targetY: undefined`.
    - [ ] Sub-task: In `convex/functions/world.ts`, call `clearTarget` for the agent when `resolveMovement` returns `arrived: true`.
- [ ] Task: Verify functionality and Refactor
    - [ ] Sub-task: Run all tests to ensure the new tests pass and there are no regressions.
    - [ ] Sub-task: Refactor if necessary.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Arrival Cleanup Implementation' (Protocol in workflow.md)