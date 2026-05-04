# Track: World Navigation & Awareness

## Overview

Add world navigation tools to the 64×64 isometric world so users never feel lost. Implements three features: a minimap for spatial awareness at a glance, URL-synced camera state for shareable views, and a floating tile tooltip for on-hover information.

## Functional Requirements

### 1. Minimap (HTML5 Canvas)

- **Location:** Fixed position in the bottom-right corner of the canvas area (z-index above canvas, below drawers/footer)
- **Size:** 120×120 pixels
- **Rendering:** Native HTML5 `<canvas>` 2D context — NOT a second PixiJS instance
- **Content:**
  - **Agent dots:** Small circles (3px radius) color-coded by archetype — use the existing `ARCHETYPE_COLORS` map from `AgentSprite.ts` directly (builder=blue, socialite=pink, philosopher=purple, explorer=amber, nurturer=emerald)
  - **POI markers:** Small squares (4×4px) colored by POI type
  - **Viewport rectangle:** A translucent white rectangle (alpha 0.4) showing which portion of the 64×64 grid the camera currently sees. Computed by converting the 4 viewport corners from screen coordinates → world pixel coordinates → grid coordinates, then drawing the bounding box on the minimap.
- **Interaction:** Clicking a point on the minimap pans the main camera to that world coordinate
- **Update:** Redraw using `requestAnimationFrame` inside the MiniMap component — reads camera state from a shared ref, runs independently of the PixiJS update loop. No coupling to PixiJS ticker.
- **Architecture:** MiniMap is a React component with a `<canvas>` ref. Camera state (stage position, stage scale, viewport dimensions) is stored in a shared ref inside GameCanvas that gets updated every PixiJS tick. The MiniMap's RAF loop reads from this ref for the viewport rectangle, while agent/POI positions come from existing Convex query props. No new Convex queries needed.

### 2. URL-Synced Camera State

- **Three URL params:** `?focus=<agent_id>`, `?zoom=<level>`, `?cx=<centerGridX>&cy=<centerGridY>`
- **On mount (priority order):**
  1. If `?focus` is present: find the agent by ID and call `cameraRef.lookAt()` to center on them
  2. Else if `?cx`/`?cy` are present: convert those grid coordinates to screen coordinates and center the camera there
  3. Else: center on world default (0,0)
  4. If `?zoom` is present: call `cameraRef.setZoom()` with parsed float value
- **Write back:** On camera pan/zoom, debounce (500ms) and write current camera state back to URL:
  - `?zoom=<currentZoomLevel>`
  - `?cx=<centerGridX>&cy=<centerGridY>` — the grid coordinate at the center of the current viewport
  - Clear `?focus` when panning manually (no agent selected)
- **On agent selection:** When the user navigates to `/agent/$id`:
  - Set `?focus=<agent_id>` in the URL
  - Clear `?cx`/`?cy` (focus takes priority on reload)
- **URL reading method:** Use `URLSearchParams` on `window.location.search` and `router.history.push()` for updates — consistent with the existing Escape-key handler pattern in `__root.tsx`. Do NOT use TanStack Router's `useSearch()` (no search schema exists in the route config).

### 3. Tile Tooltip (Floating Near Cursor)

- **Position:** A small floating div near the cursor, offset slightly (10px right, 10px below cursor), within the canvas container
- **Content, priority order (show highest-priority match):**
  1. **POI name** if the hovered tile contains a POI
  2. **Agent name + archetype badge** if the hovered tile contains an agent
  3. **Grid coordinates** (e.g., `(32, 16)`) as fallback for empty tiles
- **Visibility:** Only visible while hovering within the grid bounds. Hidden when hovering outside the grid or leaving the canvas.
- **Data source:** Compute grid coordinates directly inside the existing `mousemove` handler of `GameCanvas`. The handler already computes `localX`/`localY` (stage-local coordinates). Convert to grid coordinates using `screenToGrid(localX - offsetX, localY - offsetY)`. Store in a React state variable. No modification needed to `IsometricGrid`.
- **Matching agents/POIs to hovered tile:** Compare the hovered `(gridX, gridY)` against `agentsData` (for agents whose current position matches) and `poisData` (for POIs whose grid position matches). Use `Array.find()` — linear scan is fine for 10 agents and ~5 POIs.
- **Styling:** Small, dark semi-transparent background, pixel-style font, compact layout

## Non-Functional Requirements

- **Performance:** Minimap `requestAnimationFrame` redraw must not block the main thread (< 0.5ms per frame). Canvas 2D drawing is lightweight for ~15 simple shapes.
- **State management:** Minimap data (agent positions, POI positions, camera bounds) derived from existing Convex query props and a shared camera state ref — no new queries or state duplication.
- **Debounce:** URL updates debounced at 500ms to avoid excessive browser history entries.
- **Coordinate system:** Minimap uses grid coordinates (0-63) mapped to canvas pixels. Viewport rectangle computed via screen-to-grid coordinate conversion to ensure alignment with the main canvas rendering.

## Acceptance Criteria

1. Minimap appears in bottom-right corner showing agent dots, POI markers, and a viewport rectangle that updates as the camera pans/zooms
2. Clicking on the minimap pans the main camera to that location
3. Loading a page with `?focus=agent_123&zoom=1.5` centers the camera on that agent at that zoom
4. Loading a page with `?cx=32&cy=32&zoom=1.5` (no focus) centers the camera on grid (32, 32) at that zoom
5. Navigating to an agent detail sets `?focus=<id>` in the URL; manually panning clears `?focus` and sets `?cx`/`?cy`
6. Hovering over a tile shows a tooltip with grid coordinates, plus agent/POI info if applicable
7. All existing tests continue to pass

## Out of Scope

- Entity labels on the minimap (too small at 120×120px)
- Zoom controls on the minimap itself
- Minimap resize or drag interaction
- Mobile responsive design for tooltip
