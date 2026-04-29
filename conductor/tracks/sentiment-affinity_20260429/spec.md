# Specification: Sentiment-Based Affinity During Conversations

## Overview

Add dynamic sentiment analysis to multi-turn conversations so affinity scores change meaningfully per turn (not just on initiation). When an agent says something positive, the relationship improves; when they say something negative, it worsens. Each conversation turn carries emotional weight.

## Problem Statement

Currently, `updateRelationship` fires with a flat +2 delta **only** when an agent initiates a conversation. Multi-turn conversations don't adjust affinity further, leaving relationships static even after warm or hostile exchanges. The `valenceHistory` isn't updated per-turn either.

## Functional Requirements

### FR1: Speech Sentiment Analysis Helper (`convex/functions/ai.ts`)
- Implement a keyword-based sentiment analysis function that classifies speech text as **positive**, **negative**, or **neutral**
- Positive keywords → affinity delta of **+1 to +3** (gradient based on keyword intensity)
- Negative keywords → affinity delta of **-1 to -3** (gradient based on keyword intensity)
- Neutral speech (no sentiment keywords) → delta of **0**
- The function must handle punctuation, capitalization, and partial word matches

### FR2: Per-Turn Affinity Updates
- After each LLM decision where `action === "talking"`, analyze the `speech` field for sentiment
- Apply the resulting affinity delta to the relationship between the speaking agent and their conversation partner
- This fires on **every turn** of a multi-turn conversation, not just the initiation

### FR3: Enhanced Valence History
- Update `valenceHistory` on every conversation turn (maintaining last 5 entries)
- Each entry should include a sentiment subtype: `"conversation_positive"`, `"conversation_negative"`, or `"conversation_neutral"`
- This enriches the historical data available for AI context building

### FR4: Integration with Existing Systems
- Depends on Track A (bidirectional conversation system) — sentiments need a working bidirectional conversation flow
- Sentiment analysis runs **after** the LLM decision returns a `speech` field, not as a separate API call
- The helper function should be importable by both `world.ts` (for tick-time processing) and test files

## Non-Functional Requirements

- **Performance:** Sentiment analysis must be synchronous and lightweight (keyword lookup only, no additional API calls)
- **Maintainability:** Word lists should be easily extendable (defined as constants at the top of the helper module)
- **Accuracy:** Sentiment classification is a heuristic — false positives/negatives are acceptable as the system is a simulation, not a production NLP pipeline

## Acceptance Criteria

1. [ ] Sentiment analysis function correctly classifies positive, negative, and neutral speech
2. [ ] Positive speech increases affinity by +1 to +3 on each conversation turn
3. [ ] Negative speech decreases affinity by -1 to -3 on each conversation turn
4. [ ] Neutral speech results in 0 affinity change
5. [ ] `valenceHistory` is updated on every turn with sentiment-subtyped entries
6. [ ] Existing conversation system continues to work (no regressions)
7. [ ] No additional API calls are introduced by sentiment analysis

## Out of Scope

- Machine learning / NLP model-based sentiment analysis
- Sentiment analysis for non-conversation actions (monologue, thought text)
- UI for displaying sentiment classification to users
- Adjusting AI decision prompts based on sentiment (future enhancement)
