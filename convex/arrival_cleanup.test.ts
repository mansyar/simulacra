/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("resolveMovement snaps and clears targets when distance < 0.1", async () => {
  const t = convexTest(schema, modules);
  
  // Create agent at (10, 10) with target at (10.05, 10.05)
  // Distance is sqrt(0.05^2 + 0.05^2) = 0.0707 < 0.1
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Snapper",
    archetype: "explorer",
    gridX: 10,
    gridY: 10,
  });
  
  await t.mutation(internal.functions.agents.updateAction, {
    agentId,
    action: "walking",
    targetX: 10.05,
    targetY: 10.05,
  });

  const result = await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 1,
  });

  expect(result).toBeDefined();
  expect(result!.arrived).toBe(true);
  
  const agent = await t.query(api.functions.agents.getById, { agentId });
  // Should snap to exact target
  expect(agent?.gridX).toBe(10.05);
  expect(agent?.gridY).toBe(10.05);
  // Should clear targets
  expect(agent?.targetX).toBeUndefined();
  expect(agent?.targetY).toBeUndefined();
});

test("resolveMovement clears targets when ratio === 1 (arrival by move)", async () => {
  const t = convexTest(schema, modules);
  
  // Create agent at (0, 0) with target at (2, 2)
  // Default speed is 6. With multiplier 1, moveDistance is 6.
  // Distance is sqrt(2^2 + 2^2) = 2.82.
  // ratio = min(1, 6 / 2.82) = 1.
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Walker",
    archetype: "explorer",
    gridX: 0,
    gridY: 0,
  });
  
  await t.mutation(internal.functions.agents.updateAction, {
    agentId,
    action: "walking",
    targetX: 2,
    targetY: 2,
  });

  const result = await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 1,
  });

  expect(result).toBeDefined();
  expect(result!.arrived).toBe(true);
  expect(result!.newX).toBe(2);
  expect(result!.newY).toBe(2);
  
  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.gridX).toBe(2);
  expect(agent?.gridY).toBe(2);
  // Should clear targets
  expect(agent?.targetX).toBeUndefined();
  expect(agent?.targetY).toBeUndefined();
});
