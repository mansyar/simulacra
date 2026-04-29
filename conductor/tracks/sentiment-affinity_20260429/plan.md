# Implementation Plan: Sentiment-Based Affinity During Conversations

## Phase 1: Sentiment Analysis Helper (~2 hours)

### Task 1.1: Create sentiment analysis function [9f5af85]
- [x] Write tests for keyword-based sentiment classification (positive, negative, neutral, edge cases)
- [x] Implement `analyzeSentiment(speech: string): { classification: 'positive' | 'negative' | 'neutral'; delta: number }` in `convex/functions/ai.ts`
    - Define positive keywords list with intensity weights (+1, +2, +3)
    - Define negative keywords list with intensity weights (-1, -2, -3)
    - Handle punctuation stripping, case normalization
    - Default to neutral (delta: 0) for no-match speech
- [x] Run tests and confirm all pass (Green phase)

- [ ] Task: Conductor - Phase Completion Verification (Protocol in workflow.md)

## Phase 2: Per-Turn Sentiment Integration (~2 hours)

### Task 2.1: Wire sentiment into conversation tick
- [ ] Write tests for per-turn affinity updates during multi-turn conversations (initiation + all subsequent turns use sentiment)
- [ ] In `world.ts` `processAgent()`: after LLM returns `action === "talking"` with a `speech` field, call `analyzeSentiment(speech)` to get the delta
- [ ] Call `updateRelationship(ctx, speakerId, partnerId, delta)` — type is auto-derived from delta sign
- [ ] Run tests and confirm all pass

### Task 2.2: Enhanced valenceHistory (auto-derived from delta)
- [ ] Write tests: verify `updateRelationship` correctly auto-derives "positive"/"negative"/"neutral" entries from delta
- [ ] Verify `valenceHistory` maintains last 5 entries with correct valence types
- [ ] Run tests and confirm all pass

### Task 2.3: Integration verification
- [ ] Write integration test simulating a full multi-turn conversation with sentiment analysis
- [ ] Verify: every turn (including initiation) applies dynamic sentiment-based affinity delta
- [ ] Verify: valenceHistory shows mixed positive/negative/neutral entries across conversation turns
- [ ] Run full test suite and confirm no regressions
- [ ] Run coverage check (target >80%)

- [ ] Task: Conductor - Phase Completion Verification (Protocol in workflow.md)
