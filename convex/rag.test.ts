import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("buildAgentContext combines archetype and identity", async () => {
  const t = convexTest(schema, modules);
  
  // 1. Seed archetypes
  await t.mutation(api.functions.seed.world, {});

  // 2. Insert an agent
  const agentId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Socrates",
      archetype: "philosopher",
      gridX: 0,
      gridY: 0,
      spriteVariant: 0,
      currentAction: "idle",
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: ["wise", "curious"],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "Founder of Western philosophy.",
      inventory: ["scroll"],
      currentGoal: "Discover truth.",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
    });
  });

  // 3. Call buildAgentContext (internal query)
  const context = await t.query(internal.functions.ai.buildAgentContext as any, {
    agentId,
  });

  expect(context).toContain("Socrates");
  expect(context).toContain("philosopher");
  expect(context).toContain("Founder of Western philosophy");
  expect(context).toContain("wise, curious");
  expect(context).toContain("Discover truth");
});

test("retrieveMemories returns relevant results", async () => {
  const t = convexTest(schema, modules);
  
  const agentId = await t.run(async (ctx) => {
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

  // 1. Add some memories (events that will be summarized/reflected later)
  // Actually, retrieveMemories usually queries the 'memories' table (vector indexed)
  // We'll insert a mock memory
  await t.run(async (ctx) => {
    await ctx.db.insert("memories", {
      agentId,
      content: "I met Bob near the fountain and we discussed the weather.",
      embedding: new Array(768).fill(0.1), // Mock embedding
      importance: 5,
      type: "reflection",
      timestamp: Date.now(),
      tags: ["social"],
    });
  });

  // 2. Call retrieveMemoriesAction
  const results = await t.action(api.functions.memory.retrieveMemoriesAction, {
    agentId,
    query: "Who did I meet?",
    limit: 5,
  });

  expect(results.length).toBeGreaterThan(0);
  expect(results[0].content).toContain("Bob");
});
