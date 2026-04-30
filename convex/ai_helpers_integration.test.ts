/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

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
