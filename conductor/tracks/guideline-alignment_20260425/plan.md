# Implementation Plan: Guideline Alignment and Archetype Migration

### Phase 1: Documentation and Schema (The Foundation)
1.  - [ ] Task: Update `conductor/product-guidelines.md` sleep mode section to match `convex/functions/world.ts` logic.
2.  - [ ] Task: Update `convex/schema.ts` to restrict `AgentArchetype` to the 5 primary types.
3.  - [ ] Task: Write migration test for existing agents with deprecated archetypes.
4.  - [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

### Phase 2: AI Brain Upgrade (The Logic)
1.  - [ ] Task: Update `ARCHETYPE_PROMPTS` and `DECISION_SYSTEM_PROMPT` in `convex/functions/ai.ts` to include the 5 primary archetypes and the new JSON schema.
2.  - [ ] Task: Update `decision` action in `convex/functions/ai.ts` to return the full schema (`thought`, `speech`, `confidence`).
3.  - [ ] Task: Update `tick` action in `convex/functions/world.ts` to parse and handle the upgraded AI response.
4.  - [ ] Task: Write unit tests for the new AI decision parsing and agent migration logic.
5.  - [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Brain' (Protocol in workflow.md)

### Phase 3: Visual and Technical Polish (The Skin)
1.  - [ ] Task: Map guideline hex codes to agent archetypes in `src/components/game/AgentSprite.ts`.
2.  - [ ] Task: Update `normalizeAction` in `convex/functions/world.ts` to handle any new action mapping needs.
3.  - [ ] Task: Run full test suite and verify coverage for migration and AI logic.
4.  - [ ] Task: Conductor - User Manual Verification 'Phase 3: Visuals & Polish' (Protocol in workflow.md)