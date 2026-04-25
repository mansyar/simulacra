# Specification: Cognitive Integration & Memory Loop

## Overview
This track implements the "Brain" architecture as defined in the PRD, transforming agents from static entities into context-aware autonomous actors. It introduces a Retrieval-Augmented Generation (RAG) loop, deterministic survival safeguards, and a simulated reflection cycle to consolidate memories into core traits.

## Functional Requirements
1.  **Deterministic Survival Safeguards:**
    *   Implement a "Safety Layer" in the `tick` function.
    *   If `hunger > 80`, bypass LLM and force `action: "eating"`.
    *   If `energy < 20`, bypass LLM and force `action: "sleeping"`.
2.  **RAG Context Augmentation:**
    *   For every tick (where survival isn't forced), retrieve the **last 10 events** from the `events` table (Sensory Buffer).
    *   Perform a vector search to retrieve the **3 most relevant semantic memories** from the `memories` table.
    *   Inject both into the LLM prompt.
3.  **Reflection Layer:**
    *   Implement a `reflect` action that triggers every **24 ticks** (1 simulated day).
    *   The action will summarize the agent's last 24 sensory events and update the `coreTraits` field in the `agents` table.
4.  **World Awareness:**
    *   The `tick` action must fetch the current `weather` and `timeOfDay` from the `world_state` table.
    *   This context must be passed to the LLM so agents can react to environmental changes.

## Non-Functional Requirements
*   **Token Optimization:** Only call the LLM if survival thresholds are NOT met and the agent is not "Idle" (as per PRD Section 6).
*   **Latency:** Ensure vector search and LLM calls for multiple agents are handled efficiently within the Convex action timeout.

## Acceptance Criteria
*   Agents automatically go to eat/sleep when stats are critical without LLM intervention.
*   LLM "thoughts" reflect knowledge of past events (retrieved from memory).
*   Agents' `coreTraits` update every 24 ticks based on their experiences.
*   Agents mention the weather or time in their "speech" or "thoughts" when prompted.

## Out of Scope
*   Multi-agent conversation coordination (Social proximity is handled in Phase 4).
*   Visual UI for the "Memory Graph" (handled in Phase 4/5).
