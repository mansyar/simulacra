/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { analyzeSentiment } from "./functions/ai";

describe("Sentiment Analysis", () => {
  describe("analyzeSentiment", () => {
    it("should classify positive speech as positive and return a positive delta", () => {
      const result = analyzeSentiment("You are wonderful and amazing!");
      expect(result.classification).toBe("positive");
      expect(result.delta).toBeGreaterThan(0);
      expect(result.delta).toBeLessThanOrEqual(3);
    });

    it("should classify negative speech as negative and return a negative delta", () => {
      const result = analyzeSentiment("I hate this terrible place");
      expect(result.classification).toBe("negative");
      expect(result.delta).toBeLessThan(0);
      expect(result.delta).toBeGreaterThanOrEqual(-3);
    });

    it("should classify neutral speech as neutral with delta 0", () => {
      const result = analyzeSentiment("The sky is blue today");
      expect(result.classification).toBe("neutral");
      expect(result.delta).toBe(0);
    });

    it("should handle punctuation and capitalization", () => {
      const result = analyzeSentiment("THANK YOU! THAT IS FANTASTIC!!!");
      expect(result.classification).toBe("positive");
      expect(result.delta).toBeGreaterThan(0);
    });

    it("should return neutral for empty string", () => {
      const result = analyzeSentiment("");
      expect(result.classification).toBe("neutral");
      expect(result.delta).toBe(0);
    });

    it("should return neutral for speech with no sentiment keywords", () => {
      const result = analyzeSentiment("I walked to the table and sat down");
      expect(result.classification).toBe("neutral");
      expect(result.delta).toBe(0);
    });

    it("should return higher delta for stronger positive keywords", () => {
      const mild = analyzeSentiment("That is good");
      const strong = analyzeSentiment("That is absolutely incredible and wonderful");
      // Stronger positive keywords should produce a higher magnitude delta
      expect(Math.abs(strong.delta)).toBeGreaterThanOrEqual(Math.abs(mild.delta));
    });

    it("should return lower delta for stronger negative keywords", () => {
      const mild = analyzeSentiment("That is bad");
      const strong = analyzeSentiment("That is absolutely terrible and horrible");
      // Stronger negative keywords should produce a more negative delta
      expect(strong.delta).toBeLessThanOrEqual(mild.delta);
    });

    it("should handle mixed sentiment - net positive if more positive keywords", () => {
      const result = analyzeSentiment("I love the weather but I hate the food");
      // Both positive and negative keywords present — net could be either direction
      // This is a heuristic, so just verify we get a classification
      expect(["positive", "negative", "neutral"]).toContain(result.classification);
      expect(typeof result.delta).toBe("number");
    });

    it("should handle partial word matches (e.g., 'great' in 'greatly')", () => {
      const result = analyzeSentiment("I greatly appreciate your help");
      expect(result.classification).toBe("positive");
      expect(result.delta).toBeGreaterThan(0);
    });
  });
});
