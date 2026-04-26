# Implementation Plan: Fluid Agent Movement

## Phase 1: Foundation (Noise & State)
- [x] Task: Integrate Simplex Noise library (175d8e3)
    - [x] Add `simplex-noise` to dependencies
    - [x] Create `src/lib/noise.ts` utility wrapper
- [ ] Task: Extend `AgentSprite` state for visual offsets
    - [ ] Add `visualX/Y` offsets to `AgentSprite` class
    - [ ] Add `estimatedGridX/Y` for path prediction
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

## Phase 2: Micro-Wandering
- [ ] Task: Implement Pacing Logic
    - [ ] Write Tests: Verify `AgentSprite` calculates small offsets based on noise when idle
    - [ ] Implement: Use noise to update `visualX/Y` in `AgentSprite.tick`
- [ ] Task: Implement Looking & Shifting
    - [ ] Write Tests: Verify sprite flipping and vertical bounce triggers
    - [ ] Implement: Apply scaling/flipping transforms in `AgentSprite.tick`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Micro-Wandering' (Protocol in workflow.md)

## Phase 3: Interpolated Goal-Seeking
- [ ] Task: Implement Time-Synced Prediction
    - [ ] Write Tests: Verify `estimatedGridX/Y` moves towards target at calculated velocity
    - [ ] Implement: Logic to update `estimatedGridX/Y` based on `tickInterval`
- [ ] Task: Implement Smooth Course Correction
    - [ ] Write Tests: Verify position blending when backend data diverges from estimate
    - [ ] Implement: 500ms lerp/blend in `updateAgentData`
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Goal-Seeking' (Protocol in workflow.md)

## Phase 4: Integration & Optimization
- [ ] Task: Verify Multi-Agent Performance
    - [ ] Write Tests: Stress test with 50+ moving agents for FPS drops
    - [ ] Implement: Optimize noise calls (e.g. throttle calculation frequency)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration' (Protocol in workflow.md)
