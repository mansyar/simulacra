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

- [x] **Task:** Create Convex functions directory [d56fe7c]
  - [x] Create `convex/functions/` directory
  - [x] Create `convex/functions/agents.ts`
  - [x] Add TypeScript types for agent operations
  - [x] Task: Conductor - User Manual Verification 'Functions Directory' (Protocol in workflow.md)

- [x] **Task:** Implement `getAll` query [d56fe7c]
  - [x] Write `getAll` query function
  - [x] Filter by `isActive: true`
  - [x] Add unit tests for `getAll`
  - [x] Task: Conductor - User Manual Verification 'getAll Query' (Protocol in workflow.md)

- [x] **Task:** Implement `getById` query [d56fe7c]
  - [x] Write `getById` query function
  - [x] Validate agent ID exists
  - [x] Add unit tests for `getById`
  - [x] Task: Conductor - User Manual Verification 'getById Query' (Protocol in workflow.md)

- [x] **Task:** Implement `create` mutation [f2ef6d7]
  - [x] Write `create` mutation function
  - [x] Validate input fields (name, archetype, position)
  - [x] Generate default values for needs
  - [x] Add unit tests for `create`
  - [x] Task: Conductor - User Manual Verification 'create Mutation' (Protocol in workflow.md)

- [x] **Task:** Implement `updatePosition` mutation [0ab1ca2]
  - [x] Write `updatePosition` mutation function
  - [x] Validate position bounds (0-63)
  - [x] Update `lastActiveAt` timestamp
  - [x] Add unit tests for `updatePosition`
  - [x] Task: Conductor - User Manual Verification 'updatePosition Mutation' (Protocol in workflow.md)

### Day 5-7: Real-time Integration

- [x] **Task:** Connect TanStack Start to Convex [0ade859]
  - [x] Install `convex` package (already installed)
  - [x] Configure Convex provider in app
  - [x] Set up environment variables (CONVEX_DEPLOYMENT)
  - [x] Task: Conductor - User Manual Verification 'Convex Connection' (Protocol in workflow.md)

- [x] **Task:** Replace placeholder agents with database agents [ca9d31e]
  - [x] Update `GameWorld` component to use Convex query
  - [x] Replace hardcoded agent array with `useQuery(agents.getAll)`
  - [x] Update agent rendering to use Convex data
  - [x] Task: Conductor - User Manual Verification 'Agent Integration' (Protocol in workflow.md)

- [x] **Task:** Verify real-time sync [858916e]
  - [x] Open two browser tabs simultaneously
  - [x] Update agent position in one tab
  - [x] Verify position syncs to second tab within 1 second
  - [x] Test with multiple position updates
  - [x] Task: Conductor - User Manual Verification 'Real-time Sync' (Protocol in workflow.md)

- [x] **Task:** Test position updates across clients [858916e]
  - [x] Create test script for position updates (integrated in GameCanvas)
  - [x] Verify updates persist to database
  - [x] Verify updates reflect in all connected clients
  - [x] Task: Conductor - User Manual Verification 'Position Updates' (Protocol in workflow.md)

---

## Week 4: World State

### Day 1-2: World State Setup

- [x] **Task:** Create world state functions [2f14ee7]
  - [x] Create `convex/functions/world.ts`
  - [x] Implement `getWorldState` query
  - [x] Implement `updateWorldState` mutation
  - [x] Add unit tests for world state functions
  - [x] Task: Conductor - User Manual Verification 'World State Functions' (Protocol in workflow.md)

- [x] **Task:** Add weather system [185cb8b]
  - [x] Define weather types in schema (sunny, cloudy, rainy, stormy)
  - [x] Implement `updateWeather` mutation (integrated in `updateState`)
  - [x] Add weather to world state display
  - [x] Add unit tests for weather system
  - [x] Task: Conductor - User Manual Verification 'Weather System' (Protocol in workflow.md)

- [x] **Task:** Add time of day tracking [185cb8b]
  - [x] Implement `timeOfDay` field (0-24 hours)
  - [x] Create `updateTimeOfDay` mutation (integrated in `updateState`)
  - [x] Add time display to UI header
  - [x] Add unit tests for time tracking
  - [x] Task: Conductor - User Manual Verification 'Time Tracking' (Protocol in workflow.md)

- [x] **Task:** Add day count tracking [185cb8b]
  - [x] Implement `dayCount` field
  - [x] Create `incrementDayCount` mutation (integrated in `updateState`)
  - [x] Add day display to UI header
  - [x] Add unit tests for day count
  - [x] Task: Conductor - User Manual Verification 'Day Count' (Protocol in workflow.md)

### Day 3-4: Seed Data

- [x] **Task:** Create seed data script [89ca358]
  - [x] Create `convex/functions/seed.ts` script
  - [x] Define 10-15 agent names per archetype
  - [x] Generate random positions across 64×64 grid
  - [x] Set initial needs (hunger=50, energy=50, social=50)
  - [x] Task: Conductor - User Manual Verification 'Seed Script' (Protocol in workflow.md)

- [x] **Task:** Implement seed check logic [89ca358]
  - [x] Check if agents already exist before seeding
  - [x] Skip seeding if agents present (handled by deleting existing in this version for fresh seed)
  - [x] Log seeding status
  - [x] Task: Conductor - User Manual Verification 'Seed Check' (Protocol in workflow.md)

- [x] **Task:** Run seed script [89ca358]
  - [x] Execute seed script in development
  - [x] Verify 10-15 agents created
  - [x] Verify agents have varied archetypes
  - [x] Verify positions are within grid bounds
  - [x] Task: Conductor - User Manual Verification 'Seed Execution' (Protocol in workflow.md)

- [x] **Task:** Test seed persistence [89ca358]
  - [x] Restart development server
  - [x] Verify agents still exist after restart
  - [x] Verify agent positions unchanged
  - [x] Task: Conductor - User Manual Verification 'Seed Persistence' (Protocol in workflow.md)

### Day 5-7: Integration & Testing

- [x] **Task:** Integrate world state with rendering [185cb8b]
  - [x] Update `GameWorld` component to display weather
  - [x] Update `GameWorld` component to display time
  - [x] Update `GameWorld` component to display day count
  - [x] Task: Conductor - User Manual Verification 'World State Integration' (Protocol in workflow.md)

- [x] **Task:** Run comprehensive tests [89ca358]
  - [x] Run unit tests for all CRUD operations
  - [x] Run unit tests for world state functions
  - [x] Verify test coverage >80% (Currently 94.95%)
  - [x] Fix any failing tests
  - [x] Task: Conductor - User Manual Verification 'Test Suite' (Protocol in workflow.md)

- [x] **Task:** Verify Phase 2 acceptance criteria [89ca358]
  - [x] Convex schema deployed with agents and world_state tables ✓
  - [x] Real-time sync works (open 2 tabs, see updates) ✓
  - [x] Agent positions persist to database ✓
  - [x] Basic CRUD operations functional ✓
  - [x] World state features implemented ✓
  - [x] 10-15 seed agents created ✓
  - [x] Unit tests pass with >80% coverage ✓
  - [x] No TypeScript errors ✓
  - [x] Task: Conductor - User Manual Verification 'Phase 2 Acceptance' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions 0ea8142

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
