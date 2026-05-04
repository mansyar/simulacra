# Implementation Plan: Phase 11 Track B — World Navigation & Awareness

**Track ID:** `world-navigation_20260504`
**Type:** Feature

---

## Phase 1: Minimap (HTML5 Canvas) [checkpoint: cb0e834]

### Tasks

- [x] Task: Add `getScale()` method to CameraController `78c2a38`
    - [ ] Write failing tests: update `CameraController.test.ts` — test that `getScale()` returns the current stage scale
    - [ ] Implement: add `public getScale(): number` returning `this.stage.scale.x` to CameraController
    - [ ] Run tests and verify all pass
- [x] Task: Create MiniMap React component with HTML5 Canvas `f8f07a6`
    - [ ] Write failing tests: create `src/__tests__/MiniMap.test.tsx` — test canvas rendering, agent dots color-coded by archetype (reference `ARCHETYPE_COLORS` from AgentSprite.ts), POI markers, viewport rectangle visibility
    - [ ] Implement: new `src/components/game/MiniMap.tsx` as a React component wrapping a `<canvas>` element with a ref to the native canvas
    - [ ] Implement: fixed positioning (absolute, bottom-2 right-2 within the canvas container) with 120×120px dimensions, rounded border, dark background (`bg-slate-900/80`)
    - [ ] Implement: derive world-to-minimap coordinate mapping (64×64 grid → ~104×104px usable canvas area with 8px padding on each side)
    - [ ] Implement: draw agent dots (3px radius circles) using the existing `ARCHETYPE_COLORS` map imported from AgentSprite.ts — builder=blue, socialite=pink, philosopher=purple, explorer=amber, nurturer=emerald
    - [ ] Implement: draw POI markers (4×4px colored squares at their grid position)
    - [ ] Implement: draw viewport rectangle — compute visible grid range by converting all 4 viewport corners from screen coords → world pixel coords → grid coords via `screenToGrid()`. Draw a translucent white rectangle (alpha 0.4, stroke alpha 0.7)
    - [ ] Implement: click-to-jump — convert minimap pixel to world grid coords, compute screen-space position via `gridToScreen()`, call `cameraRef.current.lookAt()`
    - [ ] Implement: use `useEffect` with `requestAnimationFrame` loop for redraw — reads camera state from a shared ref (not PixiJS ticker), draws agents/POIs from React props
    - [ ] Run tests and verify all pass
- [x] Task: Wire MiniMap into GameCanvas `8b340a0`
    - [ ] Write failing tests: update `GameCanvas.test.tsx` to verify MiniMap mounts inside canvas container div
    - [ ] Implement: create a shared `cameraStateRef` in GameCanvas that stores `{ positionX, positionY, scaleX, viewportWidth, viewportHeight }` and update it every PixiJS tick
    - [ ] Implement: import and render `<MiniMap>` component inside `GameCanvas` container div, passing `cameraStateRef`, `agentsData`, `poisData`, `cameraRef` as props
    - [ ] Run tests and verify all pass
- [x] Task: Conductor - User Manual Verification 'Phase 1: Minimap' (Protocol in workflow.md) `cb0e834`

---

## Phase 2: URL-Synced Camera State

### Tasks

- [x] Task: Implement URL camera state read on mount `9c11f54`
    - [ ] Write failing tests: update `GameCanvas.test.tsx` — test that `?focus=agent1&zoom=1.5` URL params trigger `cameraRef.lookAt()` and `setZoom()` on mount; test that `?cx=32&cy=32` works when no focus param; test that no params leaves camera at default
    - [ ] Implement: in `GameCanvas`, read URL params on mount using `URLSearchParams(window.location.search)` — parse `focus`, `zoom`, `cx`, `cy`
    - [ ] Implement: priority logic — if `focus` present, find that agent in `agentsData` and call `cameraRef.lookAt(agentWorldX, agentWorldY, ...)`; else if `cx`/`cy` present, convert grid coords to screen coords and call `lookAt()`; else leave at default center
    - [ ] Implement: if `zoom` present, call `cameraRef.setZoom(parseFloat(zoom))` after camera positioning
    - [ ] Run tests and verify all pass
