/// <reference types="vite/client" />
import { describe, it, expect, vi } from "vitest";
import {
  simpleHash,
  getCachedEmbedding,
  ARCHETYPE_PROMPTS,
} from "./functions/ai_helpers";

describe("ai_helpers pure functions", () => {
  describe("simpleHash", () => {
    it("produces stable, deterministic output for the same input", () => {
      const input = "hello world";
      const hash1 = simpleHash(input);
      const hash2 = simpleHash(input);
      expect(hash1).toBe(hash2);
    });

    it("produces different hashes for different inputs", () => {
      const hash1 = simpleHash("hello");
      const hash2 = simpleHash("world");
      expect(hash1).not.toBe(hash2);
    });

    it("handles empty strings", () => {
      const hash = simpleHash("");
      expect(typeof hash).toBe("string");
      expect(hash).toBe("0"); // "" → hash 0 → "0" in base36
    });

    it("handles special characters", () => {
      const hash1 = simpleHash("!@#$%^&*()");
      const hash2 = simpleHash("!@#$%^&*()");
      expect(hash1).toBe(hash2); // deterministic

      const hash3 = simpleHash("日本語");
      expect(typeof hash3).toBe("string");
      expect(hash3.length).toBeGreaterThan(0);
    });

    it("handles very long strings", () => {
      const longStr = "a".repeat(10000);
      const hash = simpleHash(longStr);
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe("getCachedEmbedding", () => {
    it("returns cached value on repeated call", async () => {
      const cache = new Map<string, number[]>();
      const fetchFn = vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]);

      // First call — fetches and caches
      const result1 = await getCachedEmbedding(cache, "test text", fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual([0.1, 0.2, 0.3]);

      // Second call — returns cached value without fetching
      const result2 = await getCachedEmbedding(cache, "test text", fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toEqual([0.1, 0.2, 0.3]);
    });

    it("fetches and caches new embeddings for different texts", async () => {
      const cache = new Map<string, number[]>();
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce([[0.1, 0.2]])
        .mockResolvedValueOnce([[0.3, 0.4]]);

      const result1 = await getCachedEmbedding(cache, "text one", fetchFn);
      expect(result1).toEqual([0.1, 0.2]);

      const result2 = await getCachedEmbedding(cache, "text two", fetchFn);
      expect(result2).toEqual([0.3, 0.4]);

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it("propagates fetch errors", async () => {
      const cache = new Map<string, number[]>();
      const fetchFn = vi.fn().mockRejectedValue(new Error("API Error"));

      await expect(
        getCachedEmbedding(cache, "test", fetchFn),
      ).rejects.toThrow("API Error");
    });
  });

  describe("ARCHETYPE_PROMPTS", () => {
    it("contains prompts for all 5 archetypes", () => {
      expect(ARCHETYPE_PROMPTS).toHaveProperty("builder");
      expect(ARCHETYPE_PROMPTS).toHaveProperty("socialite");
      expect(ARCHETYPE_PROMPTS).toHaveProperty("philosopher");
      expect(ARCHETYPE_PROMPTS).toHaveProperty("explorer");
      expect(ARCHETYPE_PROMPTS).toHaveProperty("nurturer");
    });

    it("each archetype prompt is a non-empty string starting with 'You are a'", () => {
      for (const [key, prompt] of Object.entries(ARCHETYPE_PROMPTS)) {
        expect(typeof prompt).toBe("string");
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toMatch(/^You are (a|an) /);
        expect(prompt.toLowerCase()).toContain(key);
      }
    });
  });
});
