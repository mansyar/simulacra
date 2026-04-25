import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("world state query and mutation", async () => {
  const t = convexTest(schema, modules);
  
  // Seed world state
  await t.mutation(api.functions.seed.agents, {});

  const state = await t.query(api.functions.world.getState, {});
  expect(state).toBeDefined();
  expect(state?.weather).toBe("sunny");

  await t.mutation(api.functions.world.updateState, {
    weather: "rainy",
  });

  const updatedState = await t.query(api.functions.world.getState, {});
  expect(updatedState?.weather).toBe("rainy");
});

test("world tick updates agents needs and triggers decisions", async () => {
  const t = convexTest(schema, modules);
  
  // Seed world state and agents
  await t.mutation(api.functions.seed.agents, {});
  
  const agentsBefore = await t.query(api.functions.agents.getAll, {});
  const agentId = agentsBefore[0]._id;

  // Run tick
  const result = await t.action(api.functions.world.tick, {});
  expect(result.success).toBe(true);

  // Verify needs were updated
  const agents = await t.query(api.functions.agents.getAll, {});
  const agent = agents.find(a => a._id === agentId);
  
  // Hunger should increase, Energy should decrease
  expect(agent?.hunger).toBeGreaterThan(50);
  expect(agent?.energy).toBeLessThan(50);

  // Check that events were created with the new format
  const events = await t.query(api.functions.memory.getEvents, { agentId });
  expect(events.length).toBeGreaterThan(0);
  expect(events[0].description).toContain("Thought:");
  expect(events[0].description).toContain("Action:");
});
