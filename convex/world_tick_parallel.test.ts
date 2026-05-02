/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/**
 * Phase 8 Track A: Unbottleneck the World Tick
 *
 * These tests validate the new parallel agent processing with error isolation.
 * They should FAIL with the current code (batched, no error isolation) and
 * PASS after the refactoring (parallel, error-isolated, retry).
 */

test("tick: runs without inter-batch delay when all agents process in parallel", async () => {
  const t = convexTest(schema, modules);

  // Seed 10 agents
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  process.env.OPENAI_API_KEY = "sk-test-key";

  const agents = await t.query(api.functions.agents.getAll, {});
  expect(agents.length).toBe(10);

  // Mock fetch to return immediately for all 10 agents
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: JSON.stringify({
            thought: "Going about my business",
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

  const start = Date.now();
  const result = await t.action(api.functions.world.tick, {});
  const duration = Date.now() - start;

  // Tick should complete without inter-batch delays
  // Current code: 4 batches × (processing time) + 3 × 1000ms delay = ~3s+ delays
  // New code: No delays → completes in < 1500ms
  expect(result.success).toBe(true);
  expect(duration).toBeLessThan(2500);

  // All agents should have been processed (needs updated)
  const updatedAgents = await t.query(api.functions.agents.getAll, {});
  for (const agent of updatedAgents) {
    // Each agent should have had its needs updated (hunger increased from 50)
    expect(agent.hunger).not.toBe(50);
  }

  delete process.env.ENABLE_SLEEP_MODE;
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("tick: remaining 9 agents succeed when 1 agent's processing fails", async () => {
  const t = convexTest(schema, modules);

  // Seed 10 agents
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";

  const agents = await t.query(api.functions.agents.getAll, {});
  expect(agents.length).toBe(10);

  // Mock fetch to fail for the first call (agent 1's decision)
  // but succeed for subsequent calls (agents 2-10)
  let fetchCallCount = 0;
  const mockFetch = vi.fn().mockImplementation(async (_url: string) => {
    fetchCallCount++;
    if (fetchCallCount === 1) {
      // Simulate a network error for the first agent's decision
      throw new Error("Simulated network error for first agent");
    }
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Going about my business",
              action: "idle",
              target: "none",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);
  process.env.OPENAI_API_KEY = "sk-test-key";

  // Run tick — with error isolation this should succeed
  const result = await t.action(api.functions.world.tick, {});

  // The tick should complete successfully
  expect(result.success).toBe(true);
  expect(result.agentCount).toBe(10);

  // At least 9 agents should have had their needs updated
  const updatedAgents = (await t.query(api.functions.agents.getAll, {})) as Doc<"agents">[];
  const succeededAgents = updatedAgents.filter((a) => a.hunger !== 50);
  expect(succeededAgents.length).toBeGreaterThanOrEqual(9);

  delete process.env.ENABLE_SLEEP_MODE;
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("tick: error isolation wrapper does not block normal agent processing", async () => {
  const t = convexTest(schema, modules);

  // Seed 10 agents
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  // No API key — decisions use mock path (no fetch calls needed)

  const agents = await t.query(api.functions.agents.getAll, {});
  expect(agents.length).toBe(10);

  // Run tick — the error isolation try-catch wrapper wraps each processAgent call
  // Under normal conditions, no agent should trigger the catch block
  const result = await t.action(api.functions.world.tick, {});

  // Tick completes successfully with all 10 agents
  expect(result.success).toBe(true);
  expect(result.agentCount).toBe(10);

  // All agents were processed (needs updated from baseline of 50)
  const updatedAgents = (await t.query(api.functions.agents.getAll, {})) as Doc<"agents">[];
   
  const processedAgents = updatedAgents.filter((a) => a.hunger !== 50);
  expect(processedAgents.length).toBe(10);

  // Verify no error/failure events were logged (normal path through error isolation)
  for (const agent of updatedAgents) {
    const events = (await t.query(api.functions.memory.getEvents, { agentId: agent._id })) as Doc<"events">[];
     
    const errorEvents = events.filter((e) =>
      e.description.toLowerCase().includes("error") ||
      e.description.toLowerCase().includes("fail") ||
      e.description.toLowerCase().includes("skip")
    );
    expect(errorEvents.length).toBe(0);
  }

  delete process.env.ENABLE_SLEEP_MODE;
  vi.unstubAllGlobals();
});

test("tick: one agent failure does not block remaining agents", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  // Use mock decisions (no API key) so no fetch calls are made

  const agents = await t.query(api.functions.agents.getAll, {});
  expect(agents.length).toBe(10);

  // Delete the config table to cause failures for all agents' buildFullContext
  // This simulates a scenario where processAgent encounters a runtime error
  // Note: This only tests that the error isolation wrapper can handle errors
  // gracefully; in practice the wrapper catches any unexpected throw from processAgent
  await t.run(async (ctx) => {
    const configs = await ctx.db.query("config").collect();
    for (const cfg of configs) {
      await ctx.db.delete(cfg._id);
    }
  });

  // Run tick — error isolation should catch individual agent failures
  const result = await t.action(api.functions.world.tick, {});

  // Tick should still complete (error isolation catches individual failures)
  expect(result.success).toBe(true);

  delete process.env.ENABLE_SLEEP_MODE;
  vi.unstubAllGlobals();
});

test("tick: BATCH_SIZE and BATCH_DELAY_MS constants no longer used for processing", async () => {
  const t = convexTest(schema, modules);

  // Seed agents
  await t.mutation(api.functions.seed.agents, { clearExisting: true });
  process.env.ENABLE_SLEEP_MODE = "false";
  process.env.OPENAI_API_KEY = "sk-test-key";

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: JSON.stringify({
            thought: "Doing stuff",
            action: "idle",
            target: "none",
            speech: "",
            confidence: 0.8,
          }),
        },
      }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);

  // With parallel processing of all 10 agents, tick should be fast
  const start = Date.now();
  await t.action(api.functions.world.tick, {});
  const duration = Date.now() - start;

  // No inter-batch delay means 10 agents run in ~parallel
  // Even with retries, this should be well under 3 seconds
  // Current code: at least 3 seconds of delays (3 × 1000ms)
  // New code: no delays (just processing time)
  expect(duration).toBeLessThan(3000);

  delete process.env.ENABLE_SLEEP_MODE;
  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});
