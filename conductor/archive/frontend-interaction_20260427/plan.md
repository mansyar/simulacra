# Implementation Plan: Track B - Frontend Interaction

## Phase 1: Click-to-Select Agent
- [x] Task: Implement Click Interactivity on AgentSprite c7dca1a
    - [ ] Write failing test for click events on AgentSprite
    - [ ] Make `AgentSprite` interactive (`eventMode: 'static'`) and emit selection events
    - [ ] Ensure tests pass
- [x] Task: Implement Visual Selection State 627d062
    - [ ] Write failing test for selected agent highlighting
    - [ ] Render a pulsing ring beneath the selected agent sprite
    - [ ] Ensure tests pass
- [x] Task: Implement Camera Pan to Selection 8db6561
    - [ ] Write failing test for camera focusing on a target
    - [ ] Implement smooth panning logic to center the camera on the selected agent
    - [ ] Ensure tests pass
- [x] Task: Connect Selection to Routing 364075c
    - [ ] Write failing test for routing on agent click
    - [ ] On click, navigate to `/agent/$id` using TanStack Router
    - [ ] Ensure tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 1: Click-to-Select Agent' (Protocol in workflow.md)

## Phase 2: Agent Detail Panel
- [x] Task: Create /agent/$id Route 364075c
    - [ ] Write failing test for new route component
    - [ ] Define the TanStack route for `/agent/$id`
    - [ ] Implement Framer Motion slide-in animation overlaying the canvas
    - [ ] Ensure tests pass
- [x] Task: Implement Identity and Needs Display a637d59
    - [ ] Write failing test for identity and needs data binding
    - [ ] Fetch agent data from Convex and display name, archetype, bio, core traits
    - [ ] Build and bind live-updating needs bars (hunger, energy, social)
    - [ ] Ensure tests pass
- [x] Task: Implement Inventory and Relationships Display a637d59
    - [ ] Write failing test for inventory and relationships display
    - [ ] Display agent inventory and current goal/action
    - [ ] Render the relationships list with affinity scores
    - [ ] Ensure tests pass
- [x] Task: Implement Event/Memory Stream a637d59
    - [ ] Write failing test for agent-specific event stream
    - [ ] Fetch and display recent events/memories specific to this agent
    - [ ] Ensure tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 2: Agent Detail Panel' (Protocol in workflow.md)

## Phase 3: Thought Stream Improvements [checkpoint: 948c6a1]
- [x] Task: Implement Thought Stream Filtering aa58068
    - [x] Write failing test for Thought Stream filters
    - [x] Add Clickable Tags UI to filter events by agent name and event type
    - [x] Wire up filtering logic to the displayed events
    - [x] Ensure tests pass
- [x] Task: Implement Auto-scroll and Highlighting 3eae042
    - [x] Write failing test for auto-scroll and highlight behavior
    - [x] Auto-scroll the stream to the newest event when new thoughts arrive
    - [x] Visually highlight events associated with the currently selected agent
    - [x] Ensure tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 3: Thought Stream Improvements' (Protocol in workflow.md) 948c6a1

## Phase 4: Review Fixes
- [x] Task: Apply review suggestions f156030