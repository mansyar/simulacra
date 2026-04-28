/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Multi-Turn Speech Persistence", () => {
  test("agent speech persists during active conversation", async () => {
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
      myLastSpeech: "Hello!",
    });

    // Update agent speech
    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentAId,
      action: "talking",
      speech: "Hi there!",
      lastSpeechAt: Date.now(),
    });

    // Get agent and verify speech is set
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.speech).toBe("Hi there!");
    expect(agent?.conversationState).toBeDefined();
    expect(agent?.conversationState?.partnerId).toBe(agentBId);
  });

  test("speech persists across multiple turns", async () => {
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

    // Set conversation state and speech
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello!",
    });

    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentAId,
      action: "talking",
      speech: "Hi!",
      lastSpeechAt: Date.now(),
    });

    // Get agent and verify speech
    let agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.speech).toBe("Hi!");

    // Simulate next turn - update conversation state and speech
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 2,
      myLastSpeech: "How are you?",
    });

    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentAId,
      action: "talking",
      speech: "I'm good, thanks!",
      lastSpeechAt: Date.now(),
    });

    // Verify speech was updated
    agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.speech).toBe("I'm good, thanks!");
    expect(agent?.conversationState?.turnCount).toBe(2);
  });

  test("speech is cleared when conversation ends", async () => {
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

    // Set conversation state and speech
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello!",
    });

    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentAId,
      action: "talking",
      speech: "Hi!",
      lastSpeechAt: Date.now(),
    });

    // Clear conversation state
    await t.mutation(internal.functions.agents.clearConversationState, {
      agentId: agentAId,
    });

    // Get agent and verify speech is still there (speech is separate from conversation state)
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    // Speech should still be present (it's separate from conversation state)
    expect(agent?.speech).toBe("Hi!");
    // But conversation state should be cleared
    expect(agent?.conversationState).toBeUndefined();
  });

  test("myLastSpeech is stored in conversation state", async () => {
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

    // Set conversation state with myLastSpeech
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello there! How are you today?",
    });

    // Get agent and verify myLastSpeech
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState?.myLastSpeech).toBe("Hello there! How are you today?");
  });
});
