/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

/**
 * Integration tests for ai_helpers Convex actions.
 * These tests cover the no-API-key fallback paths and edge cases.
 */

test("embed action returns random embedding when no API key", async () => {
  const t = convexTest(schema, modules);

  const result = await t.action(api.functions.ai_helpers.embed, {
    text: "Hello",
  });

  // Should return a 768-dimensional array with random values
  expect(Array.isArray(result)).toBe(true);
  expect(result).toHaveLength(768);
  // Values should be numbers between 0 and 1 (from Math.random())
  for (const val of result) {
    expect(typeof val).toBe("number");
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(1);
  }
});

test("batchEmbed action returns empty array for empty input", async () => {
  const t = convexTest(schema, modules);

  const result = await t.action(api.functions.ai_helpers.batchEmbed, {
    texts: [],
  });

  expect(result).toEqual([]);
});

test("batchEmbed returns fallback embeddings when no API key", async () => {
  const t = convexTest(schema, modules);

  const result = await t.action(api.functions.ai_helpers.batchEmbed, {
    texts: ["Hello", "World"],
  });

  // Should return fallback embeddings (random 768-dim arrays)
  expect(result).toHaveLength(2);
  expect(result[0]).toHaveLength(768);
  expect(result[1]).toHaveLength(768);
  for (const val of result[0]) {
    expect(typeof val).toBe("number");
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(1);
  }
});

test("listModels returns error when no API key", async () => {
  const t = convexTest(schema, modules);

  const result = await t.action(api.functions.ai_helpers.listModels, {});

  expect(result).toHaveProperty("models");
  expect(result).toHaveProperty("error");
  expect(result.models).toEqual([]);
  expect(result.error).toBe("No API key configured");
});

test("listModels returns models when API key is set (OpenAI-compatible)", async () => {
  const t = convexTest(schema, modules);

  const mockModels = {
    data: [
      { id: "gpt-4", owned_by: "openai" },
      { id: "gpt-3.5-turbo", owned_by: "openai" },
    ],
  };
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockModels,
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const result = await t.action(api.functions.ai_helpers.listModels, {});

  expect(result.error).toBeUndefined();
  expect(result.provider).toBe("openai-compatible");
  expect(result.models).toHaveLength(2);
  expect(result.models[0].id).toBe("gpt-4");
  expect(result.models[1].id).toBe("gpt-3.5-turbo");
});

test("listModels supports filtering models by name", async () => {
  const t = convexTest(schema, modules);

  const mockModels = {
    data: [
      { id: "gpt-4", owned_by: "openai" },
      { id: "gpt-3.5-turbo", owned_by: "openai" },
      { id: "text-embedding-3-small", owned_by: "openai" },
    ],
  };
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockModels,
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const result = await t.action(api.functions.ai_helpers.listModels, {
    filter: "gpt-4",
  });

  expect(result.models).toHaveLength(1);
  expect(result.models[0].id).toBe("gpt-4");
});

test("chat with model override picks correct model from config", async () => {
  const t = convexTest(schema, modules);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "Hello from custom model!" } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  const response = await t.action(api.functions.ai_helpers.chat, {
    message: "Hello",
    archetype: "builder",
    model: "custom-model-v2",
  });

  expect(response.content).toBe("Hello from custom model!");
});
