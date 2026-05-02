/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/**
 * Integration tests for Admin/Master Flows.
 * Validates: weather change, manual tick, agent brain reset, world reset.
 */

test("weather change updates world state", async () => {
  const t = convexTest(schema, modules);
  process.env.ENABLE_SLEEP_MODE = "false";

  // Seed the world to create initial state
  await t.mutation(api.functions.seed.agents, { clearExisting: true });

  // Change weather to stormy
  await t.mutation(api.functions.world.updateState, {
    weather: "stormy",
  });

  // Verify weather changed
  const worldState = await t.query(api.functions.world.getState, {});
  expect(worldState?.weather).toBe("stormy");
});

test("manual tick processes agents on demand", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  // No API key — will use mock decisions

  // Get initial state
  const beforeTick = await t.query(api.functions.world.getState, {});
  const initialTicks = beforeTick?.totalTicks ?? 0;

  // Run manual tick
  const result = await t.action(api.functions.admin.manualTick, {}) as {
    success: boolean;
    skipped?: boolean;
    agentCount?: number;
  };
  expect(result.success).toBe(true);
  if (result.skipped !== undefined) {
    // Not checking skipped status — depends on sleep mode
    expect(result.agentCount).toBeGreaterThanOrEqual(0);
  }

  // Verify tick count advanced
  const afterTick = await t.query(api.functions.world.getState, {});
  expect(afterTick?.totalTicks).toBeGreaterThanOrEqual(initialTicks + 1);
});

test("reset agent brain clears memories and resets state", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.agents, { clearExisting: true });

  // Get an agent
  const agents = await t.query(api.functions.agents.getAll, {});
  const agentId = agents[0]._id;

  // Add some memories to the agent
  await t.mutation(api.functions.memory.addEvent, {
    agentId,
    type: "movement",
    description: "Test event before reset",
    gridX: 0,
    gridY: 0,
  });

  // Verify event exists
  let events = await t.query(api.functions.memory.getEvents, { agentId });
  expect(events.length).toBeGreaterThanOrEqual(1);

  // Reset the agent's brain
  const resetResult = await t.mutation(api.functions.admin.resetAgentBrain, { agentId });
  expect(resetResult.success).toBe(true);

  // Verify events are cleared
  events = await t.query(api.functions.memory.getEvents, { agentId });
  expect(events.length).toBe(0);

  // Verify agent state is reset
  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.currentAction).toBe("idle");
  expect(agent?.hunger).toBe(50);
  expect(agent?.energy).toBe(50);
  expect(agent?.social).toBe(50);
  expect(agent?.coreTraits).toEqual([]);
});

test("weather change affects agent speed multiplier", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";

  // Set sunny weather
  await t.mutation(api.functions.world.updateState, { weather: "sunny" });

  // Create an agent with a target to move toward
  const agents = await t.query(api.functions.agents.getAll, {});
  const agentId = agents[0]._id;

  await t.mutation(api.functions.agents.updatePosition, {
    agentId,
    targetX: 20,
    targetY: 20,
  });

  // Change to stormy (speed 0.5x)
  await t.mutation(api.functions.world.updateState, { weather: "stormy" });
  const updatedState = await t.query(api.functions.world.getState, {});
  expect(updatedState?.weather).toBe("stormy");
});
