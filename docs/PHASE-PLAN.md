# PHASE-PLAN.md - Implementation Roadmap

## Phase Overview

| Phase | Name | Focus | Status | Estimated Duration |
|-------|------|-------|--------|-------------------|
| 1 | The Body | Setup + Rendering | ✅ Complete | 1-2 weeks |
| 2 | The Heart | Convex + Real-time Sync | ✅ Complete | 1-2 weeks |
| 3 | The Brain | LLM Integration + Memory | ✅ Complete | 2-3 weeks |
| 4 | The Eyes | Excalibur → PixiJS Migration | ✅ Complete | 3-4 days |
| 5 | The Social | Proximity + Frontend Interaction | ✅ Complete | 1-2 weeks |
| 6 | Fluid Movement | Organic idle + Predictive pathing | ✅ Complete | 3-4 days |
| 7 | The Mind | AI Context Fidelity | ✅ Complete | 1 week |
| 8 | The Backbone | Robustness & Scaling | ✅ Complete | 1 week |
| 9 | The Soul | Deeper Social Dynamics | ✅ Complete | 1 week |
| 10 | Movement Coherence | Fix agent trajectory, weather sync, and arrival cleanup | ⏳ Tracks A-C Complete (Track D Pending) | 2-3 days |
| 11 | The Observatory | UI/UX Polish & World Immersion | ⏳ Not Started | 2-3 weeks |
| 12 | The Polish | Master Panel + Deploy | ⏳ Not Started | 1 week |

---

## Phase 1: The Body — Setup + Rendering ✅

**Goal:** Initialize a TanStack Start project with an isometric grid rendering engine.

**Summary:** Set up the TanStack Start project scaffold with TypeScript, Tailwind CSS, and Excalibur.js. Built an isometric grid renderer (64×64 tiles) with procedural tile generation and grid↔screen coordinate conversion. Implemented camera controls (drag-to-pan, scroll-to-zoom) with URL-based state sync (`?zoom=`, `?focus=`). Created placeholder agents as colored squares with name labels and basic idle bounce animations, tested with 10-25 agents. Full test suite via Vitest confirmed builds, rendering, camera interaction, and coordinate accuracy.

**Key outcome:** Functional isometric world canvas with interactive camera and visible agent placeholders.

---

## Phase 2: The Heart — Convex + Real-time Sync ✅

**Goal:** Wire up a Convex backend for persistent agent state and real-time cross-client sync.

**Summary:** Installed and configured Convex with a schema defining `agents`, `world_state`, and supporting tables. Implemented CRUD mutations/queries (`getAll`, `getById`, `create`, `updatePosition`). Replaced placeholder agents with database-backed entities that sync in real time across browser tabs. Added a `world_state` table with weather and time-of-day tracking. Seeded 25 initial agents into the database.

**Key outcome:** Agents persist in Convex, updates propagate instantly to all connected clients, and the weather/time system drives ambient world context.

---

## Phase 3: The Brain — LLM Integration + Memory ✅

**Goal:** Give agents AI-driven decision-making with persistent memory and personality archetypes.

**Summary:** Integrated OpenAI API via Convex secrets, creating `convex/functions/ai.ts` for LLM calls. Built a prompt system with personality archetype templates (`ARCHETYPE_PROMPTS`), JSON output parsing (`DECISION_SYSTEM_PROMPT`), and a context prompt generator. Configured a Convex Vector Index (768 dimensions) for semantic memory. Implemented a two-tier memory system: a sensory buffer (last 10 events) for short-term recall and vector-embedded semantic storage for long-term retrieval. Created a Convex Cron job (`convex/crons.ts`) for the world tick loop, with deterministic need tracking (hunger, energy) and LLM-driven social decisions.

**Key outcome:** Agents make context-aware decisions each tick, remember recent interactions, and retrieve relevant past memories via vector search.

---

## Phase 4: The Eyes — Excalibur → PixiJS Migration ✅

