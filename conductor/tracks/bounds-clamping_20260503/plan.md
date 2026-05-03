# Implementation Plan: Phase 10 Track D - Bounds Clamping

## Phase 1: Bounds Clamping Implementation

- [ ] Task: Write failing tests for bounds clamping
    - [ ] Sub-task: Create test in `convex/bounds_clamping.test.ts` to verify `resolveMovement` clamps `newX`/`newY` to [0, 63] when movement beyond the upper boundary (e.g., targeting gridX > 63) would occur.
    - [ ] Sub-task: Create test to verify `resolveMovement` clamps `newX`/`newY` to [0, 63] when movement below the lower boundary (e.g., gridX < 0) would occur.
    - [ ] Sub-task: Create test to verify the `distance < 0.1` snap path also clamps coordinates to [0, 63] (e.g., target is at gridX = 70, distance < 0.1, verify snap clamps to 63).
    - [ ] Sub-task: Create test to verify `updateAction` clamps `targetX`/`targetY` to [0, 63] when off-map values are passed.
    - [ ] Sub-task: Run the tests and confirm they fail as expected (Red phase).

- [ ] Task: Implement clamping in `resolveMovement` and `updateAction`
    - [ ] Sub-task: In `resolveMovement` (`distance > 0.1` path), apply `Math.max(0, Math.min(63, newX))` and `Math.max(0, Math.min(63, newY))` before the `ctx.db.patch` call.
    - [ ] Sub-task: In `resolveMovement` (`distance < 0.1` snap path), apply `Math.max(0, Math.min(63, agent.targetX))` and `Math.max(0, Math.min(63, agent.targetY))` before the snap `ctx.db.patch` call.
    - [ ] Sub-task: In `updateAction`, apply `Math.max(0, Math.min(63, targetX))` and `Math.max(0, Math.min(63, targetY))` if `targetX`/`targetY` are provided.
    - [ ] Sub-task: Run the full test suite and confirm all tests pass (Green phase).

- [ ] Task: Verify functionality and refactor
    - [ ] Sub-task: Run all tests with coverage to ensure >80% coverage is maintained.
    - [ ] Sub-task: Refactor if necessary, re-run tests to confirm.

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Bounds Clamping Implementation' (Protocol in workflow.md)
