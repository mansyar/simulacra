# Implementation Plan: Phase 5 Track A - Quick Fixes

This plan outlines the steps to implement configurable interaction radius, fix relationship valence tracking with history, and overhaul the home route with a welcome overlay.

## Phase 1: Backend Infrastructure & Logic (TDD)
Focus on schema updates, configuration management, and core relationship logic.

- [x] Task: Update Convex Schema and Seed Data 99a2447
    - [ ] Update `convex/schema.ts` to add `interactionRadius` to `config` table.
    - [ ] Update `convex/schema.ts` to add `valenceHistory` to `relationships` table.
    - [ ] Update `convex/functions/seed.ts` to include `interactionRadius: 5` in default config.
- [x] Task: Fix Relationship Valence Bug and Implement History 43dc049
    - [ ] **Write Tests (Red)**: Create `convex/relationships.test.ts` to verify `lastInteractionType` updates and `valenceHistory` accumulation.
    - [ ] **Implement (Green)**: Modify `updateRelationship` in `convex/functions/agents.ts` to update valence on patch and maintain history (max 5).
    - [ ] **Refactor**: Ensure efficient array manipulation for history.
- [ ] Task: Decouple Interaction Radius from Code
    - [ ] **Write Tests (Red)**: Update `convex/world.test.ts` to verify interaction radius is fetched from config.
    - [ ] **Implement (Green)**: Update `convex/functions/world.ts` and `convex/functions/agents.ts` to fetch `interactionRadius` from the `config` table.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend' (Protocol in workflow.md)

## Phase 2: Frontend Cleanup & Welcome Overlay
Focus on removing boilerplate and implementing the intro UX.

- [ ] Task: Clean up Home Route Boilerplate
    - [ ] Remove TanStack Start template content from `src/routes/index.tsx`.
    - [ ] Remove duplicate `GlobalThoughtStream` from `src/routes/index.tsx`.
- [ ] Task: Implement World Intro Overlay
    - [ ] **Write Tests (Red)**: Create `src/__tests__/IntroOverlay.test.tsx` to verify overlay visibility and dismissal.
    - [ ] **Implement (Green)**: Create a `IntroOverlay` component and integrate it into `src/routes/index.tsx`.
    - [ ] **Refactor**: Apply Framer Motion for a "cozy" entrance/exit animation.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend' (Protocol in workflow.md)