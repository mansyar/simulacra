/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
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
      },
      nearbyAgents: [],
      archetype,
    });
    expect(result).toBeTruthy();
  }
});
