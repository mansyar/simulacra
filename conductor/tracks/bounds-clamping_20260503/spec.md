# Specification: Phase 10 Track D — Bounds Clamping

## Overview
This track implements "Phase 10 Track D: Bounds Clamping" as detailed in `PHASE-PLAN.md`. The goal is to add `Math.max(0, Math.min(63, ...))` clamping around `resolveMovement` to prevent agents from walking off the [0, 63] map boundary.

## Functional Requirements

### FR1: Clamp resolved position in `resolveMovement`
In `convex/functions/agents.ts` (`resolveMovement`), the computed `newX` and `newY` values must be clamped to the range [0, 63] before being written to the database in the `distance > 0.1` path.
- `newX = Math.max(0, Math.min(63, newX))`
- `newY = Math.max(0, Math.min(63, newY))`

### FR2: Clamp snap path in `resolveMovement`
In the `distance < 0.1` (early-exit snap) path, the target coordinates must also be clamped to [0, 63] before being written to the database.
- `snappedX = Math.max(0, Math.min(63, agent.targetX))`
- `snappedY = Math.max(0, Math.min(63, agent.targetY))`

### FR3: Defensively clamp targets in `updateAction`
In `convex/functions/agents.ts` (`updateAction`), if `targetX` or `targetY` is provided, it must be clamped to [0, 63] before being stored. This prevents off-map targets from entering the system at the point of assignment.

## Non-Functional Requirements
- No change to the existing movement behavior for in-bounds targets
- Zero regressions in existing tests

## Acceptance Criteria
- When an agent's movement would place it at gridX < 0, the position is clamped to 0
- When an agent's movement would place it at gridX > 63, the position is clamped to 63
- When an agent's movement would place it at gridY < 0, the position is clamped to 0
- When an agent's movement would place it at gridY > 63, the position is clamped to 63
- The snap path (distance < 0.1) also clamps coordinates to [0, 63]
- `updateAction` clamps targetX/targetY to [0, 63] when set
- All existing tests pass (363+ tests across 79 files)

## Out of Scope
- Frontend changes (clamping is a backend safeguard)
- Changes to the grid rendering or camera bounds
