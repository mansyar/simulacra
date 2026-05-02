import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("getGlobalEvents returns events from all agents", async () => {
  const t = convexTest(schema, modules);
  
  const agent1Id = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Agent 1",
      archetype: "builder",
      gridX: 0,
      gridY: 0,
      spriteVariant: 1,
      currentAction: "idle",
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

  const agent2Id = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Agent 2",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
      spriteVariant: 0,
      currentAction: "idle",
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

  await t.mutation(api.functions.memory.addEvent, {
    agentId: agent1Id,
    type: "movement",
    description: "Agent 1 moved",
    gridX: 1,
    gridY: 1,
  });

  await t.mutation(api.functions.memory.addEvent, {
    agentId: agent2Id,
    type: "conversation",
    description: "Agent 2 talked",
    gridX: 10,
    gridY: 10,
  });

  const globalEvents = await t.query(api.functions.memory.getGlobalEvents, { limit: 10 });
  
  expect(globalEvents.length).toBe(2);
  expect(globalEvents[0].description).toBe("Agent 2 talked"); // Most recent first
  expect(globalEvents[1].description).toBe("Agent 1 moved");
});
