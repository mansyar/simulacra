# Implementation Plan: Phase 2 - The Heart

## Phase Overview

**Track ID:** `heart_20260424`
**Goal:** Convex database with real-time agent sync
**Estimated Duration:** 2 weeks (Week 3-4 from PHASE-PLAN.md)

---

## Week 3: Convex Setup

### Day 1-2: Convex Installation & Schema

- [x] **Task:** Install Convex dependencies [6b24690]
  - [x] Run `npm install convex`
  - [x] Verify installation in package.json
  - [x] Update `conductor/workflow.md` with Convex commands
  - [x] Task: Conductor - User Manual Verification 'Convex Installation' (Protocol in workflow.md)

- [x] **Task:** Initialize Convex development environment [503e68a]
  - [x] Run `npx convex dev` to start local dev server
  - [x] Create `convex/` directory structure
  - [x] Configure `convex.json` with Node 18
  - [x] Task: Conductor - User Manual Verification 'Convex Initialization' (Protocol in workflow.md)

- [x] **Task:** Create Convex schema file [875fcc2]
  - [x] Create `convex/schema.ts` with table definitions
  - [x] Define `agents` table schema (from SCHEMA.md)
  - [x] Define `world_state` table schema
  - [x] Define `events` table schema (sensory buffer)
  - [x] Define `config` table schema
  - [x] Task: Conductor - User Manual Verification 'Schema Creation' (Protocol in workflow.md)

- [x] **Task:** Define database indexes [875fcc2]
  - [x] Create `agents_by_active` index
  - [x] Create `agents_by_position` index
  - [x] Create `events_by_agent` index
  - [x] Create `events_by_time` index (automatically added by Convex)
  - [x] Task: Conductor - User Manual Verification 'Index Creation' (Protocol in workflow.md)

- [x] **Task:** Deploy schema to Convex
  - [x] Run `npx convex deploy`
  - [x] Verify schema deployed successfully
  - [x] Test schema with sample query
  - [x] Task: Conductor - User Manual Verification 'Schema Deployment' (Protocol in workflow.md)

### Day 3-4: CRUD Operations

- [ ] **Task:** Create Convex functions directory
  - [ ] Create `convex/functions/` directory
  - [ ] Create `convex/functions/agents.ts`
  - [ ] Add TypeScript types for agent operations
  - [ ] Task: Conductor - User Manual Verification 'Functions Directory' (Protocol in workflow.md)

- [ ] **Task:** Implement `getAll` query
  - [ ] Write `getAll` query function
  - [ ] Filter by `isActive: true`
  - [ ] Add unit tests for `getAll`
  - [ ] Task: Conductor - User Manual Verification 'getAll Query' (Protocol in workflow.md)

- [ ] **Task:** Implement `getById` query
  - [ ] Write `getById` query function
  - [ ] Validate agent ID exists
  - [ ] Add unit tests for `getById`
  - [ ] Task: Conductor - User Manual Verification 'getById Query' (Protocol in workflow.md)

- [ ] **Task:** Implement `create` mutation
  - [ ] Write `create` mutation function
  - [ ] Validate input fields (name, archetype, position)
  - [ ] Generate default values for needs
  - [ ] Add unit tests for `create`
  - [ ] Task: Conductor - User Manual Verification 'create Mutation' (Protocol in workflow.md)

- [ ] **Task:** Implement `updatePosition` mutation
  - [ ] Write `updatePosition` mutation function
  - [ ] Validate position bounds (0-63)
  - [ ] Update `lastActiveAt` timestamp
  - [ ] Add unit tests for `updatePosition`
  - [ ] Task: Conductor - User Manual Verification 'updatePosition Mutation' (Protocol in workflow.md)

### Day 5-7: Real-time Integration

- [ ] **Task:** Connect TanStack Start to Convex
  - [ ] Install `@convex-dev/react` package
  - [ ] Configure Convex provider in app
  - [ ] Set up environment variables (CONVEX_DEPLOYMENT)
  - [ ] Task: Conductor - User Manual Verification 'Convex Connection' (Protocol in workflow.md)

- [ ] **Task:** Replace placeholder agents with database agents
  - [ ] Update `GameWorld` component to use Convex query
  - [ ] Replace hardcoded agent array with `useQuery(agents.getAll)`
  - [ ] Update agent rendering to use Convex data
  - [ ] Task: Conductor - User Manual Verification 'Agent Integration' (Protocol in workflow.md)

- [ ] **Task:** Verify real-time sync
  - [ ] Open two browser tabs simultaneously
  - [ ] Update agent position in one tab
  - [ ] Verify position syncs to second tab within 1 second
  - [ ] Test with multiple position updates
  - [ ] Task: Conductor - User Manual Verification 'Real-time Sync' (Protocol in workflow.md)

- [ ] **Task:** Test position updates across clients
  - [ ] Create test script for position updates
  - [ ] Verify updates persist to database
  - [ ] Verify updates reflect in all connected clients
  - [ ] Task: Conductor - User Manual Verification 'Position Updates' (Protocol in workflow.md)

