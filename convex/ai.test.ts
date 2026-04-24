import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("ai:chat action calls fetch when API key is present", async () => {
  const t = convexTest(schema, modules);
  
  // Mock fetch
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "Hello from AI!" } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);
  
  // Set API key
  process.env.OPENAI_API_KEY = "sk-test-key";
  
  const response = await t.action(api.functions.ai.chat, {
    message: "Hello",
    archetype: "friendly",
  });
  
  expect(mockFetch).toHaveBeenCalled();
  expect(response.content).toBe("Hello from AI!");
  
  // Clean up
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:decision calls fetch when API key is present", async () => {
  const t = convexTest(schema, modules);
  
  const mockDecision = {
    action: "walking",
    target: "none",
    reasoning: "I want to explore.",
  };
  
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(mockDecision) } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);
  
  process.env.OPENAI_API_KEY = "sk-test-key";
  
  const response = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 50,
      social: 50,
    },
    nearbyAgents: [],
    archetype: "friendly",
  });
  
  expect(mockFetch).toHaveBeenCalled();
  expect(response).toEqual(mockDecision);
  
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:chat returns mock response when API key is missing", async () => {
  const t = convexTest(schema, modules);
  const response = await t.action(api.functions.ai.chat, {
    message: "Hello",
    archetype: "friendly",
  });
  expect(response.content).toContain("[MOCK]");
});

test("ai:decision returns mock response when API key is missing", async () => {
  const t = convexTest(schema, modules);
  const response = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 80, // Should trigger eating mock
      energy: 50,
      social: 50,
    },
    nearbyAgents: [],
    archetype: "friendly",
  });
  expect(response.action).toBe("eating");
});

test("ai:decision returns sleeping mock when energy is low", async () => {
  const t = convexTest(schema, modules);
  const response = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 20, // Should trigger sleeping mock
      social: 50,
    },
    nearbyAgents: [],
    archetype: "friendly",
  });
  expect(response.action).toBe("sleeping");
});

test("ai:decision handles API error", async () => {
  const t = convexTest(schema, modules);
  
  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    text: async () => "API Error",
  });
  vi.stubGlobal("fetch", mockFetch);
  
  process.env.OPENAI_API_KEY = "sk-test-key";
  
  await expect(t.action(api.functions.ai.decision, {
    agentState: { name: "Bob", hunger: 50, energy: 50, social: 50 },
    nearbyAgents: [],
    archetype: "friendly",
  })).rejects.toThrow("AI API error: API Error");
  
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:decision handles JSON parse error", async () => {
  const t = convexTest(schema, modules);
  
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "invalid json" } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);
  
  process.env.OPENAI_API_KEY = "sk-test-key";
  
  const response = await t.action(api.functions.ai.decision, {
    agentState: { name: "Bob", hunger: 50, energy: 50, social: 50 },
    nearbyAgents: [],
    archetype: "friendly",
  });
  
  expect(response.action).toBe("idle");
  expect(response.reasoning).toBe("Error parsing AI response");
  
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:chat handles API error", async () => {
  const t = convexTest(schema, modules);
  
  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    text: async () => "API Error",
  });
  vi.stubGlobal("fetch", mockFetch);
  
  process.env.OPENAI_API_KEY = "sk-test-key";
  
  await expect(t.action(api.functions.ai.chat, {
    message: "Hello",
    archetype: "friendly",
  })).rejects.toThrow("AI API error: API Error");
  
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});
