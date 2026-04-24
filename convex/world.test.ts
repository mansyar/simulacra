/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("world state query and mutation", async () => {
  const t = convexTest(schema, modules);
  
  // Initial state should be null
  let state = await t.query(api.functions.world.getState);
  expect(state).toBeNull();

  // Create state via mutation
  await t.mutation(api.functions.world.updateState, {
    weather: "rainy",
    timeOfDay: 18,
  });

  state = await t.query(api.functions.world.getState);
  expect(state).toBeTruthy();
  expect(state?.weather).toBe("rainy");
  expect(state?.timeOfDay).toBe(18);
  expect(state?.dayCount).toBe(1); // default value

  // Update existing state
  await t.mutation(api.functions.world.updateState, {
    weather: "sunny",
    dayCount: 2,
  });

  state = await t.query(api.functions.world.getState);
  expect(state?.weather).toBe("sunny");
  expect(state?.dayCount).toBe(2);
  expect(state?.timeOfDay).toBe(18); // unchanged
});

test("world tick updates agents needs and triggers decisions", async () => {
  const t = convexTest(schema, modules);
  
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Agent 1",
    archetype: "builder",
    gridX: 0,
    gridY: 0,
  });
  
  // Initial needs are 50
  let agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.hunger).toBe(50);
  expect(agent?.energy).toBe(50);
  
  // Run world tick
  // This should fail because tick doesn't exist or doesn't do this yet
  await t.action(api.functions.world.tick);
  
  agent = await t.query(api.functions.agents.getById, { agentId });
  // Hunger should increase, Energy should decrease
  expect(agent?.hunger).toBeGreaterThan(50);
  expect(agent?.energy).toBeLessThan(50);
});