**Goal:** Migrate the rendering layer from Excalibur.js to PixiJS v8 for GPU-accelerated 2D rendering.

**Summary:** Removed Excalibur (~200KB) and installed PixiJS v8 (~150KB). Rewrote `GameCanvas.tsx` using PixiJS `Application` with proper React lifecycle management. Rebuilt the isometric grid with viewport culling (only draws visible tiles), camera controller (Container transform with drag-to-pan + scroll-to-zoom + bounds clamping), agent sprites (archetype-colored circles + name labels + action emojis + speech bubbles with smooth lerp interpolation), and POI sprites. All existing visual behavior was preserved: smooth grid-position lerping, click-to-move, tab visibility pause/resume, and Convex real-time sync. Excalibur types and imports were fully purged from the codebase. Updated all documentation (ARCHITECTURE.md, ISOMETRIC.md, SPEC.md, PRD.md, README.md).

**Key outcome:** Identical visual output with improved performance and reduced bundle size.

---

## Phase 5: The Social — Proximity + Frontend Interaction ✅

**Goal:** Enable multi-turn conversations, an agent detail panel, and relationship-aware AI behavior.

**Summary — Track A (Quick Fixes):** Moved hardcoded interaction radius (5) to the config table. Fixed `updateRelationship` not updating `lastInteractionType` on subsequent interactions. Removed TanStack starter template content from the index route.

**Summary — Track B (Frontend Interaction):** Made agent sprites interactive (`eventMode: 'static'`), enabling click-to-select with a visual highlight ring and camera focus. Created a TanStack route `/agent/$id` as a slide-in detail panel showing identity (name, archetype, bio, traits), live needs bars (hunger, energy, social), current goal/action, inventory, relationships with affinity scores, and recent events. Improved the Thought Stream sidebar with filtering (by agent name and event type), auto-scroll, and selected-agent highlighting.

**Summary — Track C (Social Depth):** Wired relationship data into LLM prompts via `buildFullContext` ("You like Alice (affinity: +14)"). Implemented open-ended multi-turn conversations (one exchange per tick, capped at 5 turns), with `conversationState` tracking `partnerId` and `role`. Added visual conversation indicators (dotted line/glow arc + chat icon) between conversing agent pairs.

**Key outcome:** Clickable agents with rich detail panels, relationship-aware AI, multi-turn conversations with visual indicators, and Thought Stream filtering.

---

## Phase 6: Fluid Movement — Organic Idle + Predictive Pathing ✅

**Goal:** Replace static agent waiting with organic idle behaviors and smooth predictive movement.

**Summary:** Integrated Simplex Noise for natural idle movements (pacing, shifting, swaying), mapped to archetype-specific speed multipliers. Deterministic actions (eating, sleeping, talking) bypass organic idle. Added `predictedX/predictedY` fields to the agent data model for continuous frontend interpolation between ticks, time-synced via elapsed tick time. Implemented course correction: on each backend state update, the delta between predicted and actual position is computed and smoothed via a 500ms lerp. Backend positions remain authoritative.

**Key outcome:** Agents move organically between ticks without teleportation, with smooth course correction handling backend desync within 500ms, all within performance budget for 100 agents.

---

## Phase 7: The Mind — AI Context Fidelity ✅

**Goal:** Ensure LLM decisions incorporate full sensory context, memories, relationships, and archetype personality.

**Summary — Track A (Sensory Buffer):** Added retrieval of the last 10 sensory events to `buildFullContext()`, formatted as a chronologically ordered list with relative timestamps. Verified via test (`sensory_context.test.ts` — 4 tests) that events appear in the LLM decision context.

**Summary — Track B (User Prompt Restructuring):** Removed the `contextOverride` parameter entirely — a clean break with no deprecated shim. Restructured the user prompt with inline `## Your Identity`, `## Your State`, `## Your Relationships`, `## Recent Events`, `## Relevant Memories` sections. Rewrote `DECISION_SYSTEM_PROMPT` to contain only the JSON output schema. `ARCHETYPE_PROMPTS` is always appended to the system prompt. `buildFullContext` returns a structured object (`agentContext`, `relationshipContext`, `events`, `memories`). Integration test (`user_prompt_context.test.ts`) verifies all 5 context sections appear. All 73 tests pass with 85.56% coverage.

