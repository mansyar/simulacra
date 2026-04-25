# Specification: Excalibur to PixiJS Migration (Phase 4)

## Overview
This track focuses on migrating the game's rendering engine from Excalibur.js to PixiJS. The primary goal is to improve performance by utilizing GPU-accelerated 2D rendering and removing full game-engine overhead. While maintaining the core 16-bit isometric aesthetic, we will introduce minor visual improvements such as enhanced text rendering and basic shadows.

## Functional Requirements
1.  **PixiJS Setup & Canvas Integration:**
    *   Initialize PixiJS v8 `Application` within a new React `GameCanvas` component.
    *   Manage the application lifecycle cleanly using React `useEffect` (init/destroy).
2.  **Isometric Grid Rendering:**
    *   Rewrite `IsometricGrid` to utilize PixiJS `Graphics` and `Container`.
    *   Implement **Viewport Culling**: Only render grid lines and tiles currently visible within the camera's viewport.
3.  **Agent & POI Sprites:**
    *   Migrate `AgentSprite` and `POISprite` using PixiJS `Container`, `Graphics`, and `Text`.
    *   Implement **Sprite Batching** for agents and tiles to minimize draw calls.
    *   Introduce minor visual improvements: Crisp pixel text rendering for names and speech bubbles, and subtle drop shadows beneath sprites.
    *   Preserve the smooth grid-position interpolation (`lerp`) during the PixiJS ticker loop.
4.  **Camera Controls:**
    *   Re-implement camera pan (drag) and zoom (scroll) using a main PixiJS `Container` transform (scale and position).
    *   Ensure URL synchronization (`?zoom`, `?focus`) continues to function correctly.

## Non-Functional Requirements
1.  **Performance:**
    *   Significant reduction in draw calls and increase in FPS compared to Excalibur due to viewport culling and sprite batching.
2.  **Bundle Size:**
    *   **Bundle Size Reduction:** Completely remove Excalibur.js from the project dependencies, targeting a smaller final JavaScript bundle.
3.  **Testing Strategy:**
    *   **Write New Tests:** Delete old Excalibur-specific Vitest tests.
    *   Write fresh component and visual integration tests tailored for the PixiJS implementation.

## Acceptance Criteria
*   [ ] PixiJS successfully renders the 64x64 isometric grid.
*   [ ] Agents display with correct colors, names, action emojis, and speech bubbles, including new visual improvements (shadows, better text).
*   [ ] Camera panning and zooming work smoothly and match URL parameters.
*   [ ] Viewport culling correctly hides off-screen grid elements.
*   [ ] Convex real-time sync accurately updates PixiJS sprite positions.
*   [ ] All Excalibur references and dependencies are entirely removed from `package.json` and the codebase.
*   [ ] New PixiJS-specific test suite passes successfully.

## Out of Scope
*   Adding new game features, items, or agent behaviors.
*   Major UI/UX redesigns outside the canvas.