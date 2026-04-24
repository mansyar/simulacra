# Specification: Phase 3 - The Brain (LLM Integration + Memory)

## Overview
Implement Phase 3: The Brain, which introduces LLM integration and a memory system for the Simulacra agents. This will allow agents to make generative decisions based on their personality and past experiences, rather than just deterministic needs.

## Functional Requirements
- **LLM Integration:** Integrate OpenAI-compatible API to call LLMs for agent decision making. Prioritized models: Kimi K2.6, Qwen-9b.
- **World Tick:** Implement a Convex Cron job that runs every 60 seconds to process the world state and agent needs.
- **Memory System (Sensory Buffer):** Implement a Tier 1 memory system (Sensory Buffer) storing the last 10 events per agent in a Convex table (`events`).
- **Memory System (Semantic Memory):** Implement a Tier 2 memory system using Convex Vector Index (768 dimensions) to store and retrieve long-term semantic memories.
- **Agent Prompts & Archetypes:** Create personality archetype templates to drive agent behavior. Initial archetypes:
  - Friendly & Outgoing
  - Grumpy & Reclusive
  - Curious & Exploratory
- **Decision Loop:** Connect the LLM to the world tick so agents can make social decisions based on their memory and current state.

## Non-Functional Requirements
- **Performance:** Ensure the world tick efficiently processes agents, leveraging lazy LLM execution (only call when necessary, e.g., interaction radius met).
- **Cost Optimization:** Implement context pruning by using vector search to retrieve only the top 3 most relevant memories.

## Acceptance Criteria
- [ ] OpenAI-compatible API is integrated into Convex actions (`convex/functions/ai.ts`).
- [ ] Convex Cron job for world tick is scheduled and runs every 60 seconds.
- [ ] Sensory buffer correctly stores and limits to the last 10 events per agent.
- [ ] Vector Index is configured and successfully stores/retrieves semantic memories.
- [ ] Agents can make decisions using Kimi K2.6 or Qwen-9b based on their archetype and memories.
- [ ] The LLM returns valid JSON decisions that parse successfully.
- [ ] The full decision cycle runs without errors during the world tick.

## Out of Scope
- Proximity chat and relationships (Phase 4).
- Master panel and weather controls (Phase 5).