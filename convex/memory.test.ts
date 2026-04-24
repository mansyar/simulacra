import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("sensory buffer stores events and limits to 10", async () => {
  const t = convexTest(schema, modules);
  
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Agent 1",
    archetype: "builder",
    gridX: 0,
    gridY: 0,
  });
  
  // Add 12 events
  for (let i = 0; i < 12; i++) {
    await t.mutation(api.functions.memory.addEvent, {
      agentId,
      type: "movement",
      description: `Event ${i}`,
      gridX: i,
      gridY: i,
    });
  }
  
  const events = await t.query(api.functions.memory.getEvents, { agentId });
  
  // Should only have 10 events
  expect(events).toHaveLength(10);
  // Should be the latest 10 (Event 2 to Event 11)
  expect(events[0].description).toBe("Event 2");
  expect(events[9].description).toBe("Event 11");
});

test("semantic memory storage and retrieval", async () => {
  const t = convexTest(schema, modules);
  
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Agent 1",
    archetype: "builder",
    gridX: 0,
    gridY: 0,
  });
  
  // This should fail because functions/memory.ts doesn't have these yet
  await t.action(api.functions.memory.addSemanticMemory, {
    agentId,
    content: "I love building houses.",
  });
  
  const results = await t.action(api.functions.memory.searchSemanticMemory, {
    agentId,
    query: "building",
  });
  
  expect(results).toHaveLength(1);
  expect(results[0].content).toBe("I love building houses.");
});
