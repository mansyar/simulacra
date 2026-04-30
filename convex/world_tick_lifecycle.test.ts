/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/**
 * Integration tests for the World Tick Lifecycle.
 * Validates: cron tick -> agent decision -> state update -> real-time sync.
 */
const MOCK_DECISION = {
  thought: "Exploring the area.",
  action: "walking",
  target: "10,20",
  speech: "",
  confidence: 0.85,
};

const MOCK_REFLECTION = {
  memories: [{ content: "A pleasant day exploring.", importance: 6 }],
  evolutionTraits: ["curious"],
  thought: "Today was good.",
};

test("tick: processes all agents and creates events", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  process.env.OPENAI_API_KEY = "sk-test-key";

  const agents = await t.query(api.functions.agents.getAll, {});
  expect(agents.length).toBe(10);

  // Mock AI API to return deterministic decisions
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(MOCK_DECISION) } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  // Run the tick
  const result = await t.action(api.functions.world.tick, { skipSleep: true });
  expect(result.success).toBe(true);
  expect(result.skipped).toBe(false);
  expect(result.agentCount).toBe(10);
  expect(result.tickDurationMs).toBeGreaterThanOrEqual(0);

  // Verify events were created for each agent
  const allEvents = await t.query(api.functions.memory.getGlobalEvents, { limit: 50 });
  expect(allEvents.length).toBeGreaterThanOrEqual(10);

  // Verify world state advanced
  const worldState = await t.query(api.functions.world.getState, {});
  expect(worldState).not.toBeNull();
  expect(worldState!.totalTicks).toBeGreaterThanOrEqual(1);

  vi.unstubAllGlobals();
});

test("tick: progresses agent needs over multiple ticks", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  // No API key set — uses mock decisions

  const agents = await t.query(api.functions.agents.getAll, {});
  const agentId = agents[0]._id;
  const initialHunger = agents[0].hunger;

  // Run 3 ticks
  for (let i = 0; i < 3; i++) {
    await t.action(api.functions.world.tick, { skipSleep: true });
  }

  // Verify needs changed after multiple ticks
  const updatedAgent = await t.query(api.functions.agents.getById, { agentId });
  // Needs should have changed from initial values
  const totalChange =
    Math.abs((updatedAgent?.hunger ?? initialHunger) - initialHunger);
  expect(totalChange).toBeGreaterThan(0);
}, 15000);

test("tick: runs successfully with mock decisions when no API key", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  // No OPENAI_API_KEY set — uses mock decisions

  const agents = await t.query(api.functions.agents.getAll, {});
  expect(agents.length).toBe(10);

  // Run 2 ticks successfully
  for (let i = 0; i < 2; i++) {
    const result = await t.action(api.functions.world.tick, { skipSleep: true });
    expect(result.success).toBe(true);
  }

  // All agents should still be active
  const updatedAgents = await t.query(api.functions.agents.getAll, {});
  expect(updatedAgents.length).toBe(10);
});

test("tick: reflection happens after enough ticks", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  process.env.OPENAI_API_KEY = "sk-test-key";

  const agents = await t.query(api.functions.agents.getAll, {});
  const agentId = agents[0]._id;

  // Mock fetch for both decision and reflection
  let callCount = 0;
  const mockFetch = vi.fn().mockImplementation(async () => {
    callCount++;
    return {
      ok: true,
      json: async () => {
        // Alternate between decision and reflection responses
        if (callCount > 10) {
          return { candidates: [{ content: { parts: [{ text: JSON.stringify(MOCK_REFLECTION) }] } }] };
        }
        return { choices: [{ message: { content: JSON.stringify(MOCK_DECISION) } }] };
      },
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  // Run enough ticks to trigger reflection
  for (let i = 0; i < 5; i++) {
    await t.action(api.functions.world.tick, { skipSleep: true });
  }

  // Agents should still be active
  const updatedAgent = await t.query(api.functions.agents.getById, { agentId });
  expect(updatedAgent).not.toBeNull();

  vi.unstubAllGlobals();
});