- [x] Task: Write camera state back to URL on pan/zoom `2013efa`
    - [ ] Write failing tests: create test that camera movement triggers `router.history.push()` with updated search params (debounced 500ms); verify `?cx`/`?cy` are set and `?focus` is cleared on manual pan
    - [ ] Implement: add a debounced effect (500ms) in `GameCanvas` that watches camera position/zoom and updates URL via `router.history.push()` — pass router from context or use `window.location` to build the new URL
    - [ ] Implement: format: `?zoom=<level>&cx=<centerGridX>&cy=<centerGridY>` — compute center grid coordinate by converting viewport center from screen coords to grid coords
    - [ ] Run tests and verify all pass
- [x] Task: Update URL on agent detail navigation `b4298ae`
    - [ ] Write failing tests: update `GameCanvas_navigation.test.tsx` — test that navigating to `/agent/$id` sets `?focus=$id` and clears `?cx`/`?cy` in URL
    - [ ] Implement: in the existing agent selection flow (AgentSprite click handler), update URL search params via `router.history.push()` to include `?focus=<agent_id>` and remove any `?cx`/`?cy`
    - [ ] Run tests and verify all pass
- [ ] Task: Conductor - User Manual Verification 'Phase 2: URL-Synced Camera State' (Protocol in workflow.md)

---

## Phase 3: Tile Tooltip

### Tasks

- [ ] Task: Compute hovered tile coordinates in GameCanvas mousemove handler
    - [ ] Write failing tests: create `src/__tests__/TileTooltip.test.tsx` — test tooltip renders near cursor position; shows grid coords for empty tile; shows agent name+archetype when agent on tile; shows POI name when POI on tile; hidden when outside grid bounds
    - [ ] Implement: add `hoveredTile` state (`{ gridX: number, gridY: number } | null`) in GameCanvas
    - [ ] Implement: in the existing `mousemove` handler, after `grid.updateHover(localX, localY)`, compute grid coords via `screenToGrid(localX - offsetX, localY - offsetY)` where `offsetX = 1024` (64×32/2) and `offsetY = 50`
    - [ ] Implement: bounds check (0-63) — set `hoveredTile` state if valid, null otherwise
    - [ ] Implement: derive `hoveredAgent` by finding an agent in `agentsData` whose `gridX`/`gridY` matches the hovered tile (linear scan, 10 agents)
    - [ ] Implement: derive `hoveredPoi` by finding a POI in `poisData` whose `gridX`/`gridY` matches (linear scan, ~5 POIs)
    - [ ] Run tests and verify all pass
- [ ] Task: Create TileTooltip React component
    - [ ] Implement: new `src/components/game/TileTooltip.tsx` — absolutely positioned div that follows cursor with 10px right / 10px below offset
    - [ ] Implement: content priority — POI name first, then agent name + archetype badge, then grid coordinates fallback
    - [ ] Implement: styling — `bg-slate-900/90 backdrop-blur-sm`, `text-[10px] font-mono`, rounded border, compact padding (2px 6px), pixel-style font
    - [ ] Implement: visibility — only render when `hoveredTile` is non-null; hidden on mouse leave
    - [ ] Run tests and verify all pass
- [ ] Task: Wire TileTooltip into GameCanvas
    - [ ] Implement: render `<TileTooltip>` inside `GameCanvas` container div, passing `hoveredTile`, `hoveredAgent`, `hoveredPoi`, and cursor pixel position (`clientX`, `clientY`)
    - [ ] Implement: pass cursor position from the `mousemove` handler into the tooltip for positioning (store in a ref or state, throttled to avoid excessive re-renders since updateHover already gates on tile change)
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
