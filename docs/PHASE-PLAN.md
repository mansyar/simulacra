# PHASE-PLAN.md - Implementation Roadmap

## Phase Overview

| Phase | Name | Focus | Status | Estimated Duration |
|-------|------|-------|--------|-------------------|
| 1 | The Body | Setup + Rendering | ✅ Complete | 1-2 weeks |
| 2 | The Heart | Convex + Real-time Sync | ✅ Complete | 1-2 weeks |
| 3 | The Brain | LLM Integration + Memory | ✅ Complete | 2-3 weeks |
| 4 | The Eyes | Excalibur → PixiJS Migration | ✅ Complete | 3-4 days |
| 5 | The Social | Proximity + Frontend Interaction | ✅ Complete (All Tracks) | 1-2 weeks |
| 6 | Fluid Movement | Organic idle + Predictive pathing | ✅ Complete | 3-4 days |
| 7 | The Mind | AI Context Fidelity | ✅ Complete (Tracks A & B ✅, C covered by B) | 1 week |
| 8 | The Backbone | Robustness & Scaling | ✅ Complete (All Tracks) | 1 week |
| 9 | The Soul | Deeper Social Dynamics | ✅ Tracks A-D, ⏳ Track E | 1 week |
| 10 | Movement Coherence | Fix agent trajectory, weather sync, and logical gaps | 🆕 Planned | 2-3 days |
| 11 | The Polish | Master Panel + Deploy | ⏳ Not Started | 1 week |

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

**Status:** ✅ ALL TRACKS COMPLETE

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

#### C1. Relationship Context in AI Prompts (~0.5 day) ✅
- [x] Query `relationships` table for the deciding agent
- [x] Include relationship data in `buildFullContext` (e.g. "You like Alice (affinity: +14), you distrust Bob (affinity: -8)")
- [x] Verify AI decisions reference relationship context

#### C2. Multi-Turn Conversations (~1.5 days) ✅

> **Design:** Open-ended, one exchange per tick. Agent A initiates on tick N,
> Agent B responds on tick N+1, and so on until one agent decides to end the
> conversation or walks away.

- [x] Add `conversationState` to agent schema: `{ partnerId, role: "initiator" | "responder", turnCount }`
- [x] On tick: if agent has an active conversation, generate a response instead of a fresh decision
- [x] Conversation ends when: agent decides to stop, partner walks away, or `turnCount` exceeds a cap (e.g. 5)
- [x] Store each exchange as a `"conversation"` event with partner reference
- [x] Both agents show speech bubbles during active conversations

#### C3. Conversation Visual Indicators (~0.5 day) ✅
- [x] Draw a subtle dotted line or glow arc between two agents in active conversation
- [x] Show a chat icon above conversing agent pairs

---

### Implementation Order

```
A1 + A2 + A3 (quick fixes) ✅
  → B1 + B2 + B3 (frontend interaction) ✅
   → C1 (relationship context in AI prompts) ✅
  → C2 (multi-turn conversations — main backend task) ✅
  → C3 (conversation visuals — polish) ✅
```

**Track A + B completed: 2026-04-27**
**Track C completed: 2026-04-28**

### Phase 5 Checkpoints

- [x] Clicking an agent in the canvas opens a detail side panel on the left
- [x] Agent detail panel shows live needs, traits, relationships, and events
- [x] Thought Stream supports filtering by agent and event type
- [x] No TanStack starter template content remains on the index route
- [x] Agents hold multi-turn conversations across ticks (open-ended, 1 exchange/tick)
- [x] AI decisions reference relationship context ("I like Alice, I'll go talk to her")
- [x] Conversation pairs are visually linked on the canvas

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

## Phase 7: The Mind

**Goal:** Fix how AI context is built and passed to the LLM so agents actually use their full sensory data, memories, relationships, and archetype personality in every decision.

**Status:** ✅ COMPLETE (Tracks A & B ✅, Track C partially covered by B)

> **Completed:** 2026-04-28 — Track A: Sensory Buffer in LLM Context
> **Completed:** 2026-04-28 — Track B: User Prompt Restructuring

### Track A: Sensory Buffer in LLM Context [COMPLETE: 2026-04-28]

**Problem:** The `events` table stores the last 10 sensory events per agent (Tier 1 memory), but `buildFullContext()` only queries the `memories` table (Tier 2 vector store). The LLM has no awareness of what just happened to the agent.

- [x] Add sensory event retrieval to `buildFullContext()` action in `convex/functions/ai.ts`
- [x] Include last 10 sensory events in the context string passed to the LLM
- [x] Format events as a chronologically ordered list with relative timestamps
- [x] Write test verifying sensory events appear in LLM decision context (`convex/sensory_context.test.ts` — 4 tests)

### Track B: User Prompt Restructuring [COMPLETE: 2026-04-28]

