# Specification: Guideline Alignment and Archetype Migration

## Overview
This track focuses on aligning the project's implementation with the established Product Guidelines. This includes updating the documentation to reflect current functional logic (Sleep Mode), migrating the agent system to the 5 primary archetypes defined in the guidelines, and upgrading the AI decision-making schema to support richer interactions.

## Functional Requirements
1.  **Sleep Mode Documentation Sync:**
    *   Update `conductor/product-guidelines.md` to reflect the current 30-second grace period and 30-minute inactivity timeout.
2.  **Agent Archetype Migration:**
    *   Update `convex/schema.ts` to restrict `AgentArchetype` to: `builder`, `socialite`, `philosopher`, `explorer`, `nurturer`.
    *   Remove `friendly`, `grumpy`, and `curious` from the schema and AI prompts.
    *   Update `convex/functions/ai.ts` to include system prompts for the 5 primary archetypes.
    *   Update `src/components/game/AgentSprite.ts` (or relevant color mapping) to use guideline-specified hex codes for these archetypes.
3.  **LLM Schema Upgrade:**
    *   Update `convex/functions/ai.ts` and the `DECISION_SYSTEM_PROMPT` to require: `thought`, `action`, `target`, `speech`, and `confidence`.
    *   Update `convex/functions/world.ts` to handle the new schema fields during the `tick` action.
    *   `speech` should be stored in a new field or event description for display in the UI.
4.  **Targeting Logic:**
    *   Maintain and refine the "Hybrid" targeting system in `convex/functions/world.ts` to clearly distinguish between coordinate-based movement and agent-directed interaction.

## Non-Functional Requirements
*   **Backward Compatibility:** Ensure existing agents in the database are migrated or handled gracefully during the archetype change.
*   **Type Safety:** Update all TypeScript interfaces and Convex schema definitions to match the new 5-archetype set and LLM response structure.

## Acceptance Criteria
*   [ ] `product-guidelines.md` matches the code's sleep mode logic.
*   [ ] The database schema only allows the 5 primary archetypes.
*   [ ] AI decisions return `thought`, `speech`, and `confidence` fields.
*   [ ] Agent sprites render with the correct guideline colors (e.g., Explorer = #228B22).
*   [ ] The simulation `tick` correctly processes the new LLM response structure.

## Out of Scope
*   UI implementation for the "Thought Stream" (Phase 4 task).
*   Advanced logic using the `confidence` score (to be implemented in a future track).