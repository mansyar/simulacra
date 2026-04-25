import { test, expect } from "vitest";
import { convexTest } from "convex-test";
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