**Key outcome:** Every LLM decision receives full contextual awareness — who the agent is, what's happening around them, their relationships, recent events, and relevant past memories. No context content is ever dropped or replaced.

---

## Phase 8: The Backbone — Robustness & Scaling ✅

**Goal:** Unbottleneck the world tick, optimize spatial queries for 50+ agents, and clean up technical debt.

**Summary — Track A (Unbottleneck the World Tick):** Removed the 3-at-a-time batching with 1-second delays — all agents now fire LLM calls in parallel via `Promise.all()`. Added per-agent error isolation (try-catch with 1 retry) so one failure doesn't cascade. Simplified `fetchWithRetry` to skip 429 backoff for chat calls (the chat model has no concurrency limit). Tick duration dropped from ~3.2s to ~0.04-1.0s. Added `tickDurationMs` monitoring. 9 new tests.

**Summary — Track B (Spatial Query Optimization):** Replaced brute-force O(n²) Euclidean distance scans with Convex `by_position` index queries (bounded-range `gte`/`lte` on `gridX`, then in-memory Euclidean filter). Applied to both `recordPassivePerception` and `processAgent()`. 50+ agent benchmark completed in 1,055ms (well under the 30s target). Pattern documented in ARCHITECTURE.md §7.2.

**Summary — Track C (Embedding Pipeline & Config Cleanup):** Created `batchEmbed` action to send multiple texts in a single API call (N calls/tick → 1). Added a per-tick ephemeral embedding cache (`Map<string, number[]>`) keyed by text hash. Capped `coreTraits` at 10 entries (`.slice(0, 10)` with dedup). Replaced magic number 480 with `REFLECTION_INTERVAL_TICKS`. All 225 tests pass across 59 test files.

**Key outcome:** The world tick is ~80x faster, spatial queries scale to 50+ agents, embedding costs are minimized via batching and caching, and all magic thresholds are named constants.

---

## Phase 9: The Soul — Deeper Social Dynamics ✅

**Goal:** Fix the conversation system to be truly bidirectional, with dynamic sentiment, lifecycle cleanup, runtime configurability, and POI-aware behavior.

**Summary — Track A (Bidirectional Conversation):** Removed the one-sided model where partners were forced into `action: "listening"` and skipped. Each agent now stores only their own `myLastSpeech` in `conversationState`. Partners read each other's speech from the in-memory agents array during LLM context building. Removed the `if (listening) return` guard entirely. On conversation end, both agents' `conversationState` is cleared and the partner's action is reset to `"idle"`. 106/106 tests pass.

**Summary — Track B (Sentiment-Based Affinity):** Added `analyzeSentiment()` (~60 keyword-based entries, graded ±1 to ±3, clamped to [-3, +3]). Sentiment-derived affinity deltas fire on every conversation turn (not just initiation), updating both agents' `updateRelationship()` and `valenceHistory` (capped at 5). 17 new tests (10 unit + 7 integration). All 247 tests pass.

**Summary — Track C (Conversation TTL & Cleanup):** Implemented `cleanStaleConversations` at the start of every tick with partner dedup (`Set<string>`), hard cleanup (DB + in-memory mutation), and sensory event logging with dynamic staleness duration. TTL defaults to `5 turns × tickInterval × 2× safety multiplier`, configurable via `conversationMaxTtlMs` in the config table. 11 new tests. All 258 tests pass.

**Summary — Track D (Runtime Configuration):** Extracted 5 constants to the config table with env var fallbacks: `maxTraits` (10), `reflectionIntervalTicks` (480), `maxConversationTurns` (5), `safetyMultiplier` (2), `agentSpeed` (6). Added `getConfigValue` helper (priority: env var → config table → hardcoded default). Updated all affected files (`updateIdentity`, `updateRelationship`, `resolveMovement`, `processAgent`, `cleanStaleConversations`). 20 new integration tests. All 301 tests pass.

