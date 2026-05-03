# Implementation Plan: Phase 10 Track C - Arrival Cleanup

## Phase 1: Arrival Cleanup Implementation

- [x] Task: Write failing tests for atomic arrival and snapping (aad4dae)
    - [x] Sub-task: Create test in `convex/arrival_cleanup.test.ts` to verify `resolveMovement` snaps `gridX`/`gridY` to exactly `targetX`/`targetY` when distance < 0.1, clears the targets, and returns `arrived: true`.
    - [x] Sub-task: Create test in `convex/arrival_cleanup.test.ts` to verify `resolveMovement` clears targets when `ratio === 1`.
- [x] Task: Implement atomic arrival and snapping in `resolveMovement` (aad4dae)
    - [x] Sub-task: Update `resolveMovement` in `convex/functions/agents.ts`. When `distance < 0.1` or `ratio === 1`, patch the database to clear `targetX` and `targetY`, and ensure `gridX` and `gridY` are snapped precisely to the target coordinates if distance < 0.1.
    - [x] Sub-task: Ensure `convex/functions/world.ts` only logs the arrival event and does not perform redundant cleanup.
- [x] Task: Verify functionality and Refactor (aad4dae)
    - [x] Sub-task: Run all tests to ensure the new tests pass and there are no regressions.
    - [x] Sub-task: Refactor if necessary.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Arrival Cleanup Implementation' (Protocol in workflow.md)