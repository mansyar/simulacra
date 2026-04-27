# PHASE-PLAN.md - Implementation Roadmap

## Phase Overview

| Phase | Name | Focus | Status | Estimated Duration |
|-------|------|-------|--------|-------------------|
| 1 | The Body | Setup + Rendering | ✅ Complete | 1-2 weeks |
| 2 | The Heart | Convex + Real-time Sync | ✅ Complete | 1-2 weeks |
| 3 | The Brain | LLM Integration + Memory | ✅ Complete | 2-3 weeks |
| 4 | The Eyes | Excalibur → PixiJS Migration | ✅ Complete | 3-4 days |
| 5 | The Social | Proximity + Frontend Interaction | ✅ Complete (Tracks A & B) | 1-2 weeks |
| 6 | Fluid Movement | Organic idle + Predictive pathing | ✅ Complete | 3-4 days |
| 7 | The Polish | Master Panel + Deploy | ⏳ Not Started | 1 week |

---

## Phase 1: The Body

**Goal:** TanStack Start project with Excalibur isometric grid rendering

**Status:** ✅ COMPLETE

### Week 1: Project Setup

#### Day 1-2: Initialize Project
- [x] Initialize TanStack Start project with `npm create tanstack-start@latest`
- [x] Configure TypeScript and linting
- [x] Install dependencies: `excalibur`, `tailwindcss`, `framer-motion`
- [x] Set up project structure (routes/, components/, hooks/)
- [x] Configure Tailwind CSS with custom theme

#### Day 3-4: Basic Rendering
- [x] Create `GameCanvas` component with Excalibur engine
- [x] Implement isometric grid rendering (64×64)
- [x] Add tile rendering with procedural generation
- [x] Implement coordinate conversion (grid ↔ screen)

#### Day 5-7: Camera & Interaction
- [x] Add pan controls (drag to move)
- [x] Add zoom controls (scroll wheel)
- [x] Implement click detection for tiles
- [x] Add URL sync for camera state (`?zoom=`, `?focus=`)

### Week 2: Agent Sprites

- [x] Create placeholder agents (simple colored squares)
- [x] Add agent name rendering
- [x] Implement basic idle animation (bounce)
- [x] Test with 10-25 placeholder agents

### Phase 1 Checkpoints

- [x] Project builds without errors
- [x] Isometric grid renders correctly
- [x] Camera pan/zoom works smoothly
- [x] Click on grid returns correct coordinates
- [x] Comprehensive test suite (Vitest)

---

## Phase 2: The Heart

**Goal:** Convex database with real-time agent sync

**Status:** ✅ COMPLETE

### Week 3: Convex Setup

#### Day 1-2: Convex Installation
- [x] Install Convex: `npm install convex`
- [x] Initialize Convex: `npx convex dev`
- [x] Create `convex/schema.ts` with table definitions
- [x] Define agent table schema
- [x] Deploy schema to Convex

#### Day 3-4: CRUD Operations
- [x] Create `convex/functions/agents.ts`
- [x] Implement `getAll` query
- [x] Implement `getById` query
- [x] Implement `create` mutation
- [x] Implement `updatePosition` mutation

#### Day 5-7: Real-time Integration
- [x] Connect TanStack Start to Convex
- [x] Replace placeholder agents with database agents
- [x] Verify real-time sync (open 2 browser tabs)
- [x] Test position updates sync across clients

### Week 4: World State

- [x] Add `world_state` table
- [x] Implement weather system
- [x] Add time of day tracking
- [x] Create initial seed data for 25 agents

### Phase 2 Checkpoints

- [x] Convex deployed and accessible
- [x] Agents persist in database
- [x] Opening multiple tabs shows real-time sync
- [x] Weather and time display correctly

---

## Phase 3: The Brain

**Goal:** LLM integration with memory system

**Status:** ✅ COMPLETE

### Week 5: LLM Setup

#### Day 1-2: API Integration
- [x] Add OpenAI API key to Convex secrets
- [x] Create `convex/functions/ai.ts`
- [x] Implement basic LLM call function
- [x] Test LLM response parsing

