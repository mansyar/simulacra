# Implementation Plan: Excalibur to PixiJS Migration

## Phase 1: Environment Setup & Core Canvas
- [ ] Task: Remove Excalibur and Install PixiJS
    - [ ] Uninstall `excalibur` from `package.json`
    - [ ] Install `pixi.js` v8
- [ ] Task: Create `GameCanvas` PixiJS Component
    - [ ] Write failing test for `GameCanvas` component rendering a PixiJS Application and tearing it down.
    - [ ] Implement `GameCanvas` React component with `useEffect` lifecycle management.
    - [ ] Verify tests pass and test coverage is >80%.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Environment Setup & Core Canvas' (Protocol in workflow.md)

## Phase 2: Isometric Grid & Viewport Culling
- [ ] Task: Implement `IsometricGrid` Rendering
    - [ ] Write failing tests for grid generation and coordinate conversion.
    - [ ] Implement `IsometricGrid` using PixiJS `Graphics`.
    - [ ] Implement Viewport Culling logic to only draw visible tiles.
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
    - [ ] Verify tests pass and test coverage is >80%.
- [ ] Task: Remove Excalibur References
    - [ ] Search and destroy any remaining `excalibur` imports, types, or configuration files across the entire codebase.
    - [ ] Delete old Excalibur-specific Vitest tests.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Integration & Cleanup' (Protocol in workflow.md)