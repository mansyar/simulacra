/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("ai:chat returns mock response when API key is missing", async () => {
  const t = convexTest(schema, modules);
  const response = await t.action(api.functions.ai_helpers.chat, {
    message: "Hello",
    archetype: "builder",
  });
  expect(response.content).toContain("[MOCK]");
});

test("ai:chat success path", async () => {
  const t = convexTest(schema, modules);

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "Real AI response" } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const response = await t.action(api.functions.ai_helpers.chat, {
    message: "Hello",
    archetype: "philosopher",
  });

  expect(response.content).toBe("Real AI response");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:chat handles JSON parse error by returning mock", async () => {
  const t = convexTest(schema, modules);

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => { throw new Error("JSON Parse Error"); },
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const response = await t.action(api.functions.ai_helpers.chat, {
    message: "Hello",
    archetype: "socialite",
  });

  expect(response.content).toContain("[MOCK]");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:chat handles non-ok response by returning mock", async () => {
  const t = convexTest(schema, modules);

  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    text: async () => "API Error",
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const response = await t.action(api.functions.ai_helpers.chat, {
    message: "Hello",
    archetype: "explorer",
  });

  expect(response.content).toContain("[MOCK]");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});


test("ai:embed success path", async () => {
  const t = convexTest(schema, modules);

  const mockEmbedding = new Array(768).fill(0.1);
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [{ embedding: mockEmbedding }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const response = await t.action(api.functions.ai_helpers.embed, {
    text: "Hello",
  });

  expect(response).toEqual(mockEmbedding);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:embed handles API error", async () => {
  const t = convexTest(schema, modules);

  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    text: async () => "API Error",
  });
  vi.stubGlobal("fetch", mockFetch);

  process.env.OPENAI_API_KEY = "sk-test-key";

  const response = await t.action(api.functions.ai_helpers.embed, {
    text: "Hello",
  });

  // Should return mock on error
  expect(response.length).toBe(768);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:decision does not retry 429 (chat calls skip 429 backoff)", async () => {
  const t = convexTest(schema, modules);
  process.env.OPENAI_API_KEY = "sk-test-key";

  // Mock fetch to return 429 — chat calls now skip 429 backoff
  const mockFetch = vi.fn()
    .mockResolvedValue({
      status: 429,
      ok: false,
      text: async () => "Rate limit",
    });
  vi.stubGlobal("fetch", mockFetch);

  // Chat calls (ai.decision) use skip429Backoff=true — 429 returned immediately
  // decision's catch block handles the error and falls back to mock response
  const response = await t.action(api.functions.ai.decision, {
    agentState: { name: "Test", hunger: 50, energy: 50, social: 50, currentAction: "idle" },
    nearbyAgents: [],
    archetype: "builder",
  });

  // Fetch was called only once (no 429 retry for chat calls)
  expect(mockFetch).toHaveBeenCalledTimes(1);
  // Decision falls back to mock response on error
  expect(response.action).toBe("idle");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:decision failure after retries", async () => {
  const t = convexTest(schema, modules);
  process.env.OPENAI_API_KEY = "sk-test-key";

  const mockFetch = vi.fn().mockResolvedValue({
    status: 429,
    ok: false,
    text: async () => "Rate limit",
  });
  vi.stubGlobal("fetch", mockFetch);

  vi.spyOn(global, "setTimeout").mockImplementation((callback) => {
    if (typeof callback === "function") callback();
    return 0 as unknown as NodeJS.Timeout;
  });

  const response = await t.action(api.functions.ai.decision, {
    agentState: { name: "Test", hunger: 50, energy: 50, social: 50, currentAction: "idle" },
    nearbyAgents: [],
    archetype: "builder",
  });

  // Should return mock on error after retries
  expect(response.thought).toContain("[MOCK] Rate limited");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("ai:decision handles JSON parse error from API", async () => {
  const t = convexTest(schema, modules);
  process.env.OPENAI_API_KEY = "sk-test-key";

  const mockFetch = vi.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "invalid json" } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  const response = await t.action(api.functions.ai.decision, {
    agentState: { name: "Test", hunger: 50, energy: 50, social: 50, currentAction: "idle" },
    nearbyAgents: [],
    archetype: "builder",
  });

  expect(response.action).toBe("idle");
  expect(response.thought).toBe("I am having trouble thinking clearly.");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});
