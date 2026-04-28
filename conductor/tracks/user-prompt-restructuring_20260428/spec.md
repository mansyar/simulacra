# Specification: User Prompt Restructuring

## Overview
The `contextOverride` parameter currently appends rich agent context (bio, core traits, goal, relationships, recent events, memories) to the *system prompt*, while the user prompt remains bare-bones (`"Agent Name: Bob. State: ... What is your next action?"`). LLMs deprioritize system prompt content and may ignore the rich context. This track moves the rich context into the user message with structured markdown sections and clear instructions.

## Functional Requirements

**FR1 — Remove `contextOverride` from `decision` Action**
- Remove the `contextOverride` parameter from the `decision` action args definition
- Remove all system prompt branching logic that uses `contextOverride` (lines 78-80 in `ai.ts`)
- Update `world.ts` caller to pass the full context via a restructured user prompt approach
- Clean break — no deprecated shim

**FR2 — Restructure User Prompt with Inline Context Sections**
- Replace the bare-bones user prompt with a rich prompt containing structured markdown sections:
  - `## Your Identity` — Name, archetype, bio, core traits, current goal
  - `## Your State` — Hunger, energy, social levels
  - `## Your Relationships` — Sentiment-based relationship descriptions
  - `## Recent Events` — Last 10 sensory events with timestamps (from Track A)
  - `## Relevant Memories` — Retrieved semantic memories (if any)
- Include a concluding instruction: `"Based on ALL of the above context, what is your next action? Consider your personality, relationships, recent experiences, and current state."`

**FR3 — Strip Context References from `DECISION_SYSTEM_PROMPT`**
- Remove any references to "agent's state", "nearby agents", "personality archetype" from the system prompt
- Keep only the JSON output schema definition (`thought`, `action`, `target`, `speech`, `confidence`)
- Rename/update to be purely an output-format specifier

**FR4 — Integration Test**
- Write a full integration test:
  - Create an agent with bio, traits, goal, relationships, and events
  - Call `decision` action with mock API key
  - Inspect API call to verify all context sections appear in the user prompt

## Acceptance Criteria

- [ ] `contextOverride` parameter removed from `decision` action args
- [ ] All system prompt branching for `contextOverride` removed
- [ ] `DECISION_SYSTEM_PROMPT` contains ONLY the JSON output schema (no context references)
- [ ] User prompt contains `## Your Identity`, `## Your State`, `## Your Relationships`, `## Recent Events`, `## Relevant Memories` sections
- [ ] User prompt concludes with an explicit instruction to use all context sections
- [ ] World tick calls `decision` without `contextOverride` — rich context is embedded in user message
- [ ] Integration test verifies all context sections appear in the decision prompt
- [ ] All 196+ existing tests still pass

## Out of Scope
- Changing archetype prompt handling or always-including it in the system prompt (Track C)
- Adding relationship instructions to `DECISION_SYSTEM_PROMPT` (Track C)
- Any changes to the mock branch of `decision` (no-API-key fallback)
- Refactoring `ARCHETYPE_PROMPTS` storage or format
