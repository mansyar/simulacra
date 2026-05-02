/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

interface ChatCompletionBody {
  messages: { role: string; content: string }[];
}

test("AI decision returns new schema fields", async () => {
  const t = convexTest(schema, modules);
  
  // Call decision with a primary archetype
  const result = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 50,
      social: 50,
      currentAction: "idle",
    },
    nearbyAgents: ["Wendy"],
    archetype: "builder",
  });

  // These should be present in the new schema
  expect(result).toHaveProperty("thought");
  expect(result).toHaveProperty("action");
  expect(result).toHaveProperty("target");
  expect(result).toHaveProperty("speech");
  expect(result).toHaveProperty("confidence");
  expect(typeof result.confidence).toBe("number");
});

test("decision action accepts currentAction in agentState", async () => {
  const t = convexTest(schema, modules);

  const result = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 50,
      social: 50,
      currentAction: "idle",
    },
    nearbyAgents: [],
    archetype: "builder",
  });

  expect(result).toHaveProperty("action");
});

test("buildContextPrompt renders Current Action in ## Your State section", async () => {
  const t = convexTest(schema, modules);

  process.env.OPENAI_API_KEY = "sk-test-key";
  let capturedBody: ChatCompletionBody | null = null;

  const mockFetch = vi.fn().mockImplementation(async (_url: string, options: { body: string }) => {
    capturedBody = JSON.parse(options.body) as ChatCompletionBody;
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "I should wait.",
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

  await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Test",
      hunger: 50,
      energy: 50,
      social: 50,
      currentAction: "walking",
    },
    nearbyAgents: [],
    archetype: "builder",
  });

  const userMessage = capturedBody!.messages.find((m) => m.role === "user")!.content;

  // The ## Your State section should contain "Current Action"
  const stateSection = userMessage.split("## Your State")[1]?.split("##")[0] || "";
  expect(stateSection).toContain("Current Action");
  // Should render alongside Hunger, Energy, Social
  expect(stateSection).toContain("Hunger");
  expect(stateSection).toContain("Energy");
  expect(stateSection).toContain("Social");
  // Should show the actual action value
  expect(stateSection).toContain("walking");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("buildContextPrompt renders currentAction value alongside needs", async () => {
  const t = convexTest(schema, modules);

  process.env.OPENAI_API_KEY = "sk-test-key";
  let capturedBody: ChatCompletionBody | null = null;

  const mockFetch = vi.fn().mockImplementation(async (_url: string, options: { body: string }) => {
    capturedBody = JSON.parse(options.body) as ChatCompletionBody;
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "Time to rest.",
              action: "sleeping",
              target: "none",
              speech: "",
              confidence: 0.8,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Sleepy",
      hunger: 30,
      energy: 10,
      social: 60,
      currentAction: "sleeping",
    },
    nearbyAgents: [],
    archetype: "builder",
  });

  const userMessage = capturedBody!.messages.find((m) => m.role === "user")!.content;
  const stateSection = userMessage.split("## Your State")[1]?.split("##")[0] || "";

  // Verify currentAction renders as a labeled line alongside needs
  expect(stateSection).toMatch(/Current Action: sleeping/);
  expect(stateSection).toMatch(/Hunger: 30/);
  expect(stateSection).toMatch(/Energy: 10/);
  expect(stateSection).toMatch(/Social: 60/);

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("buildAgentContext contains Current Position and Destination with target set", async () => {
  const t = convexTest(schema, modules);

  // Seed archetypes so buildAgentContext can look them up
  await t.mutation(api.functions.seed.world, {});

  // Create an agent with a known position and target
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Wanderer",
    archetype: "explorer",
    gridX: 10,
    gridY: 20,
  });

  // Set target on the agent directly via run
  await t.run(async (ctx) => {
    const agent = await ctx.db.get(agentId);
    if (agent) {
      await ctx.db.patch(agentId, { targetX: 30, targetY: 40 });
    }
  });

  const context = await t.query(internal.functions.ai.buildAgentContext, { agentId });

  // Should contain position and destination
  expect(context).toContain("Current Position");
  expect(context).toContain("Destination");
});

test("buildAgentContext shows None when no target is set", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.functions.seed.world, {});

  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Idler",
    archetype: "builder",
    gridX: 5,
    gridY: 5,
  });

  const context = await t.query(internal.functions.ai.buildAgentContext, { agentId });

  // Should show "None" for destination when no target is set
  expect(context).toContain("Destination: None");
});

