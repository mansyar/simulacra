/**
 * Keyword-based sentiment analysis for agent speech.
 * Classifies speech as positive, negative, or neutral and returns a delta value.
 * Positive keywords → +1 to +3 (intensity-graded)
 * Negative keywords → -1 to -3 (intensity-graded)
 * Neutral (no match) → 0
 */

// Positive keywords grouped by intensity
const POSITIVE_KEYWORDS: [string, number][] = [
  // +3 intensity (strong positive)
  ["wonderful", 3],
  ["amazing", 3],
  ["fantastic", 3],
  ["incredible", 3],
  ["brilliant", 3],
  ["delightful", 3],
  ["magnificent", 3],
  ["splendid", 3],
  ["marvelous", 3],
  ["outstanding", 3],
  ["glorious", 3],
  ["superb", 3],
  ["terrific", 3],
  ["excellent", 3],
  ["perfect", 3],
  // +2 intensity (moderate positive)
  ["love", 2],
  ["great", 2],
  ["happy", 2],
  ["beautiful", 2],
  ["joy", 2],
  ["pleased", 2],
  ["glad", 2],
  ["grateful", 2],
  ["thank", 2],
  ["appreciate", 2],
  ["cheerful", 2],
  ["friendly", 2],
  ["kind", 2],
  ["nice", 2],
  ["lovely", 2],
  ["pleasant", 2],
  // +1 intensity (mild positive)
  ["good", 1],
  ["fine", 1],
  ["okay", 1],
  ["alright", 1],
  ["better", 1],
  ["well", 1],
  ["agree", 1],
  ["yes", 1],
  ["sure", 1],
  ["help", 1],
  ["care", 1],
];

// Negative keywords grouped by intensity
const NEGATIVE_KEYWORDS: [string, number][] = [
  // -3 intensity (strong negative)
  ["terrible", -3],
  ["horrible", -3],
  ["awful", -3],
  ["hate", -3],
  ["despise", -3],
  ["disgusting", -3],
  ["abysmal", -3],
  ["atrocious", -3],
  ["dreadful", -3],
  ["hideous", -3],
  ["vile", -3],
  ["wretched", -3],
  ["miserable", -3],
  // -2 intensity (moderate negative)
  ["bad", -2],
  ["angry", -2],
  ["sad", -2],
  ["upset", -2],
  ["annoyed", -2],
  ["frustrated", -2],
  ["disappointed", -2],
  ["unhappy", -2],
  ["hurt", -2],
  ["lonely", -2],
  ["mean", -2],
  ["cruel", -2],
  // -1 intensity (mild negative)
  ["tired", -1],
  ["bored", -1],
  ["no", -1],
  ["not", -1],
  ["cannot", -1],
  ["can't", -1],
  ["don't", -1],
  ["won't", -1],
  ["maybe", -1],
  ["confused", -1],
  ["uncertain", -1],
  ["sorry", -1],
  ["apologize", -1],
];

/**
 * Normalize speech text: lowercase, strip punctuation
 */
function normalizeSpeech(speech: string): string {
  return speech
    .toLowerCase()
    .replace(/[^\w\s']/g, " ") // Replace punctuation (except apostrophes) with spaces
    .replace(/\s+/g, " ")      // Collapse multiple spaces
    .trim();
}

/**
 * Analyze speech text for sentiment.
 * Returns classification and an affinity delta value.
 */
export function analyzeSentiment(speech: string): {
  classification: "positive" | "negative" | "neutral";
  delta: number;
} {
  if (!speech || speech.trim().length === 0) {
    return { classification: "neutral", delta: 0 };
  }

  const normalized = normalizeSpeech(speech);
  const words = normalized.split(" ");

  let totalDelta = 0;

  // Score positive keywords (use includes for partial word matching)
  for (const [keyword, intensity] of POSITIVE_KEYWORDS) {
    if (words.some((word) => word.includes(keyword))) {
      totalDelta += intensity;
    }
  }

  // Score negative keywords
  for (const [keyword, intensity] of NEGATIVE_KEYWORDS) {
    if (words.some((word) => word.includes(keyword))) {
      totalDelta += intensity; // intensity is already negative
    }
  }

  // Clamp delta to [-3, 3] range
  const delta = Math.max(-3, Math.min(3, totalDelta));

  if (delta > 0) {
    return { classification: "positive", delta };
  } else if (delta < 0) {
    return { classification: "negative", delta };
  } else {
    return { classification: "neutral", delta: 0 };
  }
}
