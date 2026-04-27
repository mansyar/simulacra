# Specification: Track B - Frontend Interaction

## Overview
This track focuses on adding interactive elements to the Simulacra frontend. Users will be able to click on agents to view their detailed state, needs, relationships, and thoughts in a dedicated side panel. Additionally, the Thought Stream will receive filtering improvements.

## Functional Requirements

### 1. Click-to-Select Agent
- **Interactivity:** Make `AgentSprite` interactive so users can click on agents on the PixiJS canvas.
- **Selection State:** The selected agent will be visually highlighted with a **Pulsing Ring** beneath the sprite.
- **Camera Behavior:** The camera will **Smoothly Pan** to center on the selected agent.
- **Routing:** Clicking an agent navigates the app to `/agent/$id`.

### 2. Agent Detail Panel (`/agent/$id`)
- **Layout:** The panel will slide in from the left side and **Overlay the Game Canvas**, partially obscuring the view but maintaining immersion without causing canvas reflows.
- **Content:**
  - Agent identity: name, archetype, bio, core traits.
  - Live-updating needs bars: hunger, energy, social.
  - Current goal and action.
  - Inventory.
  - Relationships list with affinity scores.
  - Recent events/memories specific to this agent.
- **Navigation:** Closing the panel returns the user to the `/` route and clears the selection.

### 3. Thought Stream Improvements
- **Filtering UI:** Implement **Clickable Tags** to quickly filter events by agent name and event type.
- **Auto-scroll:** The stream should automatically scroll to the newest event when new thoughts arrive.
- **Highlighting:** Events associated with the currently selected agent should be visually highlighted in the stream.

## Non-Functional Requirements
- Maintain 60 FPS while the camera pans and the panel slides in.
- UI elements should follow the existing Tailwind CSS + Framer Motion styling (Cozy Observer aesthetic).
- Ensure the detail panel updates in real-time as Convex data changes.

## Out of Scope
- Multi-turn conversations and relationship context in AI prompts (handled in Track C).
- Creating new backend tables or Convex mutations beyond what is needed for UI wiring.