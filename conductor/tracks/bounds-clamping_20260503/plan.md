# Implementation Plan: Phase 10 Track D - Bounds Clamping

## Phase 1: Bounds Clamping Implementation

- [ ] Task: Write failing tests for bounds clamping
    - [ ] Sub-task: Create a `_testSetTarget` internal mutation test helper in `convex/functions/agents.ts` that sets `targetX`/`targetY` without clamping (for testing resolveMovement clamping in isolation).
    - [ ] Sub-task: Create test in `convex/bounds_clamping.test.ts` to verify `resolveMovement` clamps position to [0, 63] when movement beyond the upper boundary occurs (use `_testSetTarget` to set off-map target).
    - [ ] Sub-task: Create test to verify `resolveMovement` clamps position to [0, 63] when movement below the lower boundary occurs (use `_testSetTarget` to set off-map target).
    - [ ] Sub-task: Create test to verify `resolveMovement` marks as arrived and clears targets when clamping changes the computed position ("stuck at boundary" guard).
    - [ ] Sub-task: Create test to verify `updateAction` clamps `targetX`/`targetY` to [0, 63] when off-map values are passed.
    - [ ] Sub-task: Run the tests and confirm they fail as expected (Red phase).

- [ ] Task: Implement clamping in `resolveMovement` and `updateAction`
    - [ ] Sub-task: In `resolveMovement`, apply `Math.max(0, Math.min(63, ...))` to all computed positions just before every `ctx.db.patch` call (both `distance > 0.1` and `distance < 0.1` paths use the same unified clamping logic).
    - [ ] Sub-task: Add "stuck at boundary" guard: when clamping changes the position value, set `arrived = true` and clear `targetX`/`targetY` so the agent isn't stuck perpetually walking toward an unreachable target.
    - [ ] Sub-task: In `updateAction`, apply `Math.max(0, Math.min(63, targetX))` and `Math.max(0, Math.min(63, targetY))` if `targetX`/`targetY` are provided, before the DB patch.
    - [ ] Sub-task: Run the full test suite and confirm all tests pass (Green phase).

- [ ] Task: Verify functionality and refactor
    - [ ] Sub-task: Run all tests with coverage to ensure >80% coverage is maintained.
    - [ ] Sub-task: Refactor if necessary, re-run tests to confirm.

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Bounds Clamping Implementation' (Protocol in workflow.md)
