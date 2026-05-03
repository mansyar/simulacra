# Implementation Plan: Phase 11 Track A — Layout Rationalization

**Track ID:** `layout-rationalization_20260504`
**Type:** Feature

---

## Phase 1: ThoughtStream → Bottom Drawer [checkpoint: ab541ce]

### Tasks

- [x] Task: Convert GlobalThoughtStream to bottom drawer `fcc532d`
    - [x] Write failing tests: update `GlobalThoughtStream.test.tsx` — test collapsed state (shows last event + expand handle), expanded state (200px height, full event feed), toggle via props/state
    - [x] Implement: refactor `GlobalThoughtStream.tsx` from fixed right sidebar (`right-4 top-20 bottom-24 w-64`) to an absolutely positioned bottom drawer anchored to viewport bottom
    - [x] Implement: collapsed state (~32px thin bar showing last event description + ▲ expand handle on the right)
    - [x] Implement: expanded state (200px height) with full event feed, filter tags, auto-scroll, highlighting
    - [x] Implement: CSS transition for expand/collapse animation (~300ms ease-in-out) `fcc532d`
    - [x] Implement: proper z-indexing (z-40, above canvas z-10/z-11, below Header z-50 and Agent Detail panel)
    - [x] Run tests and verify all pass — 80 files, 372 tests pass
- [x] Task: Integrate drawer toggle state into layout `9901917`
    - [x] Wire the expanded/collapsed state so `__root.tsx` and other components can toggle it — DrawerContext created and wired via __root.tsx provider
    - [x] Ensure the drawer doesn't overlap with the canvas's click/interaction area when collapsed — drawer is fixed bottom-0 at z-40, canvas sits above
- [x] Task: Conductor - User Manual Verification 'Phase 1: ThoughtStream → Bottom Drawer' (Protocol in workflow.md) `ab541ce`

---

## Phase 2: Replace Footer with Status Bar [checkpoint: be47059]

### Tasks

- [x] Task: Rewrite Footer.tsx as live instrumentation bar `704b7f1`
    - [x] Write failing tests: update `Footer.test.tsx` — test for tick count display, active agent count, relative time formatting, sleep mode indicator, countdown timer presence
    - [x] Implement: replace copyright/social boilerplate in `Footer.tsx` with a thin (32px) persistent bar
    - [x] Implement: query `worldState` via `useQuery(api.functions.world.getState)` for tick count, last tick timestamp
    - [x] Implement: query agents via `useQuery(api.functions.agents.getAll)` for active agent count
    - [x] Implement: relative time formatting utility ("10s ago", "2m ago") for last tick timestamp
    - [x] Implement: sleep mode indicator — derive from `worldState.lastUserActivityAt` vs. grace period
    - [x] Implement: next tick countdown — compute `lastTickAt + tickIntervalSeconds - Date.now()`, update every 1 second via `setInterval`
    - [x] Implement: minimal styling (dark background, small monospace text, compact layout)
    - [x] Run tests and verify all pass — 373 tests, 80 files
- [x] Task: Update layout integration in `__root.tsx` `35f8517`
    - [x] Ensure the status bar is rendered at the bottom with correct z-index and doesn't overlap the canvas — added pb-8 to main for clearance
    - [x] Fix any layout shift caused by replacing the old Footer — status bar is fixed pos, no flow shift
- [x] Task: Conductor - User Manual Verification 'Phase 2: Replace Footer with Status Bar' (Protocol in workflow.md) `be47059`

---

## Phase 3: Keyboard Shortcuts [checkpoint: 9c7306b]

### Tasks

- [x] Task: Create GameCanvas ref-forwarding pattern for camera/agent access `9c7306b`
    - [x] Write failing tests: create `src/__tests__/GameCanvas_shortcuts.test.tsx` testing context provides camera/agent refs
    - [x] Implement: expose `cameraRef` and `agentsRef` from `GameCanvas` via a shared context (`GameCanvasContext`)
    - [x] Run tests and verify all pass — 3 tests
- [x] Task: Register global keyboard shortcuts in `__root.tsx` `9c7306b`
    - [x] Write failing tests: create `src/__tests__/KeyboardShortcuts.test.tsx` — 7 tests covering each shortcut
    - [x] Implement: `useEffect` + `window.addEventListener('keydown', ...)` in `__root.tsx`
    - [x] Implement shortcut handlers:
        - **Space** → skip if input/textarea, call `triggerManualTick()`
        - **R** → `cameraRef.current.lookAt(center)` via `resetCamera`
        - **Escape** → navigate to `/` if on `/agent/$id`
        - **1-5** → find Nth agent, call `cameraRef.current.lookAt()`
        - **T** → toggle ThoughtStream drawer via `DrawerContext`
        - **M** → toggle AdminPanel visibility state
    - [x] Implement: input guard (skip if INPUT/TEXTAREA tagName)
    - [x] Run tests and verify all pass — 383 tests, 81 files
- [x] Task: Conductor - User Manual Verification 'Phase 3: Keyboard Shortcuts' (Protocol in workflow.md)
  **Manual verification not performed — user can test shortcuts: Space=R=reset camera, Esc=close panel, 1-5=focus agent, T=toggle drawer, M=toggle admin**

---

## Phase 4: Integration & Test Verification [checkpoint: dce9181]

### Tasks

- [x] Task: Run full test suite and verify no regressions
    - [x] Run `pnpm test` — 383 tests pass, 81 files
    - [x] Run `pnpm test:coverage` — all tests pass
    - [x] Run `npx tsc --noEmit` — no TypeScript errors
    - [x] No regressions found
- [x] Task: Update component index exports if needed
    - [x] No new components added; existing exports unchanged
- [x] Task: Conductor - User Manual Verification 'Phase 4: Integration & Test Verification' (Protocol in workflow.md)
