/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { simpleHash, getCachedEmbedding } from "./functions/ai_helpers";

const modules = import.meta.glob("./**/*.ts");

test("batchEmbed returns embeddings in the same order as input texts", async () => {
  const t = convexTest(schema, modules);

  const mockEmbedding1 = new Array(768).fill(0.1);
  const mockEmbedding2 = new Array(768).fill(0.2);
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [
        { embedding: mockEmbedding1 },
        { embedding: mockEmbedding2 },
      ],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const results = await t.action(api.functions.ai_helpers.batchEmbed, {
    texts: ["Hello world", "Goodbye world"],
  });

  expect(results).toHaveLength(2);
  expect(results[0]).toEqual(mockEmbedding1);
  expect(results[1]).toEqual(mockEmbedding2);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("batchEmbed with single text returns same shape as embed", async () => {
  const t = convexTest(schema, modules);

  const mockEmbedding = new Array(768).fill(0.42);
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [{ embedding: mockEmbedding }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const results = await t.action(api.functions.ai_helpers.batchEmbed, {
    texts: ["Single text"],
  });

  expect(results).toHaveLength(1);
  expect(results[0].length).toBe(768);
  expect(results[0]).toEqual(mockEmbedding);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("batchEmbed handles empty texts array", async () => {
  const t = convexTest(schema, modules);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const results = await t.action(api.functions.ai_helpers.batchEmbed, {
    texts: [],
  });

  expect(results).toHaveLength(0);

  delete process.env.OPENAI_API_KEY;
});

test("simpleHash returns consistent hash for same input", () => {
  const hash1 = simpleHash("Hello, world!");
  const hash2 = simpleHash("Hello, world!");
  expect(hash1).toBe(hash2);
});

test("simpleHash returns different hashes for different inputs", () => {
  const hash1 = simpleHash("Hello, world!");
  const hash2 = simpleHash("Goodbye, world!");
  expect(hash1).not.toBe(hash2);
});

test("getCachedEmbedding reuses cached results", async () => {
  const cache = new Map<string, number[]>();
  const mockEmbedding = new Array(768).fill(0.5);
  const fetchFn = vi.fn().mockResolvedValue([mockEmbedding]);

  // First call — should invoke fetchFn
  const result1 = await getCachedEmbedding(cache, "Test query", fetchFn);
  expect(result1).toEqual(mockEmbedding);
  expect(fetchFn).toHaveBeenCalledTimes(1);

  // Second call with same text — should use cache
  const result2 = await getCachedEmbedding(cache, "Test query", fetchFn);
  expect(result2).toEqual(mockEmbedding);
  expect(fetchFn).toHaveBeenCalledTimes(1); // Still only 1 call
});

test("getCachedEmbedding cache is ephemeral (fresh cache = fresh fetch)", async () => {
  const cache1 = new Map<string, number[]>();
  const cache2 = new Map<string, number[]>();
  const mockEmbedding = new Array(768).fill(0.5);
  const fetchFn = vi.fn().mockResolvedValue([mockEmbedding]);

  // First cache instance
  await getCachedEmbedding(cache1, "Test query", fetchFn);
  expect(fetchFn).toHaveBeenCalledTimes(1);

  // Second cache instance — different Map, should call fetch again
  await getCachedEmbedding(cache2, "Test query", fetchFn);
  expect(fetchFn).toHaveBeenCalledTimes(2);
});

test("getCachedEmbedding handles API error gracefully", async () => {
  const cache = new Map<string, number[]>();
  const fetchFn = vi.fn().mockRejectedValue(new Error("API Error"));

  await expect(
    getCachedEmbedding(cache, "Test query", fetchFn)
  ).rejects.toThrow("API Error");
});

test("batchEmbed handles API error gracefully", async () => {
  const t = convexTest(schema, modules);

  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    text: async () => "API Error",
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const results = await t.action(api.functions.ai_helpers.batchEmbed, {
    texts: ["Hello", "World"],
  });

  // Should return mock fallbacks on error
  expect(results).toHaveLength(2);
  expect(results[0].length).toBe(768);
  expect(results[1].length).toBe(768);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});
