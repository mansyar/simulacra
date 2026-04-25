# PHASE-PLAN.md - Implementation Roadmap

## Phase Overview

| Phase | Name | Focus | Status | Estimated Duration |
|-------|------|-------|--------|-------------------|
| 1 | The Body | Setup + Rendering | ✅ Complete | 1-2 weeks |
| 2 | The Heart | Convex + Real-time Sync | ✅ Complete | 1-2 weeks |
| 3 | The Brain | LLM Integration + Memory | ⚙️ In Progress | 2-3 weeks |
| 4 | The Eyes | Excalibur → PixiJS Migration | ⏳ Not Started | 3-4 days |
| 5 | The Social | Proximity + Chat | ⏳ Not Started | 1-2 weeks |
| 6 | The Polish | Master Panel + Deploy | ⏳ Not Started | 1 week |

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

**Status:** ⚙️ IN PROGRESS (Infrastructure complete, logic integration pending)

### Week 5: LLM Setup

#### Day 1-2: API Integration
- [x] Add OpenAI API key to Convex secrets
- [x] Create `convex/functions/ai.ts`
- [x] Implement basic LLM call function
- [x] Test LLM response parsing

#### Day 3-4: Prompt System
- [x] Create personality archetype templates (`ARCHETYPE_PROMPTS`)
- [x] Implement JSON output parsing (`DECISION_SYSTEM_PROMPT`)
- [ ] Build context prompt generator (**Incomplete:** missing memory/sensory context integration)
- [x] Test with single agent decision

#### Day 5-7: Memory System
- [x] Configure Convex Vector Index (768 dimensions)
- [x] Create `convex/functions/memory.ts`
- [x] Implement sensory buffer (last 10 events logic in `addEvent`)
- [x] Implement semantic memory storage (vector search infrastructure)

### Week 6: Decision Loop

- [x] Create Convex Cron job for world tick (`convex/crons.ts`)
- [ ] Implement deterministic needs (hunger, energy) (**Missing:** currently handled by LLM, violates PRD "deterministic code" rule)
- [ ] Connect LLM to social decisions (**Incomplete:** proximity detection exists, but lacks retrieved memory context)
- [x] Test full decision cycle

### Phase 3 Checkpoints

- [x] LLM returns valid JSON decisions
- [x] Agents remember recent interactions (sensory buffer storage)
- [ ] Vector search returns relevant memories (**Implemented but unused in tick**)
- [x] World tick processes all agents

### ⚠️ PRD Deviations & Missing Implementation
- **Deterministic Safeguards:** The PRD requires hunger/energy to be handled by deterministic code (e.g., if hunger > 80, force 'eating'). Current code delegates these critical decisions to the LLM.
- **Context Gap:** The `tick` function does not yet pull the last 10 events (sensory buffer) or relevant semantic memories (vector search) into the AI prompt.
- **Reflection Layer:** No logic exists for summarizing days into `coreTraits`.
- **World Awareness:** Agents are not informed of `weather` or `timeOfDay` during the decision loop.

---

## Phase 4: The Eyes

**Goal:** Migrate rendering layer from Excalibur.js to PixiJS for GPU-accelerated 2D rendering, viewport culling, and future visual effects support

**Status:** ⏳ NOT STARTED (Depends on Phase 3)

**Why:** Excalibur's full game-engine overhead (scene graph, ECS, physics pipeline) runs every frame despite only using ~5% of its features. The 64×64 grid generates 8,320 line segments per frame with no viewport culling. PixiJS provides WebGL/WebGPU batch rendering, native sprite sheet support, and GPU-powered visual effects (tinting, filters, particles) needed for later phases.

### Days 1-2: Core Migration

#### PixiJS Setup
- [ ] Install PixiJS v8: `pnpm add pixi.js`
- [ ] Remove Excalibur: `pnpm remove excalibur`
- [ ] Create new `GameCanvas.tsx` with PixiJS `Application`
- [ ] Wire up React lifecycle (init/destroy) with `useEffect`

#### Isometric Grid
- [ ] Rewrite `IsometricGrid.ts` using PixiJS `Graphics`
- [ ] Implement viewport culling (only draw visible grid lines)
- [ ] Preserve existing `gridToScreen` / `screenToGrid` math (no changes needed)
- [ ] Render hover highlight tile