**Summary — Track E (POI-Aware Agent Behavior):** Injected a `## Nearby Locations` section into the LLM user prompt with POI names, coordinates, descriptions, and distances. Added activity suggestions (e.g., "eating → Cozy Cafe"). POI name resolution uses case-insensitive `includes()` matching with distance-based tie-breaking; hallucinated names fall back to a random nearby coordinate. When the LLM targets a POI with a non-walking action (e.g., `action: "eating"`, `target: "Cozy Cafe"`), the action is overridden to `"walking"` unless already within 1 tile. Added POI-named arrival events ("Arrived at Cozy Cafe to eat"). Location-based need multipliers apply at matching POIs. 4 new test files (15+ tests). ~330 tests total.

**Key outcome:** Conversations are fully bidirectional, affinity evolves dynamically per turn, stale conversations auto-cleanup, all thresholds are runtime-configurable, and agents intelligently walk to POIs for contextual activities.

---

## Phase 10: Movement Coherence ⏳ (Track D Pending)

**Goal:** Fix logical gaps in the movement pipeline — LLM trajectory blindness, weather speed desync, missing arrival cleanup, and bounds clamping.

**Status:** Tracks A-C ✅ Complete | Track D ⏳ Pending

**Summary — Track A (LLM Sees Its Own Trajectory):** Added `currentAction` as structured data alongside `hunger/energy/social` in the `decision` action args. Appended `Current Position: (gridX, gridY)`, `Destination: (targetX, targetY)` (or `"None"`), and `Distance Remaining: ~N tiles` to the LLM context. Verified via tests that trajectory fields and `"None"` fallback appear correctly. All 352 tests pass.

**Summary — Track B (Weather-Aware Frontend Speed):** Created `src/lib/weather.ts` with `getWeatherSpeedMultiplier()` (sunny/cloudy→1.0, rainy→0.8, stormy→0.5). `GameCanvas` queries world state via `useQuery`, computes the multiplier, and passes it to each `AgentSprite`. Added `setSpeedMultiplier()` for dynamic weather changes. Changed tick calculation from hardcoded `6 / 180` to `(6 * speedMultiplier) / 180`. 10 new tests (utility + sprite), 136 frontend tests pass.

**Summary — Track C (Arrival Cleanup):** `resolveMovement` in `agents.ts` now atomically snaps `gridX/Y` to exact target coordinates and clears `targetX/Y` in a single DB patch when `distance < 0.1` or `ratio === 1`. `world.ts` simply logs the arrival event. 2 new tests. All 363 tests pass across 79 files.

**Track D (Bounds Clamping — Pending):** Add `Math.max(0, Math.min(63, ...))` clamping around `resolveMovement` to prevent agents from walking off the [0, 63] map boundary.

**Key outcome (once complete):** Agents see their own trajectory and complete journeys, frontend speed matches backend in all weather without snap-back, arrived agents stop cleanly, and the map boundary remains respected.

---

## Phase 11: The Observatory — UI/UX Polish & World Immersion (Upcoming)

**Goal:** Transform the interface from functional overlays into a cohesive, immersive observatory experience. Eliminate floating panel clutter, add world navigation tools, enrich ambient feedback, and make every interaction feel intentional and polished.

**Status:** ⏳ NOT STARTED — Estimated Duration: 2-3 weeks

---

### Track A: Layout Rationalization

**Goal:** Eliminate floating-panel clutter and give the canvas full visual breathing room. Replace the boilerplate footer with useful instrumentation. Add power-user shortcuts.

**Rationale:** Currently, the AdminPanel (fixed left-bottom) and ThoughtStream (fixed right) float over the canvas, competing for screen real estate. The footer contains copyright boilerplate. This track fixes all three.

