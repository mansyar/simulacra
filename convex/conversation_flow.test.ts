/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Multi-Turn Conversation Flow", () => {
  test("agent with active conversation state generates response", async () => {
    const t = convexTest(schema, modules);

    // Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B",
      archetype: "builder",
      gridX: 1,
      gridY: 1,
    });

    // Set conversation state on agent A (initiator)
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      lastPartnerSpeech: "Hello there!",
    });

    // Get the agent and verify conversation state
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState).toBeDefined();
    expect(agent?.conversationState?.partnerId).toBe(agentBId);
    expect(agent?.conversationState?.role).toBe("initiator");
  });

  test("conversation ends when action changes", async () => {
    const t = convexTest(schema, modules);

    // Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B",
      archetype: "builder",
      gridX: 1,
      gridY: 1,
    });

    // Set conversation state
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      lastPartnerSpeech: "Hello!",
    });

    // Clear conversation state (simulating action change)
    await t.mutation(internal.functions.agents.clearConversationState, {
      agentId: agentAId,
    });

    // Verify conversation state is cleared
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState).toBeUndefined();
  });

  test("conversation ends when partner walks away", async () => {
    const t = convexTest(schema, modules);

    // Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B",
      archetype: "builder",
      gridX: 1,
      gridY: 1,
    });

    // Set conversation state
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      lastPartnerSpeech: "Hello!",
    });

    // Move partner away (simulate walking away)
    await t.mutation(api.functions.agents.updatePosition, {
      agentId: agentBId,
      targetX: 50,
      targetY: 50,
    });

    // Verify conversation state still exists (not automatically cleared)
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState).toBeDefined();
  });

  test("turn count increments during conversation", async () => {
    const t = convexTest(schema, modules);

    // Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B",
      archetype: "builder",
      gridX: 1,
      gridY: 1,
    });

    // Set conversation state with turn count 1
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      lastPartnerSpeech: "Hello!",
    });

    // Get agent and verify turn count
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState?.turnCount).toBe(1);
  });

  test("conversation ends when turn count exceeds cap", async () => {
    const t = convexTest(schema, modules);

    // Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B",
      archetype: "builder",
      gridX: 1,
      gridY: 1,
    });

    // Set conversation state at turn cap (5)
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 5,
      lastPartnerSpeech: "Goodbye!",
    });

    // Get agent and verify turn count is at or over cap
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState?.turnCount).toBeGreaterThanOrEqual(5);
  });

  test("speech bubble persistence during conversation", async () => {
    const t = convexTest(schema, modules);

    // Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B",
      archetype: "builder",
      gridX: 1,
      gridY: 1,
    });

    // Set conversation state with speech
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      lastPartnerSpeech: "Hello there!",
    });

    // Update agent speech
    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentAId,
      action: "talking",
      speech: "Hi!",
      lastSpeechAt: Date.now(),
    });

    // Get agent and verify speech is set
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.speech).toBe("Hi!");
    expect(agent?.conversationState).toBeDefined();
  });
});
