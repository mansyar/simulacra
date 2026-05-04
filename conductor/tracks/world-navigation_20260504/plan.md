# Implementation Plan: Phase 11 Track B — World Navigation & Awareness

**Track ID:** `world-navigation_20260504`
**Type:** Feature

---

## Phase 1: Minimap (HTML5 Canvas)

### Tasks

- [ ] Task: Create MiniMap React component with HTML5 Canvas
    - [ ] Write failing tests: create `src/__tests__/MiniMap.test.tsx` — test canvas rendering, agent dots, POI markers, viewport rectangle visibility
    - [ ] Implement: new `src/components/game/MiniMap.tsx` as a React component wrapping a `<canvas>` element
    - [ ] Implement: fixed positioning (absolute, bottom-2 right-2 within the canvas container) with 120×120px dimensions, border, dark background
    - [ ] Implement: derive world-to-minimap coordinate mapping (64×64 grid → 120×120 canvas area with padding)
    - [ ] Implement: draw agent dots (3px radius circles, color-coded by archetype using existing color map)
    - [ ] Implement: draw POI markers (4×4px colored squares)
    - [ ] Implement: draw viewport rectangle (translucent white, alpha 0.4) computed from camera position/zoom
    - [ ] Implement: click-to-jump — convert minimap pixel to world grid coords, call `cameraRef.current.lookAt()`
    - [ ] Implement: redraw on every animation frame (via requestAnimationFrame or PixiJS ticker callback passed from GameCanvas)
    - [ ] Run tests and verify all pass
- [ ] Task: Wire MiniMap into GameCanvas
    - [ ] Write failing tests: update `GameCanvas.test.tsx` to verify MiniMap mounts inside canvas container
    - [ ] Implement: import and render `<MiniMap>` component inside `GameCanvas` container div
    - [ ] Implement: pass agentData, poisData, cameraRef, camera bounds (stage position/scale) as props
    - [ ] Implement: add a MinimapDataProvider or hook that subscribes to the PixiJS ticker to push camera state to the MiniMap React component
    - [ ] Run tests and verify all pass
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Minimap' (Protocol in workflow.md)

---

## Phase 2: URL-Synced Camera State

### Tasks

- [ ] Task: Implement URL camera state read on mount
    - [ ] Write failing tests: update `GameCanvas.test.tsx` — test that `?focus=agent_id` and `?zoom=1.5` URL params trigger `cameraRef.lookAt()` and `setZoom()` on mount
    - [ ] Implement: in `GameCanvas`, read `useSearch()` from TanStack Router to get `focus` and `zoom` params on mount
    - [ ] Implement: if `focus` param present, find agent by ID and call `cameraRef.current.lookAt()` with agent's world position
    - [ ] Implement: if `zoom` param present, call `cameraRef.current.setZoom()` with parsed float value
    - [ ] Run tests and verify all pass
- [ ] Task: Write camera state back to URL on pan/zoom
    - [ ] Write failing tests: create test that camera movement after mount triggers `navigate()` with updated search params (debounced)
    - [ ] Implement: add a debounced effect (500ms) in `GameCanvas` that watches camera position/zoom changes and updates URL search params via `navigate({ search: ... })`
    - [ ] Implement: only write `?zoom=<level>` back (position derived from agent focus, not raw coords)
    - [ ] Run tests and verify all pass
- [ ] Task: Update URL on agent detail navigation
    - [ ] Write failing tests: update `GameCanvas_navigation.test.tsx` — test that navigating to `/agent/$id` sets `?focus=$id` in URL
    - [ ] Implement: in the existing agent selection flow (AgentSprite click handler), update URL search params to include `?focus=<agent_id>`
    - [ ] Run tests and verify all pass
- [ ] Task: Conductor - User Manual Verification 'Phase 2: URL-Synced Camera State' (Protocol in workflow.md)

---

## Phase 3: Tile Tooltip

### Tasks

- [ ] Task: Create bridge from IsometricGrid hover state to React state
    - [ ] Write failing tests: create `src/__tests__/TileTooltip.test.tsx` — test tooltip renders near cursor, shows grid coords, agent info when hovered tile has agent, POI info when hovered tile has POI
    - [ ] Implement: add a hover callback/event system to `IsometricGrid` that fires when `updateHover()` detects a tile change (new tile hovered or hover left bounds)
    - [ ] Implement: in `GameCanvas`, subscribe to hover changes and store current hover state (gridX, gridY, agent info, POI info) in a React state variable
    - [ ] Run tests and verify all pass
- [ ] Task: Create TileTooltip React component
    - [ ] Implement: new `src/components/game/TileTooltip.tsx` — absolutely positioned div that follows cursor with 10px right/10px bottom offset
    - [ ] Implement: content logic — show POI name first, then agent name + archetype badge, then grid coordinates fallback
    - [ ] Implement: styling — dark semi-transparent background (`bg-slate-900/90`), small text (`text-[10px]`), rounded border, compact padding, pixel-style font
    - [ ] Implement: visibility — only render when within grid bounds, hidden on mouse leave
    - [ ] Run tests and verify all pass
- [ ] Task: Wire TileTooltip into GameCanvas
    - [ ] Implement: render `<TileTooltip>` inside `GameCanvas` container div, pass hover state, cursor position, agents data, POIs data
    - [ ] Implement: pass mouse event coordinates (clientX/clientY) from the mousemove handler to the tooltip for positioning
    - [ ] Run tests and verify all pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Tile Tooltip' (Protocol in workflow.md)

---

## Phase 4: Integration & Test Verification

### Tasks

- [ ] Task: Run full test suite and verify no regressions
    - [ ] Run `pnpm test` — verify all existing + new tests pass
    - [ ] Run `pnpm test:coverage` — verify coverage meets threshold
    - [ ] Run `npx tsc --noEmit` — no TypeScript errors
    - [ ] No regressions found
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration & Test Verification' (Protocol in workflow.md)
