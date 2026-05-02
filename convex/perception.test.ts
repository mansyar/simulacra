import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("passive perception records nearby agents", async () => {
  const t = convexTest(schema, modules);
  
  const agent1Id = await t.run(async (ctx) => {
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
      bio: "Alice bio",
      inventory: [],
      currentGoal: "None",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
    });
  });

  await t.run(async (ctx) => {
    return await ctx.db.insert("agents", {
      name: "Bob",
      archetype: "builder",
      gridX: 12, // Within radius 5
      gridY: 10,
      spriteVariant: 1,
      currentAction: "idle",
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: [],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "Bob bio",
      inventory: [],
      currentGoal: "None",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
    });
  });

  // We need to implement a 'recordPassivePerception' internal mutation or similar
  // For now, this test will fail until implemented.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await t.mutation(internal.functions.perception.recordPassivePerception as any, {
    agentId: agent1Id,
  });

  const events = await t.query(api.functions.memory.getEvents, { agentId: agent1Id });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sighting = events.find((e: any) => e.description.includes("saw Bob"));
  
  expect(sighting).toBeDefined();
  expect(sighting?.type).toBe("movement");
});