#### Checklist:
- [ ] **ThoughtStream → Bottom Drawer**: Convert GlobalThoughtStream from a fixed right sidebar (`right-4 top-20 bottom-24`) into a collapsible bottom drawer. Default: collapsed (shows last event + ▲ expand handle). Expanded: slides up to show full event feed with existing filters. Follows the original spec's "200px footer" layout intent.
- [ ] **Replace Footer with Status Bar**: Remove the copyright/social boilerplate from `Footer.tsx`. Replace with a thin (32px) persistent instrumentation bar showing: tick count, last tick timestamp, active agent count, and sleep mode indicator.
- [ ] **Keyboard Shortcuts**: Register global keybindings in `__root.tsx`:
  | Key | Action |
  |-----|--------|
  | `Space` | Manual tick (if Master authenticated) |
  | `R` | Reset camera to center |
  | `Escape` | Close agent detail / dismiss overlays |
  | `1-5` | Focus camera on agent by index |
  | `T` | Toggle ThoughtStream drawer |
  | `M` | Toggle Master panel |

#### Files affected: `GlobalThoughtStream.tsx`, `Footer.tsx`, `__root.tsx`, `GameCanvas.tsx`

---

### Track B: World Navigation & Awareness

**Goal:** Make the 64×64 isometric world navigable at a glance. Users should never feel lost or resort to aimless panning.

**Rationale:** 4,096 tiles is large. Without a minimap or coordinate feedback, observers have no spatial orientation. URL-synced camera enables shareable bookmarks.

#### Checklist:
- [ ] **Minimap**: Add a small (120×120px) top-down minimap in the bottom-right corner of the canvas area, showing:
  - Agent dots color-coded by archetype (same colors as AgentSprite)
  - POI markers with small labels
  - Viewport rectangle indicating current camera bounds
  - Click-to-jump: clicking a position on the minimap pans the camera there
  - Render via a small `<canvas>` or lightweight PixiJS graphics, updated every tick
- [ ] **URL-Synced Camera State**: Read `?zoom` and `?focus` from URL search params on mount. Write camera position back to URL on pan/zoom (debounced, 500ms). Enables bookmarkable views and browser back/forward navigation.
- [ ] **Tile Tooltip**: Show a small floating tooltip near the cursor when hovering over the canvas, displaying: grid coordinates, agent name + archetype (if an agent is on the tile), or POI name (if a POI is on the tile). Bridge existing `grid.updateHover()` to a React state.

#### Files affected: `GameCanvas.tsx`, `Camera.ts`, new `MiniMap.tsx` component

---

### Track C: Ambient World & Theme Integration

**Goal:** Make the world feel alive between ticks. Fix the jarring mismatch between the light/dark UI theme and the static PixiJS canvas.

**Rationale:** The canvas `backgroundColor` is hardcoded to `0x0f172a` (dark slate) regardless of theme toggle. Weather and time-of-day have no visual feedback in the game world itself.

#### Checklist:
- [ ] **Theme-Aware PixiJS Canvas**: On theme change, update PixiJS `app.renderer.background.color`:
  - Dark theme → `0x0f172a` (current, dark slate)
  - Light theme → `0xe7f3ec` (`--bg-base` from styles.css)
  - Pass theme state down via React context. Use `app.renderer.backgroundColor` in PixiJS v8.
- [ ] **Time-of-Day Overlay Tint**: Add a full-screen translucent `Graphics` overlay on the PixiJS stage that subtly shifts color based on `worldState.timeOfDay`:
  - Dawn (5-7): Warm orange tint, alpha 0.08
  - Day (7-18): No tint
  - Dusk (18-20): Purple-orange tint, alpha 0.12
  - Night (20-5): Deep blue tint, alpha 0.25
  - Transition smoothly over 2-3 ticks when time changes
