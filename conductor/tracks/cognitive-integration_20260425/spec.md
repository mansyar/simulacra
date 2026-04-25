# Specification: Cognitive Integration & Memory Loop

## Overview
This track implements the "Brain" architecture as defined in the PRD, transforming agents from static entities into context-aware autonomous actors. It introduces a Retrieval-Augmented Generation (RAG) loop, Character Backgrounds, Dynamic Metabolism, Narrative Survival, and robust simulation physics to ensure persistent roleplay and high-fidelity autonomous behavior.

## Functional Requirements
1.  **Identity & Social Intelligence (PRD Alignment):**
    *   **Character Bio:** Persistent personality baseline via the `bio` field.
    *   **Full Archetype Injection:** AI prompts include full archetype profiles (Goal Priorities, Interaction Style).
    *   **Relationship Initialization:** Auto-create relationship records with 0 affinity on first meeting.
    *   **Goal Tracking:** Persistent `currentGoal` across multiple ticks.

2.  **Physics, Metabolism & Environment:**
    *   **Action-Based Metabolism:** `energyDelta` and `hungerDelta` calculated based on `currentAction`.
    *   **Dynamic Weather Speed:** Apply movement multipliers based on weather (e.g., Sunny = 1.0x, Stormy = 0.5x, Rainy = 0.8x) to ensure the environment has physical consequences.
    *   **Social Handshaking & Listening:** When Alice talks to Bob, Alice enters `"talking"` and Bob enters `"listening"`. Bob's movement pauses until the interaction ends.
    *   **Movement Resolution:** Advance backend `gridX/Y` toward `targetX/Y` based on `AGENT_SPEED` and weather multipliers.

3.  **Simulation Logic & Perception:**
    *   **Passive Perception:** The `tick` must record sensory events when agents are near each other but not interacting (e.g., "I saw Alice walking nearby"). This populates memories without consuming LLM tokens.
    *   **Mutual Perception:** Record social events for both actor and target agents.
    *   **Arrival & Completion Feedback:** Generate sensory events for arriving at targets and completing actions.

4.  **Administrative API (God Mode):**
    *   **Master Controls:** Implement Server Functions (`createServerFn`) and Convex mutations for `manualTick`, `manualReflect`, and `resetAgentBrain`.
    *   **Architect Panel Support:** These endpoints provide the bridge for the "God Mode" UI mentioned in the PRD.

5.  **Infrastructure & Data Flow:**
    *   **POI Table:** Add `pois` table to store fixed locations (e.g., "Fridge", "Bed", "Library") with coordinates and functionality tags.
    *   **Global Thought Stream:** Implement `getGlobalEvents` query for the world-wide scrolling log UI.
    *   **Structured Thought Storage:** `thought` field in the `events` table.
    *   **Live State Storage:** `lastThought`, `speech`, and `lastSpeechAt` in the `agents` schema.
    *   **Robust AI Parsing:** Validation layer for Llama-3.1 output.

6.  **RAG & Memory Re-ranking:**
    *   **Recency-Weighted Retrieval:** Re-rank vector search results by `timestamp` to prioritize recent significant events.

7.  **Memory Encoding & Reflection:**
    *   **Sensory → Semantic Migration:** AI identifies high-importance events during reflection.
    *   **Trait Distillation:** Update permanent `coreTraits` every 24 simulated hours.

8.  **Performance & API Stability:**
    *   **Request Batching:** Process AI calls in batches of 3 with delays to respect 30 RPM/6K TPM limits.

## Acceptance Criteria
*   Agents move slower during bad weather.
*   Agents record "seeing" others in their sensory buffer without calling the LLM.
*   The "listening" state correctly pauses agents being spoken to.
*   The Master user can manually trigger ticks and reflections via the Admin API.
*   Thought Stream displays a world-wide scrolling log of activities.
