# Implementation Plan: Excalibur to PixiJS Migration

## Phase 1: Environment Setup & Core Canvas
- [x] Task: Remove Excalibur and Install PixiJS 694a297
- [x] Task: Create `GameCanvas` PixiJS Component 445636e
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Environment Setup & Core Canvas' (Protocol in workflow.md)

## Phase 2: Isometric Grid & Viewport Culling
- [ ] Task: Implement `IsometricGrid` Rendering
    - [ ] Write failing tests for grid generation and coordinate conversion.
    - [ ] Implement `IsometricGrid` using PixiJS `Graphics`.
    - [ ] Implement Viewport Culling logic to only draw visible tiles.
    - [ ] Implement hover highlight tile on mouse over.
    - [ ] Verify tests pass and test coverage is >80%.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Isometric Grid & Viewport Culling' (Protocol in workflow.md)

## Phase 3: Camera System & Controls
- [ ] Task: Implement `CameraController`
    - [ ] Write failing tests for camera pan/zoom state updates based on pointer/wheel events.
    - [ ] Implement `Camera` using a main PixiJS `Container` transform.
    - [ ] Implement URL synchronization (`?zoom`, `?focus`).
    - [ ] Verify tests pass and test coverage is >80%.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Camera System & Controls' (Protocol in workflow.md)

## Phase 4: Sprites & Visual Improvements
- [ ] Task: Implement `AgentSprite` and `POISprite`
    - [ ] Write failing tests for sprite rendering, batching logic, and visual improvements (shadows, text rendering).
    - [ ] Implement `AgentSprite` and `POISprite` using PixiJS `Container`, `Graphics`, and `Text`.
    - [ ] Implement smooth grid-position interpolation (`lerp`) during the PixiJS ticker loop.
    - [ ] Verify tests pass and test coverage is >80%.
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