**Problem:** The `contextOverride` parameter appends rich context (bio, traits, goals, relationships, memories) to the *system prompt* while the *user prompt* remains bare-bones (`"Agent Name: Bob. State: ... What is your next action?"`). LLMs deprioritize system prompt content and may ignore the rich context.

- [x] Remove `contextOverride` parameter from `decision` action args — clean break, no deprecated shim
- [x] Remove all system prompt branching logic that used `contextOverride`
- [x] Restructure user prompt with inline `## Your Identity`, `## Your State`, `## Your Relationships`, `## Recent Events`, `## Relevant Memories` sections
- [x] Add concluding instruction: `"Based on ALL of the above context, what is your next action? Consider your personality, relationships, recent experiences, and current state."`
- [x] Rewrite `DECISION_SYSTEM_PROMPT` to contain ONLY the JSON output schema (no context references)
- [x] Always include `ARCHETYPE_PROMPTS[args.archetype]` in the system prompt (previously replaced by `contextOverride`)
- [x] Restructure `buildFullContext` action to return structured object (`agentContext`, `relationshipContext`, `events`, `memories`)
- [x] Update `world.ts` to destructure structured context and pass fields individually to `decision`
- [x] Write integration test verifying all 5 context sections appear in the API user prompt (`convex/user_prompt_context.test.ts` — 1 test)
- [x] Update existing tests (`sensory_context.test.ts`, `relationship_context.test.ts`) for new structured return type
- [x] All 73 tests pass across 23 test files (85.56% overall coverage)

### Track C: Archetype & Relationship Prompt Enhancement [PARTIALLY COVERED BY TRACK B]

**Problem:** When `contextOverride` was provided, it replaced `ARCHETYPE_PROMPTS[args.archetype]` entirely — the archetype personality was lost. Additionally, `DECISION_SYSTEM_PROMPT` didn't instruct the LLM to consider relationships and events.

- [x] **Always include `ARCHETYPE_PROMPTS`** — covered by Track B (`contextOverride` removed entirely, archetype prompts always appended to system prompt)
- [x] **Instruct LLM to consider relationships/events** — covered by Track B's concluding instruction in the user prompt (`"Consider your personality, relationships, recent experiences, and current state"`)
- [x] **Relationship natural-language sentiment** — already implemented in Phase 5 (e.g. "You like Alice (affinity: +5.0)")
- [x] **Test archetype prompts present** — `user_prompt_context.test.ts` verifies system message contains archetype-specific content (e.g. `"You are a builder"` + `"organized, productive, and detail-oriented"`)
- [x] **Test relationship in decision output** — `user_prompt_context.test.ts` verifies full pipeline: real DB agents → `buildFullContext` → `decision` → user prompt contains relationship data (`"Bob"`, `"affinity"`, `"## Your Relationships"`)

### Phase 7 Checkpoints

- [x] Sensory events appear in LLM decision context (verified via test) — Track A
- [x] `contextOverride` parameter removed from `decision` action — clean break — Track B
- [x] User prompt contains all context sections (Identity, State, Relationships, Events, Memories) — Track B
- [x] `DECISION_SYSTEM_PROMPT` contains ONLY JSON output schema — Track B
- [x] Archetype prompts are always present in system prompt — Track C (covered)
- [x] LLM instructed to consider relationships and events — Track C (covered via user prompt)
- [x] Relationship context includes natural-language sentiment — Track C (already done)
- [x] Explicit test for archetype prompts in system content — Track C (now tested)
- [x] Explicit test for relationship data in decision output — Track C (now tested)
- [x] Integration test verifies all context sections appear in decision prompt — Track B
- [x] All 73 tests pass with >80% coverage (85.56%)

---

## Phase 8: The Backbone

**Goal:** Unbottleneck the world tick, optimize for scaling to 50+ agents, and clean up technical debt. Leverages the new (no-limit) chat API to parallelize aggressively while respecting the embedding 100 RPM cap.

**Status:** ✅ ALL TRACKS COMPLETE (2026-04-28)

> **Track A completed: 2026-04-28**
> **Track B completed: 2026-04-28**
> **Track C completed: 2026-04-28**

### Track A: Unbottleneck the World Tick [COMPLETE: 2026-04-28]

**Problem:** The tick processed agents in batches of 3 with 1-second delays (`BATCH_SIZE = 3, BATCH_DELAY_MS = 1000`). Designed to avoid chat API rate limits — but the chat model has **no concurrency limit**. The 1s delay was pure waste. A single agent failure cascaded and blocked the entire batch.

