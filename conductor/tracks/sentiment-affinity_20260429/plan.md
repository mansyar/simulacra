# Implementation Plan: Sentiment-Based Affinity During Conversations

## Phase 1: Sentiment Analysis Helper (~2 hours)

### Task 1.1: Create sentiment analysis function
- [ ] Write tests for keyword-based sentiment classification (positive, negative, neutral, edge cases)
- [ ] Implement `analyzeSentiment(speech: string): { classification: 'positive' | 'negative' | 'neutral'; delta: number }` in `convex/functions/ai.ts`
    - Define positive keywords list with intensity weights (+1, +2, +3)
    - Define negative keywords list with intensity weights (-1, -2, -3)
    - Handle punctuation stripping, case normalization
    - Default to neutral (delta: 0) for no-match speech
- [ ] Run tests and confirm all pass (Green phase)

### Task 1.2: Sentiment → affinity delta mapping
- [ ] Write tests for affinity delta integration (positive → +1..+3, negative → -1..-3, neutral → 0)
- [ ] Verify delta is applied to the correct relationship (speaker → partner)
- [ ] Run tests and confirm all pass

- [ ] Task: Conductor - Phase Completion Verification (Protocol in workflow.md)

## Phase 2: Per-Turn Sentiment Integration (~2 hours)

### Task 2.1: Wire sentiment into conversation tick
- [ ] Write tests for per-turn affinity updates during multi-turn conversations
- [ ] In `world.ts` `processAgent()`: after LLM returns `action === "talking"` with a `speech` field, call `analyzeSentiment(speech)` to get the delta
- [ ] Call `updateRelationship(ctx, speakerId, partnerId, delta, "conversation_<sentiment>")` for the sentiment-subtyped entry
- [ ] Run tests and confirm all pass

### Task 2.2: Enhanced valenceHistory with sentiment subtypes
- [ ] Write tests for sentiment-subtyped valenceHistory entries ("conversation_positive", "conversation_negative", "conversation_neutral")
- [ ] Verify `valenceHistory` maintains last 5 entries with new sentiment data
- [ ] Run tests and confirm all pass

### Task 2.3: Integration verification
- [ ] Write integration test simulating a full multi-turn conversation with sentiment analysis
- [ ] Verify: initiation adds +2 (existing behavior), subsequent turns add dynamic deltas based on speech content
- [ ] Verify: valenceHistory shows mixed sentiment types across conversation turns
- [ ] Run full test suite and confirm no regressions
- [ ] Run coverage check (target >80%)

- [ ] Task: Conductor - Phase Completion Verification (Protocol in workflow.md)