- [ ] **Weather Particles**: Create a lightweight PixiJS particle system for weather effects:
  - Rainy: Diagonal white line segments falling from top of viewport (use `Graphics` batch, ~100 lines)
  - Stormy: Rain + occasional full-screen white flash (lightning, 200ms duration)
  - Cloudy: Slow-moving semi-transparent cloud shapes at top of viewport
  - Particles are viewport-culled and cleaned up on weather change
  - Keep particle count under 150 draw calls for 60 FPS

#### Files affected: `GameCanvas.tsx`, new `WeatherParticles.ts`, new `TimeOfDayOverlay.ts`, `src/styles.css` (export theme colors for PixiJS)

---

### Track D: Admin Panel & Agent Controls

**Goal:** Centralize Master controls in the header where they belong. Add weather control (currently missing). Redesign the agent detail panel for visual hierarchy and delight.

**Rationale:** The spec calls for a "Master Panel Toggle" in the header but the current AdminPanel floats at `left-4 bottom-24`. Weather control is listed in Phase 5 requirements but has no UI. The agent detail panel ("/agent/$id") stacks everything vertically with no visual hierarchy.

#### Checklist:
- [ ] **AdminPanel → Header Badge Dropdown**: Move all Master controls from the fixed floating panel into a dropdown/popover in the Header. A 🔑/🛡️ icon triggers a dropdown containing:
  - Manual Tick button (with cooldown indicator, 180s)
  - Weather selector: 4 icon buttons (Sun, Cloud, CloudRain, Zap) with active state
  - World Full Reset button (with double confirmation dialog)
  - Remove the per-agent brain reset from this panel (moves to Track E / agent detail panel)
- [ ] **Add Weather Control Mutation**: Wire the weather selector buttons to a `server-functions.ts` mutation. The backend already supports weather changes in `advanceWorldState` — this just adds the UI.
- [ ] **Redesign Agent Detail Panel**: Restructure `/agent/$id` with clear visual hierarchy:
  - **Top**: Agent name (large) + archetype badge (color-coded) + live status line with action emoji (e.g., "🚶 Walking to the Cafe")
  - **Needs bars**: Color-gradient bars using the archetype's color. Add micro-bounce animation when values change (observe delta).
  - **Current Goal**: Prominent callout card showing the agent's last `thought` directly (not just the goal string)
  - **Relationships**: Horizontal scroll of circular avatars with affinity color ring (green/red/neutral). Click to navigate to that agent.
  - **Events**: Timeline with human-relative timestamps ("2m ago", "1h ago") instead of absolute times. Group by event type with section headers.

#### Files affected: `AdminPanel.tsx`, `Header.tsx`, `agent.$id.tsx`, `NeedsBar.tsx`, `server-functions.ts`

---

### Track E: Observer Experience & Social Visualization

**Goal:** Surface the most interesting social dynamics visually. Help new observers understand what's happening at a glance. Make conversations visible and delightful.

**Rationale:** Conversations are the most interesting part of the simulation but are invisible unless you're watching the exact right agents at the right time. New users land on a blank canvas with no context for what to watch.

#### Checklist:
- [ ] **Conversation Visualization Enhancements**:
  - Animated speech line: pulsating dots flowing along the conversation line between conversing agents (replace static dotted line)
  - Typing indicator: small "..." animation on a listening agent's name tag
  - Emoji reactions: small floating emoji (😂, 😮, 💡) that rise and fade from conversing agents, based on sentiment analysis of their speech (positive → 😊, negative → 😠, question → 🤔)
  - Clicking a conversation line shows a mini transcript popup of the last 3 exchanges
- [ ] **Observer Dashboard**: Create a toggleable dashboard overlay (triggered by a 👁️ "What's Happening" button in the header) showing:
  - **World snapshot**: Agent count, day count, current tick, most recent weather change
  - **Hot moments**: Top 3 most interesting recent events ranked by novelty (e.g., "Alice and Bob are having a deep conversation at the Library", "A storm just rolled in")
  - **Social graph**: Simple mini force-directed graph showing agent relationships — node size = social need, edge thickness = affinity magnitude, edge color = positive/negative
  - **Suggested watching**: "Watch Alice — she's heading to the Cafe, hungry and looking for company"
  - Use Framer Motion for animated card reveals. Keep it lightweight — all data already exists via existing `useQuery` calls.