- [x] **Parallelize all agents:** Removed batching — replaced 3-at-a-time with full parallel execution (`Promise.all(agents.map(...))`) (c897a96)
- [x] **Remove inter-batch delay:** Deleted `BATCH_DELAY_MS = 1000` and the `await new Promise(...)` between batches (c897a96)
- [x] **Error isolation:** Wrapped each `processAgent` call in a try-catch with 1 retry (500ms delay) so one failure doesn't block other agents (c897a96)
- [x] **Simplify chat retry:** Updated `fetchWithRetry` to skip 429 backoff for chat calls (no rate limits), preserving retries only for network errors (5xx, timeouts). Embedding calls retain 429 backoff. (377c771)
- [x] **Verify tick duration:** Tick time dropped from ~3.2s to ~0.04-1.0s (up to 80x in test env, ~3x with real LLM) (a41f5b9)
- [x] Write tests for partial batch failure recovery, error isolation, retry behavior, parallel execution timing (9 new tests) (c897a96, 377c771)
- [x] **Tick duration monitoring:** Added `tickDurationMs` to tick return value + runtime console.log with ms/agent average (a41f5b9)

### Track B: Spatial Query Optimization [COMPLETE: 2026-04-28]

**Problem:** Both `recordPassivePerception` and the nearby-agent check in `processAgent()` load ALL agents into memory and brute-force Euclidean distance O(n²). This is fine for 10 agents but prevents scaling to 25+ agents without performance degradation.

- [x] Replace brute-force agent scans with Convex `by_position` index queries in both locations (4be5159, c846884)
- [x] Implement bounded-range query with `gte`/`lte` on `gridX` then filter Euclidean in memory (4be5159)
- [x] Add performance benchmark test for 50+ agent scaling (verify tick duration < 30s — achieved: 1,055ms) (f5bc109)
- [x] Document optimized query patterns in code comments and `docs/ARCHITECTURE.md` (7a3175f)

### Track C: Embedding Pipeline & Configuration Cleanup [COMPLETE: 2026-04-28]

**Problem:** Four accumulating issues around the embedding layer and configuration hygiene:
1. Each agent's `retrieveMemoriesAction` makes a **separate embedding API call** — 10 calls/tick at 180s = only 3.3 RPM, but this doesn't scale (50 agents at 60s = 50 RPM, close to the 100 RPM limit).
2. Embedding results for similar query texts are recomputed every tick.
3. `coreTraits` grows unbounded (append-only).
4. Magic thresholds like `480` ticks aren't documented.

- [x] **Batch embedding calls** (32d5fd7) — Create `batchEmbed` action in `ai_helpers.ts` that sends multiple texts in a single API call (`input: [text1, text2, ...]`), reducing 10 individual calls to 1 per tick. Handles Google Gemini variant (separate calls internally) and preserves 429 backoff via `fetchWithRetry`.
- [x] **Per-tick embedding cache** (357ae68) — Add `simpleHash` and `getCachedEmbedding` helpers using ephemeral `Map<string, number[]>` keyed by text content hash. Wire optional `embedding` parameter through `buildFullContext` → `retrieveMemoriesAction` for pre-computed embeddings. Cache is garbage-collected after each action invocation.
- [x] **Trait Cap** (9e764cd) — Change `updateIdentity` `.slice(0, 5)` → `.slice(0, 10)`, capping `coreTraits` at 10 items. Dropping oldest entries via `.slice()` ordering (newest appended at end). Keep `Array.from(new Set(...))` dedup logic.
- [x] **Named Constants** (5316265) — Replace magic number `480` in `world.ts` with `const REFLECTION_INTERVAL_TICKS = 480` and inline comment: `// 480 ticks ≈ 10 simulated days (48 ticks/day, ~30 min per tick)`
- [x] Write test for batch embedding correctness — 9 tests in `convex/embedding_batch.test.ts` (order, single-text, empty, error, plus 5 cache behavior tests)
- [x] Write test for trait capping behavior — 2 tests in `convex/agents.test.ts` (over-limit at 10, under-limit at 7)
- [ ] Config table extraction of named constants deferred to Phase 9 Track D (Runtime Configuration)

### Phase 8 Checkpoints

- [x] **Track A:** All 10 agents fire LLM calls in parallel — tick duration drops to LLM latency (~0.04-1.0s)
- [x] **Track A:** One agent failure doesn't block other agents in the tick (error isolation with 1 retry)
- [x] **Track A:** Chat 429 backoff removed for chat calls (no rate limits); embeddings retain 429 backoff
- [x] **Track A:** Tick duration monitoring (tickDurationMs in return value + runtime logging)
- [x] **Track A:** 9 new tests + 1 updated test; all 208 tests pass across 57 test files
- [x] **Track B:** 50+ agent tick completes within acceptable duration (<30s — achieved: 1,055ms)
- [x] **Track B:** `recordPassivePerception` and `processAgent` both use `by_position` index (O(k) vs O(n))
- [x] **Track B:** Spatial query pattern documented in `docs/ARCHITECTURE.md` §7.2
- [x] **Track B:** 6 new tests (4 spatial query + 1 perception + 1 benchmark); all 214 tests pass across 58 files
- [x] **Track C:** Embedding calls can be batched from N/tick to 1/tick via `batchEmbed` action
- [x] **Track C:** `coreTraits` capped at 10 entries (tested: 12 traits → 10, 7 traits → 7)
- [x] **Track C:** Magic threshold `480` replaced with `REFLECTION_INTERVAL_TICKS` and documented
- [x] **Track C:** Batch embedding equivalence test passes (9 tests)
- [x] **Track C:** Trait capping behavior test passes (2 tests)
- [x] **Track C:** All 225 tests pass across 59 test files

