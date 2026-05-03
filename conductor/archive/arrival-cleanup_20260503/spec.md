# Specification: Phase 10 Track C - Arrival Cleanup

## Overview
This track implements "Phase 10 Track C: Arrival Cleanup" as detailed in the `PHASE-PLAN.md`. The goal is to address the issue where agents reaching their destination continue to have their `targetX` and `targetY` set, causing the frontend to predict movement and the backend to wastefully call `resolveMovement` on subsequent ticks.

## Functional Requirements
1. **Atomic Target Clearing & Snapping**: In `convex/functions/agents.ts` (`resolveMovement`), the mutation must serve as the single source of truth for physical arrival.
    - If `distance < 0.1` (early return guard), the agent must snap to the exact target coordinates (`agent.targetX`, `agent.targetY`), and both `targetX` and `targetY` must be set to `undefined` in the database patch.
    - If `ratio === 1` (the move distance equals or exceeds the distance to target), `targetX` and `targetY` must also be set to `undefined` in the database patch.
2. **Simplified World Action**: In `convex/functions/world.ts`, the logic should simply call `resolveMovement` and log the arrival event if `result.arrived` is true. No separate mutation call for target cleanup is needed.
3. **Preserve Current Action**: Upon arrival, the agent's `currentAction` must remain unchanged (e.g., if "walking" or "eating", it remains so). The AI will decide the subsequent action on the next world tick.

## Acceptance Criteria
- When an agent reaches their destination, their `targetX` and `targetY` are set to `undefined` in the database in a single atomic patch alongside the coordinate update.
- When an agent is within `< 0.1` units of their target, their coordinates snap exactly to the target, and `targetX`/`targetY` are cleared.
- Arrived agents display idle movement on the frontend (since they no longer have a target) instead of "zombie walking" towards the already reached destination.
- All tests pass, including new tests added for the cleanup and snapping behavior in `resolveMovement`.

## Out of Scope
- Adding bounding box clamping (This is reserved for Phase 10 Track D).
- Modifying the frontend prediction logic directly (clearing backend targets will naturally stop frontend prediction).