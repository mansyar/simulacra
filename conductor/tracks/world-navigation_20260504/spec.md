# Track: World Navigation & Awareness

## Overview

Add world navigation tools to the 64×64 isometric world so users never feel lost. Implements three features: a minimap for spatial awareness at a glance, URL-synced camera state for shareable views, and a floating tile tooltip for on-hover information.

## Functional Requirements

### 1. Minimap (HTML5 Canvas)

- **Location:** Fixed position in the bottom-right corner of the canvas area (z-index above canvas, below drawers/footer)
- **Size:** 120×120 pixels
- **Rendering:** Native HTML5 `<canvas>` 2D context — NOT a second PixiJS instance
- **Content:**
  - **Agent dots:** Small circles (3px radius) color-coded by archetype — same color mapping as `AgentSprite` (builder=amber, socialite=blue, philosopher=purple, explorer=emerald, nurturer=pink)
  - **POI markers:** Small squares (4×4px) with short labels when zoomed enough
  - **Viewport rectangle:** A translucent white rectangle (alpha 0.4) showing which portion of the world the camera currently sees, updating as the user pans/zooms
- **Interaction:** Clicking a point on the minimap pans the main camera to that world coordinate
- **Update:** Redraw every animation frame (via the PixiJS ticker loop)

### 2. URL-Synced Camera State

- **On mount:** Read `?focus` from URL search params (existing pattern from product.md). If present, find the agent by ID and call `cameraRef.lookAt()` to center on them. Also read `?zoom` to set initial zoom level.
- **On navigation:** When the user navigates to an agent (`/agent/$id`), update `?focus=$id` in the URL.
- **Write back:** On camera pan/zoom, debounce (500ms) and write current camera state back to URL. Store `?zoom=<level>`.
- **Scope:** Existing `?zoom` and `?focus` URL params only. Camera X/Y position is derived from focus agent. No raw coordinate storage.

### 3. Tile Tooltip (Floating Near Cursor)

- **Position:** A small floating div near the cursor, offset slightly (10px right, 10px below cursor), within the canvas container
- **Content, priority order (show highest-priority match):**
  1. **POI name** if the hovered tile contains a POI
  2. **Agent name + archetype badge** if the hovered tile contains an agent
  3. **Grid coordinates** (e.g., `(32, 16)`) as fallback for empty tiles
- **Visibility:** Only visible while hovering within the grid bounds. Hidden when hovering outside the grid or leaving the canvas.
- **Data source:** Bridge the existing `IsometricGrid.updateHover()` screen coordinates to React state via a callback or context
- **Styling:** Small, dark semi-transparent background, pixel-style font, compact layout

## Non-Functional Requirements

- **Performance:** Minimap redraw must not impact main canvas frame rate (< 0.5ms per frame spent on minimap)
- **State management:** Minimap data (agent positions, POI positions, camera bounds) derived from existing Convex queries — no new queries needed
- **Debounce:** URL updates debounced at 500ms to avoid excessive browser history entries
- **Coordinate system:** All minimap coordinates use the same grid-to-screen mapping as the main canvas for consistency

## Acceptance Criteria

1. Minimap appears in bottom-right corner showing agent dots, POI markers, and a viewport rectangle
2. Clicking on the minimap pans the main camera to that location
3. Loading a page with `?focus=agent_123&zoom=1.5` centers the camera on that agent at that zoom
4. Navigating to an agent detail sets `?focus=` in the URL
5. Hovering over a tile shows a tooltip with grid coordinates, plus agent/POI info if applicable
6. All existing tests continue to pass

## Out of Scope

- Entity labels on the minimap (too small at 120×120px)
- Zoom controls on the minimap itself
- Minimap resize or drag interaction
- Full camera coordinate URL storage (only `?focus` and `?zoom`)
- Mobile responsive design for tooltip
