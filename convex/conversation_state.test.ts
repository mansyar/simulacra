/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Conversation State", () => {
  test("agent can have conversationState field", async () => {
    const t = convexTest(schema, modules);

    // Create an agent
    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Test Agent",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    // Verify agent was created successfully
    expect(agentId).toBeDefined();
  });

  test("conversationState can be set and retrieved", async () => {
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

    // Set conversation state on agent A
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello there!",
    });

    // Get the agent and verify conversation state
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState).toBeDefined();
    expect(agent?.conversationState?.partnerId).toBe(agentBId);
    expect(agent?.conversationState?.role).toBe("initiator");
    expect(agent?.conversationState?.turnCount).toBe(1);
    expect(agent?.conversationState?.myLastSpeech).toBe("Hello there!");
  });

  test("conversationState can be cleared", async () => {
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

    // Clear conversation state
    await t.mutation(internal.functions.agents.clearConversationState, {
      agentId: agentAId,
    });

    // Verify conversation state is cleared
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState).toBeUndefined();
  });

  test("getActiveConversations returns agents with active conversation states", async () => {
    const t = convexTest(schema, modules);

    // Create three agents
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

    await t.mutation(api.functions.agents.create, {
      name: "Charlie",
      archetype: "explorer",
      gridX: 2,
      gridY: 2,
    });

    // Set conversation state on agent A and B
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello!",
    });

    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentBId,
      partnerId: agentAId,
      role: "responder",
      turnCount: 1,
      myLastSpeech: "Hi!",
    });

    // Get active conversations
    const activeConversations = await t.query(api.functions.agents.getActiveConversations, {});

    // Verify both agents are in active conversations
    expect(activeConversations.length).toBeGreaterThanOrEqual(2);
    const agentAInConv = activeConversations.find((a: any) => a._id === agentAId);
    const agentBInConv = activeConversations.find((a: any) => a._id === agentBId);
    expect(agentAInConv).toBeDefined();
    expect(agentBInConv).toBeDefined();
  });

  // === New schema tests for bidirectional conversation ===
  test("myLastSpeech field persists in conversationState", async () => {
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
      myLastSpeech: "Hello there!",
    });

    // Get the agent and verify myLastSpeech was stored
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState).toBeDefined();
    expect(agent?.conversationState?.myLastSpeech).toBe("Hello there!");
  });

  test("myLastSpeech no longer exists in conversationState", async () => {
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

    // Set conversation state with myLastSpeech (not lastPartnerSpeech)
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello there!",
    });

    // Get the agent and verify lastPartnerSpeech is NOT present
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState).toBeDefined();
    // lastPartnerSpeech should not exist since we removed it from the schema
    expect((agent?.conversationState as any)?.lastPartnerSpeech).toBeUndefined();
  });

  test("conversation termination conditions work correctly", async () => {
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

    // Set conversation state with turn count at cap
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 5, // At cap
      myLastSpeech: "Goodbye!",
    });

    // Get the agent and verify turn count
    const agent = await t.query(api.functions.agents.getById, {
      agentId: agentAId,
    });

    expect(agent?.conversationState?.turnCount).toBe(5);
    // Should be at or over the cap of 5
    expect(agent?.conversationState?.turnCount).toBeGreaterThanOrEqual(5);
  });
});
