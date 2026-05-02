import { describe, test, expect, vi } from "vitest";
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

    const nearby = await t.query(internal.functions.perception.getNearbyAgents, {
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

    const nearby = await t.query(internal.functions.perception.getNearbyAgents, {
      agentId: centerId,
      gridX: center!.gridX,
      gridY: center!.gridY,
      radius: 5,
    });

    // Should only return "Nearby", not "Center" itself
     
    const centerInResults = nearby.find((a) => a._id === centerId);
    expect(centerInResults).toBeUndefined();
  });

  test("returns empty array when no agents are nearby", async () => {
    const t = convexTest(schema, modules);
    const { centerId } = await seedAgents(t);

    const center = await t.run(async (ctx) => {
      return await ctx.db.get(centerId);
    });

    // Radius 1 should only match agents at exact same position
    const nearby = await t.query(internal.functions.perception.getNearbyAgents, {
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

    const nearby = await t.query(internal.functions.perception.getNearbyAgents, {
      agentId: centerId,
      gridX: center!.gridX,
      gridY: center!.gridY,
      radius: 5,
    });

    // FarAgent is at (20,20), distance from (10,10) ≈ 14.14 > 5
     
    const farInResults = nearby.find((a) => a.name === "FarAgent");
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

     
    await t.mutation(internal.functions.perception.recordPassivePerception, {
      agentId: agent1Id,
    });

    const events = await t.query(api.functions.memory.getEvents, { agentId: agent1Id });
     
    const sighting = events.find((e) => e.description.includes("saw Bob"));

    expect(sighting).toBeDefined();
    expect(sighting?.type).toBe("movement");
  });
});

/**
 * Phase 8 Track B: Spatial Query Optimization - 50+ agent scaling benchmark.
 * Verifies tick completes within acceptable duration with index-backed queries.
 */
describe("Spatial Query: 50+ Agent Scaling Benchmark", () => {
  test("tick with 50 agents completes within acceptable duration (< 30s)", async () => {
    const t = convexTest(schema, modules);

    // Seed initial 10 agents
    await t.mutation(api.functions.seed.agents, { clearExisting: true });

    // Add 40 more agents (total 50) spread across the 64×64 grid
    const archetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"] as const;
    for (let i = 0; i < 40; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("agents", {
          name: `BenchmarkAgent_${i}`,
          archetype: archetypes[i % archetypes.length],
          gridX: Math.floor(Math.random() * 64),
          gridY: Math.floor(Math.random() * 64),
          spriteVariant: i % 4,
          currentAction: "idle",
          hunger: 50,
          energy: 50,
          social: 50,
          coreTraits: [],
          isActive: true,
          lastActiveAt: Date.now(),
          bio: `Benchmark agent ${i}`,
          inventory: [],
          currentGoal: "Wandering around",
          lastReflectedTick: 0,
          actionStartedAt: Date.now(),
        });
      });
    }

    // Verify 50 agents exist
    const allAgents = await t.query(api.functions.agents.getAll, {});
    expect(allAgents.length).toBeGreaterThanOrEqual(50);

    // Mock fetch to return immediately for LLM calls
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Benchmark processing",
              action: "idle",
              target: "none",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    // Run tick and measure duration
    const start = Date.now();
    const result = await t.action(api.functions.world.tick, {}) as {
      success: boolean;
      agentCount: number;
    };
    const duration = Date.now() - start;

    // Verify tick completed successfully
    expect(result.success).toBe(true);
    expect(result.agentCount).toBeGreaterThanOrEqual(50);

    // Verify all 50 agents had their needs updated (hunger changed from 50)
    const updatedAgents = await t.query(api.functions.agents.getAll, {});
    const processedCount = updatedAgents.filter((a) => a.hunger !== 50).length;
    expect(processedCount).toBeGreaterThanOrEqual(49); // Allow 1 agent failure

    // Assert benchmark: tick with 50 agents must complete within 30 seconds
    console.log(`[BENCHMARK] 50-agent tick completed in ${duration}ms`);
    expect(duration).toBeLessThan(30000);

    delete process.env.ENABLE_SLEEP_MODE;
    delete process.env.OPENAI_API_KEY;
    vi.unstubAllGlobals();
  });
});
