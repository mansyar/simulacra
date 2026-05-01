/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("AI decision returns new schema fields", async () => {
  const t = convexTest(schema, modules);
  
  // Call decision with a primary archetype
  const result = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 50,
      social: 50,
      currentAction: "idle",
    },
    nearbyAgents: ["Wendy"],
    archetype: "builder",
  });

  // These should be present in the new schema
  expect(result).toHaveProperty("thought");
  expect(result).toHaveProperty("action");
  expect(result).toHaveProperty("target");
  expect(result).toHaveProperty("speech");
  expect(result).toHaveProperty("confidence");
  expect(typeof result.confidence).toBe("number");
});

test("decision action accepts currentAction in agentState", async () => {
  const t = convexTest(schema, modules);

  const result = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 50,
      social: 50,
      currentAction: "idle",
    },
    nearbyAgents: [],
    archetype: "builder",
  });

  expect(result).toHaveProperty("action");
});

test("buildContextPrompt renders Current Action in ## Your State section", async () => {
  const t = convexTest(schema, modules);

  process.env.OPENAI_API_KEY = "sk-test-key";
  let capturedBody: any = null;

  const mockFetch = vi.fn().mockImplementation(async (_url: string, options: any) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "I should wait.",
              action: "idle",
              target: "none",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Test",
      hunger: 50,
      energy: 50,
      social: 50,
      currentAction: "walking",
    },
    nearbyAgents: [],
    archetype: "builder",
  });

  const userMessage = capturedBody.messages.find((m: any) => m.role === "user").content;

  // The ## Your State section should contain "Current Action"
  const stateSection = userMessage.split("## Your State")[1]?.split("##")[0] || "";
  expect(stateSection).toContain("Current Action");
  // Should render alongside Hunger, Energy, Social
  expect(stateSection).toContain("Hunger");
  expect(stateSection).toContain("Energy");
  expect(stateSection).toContain("Social");
  // Should show the actual action value
  expect(stateSection).toContain("walking");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("buildContextPrompt renders currentAction value alongside needs", async () => {
  const t = convexTest(schema, modules);

  process.env.OPENAI_API_KEY = "sk-test-key";
  let capturedBody: any = null;

  const mockFetch = vi.fn().mockImplementation(async (_url: string, options: any) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Time to rest.",
              action: "sleeping",
              target: "none",
              speech: "",
              confidence: 0.8,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Sleepy",
      hunger: 30,
      energy: 10,
      social: 60,
      currentAction: "sleeping",
    },
    nearbyAgents: [],
    archetype: "builder",
  });

  const userMessage = capturedBody.messages.find((m: any) => m.role === "user").content;
  const stateSection = userMessage.split("## Your State")[1]?.split("##")[0] || "";

  // Verify currentAction renders as a labeled line alongside needs
  expect(stateSection).toMatch(/Current Action: sleeping/);
  expect(stateSection).toMatch(/Hunger: 30/);
  expect(stateSection).toMatch(/Energy: 10/);
  expect(stateSection).toMatch(/Social: 60/);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("AI decision handles all primary archetypes", async () => {
  const t = convexTest(schema, modules);
  const primaryArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"] as const;

  for (const archetype of primaryArchetypes) {
    const result = await t.action(api.functions.ai.decision, {
      agentState: {
        name: "Test",
        hunger: 50,
        energy: 50,
        social: 50,
        currentAction: "idle",
      },
      nearbyAgents: [],
      archetype,
    });
    expect(result).toBeTruthy();
  }
});
