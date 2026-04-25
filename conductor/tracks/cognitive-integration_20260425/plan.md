# Implementation Plan: Cognitive Integration & Memory Loop

## Phase 1: Deterministic Survival Safeguards
1. - [ ] Task: Write unit tests for deterministic survival safeguards in `convex/functions/world.ts`.
2. - [ ] Task: Implement 'Safety Layer' in `tick` function to force 'eating' (Hunger > 80) or 'sleeping' (Energy < 20).
3. - [ ] Task: Refactor and verify test coverage (>80%).
4. - [ ] Task: Conductor - User Manual Verification 'Phase 1: Deterministic Safeguards' (Protocol in workflow.md)

## Phase 2: RAG Context Augmentation
1. - [ ] Task: Write unit tests for memory retrieval logic (Sensory + Semantic).
2. - [ ] Task: Update `tick` action in `convex/functions/world.ts` to fetch last 10 events and top 3 semantic memories.
3. - [ ] Task: Modify AI decision prompt in `convex/functions/ai.ts` to accept and utilize retrieved context.
4. - [ ] Task: Refactor and verify test coverage (>80%).
5. - [ ] Task: Conductor - User Manual Verification 'Phase 2: RAG Context' (Protocol in workflow.md)

## Phase 3: Reflection & Core Traits
1. - [ ] Task: Write unit tests for the reflection action.
2. - [ ] Task: Implement `reflect` internal action to summarize last 24 events into core traits.
3. - [ ] Task: Update world tick or cron to trigger `reflect` every 24 ticks per agent.
4. - [ ] Task: Refactor and verify test coverage (>80%).
5. - [ ] Task: Conductor - User Manual Verification 'Phase 3: Reflection' (Protocol in workflow.md)

## Phase 4: World State & Final Integration
1. - [ ] Task: Write unit tests for world-state awareness (Weather/Time).
2. - [ ] Task: Inject current `weather` and `timeOfDay` into the AI decision prompt.
3. - [ ] Task: Final integration testing of the complete decision loop.
4. - [ ] Task: Refactor and verify test coverage (>80%).
5. - [ ] Task: Conductor - User Manual Verification 'Phase 4: World Awareness' (Protocol in workflow.md)
