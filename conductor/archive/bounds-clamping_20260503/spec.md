# Specification: Phase 10 Track D — Bounds Clamping

## Overview
This track implements "Phase 10 Track D: Bounds Clamping" as detailed in `PHASE-PLAN.md`. The goal is to add `Math.max(0, Math.min(63, ...))` clamping around `resolveMovement` to prevent agents from walking off the [0, 63] map boundary.

## Functional Requirements

### FR1: Unified clamping in `resolveMovement` (both movement paths)
In `convex/functions/agents.ts` (`resolveMovement`), all computed position values (`newX`/`newY`) must be clamped to [0, 63] **before** every `ctx.db.patch` call, regardless of which code path produces them. Both the `distance > 0.1` interpolated path and the `distance < 0.1` snap path must apply the same clamping logic just before the DB write.

Additionally, when clamping **changes** the computed value (i.e., the raw position was outside [0, 63]), the agent must be treated as **arrived** — clearing `targetX`/`targetY` — to prevent the "stuck at boundary" loop where the agent perpetually walks towards an unreachable off-map target without ever getting a new LLM action.

### FR2: Defensively clamp targets in `updateAction`
In `convex/functions/agents.ts` (`updateAction`), if `targetX` or `targetY` is provided, it must be clamped to [0, 63] before being stored. This prevents off-map targets from entering the system at the point of assignment.

## Non-Functional Requirements
- No change to the existing movement behavior for in-bounds targets
- Zero regressions in existing tests

## Acceptance Criteria
- When an agent's movement would place it at gridX < 0, the position is clamped to 0
- When an agent's movement would place it at gridX > 63, the position is clamped to 63
- When an agent's movement would place it at gridY < 0, the position is clamped to 0
- When an agent's movement would place it at gridY > 63, the position is clamped to 63
- Both the `distance > 0.1` and `distance < 0.1` code paths apply the same clamping
- When clamping changes the position (raw was outside [0,63]), the agent is marked as arrived and targets are cleared — no "stuck at boundary" loop
- `updateAction` clamps targetX/targetY to [0, 63] when set
- All existing tests pass (363+ tests across 79 files)

## Out of Scope
- Frontend changes (clamping is a backend safeguard)
- Changes to the grid rendering or camera bounds
