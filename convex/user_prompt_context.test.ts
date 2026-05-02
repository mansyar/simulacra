import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

interface ChatCompletionBody {
  messages: { role: string; content: string }[];
}

test("ai:decision user prompt contains all context sections when API key is set", async () => {
  const t = convexTest(schema, modules);
  process.env.OPENAI_API_KEY = "sk-test-key";

  // Track the API call payload to inspect the user prompt
  let capturedBody: ChatCompletionBody | null = null;

  const mockFetch = vi.fn().mockImplementation(async (_url: string, options: { body: string }) => {
    capturedBody = JSON.parse(options.body) as ChatCompletionBody;
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              thought: "I should explore the area and see what's new.",
              action: "exploring",
              target: "none",
              speech: "",
              confidence: 0.85,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  const result = await t.action(api.functions.ai.decision, {
    agentState: {
      name: "Bob",
      hunger: 50,
      energy: 60,
      social: 40,
      currentAction: "idle",
    },
    nearbyAgents: ["Alice", "Charlie"],
    archetype: "explorer",
    // New structured context args (not yet implemented — test will fail)
    agentContext: [
      "## Your Identity",
      "Name: Bob",
      "Archetype: explorer",
      "Biography: A curious adventurer who loves discovering new places",
      "Traits: adventurous, curious, energetic",
      "Current Goal: Explore every corner of the world",
    ].join("\n"),
    relationshipContext: [
      "## Your Relationships",
      "- You like Alice (affinity: +5.0)",
      "- You are neutral toward Charlie (affinity: +0.0)",
    ].join("\n"),
    events: [
      "## Recent Events",
      "- [<1 min ago] conversation: Alice said hello to you",
      "- [5 min ago] movement: Walked to the town square",
      "- [12 min ago] interaction: Found a shiny rock near the river",
    ].join("\n"),
    memories: [
      "## Relevant Memories",
      "- Remembered the hidden path behind the old oak tree",
      "- Recall that Charlie mentioned a cave to the north",
    ].join("\n"),
  });

  // Verify the user message in the API call contains all expected sections
  const userMessage = capturedBody!.messages.find((m) => m.role === "user")!.content;
  expect(userMessage).toContain("## Your Identity");
  expect(userMessage).toContain("## Your State");
  expect(userMessage).toContain("## Your Relationships");
  expect(userMessage).toContain("## Recent Events");
  expect(userMessage).toContain("## Relevant Memories");
  expect(userMessage).toContain("Based on ALL of the above context");
  // Verify sections include actual data
  expect(userMessage).toContain("Bob");
  expect(userMessage).toContain("explorer");
  expect(userMessage).toContain("Hunger: 50");
  expect(userMessage).toContain("Energy: 60");
  expect(userMessage).toContain("Alice");
  expect(userMessage).toContain("Charlie");
  // Verify JSON schema output is in system prompt (not user prompt)
  const systemMessage = capturedBody!.messages.find((m) => m.role === "system")!.content;
  expect(systemMessage).toContain("thought");
  expect(systemMessage).toContain("action");

  // Verify the decision result still works
  expect(result).toHaveProperty("thought");
  expect(result).toHaveProperty("action");
  expect(result).toHaveProperty("target");
  expect(result).toHaveProperty("speech");
  expect(result).toHaveProperty("confidence");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:decision system prompt includes archetype-specific prompt for the agent", async () => {
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
              thought: "I should build something.",
              action: "working",
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
    agentState: { name: "Test", hunger: 50, energy: 50, social: 50, currentAction: "idle" },
    nearbyAgents: [],
    archetype: "builder",
  });

  const systemMessage = capturedBody!.messages.find((m) => m.role === "system")!.content;

  // Verify the builder archetype prompt is present in the system message
  expect(systemMessage).toContain("You are a builder");
  expect(systemMessage).toContain("organized, productive, and detail-oriented");

  // Verify DECISION_SYSTEM_PROMPT (JSON schema) is also present
  expect(systemMessage).toContain("thought");
  expect(systemMessage).toContain("action");
  expect(systemMessage).toContain("confidence");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});

test("ai:decision user prompt includes relationship data from real DB agents via buildFullContext pipeline", async () => {
  const t = convexTest(schema, modules);

  // Create two agents
  const agentAId = await t.mutation(api.functions.agents.create, {
    name: "Alice",
    archetype: "socialite",
    gridX: 0,
    gridY: 0,
  });

  const agentBId = await t.mutation(api.functions.agents.create, {
    name: "Bob",
    archetype: "builder",
    gridX: 1,
    gridY: 1,
  });

  // Create a relationship between them
  await t.mutation(internal.functions.relationships.updateRelationship, {
    agentAId,
    agentBId,
    delta: 10,
  });

  // Build full context — should include relationship data
  const context = await t.action(api.functions.ai.buildFullContext, {
    agentId: agentAId,
    query: "What should I do?",
  });

  expect(context.relationshipContext).toContain("Bob");
  expect(context.relationshipContext).toContain("affinity");
  expect(context.agentContext).toContain("Alice");
  expect(context.agentContext).toContain("socialite");

  // Now call decision with this context and a mock API key
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
              thought: "I should talk to Bob.",
              action: "talking",
              target: "Bob",
              speech: "Hi Bob, nice to see you!",
              confidence: 0.9,
            }),
          },
        }],
      }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  await t.action(api.functions.ai.decision, {
    agentState: { name: "Alice", hunger: 50, energy: 50, social: 50, currentAction: "idle" },
    nearbyAgents: ["Bob"],
    archetype: "socialite",
    agentContext: context.agentContext,
    relationshipContext: context.relationshipContext,
    events: context.events,
    memories: context.memories,
  });

  const userMessage = capturedBody!.messages.find((m) => m.role === "user")!.content;

  // Verify relationship context data is in the user prompt
  expect(userMessage).toContain("## Your Relationships");
  expect(userMessage).toContain("Bob");
  expect(userMessage).toContain("affinity");

  // Verify identity data is present
  expect(userMessage).toContain("## Your Identity");
  expect(userMessage).toContain("Alice");
  expect(userMessage).toContain("socialite");

  // Verify state data is present
  expect(userMessage).toContain("## Your State");
  expect(userMessage).toContain("Hunger: 50");

  delete process.env.OPENAI_API_KEY;
  vi.unstubAllGlobals();
});