test("buildAgentContext includes Distance Remaining when target set, omits when not set", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.functions.seed.world, {});

  // Agent WITH target
  const agentWithTarget = await t.mutation(api.functions.agents.create, {
    name: "Traveler",
    archetype: "explorer",
    gridX: 10,
    gridY: 10,
  });
  await t.run(async (ctx) => {
    await ctx.db.patch(agentWithTarget, { targetX: 20, targetY: 20 });
  });

  const contextWithTarget = await t.query(internal.functions.ai.buildAgentContext, { agentId: agentWithTarget });
  expect(contextWithTarget).toContain("Distance Remaining");

  // Agent WITHOUT target
  const agentWithoutTarget = await t.mutation(api.functions.agents.create, {
    name: "Sitter",
    archetype: "builder",
    gridX: 0,
    gridY: 0,
  });

  const contextWithoutTarget = await t.query(internal.functions.ai.buildAgentContext, { agentId: agentWithoutTarget });
  // The default targetX/targetY may be undefined, so Distance Remaining should NOT appear
  expect(contextWithoutTarget).not.toContain("Distance Remaining");
});

test("trajectory fields appear after Personality & Instructions in agentContext", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.functions.seed.world, {});

  const agentId = await t.mutation(api.functions.agents.create, {
    name: "PosTest",
    archetype: "explorer",
    gridX: 7,
    gridY: 8,
  });
  await t.run(async (ctx) => {
    await ctx.db.patch(agentId, { targetX: 15, targetY: 25 });
  });

  const context = await t.query(internal.functions.ai.buildAgentContext, { agentId });

  // Find the index of "Personality & Instructions" and "Current Position"
  const personalityIdx = context.indexOf("Personality & Instructions");
  const positionIdx = context.indexOf("Current Position");

  expect(personalityIdx).toBeGreaterThanOrEqual(0);
  expect(positionIdx).toBeGreaterThan(personalityIdx);
});

test("full decision pipeline includes both currentAction and trajectory info in user prompt", async () => {
  const t = convexTest(schema, modules);

  // Seed POIs and archetypes
  await t.mutation(api.functions.seed.world, {});
  await t.mutation(api.functions.seed.agents, { clearExisting: true });

  // Create an agent with a target
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Pathfinder",
    archetype: "explorer",
    gridX: 5,
    gridY: 10,
  });
  await t.run(async (ctx) => {
    await ctx.db.patch(agentId, { targetX: 20, targetY: 30 });
  });

  process.env.OPENAI_API_KEY = "sk-test-key";
  let capturedBody: ChatCompletionBody | null = null;

  const mockFetch = vi.fn().mockImplementation(async (_url: string, options: { body: string }) => {
    capturedBody = JSON.parse(options.body) as ChatCompletionBody;
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "I'm on a journey.",
              action: "walking",
              target: "20,30",
              speech: "",
              confidence: 0.9,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  // Get full context
  const context = await t.action(api.functions.ai.buildFullContext, {
    agentId,
    query: "What should I do?",
  });

  // Call decision with full context
  await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Pathfinder",
      hunger: 50,
      energy: 60,
      social: 40,
      currentAction: "walking",
    },
    nearbyAgents: [],
    archetype: "explorer",
    agentContext: context.agentContext,
    relationshipContext: context.relationshipContext,
    events: context.events,
    memories: context.memories,
    poiContext: context.poiContext,
  });

  const userMessage = capturedBody!.messages.find((m) => m.role === "user")!.content;

  // Verify everything appears in the user prompt
  expect(userMessage).toContain("## Your Identity");
  expect(userMessage).toContain("## Your State");
  expect(userMessage).toContain("Current Action");
  expect(userMessage).toContain("Current Position");
  expect(userMessage).toContain("Destination");
  expect(userMessage).toContain("Hunger");
  expect(userMessage).toContain("Energy");
  expect(userMessage).toContain("Social");
  // Trajectory should be in the Your Identity section
  const identitySection = userMessage.split("## Your State")[0];
  expect(identitySection).toContain("Current Position");
  expect(identitySection).toContain("Destination");
  // currentAction should be in the Your State section
  const stateSection = userMessage.split("## Your State")[1]?.split("##")[0] || "";
  expect(stateSection).toContain("Current Action");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("AI decision handles all primary archetypes", async () => {
  const t = convexTest(schema, modules);
  const primaryArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"] as const;

  for (const archetype of primaryArchetypes) {
    const result = await t.action(api.functions.ai.decision, {
      agentState: {
        name: "Test",
        hunger: 50,
        energy: 50,
        social: 50,
        currentAction: "idle",
      },
      nearbyAgents: [],
      archetype,
    });
    expect(result).toBeTruthy();
  }
});
