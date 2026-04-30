/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("POI Arrival Events", () => {
  test("agent reaches POI coordinates → event logged with POI name and action", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];

    // Place the agent very close to Cozy Cafe (45, 15)
    await t.mutation(api.functions.agents.updatePosition, {
      agentId: agent._id, targetX: 44.9, targetY: 14.9,
    });

    // Mock fetch to return walking to Cozy Cafe
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Going to the cafe.",
              action: "walking",
              target: "Cozy Cafe",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    // Run tick — agent will move to Cozy Cafe and arrive
    await t.action(api.functions.world.tick, { skipSleep: true });

    // Check events for POI arrival message
    const events = await t.query(api.functions.memory.getEvents, { agentId: agent._id });
    const poiEvent = events.find((e: { description: string }) =>
      e.description.includes("Arrived at") && e.description.includes("Cozy Cafe")
    );
    expect(poiEvent).toBeDefined();
    expect(poiEvent!.description).toContain("Cozy Cafe");

    vi.unstubAllGlobals();
  });

  test("agent already at POI → 'Already at POI' message", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];

    // Place agent exactly at Cozy Cafe (45, 15)
    await t.mutation(api.functions.agents.updatePosition, {
      agentId: agent._id, targetX: 45, targetY: 15,
    });

    // Already there so needs shouldn't trigger survival

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Already at the cafe.",
              action: "eating",
              target: "Cozy Cafe",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    // Run tick
    await t.action(api.functions.world.tick, { skipSleep: true });

    // Should have an "Already at" event
    const events = await t.query(api.functions.memory.getEvents, { agentId: agent._id });
    const alreadyAtEvent = events.find((e: { description: string }) =>
      e.description.toLowerCase().includes("already at")
    );
    expect(alreadyAtEvent).toBeDefined();

    vi.unstubAllGlobals();
  });
});
