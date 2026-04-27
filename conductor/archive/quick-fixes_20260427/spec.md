# Specification: Phase 5 Track A - Quick Fixes

## Overview
This track addresses three immediate technical debts and bugs identified in the current implementation: hardcoded interaction parameters, stale relationship metadata, and redundant starter content in the routing layer.

## Functional Requirements

### 1. Configurable Interaction Radius
- **Schema Update**: Add `interactionRadius` (number) to the `config` table in `convex/schema.ts`.
- **Default Value**: Initialize with `5` in seed data/deployment.
- **Implementation**: Replace hardcoded `5` in `convex/functions/world.ts` (distance check) and `convex/functions/agents.ts` (passive perception) with a lookup from the `config` table.

### 2. Relationship Valence & History Fix
- **Bug**: `lastInteractionType` currently only sets once and never updates on subsequent interactions.
- **Enhancement (Richer History)**: 
    - Update `relationships` table schema to include `valenceHistory: v.array(v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")))`.
    - Modify `updateRelationship` in `convex/functions/agents.ts` to:
        - Update `lastInteractionType` on every interaction based on the `delta`.
        - Prepend the new interaction type to `valenceHistory` (capped at the last 5 entries).

### 3. Home Route (Index) Overhaul
- **Cleanup**: Remove all TanStack Start boilerplate content from `src/routes/index.tsx`.
- **World Intro Overlay**: 
    - Implement a "Welcome to Simulacra" overlay in `src/routes/index.tsx`.
    - This overlay should provide a brief introduction to the "Ant Farm" and disappear either on click or after a short delay (e.g., 5 seconds).
    - Ensure it doesn't block the `GameCanvas` (rendered in `__root.tsx`) once dismissed.

## Non-Functional Requirements
- **Performance**: Configuration lookups in the world tick should be efficient.
- **Type Safety**: Maintain strict TypeScript typing for the new relationship history.

## Acceptance Criteria
- [ ] `interactionRadius` is successfully moved to the `config` table and respected by the world engine.
- [ ] `updateRelationship` correctly updates `lastInteractionType` and maintains a history of the last 5 interactions.
- [ ] Navigating to `/` shows a polished intro overlay instead of TanStack template content.
- [ ] All existing tests pass, and new tests are added for the relationship history logic.