#### Day 3-4: Prompt System
- [x] Create personality archetype templates (`ARCHETYPE_PROMPTS`)
- [x] Implement JSON output parsing (`DECISION_SYSTEM_PROMPT`)
- [x] Build context prompt generator
- [x] Test with single agent decision

#### Day 5-7: Memory System
- [x] Configure Convex Vector Index (768 dimensions)
- [x] Create `convex/functions/memory.ts`
- [x] Implement sensory buffer (last 10 events logic in `addEvent`)
- [x] Implement semantic memory storage (vector search infrastructure)

### Week 6: Decision Loop

- [x] Create Convex Cron job for world tick (`convex/crons.ts`)
- [x] Implement deterministic needs (hunger, energy)
- [x] Connect LLM to social decisions
- [x] Test full decision cycle

### Phase 3 Checkpoints

- [x] LLM returns valid JSON decisions
- [x] Agents remember recent interactions (sensory buffer storage)
- [x] Vector search returns relevant memories
- [x] World tick processes all agents

---

## Phase 4: The Eyes

**Goal:** Migrate rendering layer from Excalibur.js to PixiJS for GPU-accelerated 2D rendering, viewport culling, and future visual effects support

**Status:** ✅ COMPLETE

### Days 1-2: Core Migration

#### PixiJS Setup
- [x] Install PixiJS v8: `pnpm add pixi.js`
- [x] Remove Excalibur: `pnpm remove excalibur`
- [x] Create new `GameCanvas.tsx` with PixiJS `Application`
- [x] Wire up React lifecycle (init/destroy) with `useEffect`

#### Isometric Grid
- [x] Rewrite `IsometricGrid.ts` using PixiJS `Graphics`
- [x] Implement viewport culling (only draw visible grid lines)
- [x] Preserve existing `gridToScreen` / `screenToGrid` math (no changes needed)
- [x] Render hover highlight tile

#### Camera Controller
- [x] Rewrite `Camera.ts` using PixiJS `Container` transform (translate + scale)
- [x] Implement drag-to-pan with pointer events
- [x] Implement scroll-to-zoom with wheel events
- [x] Preserve camera bounds clamping

### Days 3-4: Sprites & Polish

#### Agent Sprites
- [x] Rewrite `AgentSprite.ts` using PixiJS `Container` + `Graphics` + `Text`
- [x] Implement archetype-colored circles (same visual as current)
- [x] Add name labels and action emoji rendering
- [x] Implement speech bubble with background
- [x] Preserve smooth grid-position lerping (`onPreUpdate` → ticker callback)

#### POI Sprites
- [x] Rewrite `POISprite.ts` using PixiJS `Container` + `Graphics` + `Text`
- [x] Match existing visual style

#### Integration & Cleanup
- [x] Verify Convex real-time sync still works (agents appear/update/remove)
- [x] Verify click-to-move interaction
- [x] Verify tab visibility pause/resume
- [x] Update/add Vitest tests for new rendering layer
- [x] Remove all Excalibur imports and types from codebase
- [x] Fix Thought Stream blankness by logging survival mode states

#### Documentation Updates
- [x] Update `docs/ARCHITECTURE.md`
- [x] Update `docs/ISOMETRIC.md`
- [x] Update `docs/SPEC.md`
- [x] Update `docs/PRD.md`
- [x] Update `docs/PHASE-PLAN.md`
- [x] Update `README.md`

### Phase 4 Checkpoints

- [x] PixiJS renders identical isometric grid to previous Excalibur version
- [x] All agents display with correct colors, names, actions, and speech
- [x] Camera pan/zoom works identically
- [x] No Excalibur references remain in codebase
- [x] Performance improvement confirmed (measure FPS before/after)
- [x] Bundle size reduced (~200KB Excalibur → ~150KB PixiJS)
- [x] Existing tests pass or are updated

---

## Phase 5: The Social

**Goal:** Multi-turn conversations, agent detail panel, and relationship-aware AI

**Status:** ✅ TRACKS A & B COMPLETE

> **Note:** Many Phase 5 items from the original plan were already built during
> Phases 2–4 (distance calculation, speech bubbles, relationships table, affinity
> tracking, thought stream). This revised plan focused on remaining gaps only.

### Already Complete (from earlier phases)

