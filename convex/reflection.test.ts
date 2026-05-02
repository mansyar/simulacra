import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("reflect synthesizes events into traits and memories", async () => {
  const t = convexTest(schema, modules);
  
  const agentId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Reflector",
      archetype: "philosopher",
      gridX: 0,
      gridY: 0,
      spriteVariant: 0,
      currentAction: "idle",
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: ["thoughtful"],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "A test agent.",
      inventory: [],
      currentGoal: "Understand reflection.",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
    });
  });

  // 1. Add some recent events
  await t.mutation(api.functions.memory.addEvent, {
    agentId,
    type: "conversation",
    description: "I had a deep conversation about the meaning of existence with Plato.",
    gridX: 0,
    gridY: 0,
  });

  // 2. Call reflect (action)
  // This will fail until implemented
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await t.action(api.functions.ai.reflect as any, {
    agentId,
  });

  // 3. Verify coreTraits were updated (Identity Evolution)
  const agent = await t.run(async (ctx) => {
    return await ctx.db.get(agentId);
  });
  expect(agent?.coreTraits.length).toBeGreaterThan(1);

  // 4. Verify a high-importance memory was created
  const memories = await t.run(async (ctx) => {
    return await ctx.db.query("memories").withIndex("by_agent", (q) => q.eq("agentId", agentId)).collect();
  });
  expect(memories.some(m => m.importance > 5)).toBe(true);
});

test("social interactions affect affinity", async () => {
  const t = convexTest(schema, modules);
  
  const agentAId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Alice",
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

  const agentBId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Bob",
      archetype: "builder",
      gridX: 10,
      gridY: 10,
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

  // 1. Trigger an interaction (normally via world:tick)
  // We'll call an internal mutation to record relationship delta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await t.mutation(internal.functions.relationships.updateRelationship as any, {
    agentAId,
    agentBId,
    delta: 10,
  });

  const relationships = await t.run(async (ctx) => {
    return await ctx.db.query("relationships").collect();
  });
  
  expect(relationships.length).toBeGreaterThan(0);
  expect(relationships[0].affinity).toBeGreaterThan(0);
});
