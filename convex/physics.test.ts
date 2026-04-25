import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("updateNeeds applies action-based deltas", async () => {
  const t = convexTest(schema, modules);
  
  const agentId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Test Agent",
      archetype: "builder",
      gridX: 0,
      gridY: 0,
      spriteVariant: 1,
      currentAction: "working",
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: [],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "",
      inventory: [],
      currentGoal: "",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
    });
  });

  await t.mutation(internal.functions.agents.updateNeeds, {
    agentId,
  });

  const agent = await t.run(async (ctx) => {
    return await ctx.db.get(agentId);
  });

  // working: hunger +5, energy -5, social -2
  expect(agent?.hunger).toBe(55);
  expect(agent?.energy).toBe(45);
  expect(agent?.social).toBe(48);
});

test("movement resolution applies weather multipliers", async () => {
  const t = convexTest(schema, modules);
  
  const agentId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Mover",
      archetype: "explorer",
      gridX: 0,
      gridY: 0,
      targetX: 10,
      targetY: 0,
      spriteVariant: 1,
      currentAction: "walking",
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: [],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "",
      inventory: [],
      currentGoal: "",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
    });
  });

  // Stormy weather = 0.5x multiplier. AGENT_SPEED = 2.
  // Move distance should be 2 * 0.5 = 1.
  await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 0.5,
  });

  const agent = await t.run(async (ctx) => {
    return await ctx.db.get(agentId);
  });

  expect(agent?.gridX).toBe(1);
  expect(agent?.gridY).toBe(0);

  // Sunny weather = 1.0x multiplier. Move distance should be 2.
  // New position should be 1 + 2 = 3.
  await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 1.0,
  });

  const agent2 = await t.run(async (ctx) => {
    return await ctx.db.get(agentId);
  });

  expect(agent2?.gridX).toBe(3);
});
