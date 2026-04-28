import { describe, test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Spatial Query: getNearbyAgents", () => {
  async function seedAgents(t: ReturnType<typeof convexTest>) {
    // Create agents at specific positions
    const centerId = await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "Center",
        archetype: "builder",
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
        bio: "Center agent",
        inventory: [],
        currentGoal: "None",
        lastReflectedTick: 0,
        actionStartedAt: Date.now(),
      });
    });

    // Within radius 5 (distance = 3)
    await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "Nearby",
        archetype: "socialite",
        gridX: 13,
        gridY: 10,
        spriteVariant: 1,
        currentAction: "idle",
        hunger: 50,
        energy: 50,
        social: 50,
        coreTraits: [],
        isActive: true,
        lastActiveAt: Date.now(),
        bio: "Nearby agent",
        inventory: [],
        currentGoal: "None",
        lastReflectedTick: 0,
        actionStartedAt: Date.now(),
      });
    });

    // Far outside radius 5 (distance ≈ 14.14)
    await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "FarAgent",
        archetype: "explorer",
        gridX: 20,
        gridY: 20,
        spriteVariant: 2,
        currentAction: "idle",
        hunger: 50,
        energy: 50,
        social: 50,
        coreTraits: [],
        isActive: true,
        lastActiveAt: Date.now(),
        bio: "Far agent",
        inventory: [],
        currentGoal: "None",
        lastReflectedTick: 0,
        actionStartedAt: Date.now(),
      });
    });

    return { centerId };
  }

  test("returns agents within the specified radius using by_position index", async () => {
    const t = convexTest(schema, modules);
    const { centerId } = await seedAgents(t);

    // Fetch center agent to get its gridX/gridY
    const center = await t.run(async (ctx) => {
      return await ctx.db.get(centerId);
    });

    const nearby = await t.query(internal.functions.agents.getNearbyAgents, {
      agentId: centerId,
      gridX: center!.gridX,
      gridY: center!.gridY,
      radius: 5,
    });

    expect(nearby).toHaveLength(1);
    expect(nearby[0].name).toBe("Nearby");
  });

  test("excludes the querying agent from results", async () => {
    const t = convexTest(schema, modules);
    const { centerId } = await seedAgents(t);

    const center = await t.run(async (ctx) => {
      return await ctx.db.get(centerId);
    });

    const nearby = await t.query(internal.functions.agents.getNearbyAgents, {
      agentId: centerId,
      gridX: center!.gridX,
      gridY: center!.gridY,
      radius: 5,
    });

    // Should only return "Nearby", not "Center" itself
    const centerInResults = nearby.find((a: any) => a._id === centerId);
    expect(centerInResults).toBeUndefined();
  });

  test("returns empty array when no agents are nearby", async () => {
    const t = convexTest(schema, modules);
    const { centerId } = await seedAgents(t);

    const center = await t.run(async (ctx) => {
      return await ctx.db.get(centerId);
    });

    // Radius 1 should only match agents at exact same position
    const nearby = await t.query(internal.functions.agents.getNearbyAgents, {
      agentId: centerId,
      gridX: center!.gridX,
      gridY: center!.gridY,
      radius: 1,
    });

    expect(nearby).toHaveLength(0);
  });

  test("agent far outside radius is not included in results", async () => {
    const t = convexTest(schema, modules);
    const { centerId } = await seedAgents(t);

    const center = await t.run(async (ctx) => {
      return await ctx.db.get(centerId);
    });

    const nearby = await t.query(internal.functions.agents.getNearbyAgents, {
      agentId: centerId,
      gridX: center!.gridX,
      gridY: center!.gridY,
      radius: 5,
    });

    // FarAgent is at (20,20), distance from (10,10) ≈ 14.14 > 5
    const farInResults = nearby.find((a: any) => a.name === "FarAgent");
    expect(farInResults).toBeUndefined();
  });
});

describe("Spatial Query: recordPassivePerception optimized", () => {
  test("still detects nearby agents after optimization", async () => {
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

    await t.mutation(internal.functions.agents.recordPassivePerception as any, {
      agentId: agent1Id,
    });

    const events = await t.query(api.functions.memory.getEvents, { agentId: agent1Id });
    const sighting = events.find((e: any) => e.description.includes("saw Bob"));

    expect(sighting).toBeDefined();
    expect(sighting?.type).toBe("movement");
  });
});