---

## Phase 9: The Soul

**Goal:** Fix the conversation system to be truly bidirectional, then layer on dynamic sentiment, lifecycle cleanup, and runtime configurability.

**Status:** ✅ Tracks A-D Complete, ⏳ Track E Remaining

> **Completed:** 2026-04-29 — Track A: Bidirectional Conversation System
> **Completed:** 2026-04-29 — Track B: Sentiment-Based Affinity During Conversations
> **Completed:** 2026-04-30 — Track C: Conversation TTL & Cleanup
>   - 11 new tests, 258 total, 62 test files
> **Completed:** 2026-04-30 — Track D: Runtime Configuration & Integration Testing
>   - 20 new tests, 301 total, 69 test files
>   - All 5 config fields extracted to config table with env var fallbacks
>   - `maxTraits`, `reflectionIntervalTicks`, `maxConversationTurns`, `safetyMultiplier`, `agentSpeed` all config-driven
>
> **Design Context:** The current conversation system has two critical flaws discovered during Phase 8 testing:
> 1. When agent A talks to agent B, B is force-set to `action: "listening"` and skipped on subsequent ticks — B never gets to respond
> 2. When the conversation ends, B's `action` is never reset from `"listening"` — B is permanently frozen
>
> Track A fixes both by removing forced actions entirely and making the conversation state bidirectional.

### Track A: Bidirectional Conversation System [COMPLETE: 2026-04-29]

**Problem:** The conversation system uses a one-sided model where the initiator drives everything and the partner is forced into `action: "listening"`. The partner is skipped (`if listening → return`) across ticks, so they never generate a response. When the conversation ends, the partner's action is never reset, permanently freezing them.

**Design decisions (revised 2026-04-28):**
- Each agent stores ONLY their own `myLastSpeech` in `conversationState`. No `partnerLastSpeech` field — the partner's speech is read from the in-memory agents array during LLM context building. This avoids cross-document `conversationState` overwrites (Convex patches the entire nested object, not individual fields).
- The `if (listening) return` guard is removed entirely — it recreates the same freeze bug for AI-chosen listening.
- When a conversation ends, only the partner's action is reset to `"idle"` (the ending agent keeps their AI-chosen action, since `updateAction` at line 327 runs after `handleConversationState` and overwrites any reset).

