# Specification: Phase 11 Track A — Layout Rationalization

## Overview
This track eliminates floating-panel clutter that currently overlaps the game canvas (AdminPanel fixed left-bottom, ThoughtStream fixed right), replaces the boilerplate copyright footer with a live instrumentation status bar, and adds power-user keyboard shortcuts. The goal is to give the isometric canvas full visual breathing room and provide useful world instrumentation at a glance.

## Functional Requirements

### 1. ThoughtStream → Bottom Drawer
- **Convert** `GlobalThoughtStream` from a fixed right sidebar (`right-4 top-20 bottom-24`) into a collapsible bottom drawer anchored at the bottom of the viewport.
- **Default (collapsed) state:** Shows only the last event as a thin bar (~32px) with an ▲ expand handle on the right.
- **Expanded state:** Slides up to reveal the full event feed, occupying **200px** height (matching the original spec's footer layout intent).
- **Preserve all existing features:** Filter tags (agent name, event type), auto-scroll, selected-agent highlighting, event type icons, and the empty/waiting states.
- **Apply proper z-indexing** so the drawer sits above the canvas but below the Header and Agent Detail panel.
- **Animate** the expand/collapse transition (Framer Motion or CSS transition, ~300ms).

### 2. Replace Footer with Status Bar
- **Remove** the copyright boilerplate content and TanStack social links from `Footer.tsx`.
- **Replace** with a thin (32px) persistent instrumentation bar at the bottom of the screen.
- **Display the following live metrics**, all queried from Convex:
  - **Tick count** — `worldState.totalTicks`
  - **Last tick timestamp** — `worldState.lastTickAt`, formatted as relative time ("10s ago", "2m ago")
  - **Active agent count** — count of agents where `isActive === true`
  - **Sleep mode indicator** — visible icon/tag (e.g., "💤 Sleeping" or "🟢 Active") derived from `worldState` activity data
  - **Next tick countdown** — live countdown timer showing seconds remaining until the next world tick (based on `lastTickAt + tickIntervalSeconds`)
- **Style** the bar with a subtle dark background, small monospace text, and minimal footprint.

### 3. Keyboard Shortcuts
Register global keybindings in `__root.tsx` using a `useEffect` with a `keydown` event listener on `window`. All shortcuts must be scoped to not fire when the user is typing in an input field.

| Key | Action |
|-----|--------|
| `Space` | Trigger manual world tick (only if Master password is authenticated — check via existing auth state) |
| `R` | Reset camera to center of the isometric grid |
| `Escape` | If agent detail panel is open, navigate back to `/` to close it; dismiss other overlays |
| `1-5` | Focus camera on the Nth agent in the agents array (1-indexed). No-op if that index doesn't exist |
| `T` | Toggle the ThoughtStream bottom drawer (expand/collapse) |
| `M` | Toggle the Admin Master panel (show/hide) |

**Implementation notes:**
- Expose `cameraRef`, `agentsRef` from `GameCanvas` via a ref-forwarding or a context/event pattern so `__root.tsx` can call `lookAt()` on keyboard events.
- Space key must check `e.target` to avoid firing when focused in an input/textarea.
- The `triggerManualTick` server function already exists in `src/lib/server-functions.ts`.

## Non-Functional Requirements
- **Performance:** The status bar countdown timer should update at most once per second (not every frame).
- **Accessibility:** Keyboard shortcuts must not interfere with standard browser shortcuts (e.g., Space for page scroll is overridden only when Master is authenticated).
- **Type Safety:** All new components and props must be fully typed with TypeScript.

## Acceptance Criteria
- [ ] ThoughtStream is a collapsible bottom drawer (200px expanded), not a floating sidebar.
- [ ] Footer shows: tick count, last tick time, active agent count, sleep indicator, next tick countdown.
- [ ] `Space` triggers manual tick when Master is authenticated.
- [ ] `R` resets camera to center.
- [ ] `Escape` closes agent detail panel.
- [ ] `1-5` focuses camera on agent by index (no-op if out of range).
- [ ] `T` toggles ThoughtStream drawer.
- [ ] `M` toggles Admin Panel.
- [ ] All existing tests pass (Footer.test.tsx, GlobalThoughtStream.test.tsx, etc. updated accordingly).
- [ ] Code coverage >80% for new code.

## Out of Scope
- The Minimap (Track B)
- Weather particles, time-of-day overlay, theme integration (Track C)
- AdminPanel header dropdown migration (Track D)
- Agent detail panel redesign (Track D)
- Observer dashboard / conversation visualization enhancements (Track E)
