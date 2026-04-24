# Implementation Plan: Phase 3 - The Brain

## Phase 3: The Brain (LLM Integration + Memory)
- [x] Task: Setup AI Integration and Basic Testing (dadf2c6)
    - [ ] Write failing test for LLM action API integration.
    - [ ] Implement OpenAI-compatible API connection with Kimi K2.6 and Qwen-9b in `convex/functions/ai.ts`.
    - [ ] Implement personality archetype templates (Friendly & Outgoing, Grumpy & Reclusive, Curious & Exploratory) and JSON output parsing.
- [ ] Task: Tier 1 Memory (Sensory Buffer)
    - [ ] Write failing test for sensory buffer storage and cleanup logic.
    - [ ] Implement sensory buffer to store last 10 events per agent in `convex/functions/memory.ts`.
- [ ] Task: Tier 2 Memory (Semantic Memory)
    - [ ] Write failing test for semantic memory vector storage and retrieval.
    - [ ] Configure Convex Vector Index (768 dimensions) for `memoryIndex`.
    - [ ] Implement vector search and storage for semantic memory in `convex/functions/memory.ts`.
- [ ] Task: Decision Loop and World Tick
    - [ ] Write failing test for world tick cron job and decision loop.
    - [ ] Create Convex Cron job for world tick (running every 60 seconds).
    - [ ] Connect LLM to social decisions and deterministic needs.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: The Brain' (Protocol in workflow.md)