#### Camera Controller
- [ ] Rewrite `Camera.ts` using PixiJS `Container` transform (translate + scale)
- [ ] Implement drag-to-pan with pointer events
- [ ] Implement scroll-to-zoom with wheel events
- [ ] Preserve camera bounds clamping

### Days 3-4: Sprites & Polish

#### Agent Sprites
- [ ] Rewrite `AgentSprite.ts` using PixiJS `Container` + `Graphics` + `Text`
- [ ] Implement archetype-colored circles (same visual as current)
- [ ] Add name labels and action emoji rendering
- [ ] Implement speech bubble with background
- [ ] Preserve smooth grid-position lerping (`onPreUpdate` → ticker callback)

#### POI Sprites
- [ ] Rewrite `POISprite.ts` using PixiJS `Container` + `Graphics` + `Text`
- [ ] Match existing visual style

#### Integration & Cleanup
- [ ] Verify Convex real-time sync still works (agents appear/update/remove)
- [ ] Verify click-to-move interaction
- [ ] Verify tab visibility pause/resume
- [ ] Update/add Vitest tests for new rendering layer
- [ ] Remove all Excalibur imports and types from codebase

#### Documentation Updates
- [ ] Update `docs/ARCHITECTURE.md` — Replace Excalibur references with PixiJS (rendering layer, component descriptions)
- [ ] Update `docs/ISOMETRIC.md` — Update rendering implementation details to reflect PixiJS APIs
- [ ] Update `docs/SPEC.md` — Update tech stack and rendering references
- [ ] Update `docs/PRD.md` — Update technology stack section
- [ ] Update `docs/PHASE-PLAN.md` — Mark Phase 4 complete, update Phase 1 description to note historical Excalibur usage
- [ ] Update `README.md` — Update tech stack, setup instructions, and any Excalibur mentions

### Phase 4 Checkpoints

- [ ] PixiJS renders identical isometric grid to previous Excalibur version
- [ ] All agents display with correct colors, names, actions, and speech
- [ ] Camera pan/zoom works identically
- [ ] No Excalibur references remain in codebase
- [ ] Performance improvement confirmed (measure FPS before/after)
- [ ] Bundle size reduced (~200KB Excalibur → ~150KB PixiJS)
- [ ] Existing tests pass or are updated

---

## Phase 5: The Social

**Goal:** Proximity interactions and chat

**Status:** ⏳ NOT STARTED (Depends on Phase 4)

### Week 8: Proximity System

#### Day 1-2: Distance Calculation
- [ ] Implement Euclidean distance function
- [ ] Add interaction radius to agent config
- [ ] Detect nearby agents during tick

#### Day 3-4: Chat System
- [ ] Implement conversation logic
- [ ] Add speech bubble rendering
- [ ] Store conversation in memories

#### Day 5-7: Relationships
- [ ] Create `relationships` table
- [ ] Track affinity scores
- [ ] Update relationships after interactions

### Week 9: UI Updates

- [ ] Create Thought Stream sidebar
- [ ] Display agent thoughts in real-time
- [ ] Add agent detail panel
- [ ] Connect `/agent/:id` route

### Phase 5 Checkpoints

- [ ] Agents chat when near each other
- [ ] Relationship scores update correctly
- [ ] Thought Stream shows agent activity
- [ ] Click agent opens detail panel

---

## Phase 6: The Polish

**Goal:** Master panel and deployment

**Status:** ⏳ NOT STARTED (Depends on Phase 5)

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

### Phase 6 Checkpoints

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
    └──► Relationships
            │
            ▼
Phase 6 (Polish)
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

### Current Status: Phase 3 In Progress ⚙️

1. ✅ **Start simple:** Grid rendering complete with Excalibur.js
2. ✅ **Add one thing at a time:** Agent sprites, camera controls, tests
3. ✅ **Done:** Install and configure Convex (Phase 2)
4. ⚙️ **Current:** Implement LLM integration (Phase 3)
5. ⏳ **Then:** Migrate Excalibur → PixiJS (Phase 4)
6. ⏳ **Then:** Add proximity and chat (Phase 5)
7. ⏳ **Finally:** Master panel and deployment (Phase 6)

---

## Future Enhancements (Post v1.0)

- Spatial partitioning (quadtree) for 100+ agents
- Multiple world maps
- Agent inventory system
- Building construction
- Day/night cycle with lighting
- Sound effects
- Mobile responsive design