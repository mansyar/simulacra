import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("agents table has new fields", async () => {
  const t = convexTest(schema, modules);
  
  // Try to insert an agent with all fields, including the new ones
  // This will fail validation if the schema is not updated
  const agentId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Test Agent",
      archetype: "builder",
      gridX: 0,
      gridY: 0,
      spriteVariant: 1,
      currentAction: "idle",
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: ["test"],
      isActive: true,
      lastActiveAt: Date.now(),
      // New fields
      bio: "A test agent biography.",
      inventory: ["wrench"],
      currentGoal: "Building a test structure.",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
      interactionPartnerId: undefined,
      lastThought: "I am a test agent.",
      speech: "Hello world",
      lastSpeechAt: Date.now(),
    } as any); // Use 'any' to bypass TS check for now to prove schema failure
  });

  const agent = await t.run(async (ctx) => {
    return await ctx.db.get(agentId);
  });

  expect(agent).toMatchObject({
    bio: "A test agent biography.",
    inventory: ["wrench"],
    currentGoal: "Building a test structure.",
    lastReflectedTick: 0,
    lastThought: "I am a test agent.",
    speech: "Hello world",
  });
});

test("pois table exists with correct fields", async () => {
  const t = convexTest(schema, modules);

  const poiId = await t.run(async (ctx) => {
    return await ctx.db.insert("pois", {
      name: "The Great Library",
      description: "A place of knowledge.",
      gridX: 32,
      gridY: 32,
      type: "library",
    });
  });

  const poi = await t.run(async (ctx) => {
    return await ctx.db.get(poiId);
  });

  expect(poi).toMatchObject({
    name: "The Great Library",
    gridX: 32,
    gridY: 32,
  });
});

test("AgentAction supports listening state", async () => {
  const t = convexTest(schema, modules);

  const agentId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Listener",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
      spriteVariant: 0,
      currentAction: "listening",
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

  const agent = await t.run(async (ctx) => {
    return await ctx.db.get(agentId);
  });

  expect(agent?.currentAction).toBe("listening");
});

test("admin:resetAgentBrain clears memories and resets agent", async () => {
  const t = convexTest(schema, modules);

  const agentId = await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Old Agent",
      archetype: "builder",
      gridX: 10,
      gridY: 10,
      spriteVariant: 0,
      currentAction: "working",
      hunger: 90,
      energy: 10,
      social: 10,
      coreTraits: ["grumpy"],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "An old bio",
      inventory: ["wrench"],
      currentGoal: "Do work",
      lastReflectedTick: 100,
      actionStartedAt: Date.now(),
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("memories", {
      agentId,
      content: "Old memory",
      embedding: new Array(768).fill(0),
      importance: 5,
      type: "semantic",
      timestamp: Date.now(),
      tags: [],
    });
  });

  // Call resetAgentBrain
  await t.mutation(api.functions.admin.resetAgentBrain, { agentId });

  const agent = await t.run(async (ctx) => {
    return await ctx.db.get(agentId);
  });

  expect(agent?.coreTraits).toEqual([]);
  expect(agent?.hunger).toBe(50);
  expect(agent?.currentGoal).toBe("Starting over.");

  const memories = await t.run(async (ctx) => {
    return await ctx.db.query("memories").withIndex("by_agent", (q) => q.eq("agentId", agentId)).collect();
  });
  expect(memories.length).toBe(0);
});
