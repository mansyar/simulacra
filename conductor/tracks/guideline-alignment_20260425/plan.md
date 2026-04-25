# Implementation Plan: Guideline Alignment and Archetype Migration

### Phase 1: Documentation and Schema (The Foundation) [checkpoint: e200693]
1.  - [x] Task: Update `conductor/product-guidelines.md` sleep mode section to match `convex/functions/world.ts` logic. (067df7c)
2.  - [x] Task: Update `convex/schema.ts` to restrict `AgentArchetype` to the 5 primary types. (2435c05)
3.  - [x] Task: Write migration test for existing agents with deprecated archetypes. (2435c05)
4.  - [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md) (e200693)

### Phase 2: AI Brain Upgrade (The Logic) [checkpoint: b6084a2]
1.  - [x] Task: Update `ARCHETYPE_PROMPTS` and `DECISION_SYSTEM_PROMPT` in `convex/functions/ai.ts` to include the 5 primary archetypes and the new JSON schema. (b6084a2)
2.  - [x] Task: Update `decision` action in `convex/functions/ai.ts` to return the full schema (`thought`, `speech`, `confidence`). (b6084a2)
3.  - [x] Task: Update `tick` action in `convex/functions/world.ts` to parse and handle the upgraded AI response. (b6084a2)
4.  - [x] Task: Write unit tests for the new AI decision parsing and agent migration logic. (b6084a2)
5.  - [x] Task: Conductor - User Manual Verification 'Phase 2: AI Brain' (Protocol in workflow.md) (b6084a2)

### Phase 3: Visual and Technical Polish (The Skin)
1.  - [x] Task: Map guideline hex codes to agent archetypes in `src/components/game/AgentSprite.ts`. (b6084a2)
2.  - [x] Task: Update `normalizeAction` in `convex/functions/world.ts` to handle any new action mapping needs. (b6084a2)
3.  - [~] Task: Run full test suite and verify coverage for migration and AI logic.
4.  - [ ] Task: Conductor - User Manual Verification 'Phase 3: Visuals & Polish' (Protocol in workflow.md)