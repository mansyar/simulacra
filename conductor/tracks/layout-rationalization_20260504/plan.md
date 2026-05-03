# Implementation Plan: Phase 11 Track A — Layout Rationalization

**Track ID:** `layout-rationalization_20260504`
**Type:** Feature

---

## Phase 1: ThoughtStream → Bottom Drawer

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
- [ ] Task: Conductor - User Manual Verification 'Phase 1: ThoughtStream → Bottom Drawer' (Protocol in workflow.md)

---

## Phase 2: Replace Footer with Status Bar

### Tasks

- [ ] Task: Rewrite Footer.tsx as live instrumentation bar
    - [ ] Write failing tests: update `Footer.test.tsx` — test for tick count display, active agent count, relative time formatting, sleep mode indicator, countdown timer presence
    - [ ] Implement: replace copyright/social boilerplate in `Footer.tsx` with a thin (32px) persistent bar
    - [ ] Implement: query `worldState` via `useQuery(api.functions.world.getState)` for tick count, last tick timestamp
    - [ ] Implement: query agents via `useQuery(api.functions.agents.getAll)` for active agent count
    - [ ] Implement: relative time formatting utility ("10s ago", "2m ago") for last tick timestamp
    - [ ] Implement: sleep mode indicator — derive from `worldState.lastUserActivityAt` vs. grace period
    - [ ] Implement: next tick countdown — compute `lastTickAt + tickIntervalSeconds - Date.now()`, update every 1 second via `setInterval`
    - [ ] Implement: minimal styling (dark background, small monospace text, compact layout)
    - [ ] Run tests and verify all pass
- [ ] Task: Update layout integration in `__root.tsx`
    - [ ] Ensure the status bar is rendered at the bottom with correct z-index and doesn't overlap the canvas
    - [ ] Fix any layout shift caused by replacing the old Footer
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Replace Footer with Status Bar' (Protocol in workflow.md)

---

## Phase 3: Keyboard Shortcuts

### Tasks

- [ ] Task: Create GameCanvas ref-forwarding pattern for camera/agent access
    - [ ] Write failing tests: create `src/__tests__/GameCanvas_shortcuts.test.tsx` testing that keyboard events trigger correct camera/navigation actions
    - [ ] Implement: expose `cameraRef` and `agentsRef` from `GameCanvas` via a React context (`GameCanvasContext`) or imperative handle
    - [ ] Run tests and verify all pass
- [ ] Task: Register global keyboard shortcuts in `__root.tsx`
    - [ ] Write failing tests: create `src/__tests__/KeyboardShortcuts.test.tsx` — test each shortcut key fires the correct handler; test that Space doesn't fire when typing in an input
    - [ ] Implement: `useEffect` + `window.addEventListener('keydown', ...)` in `__root.tsx`
    - [ ] Implement shortcut handlers:
        - **Space** → check `e.target` (skip if input/textarea), call `triggerManualTick()` (requires Master auth check)
        - **R** → call `cameraRef.current.lookAt(center)`
        - **Escape** → navigate to `/` if on `/agent/$id`
        - **1-5** → find Nth agent, call `cameraRef.current.lookAt()`; no-op if index out of range
        - **T** → toggle ThoughtStream drawer state
        - **M** → toggle AdminPanel visibility state
    - [ ] Implement: Master auth state tracking (if not already available) for the Space key guard
    - [ ] Run tests and verify all pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Keyboard Shortcuts' (Protocol in workflow.md)

---

## Phase 4: Integration & Test Verification

### Tasks

- [ ] Task: Run full test suite and verify no regressions
    - [ ] Run `pnpm test` — all existing tests must pass
    - [ ] Run `pnpm test:coverage` — verify >80% coverage for new/modified files
    - [ ] Run `npx tsc --noEmit` — verify no TypeScript errors
    - [ ] Fix any regressions or type errors
- [ ] Task: Update component index exports if needed
    - [ ] Update `src/components/index.ts` if new components were added or signatures changed
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration & Test Verification' (Protocol in workflow.md)
