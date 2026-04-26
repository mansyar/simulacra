# Implementation Plan: Excalibur to PixiJS Migration

## Phase 1: Environment Setup & Core Canvas [checkpoint: aedbb3a]
- [x] Task: Remove Excalibur and Install PixiJS 694a297
- [x] Task: Create `GameCanvas` PixiJS Component 445636e
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment Setup & Core Canvas' aedbb3a

## Phase 2: Isometric Grid & Viewport Culling [checkpoint: 833b2b5]
- [x] Task: Implement `IsometricGrid` Rendering 595e7ba
- [x] Task: Conductor - User Manual Verification 'Phase 2: Isometric Grid & Viewport Culling' 833b2b5

## Phase 3: Camera System & Controls [checkpoint: e3dad3a]
- [x] Task: Implement `CameraController` 463df04
- [x] Task: Conductor - User Manual Verification 'Phase 3: Camera System & Controls' e3dad3a

## Phase 4: Sprites & Visual Improvements
- [x] Task: Implement `AgentSprite` and `POISprite` c42378e
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Sprites & Visual Improvements' (Protocol in workflow.md)

## Phase 5: Integration & Cleanup
- [ ] Task: Final System Integration
    - [ ] Write failing tests for Convex real-time sync updating PixiJS sprite positions.
    - [ ] Connect Convex `useQuery` hooks to the `GameCanvas` to feed state to the PixiJS application.
    - [ ] Verify click-to-move interactions map correctly from screen to grid coordinates.
    - [ ] Verify tab visibility pause/resume correctly halts and restarts the PixiJS ticker.
    - [ ] Verify tests pass and test coverage is >80%.
- [ ] Task: Remove Excalibur References
    - [ ] Search and destroy any remaining `excalibur` imports, types, or configuration files across the entire codebase.
    - [ ] Delete old Excalibur-specific Vitest tests.
- [ ] Task: Documentation Updates
    - [ ] Update docs/ARCHITECTURE.md
    - [ ] Update docs/ISOMETRIC.md
    - [ ] Update docs/SPEC.md
    - [ ] Update docs/PRD.md
    - [ ] Update docs/PHASE-PLAN.md
    - [ ] Update README.md
- [ ] Task: Verify Checkpoints
    - [ ] Measure and document FPS before/after the migration to confirm performance improvement.
    - [ ] Measure and document the final JS bundle size to confirm reduction (~200KB to ~150KB).
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Integration & Cleanup' (Protocol in workflow.md)