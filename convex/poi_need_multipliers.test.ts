import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("POI Need Multipliers", () => {
  async function setupAgent(t: ReturnType<typeof convexTest>, gridX: number, gridY: number, action: string) {
    return await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "Test Agent", archetype: "builder",
        gridX, gridY, spriteVariant: 1,
        currentAction: action as "idle", // Narrow to a valid action
        hunger: 50, energy: 50, social: 50,
        coreTraits: [], isActive: true, lastActiveAt: Date.now(),
        bio: "", inventory: [], currentGoal: "",
        lastReflectedTick: 0, actionStartedAt: Date.now(),
      });
    });
  }

  async function setupPOI(t: ReturnType<typeof convexTest>, name: string, type: string, gridX: number, gridY: number) {
    await t.run(async (ctx) => {
      await ctx.db.insert("pois", { name, description: "", gridX, gridY, type });
    });
  }

  test("eating at Cozy Cafe → hunger delta -40 (×2 of -20, beneficial)", async () => {
    const t = convexTest(schema, modules);
    const agentId = await setupAgent(t, 45, 15, "eating");
    await setupPOI(t, "Cozy Cafe", "cafe", 45, 15);

    await t.mutation(internal.functions.agents.updateNeeds, { agentId });
    const agent = await t.run(async (ctx) => await ctx.db.get(agentId));

    // Baseline hunger delta for eating is -20. With cafe multiplier ×2 (beneficial) → -40
    // 50 - 40 = 10
    expect(agent?.hunger).toBe(10);
  });

  test("working at The Great Library → energy delta -2 (×0.5 of -5, draining)", async () => {
    const t = convexTest(schema, modules);
    const agentId = await setupAgent(t, 32, 32, "working");
    await setupPOI(t, "The Great Library", "library", 32, 32);

    await t.mutation(internal.functions.agents.updateNeeds, { agentId });
    const agent = await t.run(async (ctx) => await ctx.db.get(agentId));

    // Baseline energy delta for working is -5. With library multiplier ×0.5 (draining) → Math.round(-2.5) = -2
    // 50 - 2 = 48
    expect(agent?.energy).toBe(48);
  });

  test("talking at Central Plaza → social delta +20 (×2 of +10, beneficial)", async () => {
    const t = convexTest(schema, modules);
    const agentId = await setupAgent(t, 10, 10, "talking");
    await setupPOI(t, "Central Plaza", "plaza", 10, 10);

    await t.mutation(internal.functions.agents.updateNeeds, { agentId });
    const agent = await t.run(async (ctx) => await ctx.db.get(agentId));

    // Baseline social delta for talking is +10. With plaza multiplier ×2 (beneficial) → +20
    // 50 + 20 = 70
    expect(agent?.social).toBe(70);
  });

  test("exploring at Forest Grove → energy delta -1 (×0.5 of -3, draining, Math.round(-1.5) = -1)", async () => {
    const t = convexTest(schema, modules);
    const agentId = await setupAgent(t, 5, 50, "exploring");
    await setupPOI(t, "Forest Grove", "nature", 5, 50);

    await t.mutation(internal.functions.agents.updateNeeds, { agentId });
    const agent = await t.run(async (ctx) => await ctx.db.get(agentId));

    // Baseline energy delta for exploring is -3. With nature multiplier ×0.5 (draining) → Math.round(-1.5) = -1
    // 50 - 1 = 49
    expect(agent?.energy).toBe(49);
  });

  test("no POI nearby → normal deltas (no change)", async () => {
    const t = convexTest(schema, modules);
    const agentId = await setupAgent(t, 0, 0, "idle");
    // No POIs inserted

    await t.mutation(internal.functions.agents.updateNeeds, { agentId });
    const agent = await t.run(async (ctx) => await ctx.db.get(agentId));

    // idle: hunger +1, energy -1, social -1
    expect(agent?.hunger).toBe(51);
    expect(agent?.energy).toBe(49);
    expect(agent?.social).toBe(49);
  });

  test("non-matching action at POI location → normal deltas", async () => {
    const t = convexTest(schema, modules);
    const agentId = await setupAgent(t, 45, 15, "sleeping"); // sleeping at cafe - no match
    await setupPOI(t, "Cozy Cafe", "cafe", 45, 15);

    await t.mutation(internal.functions.agents.updateNeeds, { agentId });
    const agent = await t.run(async (ctx) => await ctx.db.get(agentId));

    // sleeping at cafe → cafe matches eating, not sleeping → normal deltas
    // sleeping: hunger +1, energy +20, social -2
    expect(agent?.hunger).toBe(51);
    expect(agent?.energy).toBe(70); // becomes 70 (capped at 100, 50+20=70)
    expect(agent?.social).toBe(48);
  });

  test("multiplied values are rounded (e.g., 0.5 × odd → Math.round)", async () => {
    const t = convexTest(schema, modules);
    // Create an agent within 1 tile of a library doing working
    const agentId = await setupAgent(t, 32, 32, "working");
    await setupPOI(t, "The Great Library", "library", 32, 32);

    await t.mutation(internal.functions.agents.updateNeeds, { agentId });
    const agent = await t.run(async (ctx) => await ctx.db.get(agentId));

    // working at library → energy delta -5 × 0.5 = Math.round(-2.5) = -2 (draining)
    // So energy should be 50 - 2 = 48
    expect(agent?.energy).toBe(48);
    // The value should be an integer, no floating point
    expect(Number.isInteger(agent?.energy as number)).toBe(true);
  });
});
