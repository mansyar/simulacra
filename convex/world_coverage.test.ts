/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("world:checkSleepMode returns early when disabled", async () => {
  const t = convexTest(schema, modules);
  
  // Set env var to false
  process.env.ENABLE_SLEEP_MODE = "false";

  const result = await t.action(api.functions.world.checkSleepMode, {});
  expect(result.sleeping).toBe(false);
  expect(result.reason).toBe("Sleep mode disabled");

  delete process.env.ENABLE_SLEEP_MODE;
});

test("world:updateState creates default state when missing", async () => {
  const t = convexTest(schema, modules);
  
  // Initially no state
  const stateBefore = await t.query(api.functions.world.getState, {});
  expect(stateBefore).toBeNull();

  // Update with partial args
  await t.mutation(api.functions.world.updateState, {
    weather: "rainy"
  });

  const stateAfter = await t.query(api.functions.world.getState, {});
  expect(stateAfter).toBeDefined();
  expect(stateAfter?.weather).toBe("rainy");
  expect(stateAfter?.dayCount).toBe(1); // Default value
});

test("world:tick uses normalizeAction with hallucinations", async () => {
  const t = convexTest(schema, modules);
  process.env.ENABLE_SLEEP_MODE = "false";
  
  await t.mutation(api.functions.seed.agents, {});
  
  // Mock AI decision with hallucinatory action "eat some food"
  const mockDecision = {
    thought: "I'm hungry.",
    action: "eat some food", // Should normalize to "eating"
    target: "none",
    speech: "",
    confidence: 1.0,
  };
  
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(mockDecision) } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);
  process.env.OPENAI_API_KEY = "sk-test-key";

  await t.action(api.functions.world.tick, {});

  const agents = await t.query(api.functions.agents.getAll, {});
  // Check if any agent was set to "eating"
  const anyEating = agents.some((a: any) => a.currentAction === "eating");
  expect(anyEating).toBe(true);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("world:tick parses coordinate targets", async () => {
  const t = convexTest(schema, modules);
  process.env.ENABLE_SLEEP_MODE = "false";
  await t.mutation(api.functions.seed.agents, { clearExisting: true });

  const mockDecision = {
    thought: "I'll go to the center.",
    action: "walking",
    target: "10,20",
    speech: "",
    confidence: 1.0,
  };

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(mockDecision) } }],
    }),
  });
  vi.stubGlobal("fetch", mockFetch);
  process.env.OPENAI_API_KEY = "sk-test-key";

  await t.action(api.functions.world.tick, {});

  const agents = await t.query(api.functions.agents.getAll, {});
   
  const anyAgentAtTarget = agents.some((a: any) => a.targetX === 10 && a.targetY === 20);
  expect(anyAgentAtTarget).toBe(true);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("world:tick updates world state totalTicks", async () => {
  const t = convexTest(schema, modules);
  process.env.ENABLE_SLEEP_MODE = "false";
  await t.mutation(api.functions.seed.agents, {});
  
  const stateBefore = await t.query(api.functions.world.getState, {});
  const ticksBefore = stateBefore?.totalTicks || 0;

  await t.action(api.functions.world.tick, {});

  const stateAfter = await t.query(api.functions.world.getState, {});
  expect(stateAfter?.totalTicks).toBe(ticksBefore + 1);

  delete process.env.ENABLE_SLEEP_MODE;
});