- [x] Euclidean distance function (`world.ts:333`)
- [x] Nearby agent detection during tick (`world.ts:328-335`, `agents.ts:recordPassivePerception`)
- [x] Speech bubble rendering (`AgentSprite.ts:103-122`)
- [x] Store conversations in memories (`world.ts:445-451`, event type `"conversation"`)
- [x] `relationships` table with indexes (`schema.ts:96-105`)
- [x] Affinity score tracking ±100 range (`agents.ts:updateRelationship`)
- [x] Relationship updates after interactions (`world.ts:384-388`)
- [x] Thought Stream sidebar (`GlobalThoughtStream.tsx`)
- [x] Real-time agent thoughts via events (`memory.addEvent`)

---

### Track A: Quick Fixes (Day 1, ~1 hour)

- [x] **A1. Configurable interaction radius** (bc95135) — Move hardcoded `5` from `world.ts:333` and `agents.ts:277` to the `config` table
- [x] **A2. Fix relationship valence bug** (43dc049) — `updateRelationship` never updates `lastInteractionType` on subsequent interactions (only on insert)
- [x] **A3. Remove TanStack starter content** (63d9ebf, cfcdefd) — Clean up `index.tsx` route; `/` should show only the game canvas (already rendered by `__root.tsx`)

### Track B: Frontend Interaction (Days 1–3)

#### B1. Click-to-Select Agent (~0.5 day) ✅
- [x] Set `eventMode: 'static'` on `AgentSprite` to make sprites interactive
- [x] Emit click events from `AgentSprite` → `GameCanvas`
- [x] Add selected-agent state (visual highlight ring, camera focus)
- [x] Wire click to navigate to `/agent/$id`

#### B2. Agent Detail Panel — `/agent/$id` (~1.5 days) ✅
- [x] Create TanStack route `/agent/$id` as a left-side slide-in panel
- [x] Display agent identity: name, archetype, bio, core traits
- [x] Display needs bars: hunger, energy, social (live-updating)
- [x] Display current goal and action
- [x] Display inventory
- [x] Display relationships list with affinity scores
- [x] Display recent events/memories for this agent
- [x] Close panel returns to `/`

#### B3. Thought Stream Improvements (~0.5 day) ✅
- [x] Add filter by agent name and event type
- [x] Auto-scroll to latest event
- [x] Highlight events from selected agent

### Track C: Social Depth (Days 3–5)

#### C1. Relationship Context in AI Prompts (~0.5 day)
- [ ] Query `relationships` table for the deciding agent
- [ ] Include relationship data in `buildFullContext` (e.g. "You like Alice (affinity: +14), you distrust Bob (affinity: -8)")
- [ ] Verify AI decisions reference relationship context

#### C2. Multi-Turn Conversations (~1.5 days)

> **Design:** Open-ended, one exchange per tick. Agent A initiates on tick N,
> Agent B responds on tick N+1, and so on until one agent decides to end the
> conversation or walks away.

- [ ] Add `conversationState` to agent schema: `{ partnerId, role: "initiator" | "responder", turnCount }`
- [ ] On tick: if agent has an active conversation, generate a response instead of a fresh decision
- [ ] Conversation ends when: agent decides to stop, partner walks away, or `turnCount` exceeds a cap (e.g. 5)
- [ ] Store each exchange as a `"conversation"` event with partner reference
- [ ] Both agents show speech bubbles during active conversations

#### C3. Conversation Visual Indicators (~0.5 day)
- [ ] Draw a subtle dotted line or glow arc between two agents in active conversation
- [ ] Show a chat icon above conversing agent pairs

---

### Implementation Order

```
A1 + A2 + A3 (quick fixes) ✅
  → B1 + B2 + B3 (frontend interaction) ✅
  → C1 (relationship context in AI prompts)
  → C2 (multi-turn conversations — main backend task)
  → C3 (conversation visuals — polish)
```

**Track A + B completed: 2026-04-27**

### Phase 5 Checkpoints

- [x] Clicking an agent in the canvas opens a detail side panel on the left
- [x] Agent detail panel shows live needs, traits, relationships, and events
- [x] Thought Stream supports filtering by agent and event type
- [x] No TanStack starter template content remains on the index route
- [ ] Agents hold multi-turn conversations across ticks (open-ended, 1 exchange/tick)
- [ ] AI decisions reference relationship context ("I like Alice, I'll go talk to her")
- [ ] Conversation pairs are visually linked on the canvas