- [ ] **Per-Agent Brain Reset in Detail Panel**: Move the "Reset Brain" button from AdminPanel into the Agent Detail Panel (under a "Danger Zone" section at the bottom). This is semantically correct — it's an action on a specific agent, not a world-level control.

#### Files affected: `ConversationLines.tsx`, `AgentSprite.tsx`, new `ObserverDashboard.tsx`, `Header.tsx`, `agent.$id.tsx`, `AdminPanel.tsx`

---

### Phase 11 Checkpoints

- [ ] No floating panels overlap the canvas (AdminPanel and ThoughtStream are integrated into the header/bottom drawer)
- [ ] Minimap renders agents, POIs, and viewport rectangle; click-to-jump works
- [ ] PixiJS canvas background matches the active theme (light/dark)
- [ ] Weather particles (rain, storm, clouds) render without dropping below 55 FPS
- [ ] Keyboard shortcuts work: Space (tick), R (reset camera), Escape (close), T (toggle), M (master)
- [ ] URL params (`?zoom=`, `?focus=`) restore camera state on page load
- [ ] Agent detail panel shows thought text, human-relative timestamps, and horizontal relationship avatars
- [ ] Conversation lines animate with dot flow; emoji reactions appear on sentiment-triggered speech
- [ ] Observer dashboard surfaces top 3 "hot" events and shows a mini social graph
- [ ] All existing tests pass (no regressions from refactoring)
- [ ] 60 FPS maintained during weather particle rendering (test via `requestAnimationFrame` delta logging)

---

## Phase 12: The Polish (Upcoming)

**Goal:** Master panel and deployment

**Status:** ⏳ NOT STARTED

### Week 12: Master Panel

#### Day 1-2: Authentication
- [ ] Create password input component
- [ ] Hash password with bcrypt
- [ ] Store master config in Convex

#### Day 3-4: Controls
- [ ] Weather control buttons
- [ ] Force tick button
- [ ] Spawn item functionality
- [ ] World restart with confirmation

#### Day 5-7: UI Polish
- [ ] Add Framer Motion animations
- [ ] Style Master Panel modal
- [ ] Add loading states
- [ ] Error handling and toasts

### Week 13: Deployment

- [ ] Configure Vercel deployment
- [ ] Set environment variables
- [ ] Deploy Convex: `npx convex deploy`
- [ ] Deploy frontend to Vercel
- [ ] Test production build

### Phase 12 Checkpoints

- [ ] Master password protects admin actions
- [ ] Weather changes reflect in world
- [ ] World restart clears appropriate data
- [ ] Production URL accessible

---

## Dependency Graph

