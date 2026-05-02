# Specification: Phase 10 Track C - Arrival Cleanup

## Overview
This track implements "Phase 10 Track C: Arrival Cleanup" as detailed in the `PHASE-PLAN.md`. The goal is to address the issue where agents reaching their destination continue to have their `targetX` and `targetY` set, causing the frontend to predict movement and the backend to wastefully call `resolveMovement` on subsequent ticks.

## Functional Requirements
1. **Clear Targets on Arrival**: Once an agent has arrived at their destination (indicated by `resolveMovement` returning `arrived: true`), the backend must clear the agent's `targetX` and `targetY` fields. This should happen immediately after logging the arrival event in `convex/functions/world.ts`.
2. **Early Return in Movement Resolution**: In `convex/functions/agents.ts` (`resolveMovement`), the distance check must use an early return guard. If the distance to the target is `< 0.1` (the existing threshold, explicitly formalized as an early return), the function should skip the database patch entirely and return `arrived: true`.
3. **Preserve Current Action**: Upon arrival, the agent's `currentAction` must remain unchanged (e.g., if "walking" or "eating", it remains so). The AI will decide the subsequent action on the next world tick.

## Acceptance Criteria
- When an agent reaches their destination, their `targetX` and `targetY` are set to `undefined` in the database.
- The `resolveMovement` function does not perform a database patch if the agent is already within `0.1` units of their target.
- Arrived agents display idle movement on the frontend (since they no longer have a target) instead of "zombie walking" towards the already reached destination.
- All tests pass, including new tests added for the cleanup and early return behavior.

## Out of Scope
- Adding bounding box clamping (This is reserved for Phase 10 Track D).
- Modifying the frontend prediction logic directly (clearing backend targets will naturally stop frontend prediction).