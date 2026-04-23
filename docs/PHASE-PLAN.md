# PHASE-PLAN.md - Implementation Roadmap

## Phase Overview

| Phase | Name | Focus | Status | Estimated Duration |
|-------|------|-------|--------|-------------------|
| 1 | The Body | Setup + Rendering | ✅ Complete | 1-2 weeks |
| 2 | The Heart | Convex + Real-time Sync | ⏳ Not Started | 1-2 weeks |
| 3 | The Brain | LLM Integration + Memory | ⏳ Not Started | 2-3 weeks |
| 4 | The Social | Proximity + Chat | ⏳ Not Started | 1-2 weeks |
| 5 | The Polish | Master Panel + Deploy | ⏳ Not Started | 1 week |

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

**Status:** ⏳ NOT STARTED (Phase 1 complete first)

### Week 3: Convex Setup

#### Day 1-2: Convex Installation
- [ ] Install Convex: `npm install convex`
- [ ] Initialize Convex: `npx convex dev`
- [ ] Create `convex/schema.ts` with table definitions
- [ ] Define agent table schema
- [ ] Deploy schema to Convex

#### Day 3-4: CRUD Operations
- [ ] Create `convex/functions/agents.ts`
- [ ] Implement `getAll` query
- [ ] Implement `getById` query
- [ ] Implement `create` mutation
- [ ] Implement `updatePosition` mutation

#### Day 5-7: Real-time Integration
- [ ] Connect TanStack Start to Convex
- [ ] Replace placeholder agents with database agents
- [ ] Verify real-time sync (open 2 browser tabs)
- [ ] Test position updates sync across clients

### Week 4: World State

- [ ] Add `world_state` table
- [ ] Implement weather system
- [ ] Add time of day tracking
- [ ] Create initial seed data for 25 agents

### Phase 2 Checkpoints

- [ ] Convex deployed and accessible
- [ ] Agents persist in database
- [ ] Opening multiple tabs shows real-time sync
- [ ] Weather and time display correctly

---

## Phase 3: The Brain

**Goal:** LLM integration with memory system

**Status:** ⏳ NOT STARTED (Depends on Phase 2)

### Week 5: LLM Setup

#### Day 1-2: API Integration
- [ ] Add OpenAI API key to Convex secrets
- [ ] Create `convex/functions/ai.ts`
- [ ] Implement basic LLM call function
- [ ] Test LLM response parsing

#### Day 3-4: Prompt System
- [ ] Create personality archetype templates
- [ ] Implement JSON output parsing
- [ ] Build context prompt generator
- [ ] Test with single agent decision

#### Day 5-7: Memory System
- [ ] Configure Convex Vector Index (768 dimensions)
- [ ] Create `convex/functions/memory.ts`
- [ ] Implement sensory buffer (last 10 events)
- [ ] Implement semantic memory storage

### Week 6: Decision Loop

- [ ] Create Convex Cron job for world tick
- [ ] Implement deterministic needs (hunger, energy)
- [ ] Connect LLM to social decisions
- [ ] Test full decision cycle

### Phase 3 Checkpoints

- [ ] LLM returns valid JSON decisions
- [ ] Agents remember recent interactions
- [ ] Vector search returns relevant memories
- [ ] World tick processes all agents

---

## Phase 4: The Social

**Goal:** Proximity interactions and chat

**Status:** ⏳ NOT STARTED (Depends on Phase 3)

### Week 7: Proximity System

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

### Week 8: UI Updates

- [ ] Create Thought Stream sidebar
- [ ] Display agent thoughts in real-time
- [ ] Add agent detail panel
- [ ] Connect `/agent/:id` route

### Phase 4 Checkpoints

- [ ] Agents chat when near each other
- [ ] Relationship scores update correctly
- [ ] Thought Stream shows agent activity
- [ ] Click agent opens detail panel

---

## Phase 5: The Polish

**Goal:** Master panel and deployment

**Status:** ⏳ NOT STARTED (Depends on Phase 4)

### Week 9: Master Panel

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

### Week 10: Deployment

- [ ] Configure Vercel deployment
- [ ] Set environment variables
- [ ] Deploy Convex: `npx convex deploy`
- [ ] Deploy frontend to Vercel
- [ ] Test production build

### Phase 5 Checkpoints

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
Phase 4 (Social)
    │
    ├──► Proximity detection
    ├──► Chat system
    └──► Relationships
            │
            ▼
Phase 5 (Polish)
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

### Current Status: Phase 1 Complete ✅

1. ✅ **Start simple:** Grid rendering complete with Excalibur.js
2. ✅ **Add one thing at a time:** Agent sprites, camera controls, tests
3. ⏳ **Next:** Install and configure Convex (Phase 2)
4. ⏳ **Then:** Implement LLM integration (Phase 3)
5. ⏳ **Then:** Add proximity and chat (Phase 4)
6. ⏳ **Finally:** Master panel and deployment (Phase 5)

---

## Future Enhancements (Post v1.0)

- Spatial partitioning (quadtree) for 100+ agents
- Multiple world maps
- Agent inventory system
- Building construction
- Day/night cycle with lighting
- Sound effects
- Mobile responsive design