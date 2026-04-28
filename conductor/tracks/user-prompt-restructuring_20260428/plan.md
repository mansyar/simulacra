# Plan: User Prompt Restructuring

**Track ID:** user-prompt-restructuring_20260428

## Phase 1: Restructure User Prompt & Remove contextOverride

### Task 1: Write Integration Test for Context Fields in User Prompt
- [ ] **Sub-task:** Create `convex/user_prompt_context.test.ts` with a full integration test
- [ ] **Sub-task:** Set up an agent with bio, core traits, current goal, relationships, and sensory events
- [ ] **Sub-task:** Call `decision` action with a mock API key to trigger the real prompt path
- [ ] **Sub-task:** Intercept/mock the `chatCompletion` call and assert the user message contains all sections:
    - `## Your Identity` with name, archetype, bio, traits, goal
    - `## Your State` with hunger, energy, social
    - `## Your Relationships` with relationship descriptions
    - `## Recent Events` with event entries
- [ ] **Sub-task:** Assert the user message ends with the concluding instruction to use all context
- [ ] **Sub-task:** Run the test and confirm it fails (Red phase — no implementation yet)

### Task 2: Remove `contextOverride` from `decision` Action
- [ ] **Sub-task:** Remove `contextOverride: v.optional(v.string())` from `decision` action args in `convex/functions/ai.ts`
- [ ] **Sub-task:** Remove the system prompt branching logic at lines 78-80 (the `args.contextOverride ? ... : ...` block)
- [ ] **Sub-task:** Remove the `contextOverride` field from the `decision` call in `convex/functions/world.ts` (line 287)
- [ ] **Sub-task:** Ensure `ARCHETYPE_PROMPTS[args.archetype]` is always appended to the system prompt
- [ ] **Sub-task:** Run the integration test and confirm it still fails (no user prompt restructuring yet)

### Task 3: Restructure User Prompt with Context Sections
- [ ] **Sub-task:** Build the user prompt with structured markdown sections:
    - `## Your Identity` — Name, archetype, bio, core traits, current goal (from `args.agentState`)
    - `## Your State` — Hunger, energy, social levels (from `args.agentState`)
    - `## Your Relationships` — Relationship descriptions (need a new pattern to pass this into `decision`)
    - `## Recent Events` — Sensory events (need a new pattern to pass this into `decision`)
    - `## Relevant Memories` — Retrieved memories (need a new pattern)
- [ ] **Sub-task:** Add optional args to `decision` for passing structured context data: `agentContext`, `relationshipContext`, `events`, `memories`
- [ ] **Sub-task:** Update `world.ts` to build the context data via `buildFullContext` and pass the structured fields to `decision`
- [ ] **Sub-task:** Add the concluding instruction: `"Based on ALL of the above context, what is your next action? Consider your personality, relationships, recent experiences, and current state."`
- [ ] **Sub-task:** Run the integration test and confirm it passes (Green phase)

### Task 4: Strip Context References from `DECISION_SYSTEM_PROMPT`
- [ ] **Sub-task:** Rewrite `DECISION_SYSTEM_PROMPT` to contain ONLY the JSON output schema definition
- [ ] **Sub-task:** Remove sentences referencing "agent's state", "nearby agents", "personality archetype"
- [ ] **Sub-task:** Keep only the JSON format specification with the 5 fields: thought, action, target, speech, confidence
- [ ] **Sub-task:** Run full test suite and confirm all 196+ tests pass

### Phase Completion Verification
- [ ] **Task:** Conductor - User Manual Verification 'Phase 1: Restructure User Prompt & Remove contextOverride' (Protocol in workflow.md)
