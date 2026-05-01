import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("world state query and mutation", async () => {
  const t = convexTest(schema, modules);
  
  // Seed world state
  await t.mutation(api.functions.seed.agents, {});

  const state = await t.query(api.functions.world.getState, {});
  expect(state).toBeDefined();
  expect(state?.weather).toBe("sunny");

  await t.mutation(api.functions.world.updateState, {
    weather: "rainy",
  });

  const updatedState = await t.query(api.functions.world.getState, {});
  expect(updatedState?.weather).toBe("rainy");
});

test("world tick updates agents needs and triggers decisions", async () => {
  const t = convexTest(schema, modules);
  
  // Seed world state and agents
  await t.mutation(api.functions.seed.agents, {});
  
  const agentsBefore = await t.query(api.functions.agents.getAll, {});
  const agentId = agentsBefore[0]._id;

  // Run tick
  const result = await t.action(api.functions.world.tick, {});
  expect(result.success).toBe(true);

  // Verify needs were updated
  const agents = await t.query(api.functions.agents.getAll, {});
  const agent = agents.find((a) => a._id === agentId);
  
  // Hunger should increase, Energy should decrease
  expect(agent?.hunger).toBeGreaterThan(50);
  expect(agent?.energy).toBeLessThan(50);

  // Check that events were recorded (could be multiple due to perception + decision)
  const events = await t.query(api.functions.memory.getEvents, { agentId });
  expect(events.length).toBeGreaterThan(0);

  const hasDecision = events.some((e) => e.description.includes("Thought:") && e.description.includes("Action:"));
  expect(hasDecision).toBe(true);
});

test("world tick passes currentAction to decision action", async () => {
  const t = convexTest(schema, modules);

  // Seed everything needed for a tick
  await t.mutation(api.functions.seed.agents, {});
  await t.mutation(api.functions.seed.world, {});

  // Run tick - this will fail if currentAction isn't passed to decision
  const result = await t.action(api.functions.world.tick, {});
  expect(result.success).toBe(true);

  // Verify agents have a valid currentAction after processing
  const agents = await t.query(api.functions.agents.getAll, {});
  const validActions = ["idle", "walking", "eating", "sleeping", "talking", "working", "exploring"];
  for (const agent of agents) {
    expect(validActions).toContain(agent.currentAction);
  }
});

test("interaction radius is fetched from config", async () => {
  const t = convexTest(schema, modules);
  
  // 1. Setup: Create two agents at distance 3
  const agentAId = await t.mutation(api.functions.agents.create, {
    name: "Agent A",
    archetype: "socialite",
    gridX: 0,
    gridY: 0,
  });
  await t.mutation(api.functions.agents.create, {
    name: "Agent B",
    archetype: "socialite",
    gridX: 3,
    gridY: 0,
  });

  // 2. Set interaction radius to 2 (should NOT see each other)
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const cfg = await t.query(api.functions.config.get, {});
  await t.run(async (ctx) => {
    await ctx.db.patch(cfg!._id, { interactionRadius: 2 });
  });

  // 3. Record passive perception
  await t.mutation(internal.functions.agents.recordPassivePerception, { agentId: agentAId });

  // 4. Verify no event recorded
  let events = await t.query(api.functions.memory.getEvents, { agentId: agentAId });
  expect(events.length).toBe(0);

  // 5. Set interaction radius to 5 (SHOULD see each other)
  await t.run(async (ctx) => {
    await ctx.db.patch(cfg!._id, { interactionRadius: 5 });
  });

  // 6. Record passive perception
  await t.mutation(internal.functions.agents.recordPassivePerception, { agentId: agentAId });

  // 7. Verify event recorded
  events = await t.query(api.functions.memory.getEvents, { agentId: agentAId });
  expect(events.length).toBe(1);
  expect(events[0].description).toContain("I saw Agent B nearby.");
});