```
Phase 1 (Body) ✅
    │
    └──► Isometric grid with Excalibur canvas
            │
            ▼
Phase 2 (Heart) ✅
    │
    └──► Convex database + real-time sync
            │
            ▼
Phase 3 (Brain) ✅
    │
    └──► LLM integration + vector memory
            │
            ▼
Phase 4 (Eyes) ✅
    │
    └──► PixiJS v8 renderer (Excalibur removed)
            │
            ▼
Phase 5 (Social) ✅
    │
    ├──► Quick fixes (configurable radius, relationship bug, cleanup)
    ├──► Click-to-select, agent detail panel, Thought Stream filtering
    └──► Multi-turn conversations + relationship context in AI prompts
            │
            ▼
Phase 6 (Fluid Movement) ✅
    │
    ├──► Simplex noise idle + predictive pathing + course correction
    └──► Smooth frontend interpolation between ticks
            │
            ▼
Phase 7 (Mind) ✅
    │
    ├──► Sensory buffer in LLM context
    ├──► User prompt restructuring (5 sections)
    └──► Archetype prompts always included
            │
            ▼
Phase 8 (Backbone) ✅
    │
    ├──► Parallel tick execution (Track A)
    ├──► Spatial index queries (Track B)
    └──► Batch embeddings + config cleanup (Track C)
            │
            ▼
Phase 9 (Soul) ✅
    │
    ├──► Bidirectional conversations (Track A)
    ├──► Sentiment-based affinity (Track B)
    ├──► Conversation TTL & cleanup (Track C)
    ├──► Runtime configuration table (Track D)
    └──► POI-aware agent behavior (Track E)
            │
            ▼
Phase 10 (Movement Coherence) ⏳ (Track D Pending)
    │
    ├──► LLM sees its own trajectory (Track A) ✅
    ├──► Weather-aware frontend speed (Track B) ✅
    ├──► Arrival cleanup (Track C) ✅
    └──► Bounds clamping (Track D) ⏳ Pending — **must complete before Phase 11**
            │
            ▼
Phase 11 (Observatory) ⏳
    │
    ├──► Layout rationalization (Track A)
    ├──► World navigation + minimap (Track B)
    ├──► Ambient weather + theme integration (Track C)
    ├──► Header admin panel + agent detail redesign (Track D)
    └──► Observer dashboard + social visualization (Track E)
            │
            ▼
Phase 12 (Polish) ⏳
    │
    ├──► Master panel
    └──► Deployment
```

---

## Testing Strategy

### Unit Tests
- Coordinate conversion functions
- Distance calculations
- LLM response parsing
- Memory retrieval

### Integration Tests
- Agent creation flow
- Real-time sync between tabs
- LLM decision cycle
- Proximity chat trigger

### E2E Tests
- Full user journey: view world → click agent → view details
- Master login and weather control
- World restart flow

---

## Recommended Development Order

### Current Status: Phase 10 (Movement Coherence) — Track D Pending ⏳; Phase 11-12 Planned 🎯
**Prerequisite:** Phase 10 Track D must be completed before Phase 11 starts.
**Order:** Movement Coherence (Phase 10) → UI/UX Polish (Phase 11) → Master Panel & Deploy (Phase 12)

1. ✅ Phase 1 — Isometric grid rendering (Excalibur)
2. ✅ Phase 2 — Convex + real-time sync
3. ✅ Phase 3 — LLM integration + memory system
4. ✅ Phase 4 — PixiJS v8 migration (Excalibur removed)
5. ✅ Phase 5 — Social: click-to-select, agent panel, conversations, relationship AI
6. ✅ Phase 6 — Fluid movement: organic idle + predictive pathing + course correction
7. ✅ Phase 7 — AI context fidelity: sensory buffer, user prompt restructuring
8. ✅ Phase 8 — Backbone: parallel tick, spatial queries, batch embeddings, config cleanup
9. ✅ Phase 9 — Soul: bidirectional conversations, sentiment, TTL cleanup, runtime config, POI awareness
10. ✅ Phase 10 Tracks A-C — Movement coherence: trajectory awareness, weather sync, arrival cleanup
11. ⏳ Phase 10 Track D — Bounds clamping [~1 day]
12. ⏳ Phase 11 Track A — Layout rationalization [~2 days]
13. ⏳ Phase 11 Track B — World navigation & minimap [~2-3 days]
14. ⏳ Phase 11 Track C — Ambient world & theme integration [~3-4 days]
15. ⏳ Phase 11 Track D — Admin panel + agent controls [~2-3 days]
16. ⏳ Phase 11 Track E — Observer experience & social visualization [~3-4 days]
17. ⏳ Phase 12 — Master panel + deployment [~1 week]

**Recommended execution order within Phase 11:** Track A first (foundational layout change), then Tracks B+C (world immersion), then Tracks D+E (controls + experience) — these last two can run in parallel since they touch different components.

---

## Future Enhancements (Post v1.0)

- Spatial partitioning (quadtree) for 100+ agents
- Multiple world maps
- Agent inventory system
- Building construction
- Day/night cycle with lighting
- Sound effects
- Mobile responsive design
