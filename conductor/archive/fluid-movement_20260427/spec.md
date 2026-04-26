# Specification: Fluid Agent Movement

## Overview
This track implements a more "alive" and "continuous" movement system for agents in the Simulacra world. It addresses the "frozen" state of agents between 3-minute ticks by introducing frontend-driven visual autonomy and predictive pathing.

## Functional Requirements
1.  **Micro-Wandering (Idle/Working State)**
    *   Agents in `idle` or `working` actions shall exhibit subtle, non-teleporting visual movement.
    *   Behaviors include:
        *   **Pacing**: Random movement within a ~0.5 tile radius.
        *   **Looking**: Occasional horizontal flipping of the sprite.
        *   **Shifting**: Vertical "breathing" or weight-shifting bounce.
    *   Driven by a **Simplex Noise** generator for organic, non-repetitive motion.

2.  **Interpolated Goal-Seeking (Walking State)**
    *   Agents in `walking` or `exploring` actions shall move continuously between backend updates.
    *   **Time-Synced Velocity**: Frontend calculates speed based on `distance / world_tick_interval` to ensure arrival coincides with the next expected update.
    *   **Seamless Transition**: Movement continues along the current vector even if a backend update is slightly delayed.

3.  **Smooth Course Correction**
    *   When a backend update arrives, if the frontend position differs from the "truth," the sprite shall **blend** its position toward the new coordinate over 500ms instead of snapping.

## Non-Functional Requirements
*   **Performance**: Simplex noise calculations must be lightweight to handle 25+ agents at 60 FPS.
*   **Decoupling**: Visual wandering should not update the `gridX/Y` state in the database.

## Acceptance Criteria
1.  Agents at rest (idle/working) no longer look like static images; they exhibit "breathing" or pacing.
2.  Agents moving to a destination (walking/exploring) appear to move in a single continuous slide across the map rather than 6-unit bursts.
3.  No noticeable "teleportation" or "snapping" occurs when backend updates arrive.
4.  Performance remains stable at 60 FPS.

## Out of Scope
*   Collision avoidance (agents can still walk through each other).
*   Pathfinding around obstacles (movement remains linear/Euclidean).