---

## Phase 6: Fluid Movement

**Goal:** Organic idle behaviors, predictive pathing, and smooth course correction

**Status:** ✅ COMPLETE

### Days 1-2: Core Movement

#### Organic Idle Behavior
- [x] Integrate Simplex Noise for natural idle movements (pacing, shifting, swaying)
- [x] Map noise output to archetype-specific speed multipliers for varied pacing
- [x] Respect deterministic action overrides (eating/sleeping/talking bypass organic idle)

#### Predictive Pathing
- [x] Implement `predictedX/predictedY` fields on agent data model
- [x] Frontend interpolation uses predicted position for continuous movement between ticks
- [x] Time-synced pathing: use elapsed tick time rather than frame count

### Days 3-4: Stability & Polish

#### Course Correction
- [x] On each backend state update, compute delta between predicted and actual position
- [x] Smooth 500ms lerp to correct position drift
- [x] Backend-reported positions remain the authoritative source (no physics drift accumulation)

#### Testing
- [x] Unit tests for Simplex noise integration
- [x] Unit tests for predictive path interpolation
- [x] Unit tests for course correction smoothing
- [x] Performance test: 100 agents ticking within budget

### Phase 6 Checkpoints

- [x] Agents exhibit organic idle movements (not static waiting)
- [x] Agents move smoothly between ticks (no teleportation)
- [x] Course correction handles backend desync within 500ms
- [x] Performance stays within budget for 100 agents

---

## Phase 7: The Polish

**Goal:** Master panel and deployment

**Status:** ⏳ NOT STARTED (Depends on Phase 5 Track C)

### Week 10: Master Panel

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

### Week 11: Deployment

- [ ] Configure Vercel deployment
- [ ] Set environment variables
- [ ] Deploy Convex: `npx convex deploy`
- [ ] Deploy frontend to Vercel
- [ ] Test production build

### Phase 7 Checkpoints

- [ ] Master password protects admin actions
- [ ] Weather changes reflect in world
- [ ] World restart clears appropriate data
- [ ] Production URL accessible

---

## Dependency Graph

```
Phase 1 (Body)
    │
    ├──► TanStack Start setup
    ├──► Excalibur canvas
    └──► Isometric grid
            │
            ▼
Phase 2 (Heart)
    │
    ├──► Convex database
    ├──► Agent CRUD
    └──► Real-time sync
            │
            ▼
Phase 3 (Brain)
    │
    ├──► LLM integration
    ├──► Vector index
    └──► Memory system
            │
            ▼
Phase 4 (Eyes)
    │
    ├──► Remove Excalibur
    ├──► PixiJS renderer
    └──► Viewport culling
            │
            ▼
Phase 5 (Social)
    │
    ├──► Proximity detection
    ├──► Chat system
    ├──► Relationships
    ├──► Quick fixes (Track A)
    └──► Frontend interaction (Track B)
            │
            ▼
Phase 6 (Fluid Movement)
    │
    ├──► Simplex noise integration
    ├──► Predictive pathing
    └──► Course correction
            │
            ▼
Phase 7 (Polish)
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

### Current Status: Phase 5 Track C Remaining 🎯

1. ✅ **Done:** Grid rendering (Phase 1)
2. ✅ **Done:** Convex + real-time sync (Phase 2)
3. ✅ **Done:** LLM integration + memory (Phase 3)
4. ✅ **Done:** PixiJS migration (Phase 4)
5. ✅ **Done:** Quick fixes & frontend interaction (Phase 5 — Tracks A & B)
6. ✅ **Done:** Fluid movement (Phase 6)
7. 🎯 **Current:** Multi-turn conversations, relationship context, conversation visuals (Phase 5 — Track C)
8. ⏳ **Next:** Master panel and deployment (Phase 7)

---

## Future Enhancements (Post v1.0)

- Spatial partitioning (quadtree) for 100+ agents
- Multiple world maps
- Agent inventory system
- Building construction
- Day/night cycle with lighting
- Sound effects
- Mobile responsive design