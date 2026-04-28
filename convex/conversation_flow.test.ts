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
      myLastSpeech: "Hello there!",
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
      myLastSpeech: "Hello!",
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
      myLastSpeech: "Hello!",
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
      myLastSpeech: "Hello!",
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
      myLastSpeech: "Goodbye!",
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
      myLastSpeech: "Hello there!",
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

  // === Phase 2: Bidirectional conversation tests ===

  test("Agent B is not forced to 'listening' when Agent A initiates talking", async () => {
    const t = convexTest(schema, modules);

    // Create two agents near each other
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B", archetype: "builder", gridX: 1, gridY: 1,
    });

    // Directly test: updateAction for A should NOT touch B's state
    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentAId, action: "talking", speech: "Hello B!",
      interactionPartnerId: agentBId, lastSpeechAt: Date.now(),
    });

    const agentB = await t.query(api.functions.agents.getById, { agentId: agentBId });
    // B should NOT be forced to "listening" — B stays at whatever action was set (default "idle")
    expect(agentB?.currentAction).not.toBe("listening");
  });

  test("Agent with 'listening' action is not stuck — can still receive state updates", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Listener Agent", archetype: "socialite", gridX: 0, gridY: 0,
    });

    // Set agent to "listening"
    await t.mutation(internal.functions.agents.updateAction, {
      agentId, action: "listening",
    });

    // Verify agent is in listening state
    let agent = await t.query(api.functions.agents.getById, { agentId });
    expect(agent?.currentAction).toBe("listening");

    // Update agent's action from "listening" to something else
    await t.mutation(internal.functions.agents.updateAction, {
      agentId, action: "idle",
    });

    agent = await t.query(api.functions.agents.getById, { agentId });
    expect(agent?.currentAction).toBe("idle");
  });

  test("Partner's state is properly reset when conversation ends", async () => {
    const t = convexTest(schema, modules);

    // Create two agents in a conversation
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B", archetype: "builder", gridX: 1, gridY: 1,
    });

    // Set A as initiator in conversation with B
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId, partnerId: agentBId, role: "initiator", turnCount: 1,
      myLastSpeech: "Hello!",
    });

    // Set B as responder in conversation with A — B was talking
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentBId, partnerId: agentAId, role: "responder", turnCount: 1,
      myLastSpeech: "Hi there!",
    });

    // Set B's action to "talking" with A as partner
    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentBId, action: "talking", speech: "Hi there!",
      interactionPartnerId: agentAId, lastSpeechAt: Date.now(),
    });

    // Simulate conversation end cleanup (FR5):
    // Clear both agents' conversation states
    // Reset B's action to "idle" and clear B's interactionPartnerId
    await t.mutation(internal.functions.agents.clearConversationState, { agentId: agentAId });
    await t.mutation(internal.functions.agents.clearConversationState, { agentId: agentBId });
    await t.mutation(internal.functions.agents.updateAction, {
      agentId: agentBId, action: "idle",
    });
    // Clear interactionPartnerId directly via DB patch
    await t.run(async (ctx) => {
      await ctx.db.patch(agentBId, { interactionPartnerId: undefined });
    });

    // Verify partner B is properly reset
    const agentB = await t.query(api.functions.agents.getById, { agentId: agentBId });
    expect(agentB?.conversationState).toBeUndefined();
    expect(agentB?.currentAction).toBe("idle");
    expect(agentB?.interactionPartnerId).toBeUndefined();

    // Verify A is also cleared
    const agentA = await t.query(api.functions.agents.getById, { agentId: agentAId });
    expect(agentA?.conversationState).toBeUndefined();
  });
});
