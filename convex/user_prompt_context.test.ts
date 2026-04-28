/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("ai:decision user prompt contains all context sections when API key is set", async () => {
  const t = convexTest(schema, modules);
  process.env.OPENAI_API_KEY = "sk-test-key";

  // Track the API call payload to inspect the user prompt
  let capturedBody: any = null;

  const mockFetch = vi.fn().mockImplementation(async (_url: string, options: any) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "I should explore the area and see what's new.",
              action: "exploring",
              target: "none",
              speech: "",
              confidence: 0.85,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  const result = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 60,
      social: 40,
    },
    nearbyAgents: ["Alice", "Charlie"],
    archetype: "explorer",
    // New structured context args (not yet implemented — test will fail)
    agentContext: [
      "## Your Identity",
      "Name: Bob",
      "Archetype: explorer",
      "Biography: A curious adventurer who loves discovering new places",
      "Traits: adventurous, curious, energetic",
      "Current Goal: Explore every corner of the world",
    ].join("\n"),
    relationshipContext: [
      "## Your Relationships",
      "- You like Alice (affinity: +5.0)",
      "- You are neutral toward Charlie (affinity: +0.0)",
    ].join("\n"),
    events: [
      "## Recent Events",
      "- [<1 min ago] conversation: Alice said hello to you",
      "- [5 min ago] movement: Walked to the town square",
      "- [12 min ago] interaction: Found a shiny rock near the river",
    ].join("\n"),
    memories: [
      "## Relevant Memories",
      "- Remembered the hidden path behind the old oak tree",
      "- Recall that Charlie mentioned a cave to the north",
    ].join("\n"),
  });

  // Verify the user message in the API call contains all expected sections
  const userMessage = capturedBody.messages.find((m: any) => m.role === "user").content;
  expect(userMessage).toContain("## Your Identity");
  expect(userMessage).toContain("## Your State");
  expect(userMessage).toContain("## Your Relationships");
  expect(userMessage).toContain("## Recent Events");
  expect(userMessage).toContain("## Relevant Memories");
  expect(userMessage).toContain("Based on ALL of the above context");
  // Verify sections include actual data
  expect(userMessage).toContain("Bob");
  expect(userMessage).toContain("explorer");
  expect(userMessage).toContain("Hunger: 50");
  expect(userMessage).toContain("Energy: 60");
  expect(userMessage).toContain("Alice");
  expect(userMessage).toContain("Charlie");
  // Verify JSON schema output is in system prompt (not user prompt)
  const systemMessage = capturedBody.messages.find((m: any) => m.role === "system").content;
  expect(systemMessage).toContain("thought");
  expect(systemMessage).toContain("action");

  // Verify the decision result still works
  expect(result).toHaveProperty("thought");
  expect(result).toHaveProperty("action");
  expect(result).toHaveProperty("target");
  expect(result).toHaveProperty("speech");
  expect(result).toHaveProperty("confidence");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});
