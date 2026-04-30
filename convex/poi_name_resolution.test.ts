/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/**
 * Integration tests for POI Name Resolution and Action Override (FR2 + FR3).
 * Tests use the established pattern: mock fetch → call tick() → inspect results.
 */

describe("POI Name Resolution and Action Override", () => {
  test("mock fetch returns walking to Cozy Cafe → agent targetX/Y set to (45, 15)", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];

    // Mock fetch to return "walking to Cozy Cafe"
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Heading to the cafe for some coffee.",
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

    // Run tick — should resolve "Cozy Cafe" to (45, 15)
    const result = await t.action(api.functions.world.tick, { skipSleep: true });
    expect(result.success).toBe(true);

    // Check the agent's target was set to Cozy Cafe coordinates
    const updatedAgent = await t.query(api.functions.agents.getById, { agentId: agent._id });
    // Agent should have targetX=45, targetY=15 (Cozy Cafe's coordinates)
    expect(updatedAgent?.targetX).toBe(45);
    expect(updatedAgent?.targetY).toBe(15);

    vi.unstubAllGlobals();
  });

  test("partial match with includes() → 'Cafe' resolves to Cozy Cafe coords", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Going somewhere.",
              action: "walking",
              target: "Cafe",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await t.action(api.functions.world.tick, { skipSleep: true });
    expect(result.success).toBe(true);

    const updatedAgent = await t.query(api.functions.agents.getById, { agentId: agent._id });
    expect(updatedAgent?.targetX).toBe(45);
    expect(updatedAgent?.targetY).toBe(15);

    vi.unstubAllGlobals();
  });

  test("hallucinated POI name → fallback to random nearby coordinate within 5 tiles, clamped to [0, 63]", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];
    const originalX = agent.gridX;
    const originalY = agent.gridY;

    // Mock fetch with hallucinated action "walking" and hallucinated target "Mega Mall"
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Going to the mall.",
              action: "walking",
              target: "Mega Mall",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await t.action(api.functions.world.tick, { skipSleep: true });
    expect(result.success).toBe(true);

    const updatedAgent = await t.query(api.functions.agents.getById, { agentId: agent._id });
    // Target should be within 5 tiles of original position
    const dx = Math.abs((updatedAgent?.targetX ?? 0) - originalX);
    const dy = Math.abs((updatedAgent?.targetY ?? 0) - originalY);
    expect(dx).toBeLessThanOrEqual(5);
    expect(dy).toBeLessThanOrEqual(5);
    // Target should be clamped to [0, 63]
    expect(updatedAgent?.targetX).toBeGreaterThanOrEqual(0);
    expect(updatedAgent?.targetX).toBeLessThanOrEqual(63);
    expect(updatedAgent?.targetY).toBeGreaterThanOrEqual(0);
    expect(updatedAgent?.targetY).toBeLessThanOrEqual(63);

    vi.unstubAllGlobals();
  });

  test("eating + Cozy Cafe target → action overridden to walking, target set to POI coords", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "I'm hungry, going to eat at the cafe.",
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

    const result = await t.action(api.functions.world.tick, { skipSleep: true });
    expect(result.success).toBe(true);

    const updatedAgent = await t.query(api.functions.agents.getById, { agentId: agent._id });
    // Action should be overridden to "walking"
    expect(updatedAgent?.currentAction).toBe("walking");
    // Target should be Cozy Cafe coordinates
    expect(updatedAgent?.targetX).toBe(45);
    expect(updatedAgent?.targetY).toBe(15);

    vi.unstubAllGlobals();
  });

  test("already within 1 tile of POI → no action override (keeps eating)", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    // Move an agent to be very close to Cozy Cafe (45, 15)
    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];
    await t.mutation(api.functions.agents.updatePosition, {
      agentId: agent._id,
      targetX: 45,
      targetY: 15,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Already at the cafe, time to eat.",
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

    const result = await t.action(api.functions.world.tick, { skipSleep: true });
    expect(result.success).toBe(true);

    const updatedAgent = await t.query(api.functions.agents.getById, { agentId: agent._id });
    // Agent is within 1 tile of Cozy Cafe, so action should remain "eating", not overridden
    expect(updatedAgent?.currentAction).toBe("eating");

    vi.unstubAllGlobals();
  });

  test("talking + Cozy Cafe (no agent named Cozy) → overridden to walking", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.functions.seed.agents, { clearExisting: true });
    await t.mutation(api.functions.seed.world, { clearExisting: false });
    process.env.ENABLE_SLEEP_MODE = "false";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const agents = await t.query(api.functions.agents.getAll, {});
    const agent = agents[0];

    // Mock fetch returns "talking" with a POI as target (no agent named "Cozy Cafe" exists)
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Going to chat at the cafe.",
              action: "talking",
              target: "Cozy Cafe",
              speech: "Hello!",
              confidence: 0.9,
            }),
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await t.action(api.functions.world.tick, { skipSleep: true });
    expect(result.success).toBe(true);

    const updatedAgent = await t.query(api.functions.agents.getById, { agentId: agent._id });
    // Talking + POI target with no matching agent → overridden to walking
    expect(updatedAgent?.currentAction).toBe("walking");
    expect(updatedAgent?.targetX).toBe(45);
    expect(updatedAgent?.targetY).toBe(15);

    vi.unstubAllGlobals();
  });
});
