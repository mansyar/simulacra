# Implementation Plan: Cognitive Integration & Memory Loop [checkpoint: 2a48658]

## Phase 0: Architectural Refinement (Identity & Physics) [checkpoint: 2a48658]
1. - [x] Task: Update `convex/schema.ts` to add `bio`, `inventory`, `currentGoal`, `lastReflectedTick`, `actionStartedAt`, `interactionPartnerId`, `lastThought`, `speech`, and `lastSpeechAt`. 7a7612a
2. - [x] Task: Update `convex/schema.ts` to add the `pois` table (name, description, gridX, gridY, type). 000276f
3. - [x] Task: Update `AgentAction` schema to include the `"listening"` state. 91b0aca
4. - [x] Task: Implement dynamic Metabolism and Weather Multiplier logic in `updateNeeds` and movement helpers. 21fbf95
5. - [x] Task: Implement `getGlobalEvents` query for the world-wide sidebar. 8517854
6. - [x] Task: Implement "Batch Processor" to stay within RPM/TPM limits. e3ddf22

## Phase 1: Simulation Logic & Perception
1. - [x] Task: Create data migration/seed function for new schema fields, POIs, and Full Archetype profiles. 8a303d6
2. - [x] Task: Write unit tests for Passive Perception (seeing nearby agents) and Weather-based speed multipliers. 7ede330
3. - [x] Task: Implement 'Safety Layer' with Narrative Survival and Social Handshaking (Talking/Listening states). 2ba23ea
4. - [x] Task: Implement Passive Perception logic to record proximity sightings in the sensory buffer. 2ba23ea
5. - [x] Task: Implement movement advance logic with weather multipliers and "Arrival" events. 2ba23ea
6. - [x] Task: Refactor and verify test coverage (>80%). 7fae67f

## Phase 1.1: POI & Feedback UI
1. - [ ] Task: Create `POISprite.ts` to render fixed locations.
2. - [ ] Task: Update `AgentSprite.ts` to render speech bubbles and action icons.

## Phase 2: RAG Context & Identity Evolution
1. - [ ] Task: Write unit tests for full-archetype context building and re-ranked memory retrieval.
2. - [ ] Task: Update `tick` to fetch `affinity`, `bio`, and `inventory` for context payload.
3. - [ ] Task: Modify AI decision prompt to use compressed evolution context.
4. - [ ] Task: Refactor and verify test coverage (>80%).
5. - [ ] Task: Conductor - User Manual Verification 'Phase 2: RAG & Evolution' (Protocol in workflow.md)

## Phase 3: Reflection & Memory Encoding
1. - [ ] Task: Write unit tests for reflection, importance scoring, and relationship delta logic.
2. - [ ] Task: Implement `reflect` action to summarize events into `coreTraits` and encode high-importance memories.
3. - [ ] Task: Update tick to trigger reflection every 24 simulated hours with staggered jitter.
4. - [ ] Task: Refactor and verify test coverage (>80%).

## Phase 4: World State & Final Integration
1. - [ ] Task: Write unit tests for world-state advancement logic using `TIME_SCALE`.
2. - [ ] Task: Implement automatic `timeOfDay` increment and stochastic `weather` transitions.
3. - [ ] Task: Final integration testing of the complete decision loop.
4. - [ ] Task: Refactor and verify test coverage (>80%).

## Phase 5: Master Controls & Admin API
1. - [ ] Task: Create `world:admin` functions for `manualTick`, `manualReflect`, and `resetAgentBrain`.
2. - [ ] Task: Implement TanStack Start Server Functions (`createServerFn`) to bridge these to the UI.
3. - [ ] Task: Conductor - User Manual Verification 'Phase 5: God Mode API' (Protocol in workflow.md)