- [x] **Remove forced `"listening"` action** — In `processAgent()`, stop calling `updateAction(partner, "listening")` when an agent initiates talking. The partner keeps their own action. Also remove the `+2` relationship update from this branch (deferred to Track B).
- [x] **Remove `listening` skip** — Delete the `if (agent.currentAction === "listening") return;` guard. Every agent gets an LLM call every tick. AI-chosen `"listening"` self-recovers naturally on the next tick.
- [x] **Add `myLastSpeech` to conversationState** — Add `myLastSpeech: v.optional(v.string())` to the `conversationState` schema. Remove `lastPartnerSpeech` entirely (not renamed — deleted).
- [x] **Fix `handleConversationState`** — When Alice talks to Bob, write ONLY `myLastSpeech: speech` to Alice's `conversationState`. Do NOT write to Bob's document. Bob reads Alice's `myLastSpeech` from the in-memory agents array when building his LLM context.
- [x] **Build conversation context from agents array** — When building the LLM prompt for Bob, find Alice in the `agents` array and read `alice.conversationState.myLastSpeech` as "what Alice said." Handle undefined gracefully (partner hasn't spoken yet).
- [x] **Fix conversation end** — When either agent returns a non-`"talking"` action: clear current agent's `conversationState`; clear partner's `conversationState`; reset partner's `currentAction` to `"idle"` AND clear partner's `interactionPartnerId`. (Current agent's action is set by `updateAction` at line 327 — no reset needed.)
- [x] **Write tests:**
  - Test: Agent B is not forced to "listening" when Agent A initiates talking
  - Test: Agent with "listening" action is not stuck — can still receive state updates
  - Test: Partner's state is properly reset when conversation ends
  - Test: `myLastSpeech` field persists in conversationState
  - Test: `lastPartnerSpeech` no longer exists in conversationState
  - Run test suite and confirm all existing tests still pass (106/106 passing)

### Track B: Sentiment-Based Affinity During Conversations [COMPLETE: 2026-04-29]

**Problem:** `updateRelationship` with +2 delta only fires when an agent initiates talking. Multi-turn conversations don't adjust affinity further, so even warm conversations leave relationships unchanged. The `valenceHistory` isn't updated per-turn either.

> **Depends on:** Track A — sentiments need a working bidirectional conversation system

- [x] **Add speech sentiment analysis helper** — `analyzeSentiment()` in `convex/functions/ai.ts` with ~60 keyword-based entries graded +1 to +3 (positive) and -1 to -3 (negative). Handles punctuation, capitalization, and partial word matching. Clamped to [-3, +3] range. (Commit 9f5af85)
- [x] **Wire sentiment into conversation tick** — In `processAgent()` in `world.ts`, after LLM returns `action === "talking"` with speech, call `analyzeSentiment(speech)` and pass the delta to `updateRelationship()`. (Commit 49fc2f7)
- [x] **Apply dynamic affinity delta on every turn** — Sentiment-based affinity fires on initiation AND every subsequent turn (no flat +2 baseline). Shared affinity: both agents' deltas in the same tick average out (by design). (Commit 49fc2f7)
- [x] **Update `valenceHistory` on every turn** — Auto-derived from delta sign by existing `updateRelationship()` mutation. Maintains last 5 entries. (Commit 49fc2f7)
- [x] **Write tests** — 17 new tests: 10 unit tests for `analyzeSentiment()` (positive/negative/neutral/mixed/empty/partial matches) + 7 integration tests (multi-turn accumulation, mixed sentiment, valenceHistory cap at 5). (Commits 9f5af85, 49fc2f7, 01c8275)
- [x] **Full test suite** — 247 tests across 61 files, all passing. Coverage: 82.12% (above 80% target). (Commit 01c8275)

### Track C: Conversation TTL & Cleanup [COMPLETE: 2026-04-30]

**Problem:** `conversationState` persists forever with no real-time timeout. If the tick interval is 180s and max 5 turns, conversations span ~15 minutes. If both agents are idle, the conversation state never cleans up. Additionally, when Agent A switches from talking to Agent B to talking to Agent C (via LLM decision), `handleConversationState` overwrites A's `conversationState.partnerId` to C, but B's `conversationState` still references A — **B is now orphaned** with stale state. The TTL mechanism serves as the safety net for this scenario.

> **Depends on:** Track A — TTL logic operates on the new bidirectional state schema

> **Design Changes (analysis-driven):**
> - **Hard cleanup:** In-memory agent objects are mutated alongside DB writes, preventing conversation restart on the same tick
> - **Dynamic TTL:** Default computed as `5 turns × tickInterval × 2× safety multiplier`, scales with env-driven tick timer changes
> - **Partner dedup:** `Set<string>` prevents double-processing the same conversation pair
> - **Dynamic event duration:** `Math.round((Date.now() - startedAt) / 60000)` used in event messages

- [x] Add `conversationMaxTtlMs` to config table schema (`v.optional(v.float64())`)
- [x] Compute dynamic TTL default: `5 × (config?.defaultTickInterval ?? 180) × 2 × 1000` with env var and hardcoded fallback
- [x] Implement `cleanStaleConversations` at start of `tick()` with:
    - [x] **Partner dedup** via `Set<string>` of processed IDs
    - [x] **Hard cleanup** — DB mutation + in-memory object mutation (set `conversationState = undefined`, `currentAction = "idle"`, `interactionPartnerId = undefined`)
    - [x] Both agent and partner get cleaned (in-memory + DB)
- [x] Log cleanup events to sensory buffer for BOTH agents with dynamic staleness duration
- [x] Write tests: TTL formula, hard cleanup prevents restart, partner dedup, event logging, env var override, non-stale conversations unaffected (11 tests in `convex/conversation_ttl.test.ts`)
- [x] All 258 tests pass across 62 test files

### Track D: Runtime Configuration & Integration Testing [COMPLETE: 2026-04-30]

**Problem:** Several thresholds remain as magic numbers or disconnected values across files. No integration tests verify config-driven behavior end-to-end.

- [x] Extract to config table (with env var fallbacks):
  - `maxTraits` (default 10) — env: `MAX_TRAITS`
  - `reflectionIntervalTicks` (default 480) — env: `REFLECTION_INTERVAL_TICKS`
  - `maxConversationTurns` (default 5) — env: `MAX_CONVERSATION_TURNS`
  - `safetyMultiplier` (default 2) — env: `SAFETY_MULTIPLIER`
  - `agentSpeed` (default 6) — env: `AGENT_SPEED`
  - ~~`CONVERSATION_MAX_TTL_MS`~~ → already added in Track C as `conversationMaxTtlMs` with dynamic default
- [x] Update all affected files to read from config/env var with fallback to defaults:
  - `updateIdentity` — reads `maxTraits` from config
  - `updateRelationship` — reads `maxConversationTurns` for valence cap
  - `resolveMovement` — reads `agentSpeed` from config
  - `processAgent` — reads `reflectionIntervalTicks` and `maxConversationTurns`
  - `cleanStaleConversations` — reads `maxConversationTurns` and `safetyMultiplier`
  - Conversation context string shows dynamic turn cap
- [x] Add `getConfigValue` helper with priority: env var → config table → hardcoded default
- [x] Add integration test: set config → run tick → verify behavior matches config values
- [x] Add integration test: disable sleep mode → run tick → verify agents process (skipSleep bypass)
- [x] All 301 tests pass across 69 test files

### Track E: POI-Aware Agent Behavior

**Problem:** POIs (Library, Plaza, Cafe, Forest Grove) are rendered on the canvas and stored in the database, but the LLM has no awareness they exist. Agents eat, sleep, and work while standing in place — the world feels empty because locations have no meaning to the AI.

- [ ] **Inject POI context into LLM decisions** — Add a `## Nearby Locations` section to the user prompt in `buildContextPrompt()`. Include all POIs with name, coordinates, description, and distance from the agent.
  - Format: `"- Cozy Cafe (45, 15): Fresh coffee and good conversation. [1.2 tiles away]"`
  - Add activity suggestions: `"eating → Cozy Cafe"`, `"working → The Great Library"`, etc.
  - The LLM can then output a POI name as `target` instead of raw coordinates
  - Include an explicit note listing valid POI names to reduce hallucination of fake locations:
    `"Valid destinations: Cozy Cafe, The Great Library, Central Plaza, Forest Grove. Do not invent locations."`

- [ ] **Add POI name → coordinate resolution** — In `processAgent()`, after the existing agent name lookup, add a POI name lookup that converts a POI name to coordinates.
  - Use `includes()` matching (case-insensitive) instead of strict `===` — e.g., `"Cafe"` resolves to `"Cozy Cafe"`. If multiple POIs match, prefer the closest one by distance.
  - If no POI matches AND no agent name matches AND coordinates can't be parsed → fall back to a random nearby coordinate within 5 tiles of the agent's current position. Prevents the agent from standing still when the LLM outputs a hallucinated target.

- [ ] **Handle POI target + non-walking action** — When the LLM returns a POI name as target but the action is an activity (e.g., `action: "eating"`, `target: "Cozy Cafe"`), override the action to `"walking"` so the agent actually moves toward the POI. The LLM can decide on the activity after arrival.
  - Exception: if the agent is already within 1 tile of the POI, keep the original action (they're already there).

- [ ] **Add POI arrival events** — When an agent reaches coordinates that match a POI, log an event like `"Arrived at Cozy Cafe to eat."` instead of the generic `"Arrived at destination (45, 15)"`.
  - Include the agent's current action in the event description for rich context.
  - If the agent was already at the POI (didn't walk there), log `"Already at Cozy Cafe"` to avoid misleading "arrival" messages.

- [ ] **Add POI context to `buildFullContext`** — Add `poiContext` field to the return type, query the `pois` table, compute distances from the agent's position.

- [ ] **Write tests:**
  - Test: LLM context string includes all POI names and coordinates
  - Test: `processAgent()` resolves POI name to coordinates (exact match + partial match via `includes()`)
  - Test: LLM hallucinates fake POI name → fallback to random nearby coordinate
  - Test: LLM returns POI target with `action: "eating"` → overridden to `"walking"` (unless already at POI)
  - Test: POI arrival events are logged with the POI name when agent reaches a POI
  - Test: POI arrival events use different message when agent was already at the POI
  - Run test suite and confirm all existing tests still pass

### Phase 9 Checkpoints

- [x] Both agents participate in conversations (bidirectional, not one-sided) — Track A
- [x] Agents are never frozen in "listening" state after conversation ends — Track A
- [x] Partners are free to ignore conversations and pursue their own actions — Track A
- [x] `myLastSpeech` correctly stores each agent's own speech — Track A
- [x] Affinity scores change dynamically during multi-turn conversations — Track B
- [x] Stale conversations auto-cleanup after timeout — Track C
- [x] All thresholds configurable via config table — Track D (5 fields: maxTraits, reflectionIntervalTicks, maxConversationTurns, safetyMultiplier, agentSpeed)
- [ ] **Agents walk to POIs for contextual actions (eat at Cafe, work at Library, etc.)** — Track E
- [ ] **Thought stream shows arrival events like "Arrived at Cozy Cafe to eat."** — Track E
- [ ] **LLM decisions reference location names instead of raw coordinates** — Track E
- [x] Integration tests verify config-driven behavior — Track D (20 tests, 301 total, 69 test files)
- [x] All 301 tests pass across 69 test files (Track D verified)

---

## Phase 10: Movement Coherence

**Goal:** Fix the logical flow gaps in the agent movement mechanism discovered during Phase 9 analysis — the LLM doesn't know it's already walking, the frontend ignores weather in its speed calculations, and no cleanup happens on arrival.

**Status:** 🆕 PLANNED

> **Discovery Context:** Analysis of the movement pipeline revealed four logical issues:
> 1. **LLM blindness** — `buildAgentContext` omits `currentAction`, `gridX/Y`, and `targetX/Y`, so the LLM re-decides a fresh direction every tick (agents zigzag, never completing journeys)
> 2. **Weather decoupling** — `AgentSprite.tick()` hardcodes `6 / 180` for speed; the backend applies weather multipliers (0.5x stormy, 0.8x rainy), causing the frontend to overshoot and snap back
> 3. **No arrival cleanup** — `resolveMovement` returns `arrived: true` but nobody clears `targetX/targetY` from the agent; frontend keeps "walking" to an already-reached destination
> 4. **No bounds clamping** — `resolveMovement` doesn't clamp to [0, 63], so agents can walk off the map

### Track A: LLM Sees Its Own Trajectory

**Problem:** The LLM receives no information about its current action, position, or target in `buildAgentContext`. Every 180-second tick is a blank slate — the LLM picks a new random destination, and agents zigzag instead of completing journeys.

- [ ] **Add `currentAction` to `agentState`** — Pass `currentAction` alongside `hunger/energy/social` in the `decision` action args in `world.ts`
- [ ] **Add current position and target to `buildAgentContext`** — Append `Current Position: (gridX, gridY)` and `Destination: (targetX, targetY)` (with `"None"` fallback when undefined) to the identity context string in `convex/functions/ai.ts`
- [ ] **Add distance-remaining hint** — If a target exists, include `Distance Remaining: ~N tiles` so the LLM understands journey progress
- [ ] **Write tests:**
  - Test: `buildAgentContext` output contains `Current Action`, `Current Position`, and `Destination` fields
  - Test: `buildAgentContext` shows `"None"` when no target is set
  - Test: LLM decision context includes the agent's ongoing trajectory

### Track B: Weather-Aware Frontend Speed

**Problem:** `AgentSprite.tick()` hardcodes `const speed = 6 / 180`. During stormy weather, the backend advances only 3 units per tick (6 × 0.5), but the frontend races ahead at 6/180 units/sec, causing a jarring 500ms snap-back course correction every tick.

- [ ] **Propagate weather multiplier to AgentSprite** — Have `GameCanvas` pass the world state's weather multiplier down to each `AgentSprite` instance
- [ ] **Apply multiplier in tick calculation** — Change line ~237 from `const speed = 6 / 180` to `const speed = (6 * this.speedMultiplier) / 180` in `AgentSprite.ts`
- [ ] **Default multiplier** — Default to `1.0` when no weather data is available (ensures graceful degradation)
- [ ] **Write tests:**
  - Test: AgentSprite moves at reduced speed during simulated stormy/rainy weather
  - Test: Default multiplier of 1.0 when weather data is absent
  - Integration test: Backend position delta matches frontend predicted delta over one tick interval

### Track C: Arrival Cleanup

**Problem:** When `resolveMovement` returns `arrived: true`, `targetX/targetY` remain set on the agent. The frontend continues predicting movement toward an already-reached destination, and subsequent ticks wastefully call `resolveMovement` on an arrived agent.

- [ ] **Clear targets on arrival in `processAgent`** — After logging the arrival event in `world.ts` (~line 260), call an internal mutation to set `targetX: undefined, targetY: undefined`
- [ ] **Skip `resolveMovement` when distance is zero** — Add an early return guard in `resolveMovement`: if distance < 0.1, skip the DB patch entirely
- [ ] **Write tests:**
  - Test: Agent's `targetX/targetY` are cleared after `resolveMovement` returns `arrived: true`
  - Test: `resolveMovement` skips DB patch when distance is already zero (no wasted writes)
  - Test: Frontend stops predicting movement toward target after arrival

### Track D: Bounds Clamping

**Problem:** The backend's `resolveMovement` doesn't clamp `gridX/gridY` to the [0, 63] world boundary, so agents can move outside the visible map.

- [ ] **Add clamping in `resolveMovement`** — Change line ~148-149 in `agents.ts` to clamp:
  ```typescript
  const newX = Math.max(0, Math.min(63, agent.gridX + dx * ratio));
  const newY = Math.max(0, Math.min(63, agent.gridY + dy * ratio));
  ```
- [ ] **Write test:**
  - Test: Agent with target outside bounds is clamped to [0, 63]
  - Test: Agent already at boundary doesn't overshoot (e.g., gridX=62, targetX=70 → newX=63)

### Implementation Order

```
Track A (LLM sees trajectory)     ← Highest impact: stops zigzagging
  → Track B (weather sync)        ← High impact: smooths bad-weather movement
  → Track C (arrival cleanup)     ← Medium impact: stops zombie walking
  → Track D (bounds clamping)     ← Low impact: safety net
```

**Estimated effort:** ~2-3 days total (each track is 2-4 hour changes)

### Phase 10 Checkpoints

- [ ] LLM decisions reference ongoing journeys ("I'm already walking to the library, halfway there")
- [ ] Agents complete long-distance journeys instead of zigzagging every tick
- [ ] Frontend movement speed matches backend speed in all weather conditions (no snap-back)
- [ ] Arrived agents' targets are cleared; frontend shows "idle" behavior on arrival
- [ ] Agent positions never exceed world boundaries [0, 63]
- [ ] All 250+ existing tests still pass; new tests cover all 4 tracks

---

## Phase 11: The Polish (Upcoming)

**Goal:** Master panel and deployment

**Status:** ⏳ NOT STARTED

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

### Phase 11 Checkpoints

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
Phase 7 (Mind) ✅
    │
    ├──► Sensory buffer in LLM context ✅
    ├──► User prompt restructuring ✅
    └──► Archetype prompts always included ✅
            │
            ▼
Phase 8 (Backbone) ✅
    │
    ├──► Unbottleneck the world tick ✅ (Track A)
    ├──► Spatial query optimization ✅ (Track B)
    └──► Embedding pipeline (batch + cache) & configuration cleanup ✅ (Track C)
            │
            ▼
Phase 9 (Soul)
    │
    ├──► Bidirectional conversation system (Track A) ✅
    │       │
    │       ├──► Sentiment-based affinity (Track B) ✅
    │       ├──► Conversation TTL & cleanup (Track C) ✅
    │       ├──► Runtime configuration & integration testing (Track D) ✅
    │       └──► POI-aware agent behavior (Track E) ⏳
            │
            ▼
Phase 10 (Movement Coherence)
    │
    ├──► LLM sees its own trajectory (Track A)
    ├──► Weather-aware frontend speed (Track B)
    ├──► Arrival cleanup (Track C)
    └──► Bounds clamping (Track D)
            │
            ▼
Phase 11 (Polish)
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

### Current Status: Phase 9 (Track E) Up Next 🎯

1. ✅ **Done:** Grid rendering (Phase 1)
2. ✅ **Done:** Convex + real-time sync (Phase 2)
3. ✅ **Done:** LLM integration + memory (Phase 3)
4. ✅ **Done:** PixiJS migration (Phase 4)
5. ✅ **Done:** Quick fixes & frontend interaction (Phase 5 — Tracks A & B)
6. ✅ **Done:** Multi-turn conversations, relationship context, conversation visuals (Phase 5 — Track C)
7. ✅ **Done:** Fluid movement (Phase 6)
8. ✅ **Done:** Sensory Buffer in LLM Context (Phase 7 — Track A)
9. ✅ **Done:** User Prompt Restructuring (Phase 7 — Track B)
10. ✅ **Done:** Unbottleneck the World Tick (Phase 8 — Track A)
11. ✅ **Done:** Spatial Query Optimization (Phase 8 — Track B)
12. ✅ **Done:** Embedding Pipeline & Configuration Cleanup (Phase 8 — Track C)
13. ✅ **Done:** Fix bidirectional conversation system (Phase 9 — Track A)
14. ✅ **Done:** Sentiment-based affinity during conversations (Phase 9 — Track B)
15. ✅ **Done:** Conversation TTL & cleanup (Phase 9 — Track C) — Auto-cleanup stale conversations with configurable TTL, hard cleanup (DB + in-memory), partner dedup, and event logging
16. ✅ **Done:** Runtime configuration & integration testing (Phase 9 — Track D) — Extracted 5 constants to config table with env var fallbacks, added getConfigValue helper, 20 new tests (301 total)
17. ⏳ **Planned:** POI-aware agent behavior (Phase 9 — Track E)
18. 🆕 **Planned:** LLM sees its own trajectory (Phase 10 — Track A)
19. 🆕 **Planned:** Weather-aware frontend speed (Phase 10 — Track B)
20. 🆕 **Planned:** Arrival cleanup (Phase 10 — Track C)
21. 🆕 **Planned:** Bounds clamping (Phase 10 — Track D)
22. ⏳ **Planned:** Master panel and deployment (Phase 11 — The Polish)

---

## Future Enhancements (Post v1.0)

- Spatial partitioning (quadtree) for 100+ agents
- Multiple world maps
- Agent inventory system
- Building construction
- Day/night cycle with lighting
- Sound effects
- Mobile responsive design