---

## Week 4: World State

### Day 1-2: World State Setup

- [ ] **Task:** Create world state functions
  - [ ] Create `convex/functions/world.ts`
  - [ ] Implement `getWorldState` query
  - [ ] Implement `updateWorldState` mutation
  - [ ] Add unit tests for world state functions
  - [ ] Task: Conductor - User Manual Verification 'World State Functions' (Protocol in workflow.md)

- [ ] **Task:** Add weather system
  - [ ] Define weather types in schema (sunny, cloudy, rainy, stormy)
  - [ ] Implement `updateWeather` mutation
  - [ ] Add weather to world state display
  - [ ] Add unit tests for weather system
  - [ ] Task: Conductor - User Manual Verification 'Weather System' (Protocol in workflow.md)

- [ ] **Task:** Add time of day tracking
  - [ ] Implement `timeOfDay` field (0-24 hours)
  - [ ] Create `updateTimeOfDay` mutation
  - [ ] Add time display to UI header
  - [ ] Add unit tests for time tracking
  - [ ] Task: Conductor - User Manual Verification 'Time Tracking' (Protocol in workflow.md)

- [ ] **Task:** Add day count tracking
  - [ ] Implement `dayCount` field
  - [ ] Create `incrementDayCount` mutation
  - [ ] Add day display to UI header
  - [ ] Add unit tests for day count
  - [ ] Task: Conductor - User Manual Verification 'Day Count' (Protocol in workflow.md)

### Day 3-4: Seed Data

- [ ] **Task:** Create seed data script
  - [ ] Create `convex/seed.ts` script
  - [ ] Define 10-15 agent names per archetype
  - [ ] Generate random positions across 64×64 grid
  - [ ] Set initial needs (hunger=50, energy=50, social=50)
  - [ ] Task: Conductor - User Manual Verification 'Seed Script' (Protocol in workflow.md)

- [ ] **Task:** Implement seed check logic
  - [ ] Check if agents already exist before seeding
  - [ ] Skip seeding if agents present
  - [ ] Log seeding status
  - [ ] Task: Conductor - User Manual Verification 'Seed Check' (Protocol in workflow.md)

- [ ] **Task:** Run seed script
  - [ ] Execute seed script in development
  - [ ] Verify 10-15 agents created
  - [ ] Verify agents have varied archetypes
  - [ ] Verify positions are within grid bounds
  - [ ] Task: Conductor - User Manual Verification 'Seed Execution' (Protocol in workflow.md)

- [ ] **Task:** Test seed persistence
  - [ ] Restart development server
  - [ ] Verify agents still exist after restart
  - [ ] Verify agent positions unchanged
  - [ ] Task: Conductor - User Manual Verification 'Seed Persistence' (Protocol in workflow.md)

### Day 5-7: Integration & Testing

- [ ] **Task:** Integrate world state with rendering
  - [ ] Update `GameWorld` component to display weather
  - [ ] Update `GameWorld` component to display time
  - [ ] Update `GameWorld` component to display day count
  - [ ] Add visual weather effects (optional)
  - [ ] Task: Conductor - User Manual Verification 'World State Integration' (Protocol in workflow.md)

- [ ] **Task:** Run comprehensive tests
  - [ ] Run unit tests for all CRUD operations
  - [ ] Run unit tests for world state functions
  - [ ] Verify test coverage >80%
  - [ ] Fix any failing tests
  - [ ] Task: Conductor - User Manual Verification 'Test Suite' (Protocol in workflow.md)

- [ ] **Task:** Verify Phase 2 acceptance criteria
  - [ ] Convex schema deployed with agents and world_state tables ✓
  - [ ] Real-time sync works (open 2 tabs, see updates) ✓
  - [ ] Agent positions persist to database ✓
  - [ ] Basic CRUD operations functional ✓
  - [ ] World state features implemented ✓
  - [ ] 10-15 seed agents created ✓
  - [ ] Unit tests pass with >80% coverage ✓
  - [ ] No TypeScript errors ✓
  - [ ] Task: Conductor - User Manual Verification 'Phase 2 Acceptance' (Protocol in workflow.md)

---

## Phase Completion Checkpoint

- [ ] **Task:** Conductor - User Manual Verification 'Phase 2 Complete' (Protocol in workflow.md)

---

## References

- `PHASE-PLAN.md` - Phase 2 roadmap and timeline
- `SCHEMA.md` - Convex schema definitions
- `conductor/workflow.md` - Development workflow and TDD process
- `spec.md` - Phase 2 specification

---

**Status:** `[ ]` = Not Started | `[~]` = In Progress | `[x]` = Complete

---

## Notes

- All tasks follow TDD workflow (Red → Green → Refactor)
- Unit tests must pass before marking tasks complete
- Code coverage target: >80% for new code
- Follow commit message format from `conductor/workflow.md`
