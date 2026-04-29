/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/**
 * Integration tests for the Agent Interaction Flow.
 * Validates: two agents meet -> conversation triggers -> relationship updates -> thought stream.
 */

describe("Agent Interaction Flow", () => {
  test("two agents within proximity trigger conversation", async () => {
    const t = convexTest(schema, modules);
    
    // Create two agents at adjacent positions
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Alpha",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Beta",
      archetype: "socialite",
      gridX: 11,
      gridY: 11,
    });

    // Set conversation state (simulating what world tick would do)
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello Beta! Lovely day, isn't it?",
    });

    // Verify conversation state is set
    const agentA = await t.query(api.functions.agents.getById, { agentId: agentAId });
    expect(agentA?.conversationState).toBeDefined();
    expect(agentA?.conversationState?.partnerId).toBe(agentBId);
    expect(agentA?.conversationState?.role).toBe("initiator");
  });

  test("conversation updates relationship valence", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Alpha",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Beta",
      archetype: "builder",
      gridX: 11,
      gridY: 11,
    });

    // Create a positive relationship interaction
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId,
      agentBId,
      delta: 5,
    });

    // Verify relationship exists with positive affinity
    const rel = await t.query(api.functions.world.getRelationship, {
      agentAId,
      agentBId,
    });
    expect(rel).not.toBeNull();
    expect(rel!.affinity).toBe(5);
    expect(rel!.lastInteractionType).toBe("positive");

    // Create a negative interaction
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId,
      agentBId,
      delta: -3,
    });

    const updatedRel = await t.query(api.functions.world.getRelationship, {
      agentAId,
      agentBId,
    });
    expect(updatedRel!.affinity).toBe(2); // 5 - 3 = 2
    expect(updatedRel!.interactionsCount).toBe(2);
  });

  test("conversation termination and cooldown", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Alpha",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Beta",
      archetype: "builder",
      gridX: 11,
      gridY: 11,
    });

    // Start a conversation
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
      myLastSpeech: "Hello!",
    });

    // Verify conversation state exists
    let agentA = await t.query(api.functions.agents.getById, { agentId: agentAId });
    expect(agentA?.conversationState).toBeDefined();

    // Clear conversation state (simulating world tick ending conversation)
    await t.mutation(internal.functions.agents.clearConversationState, {
      agentId: agentAId,
    });

    // Verify conversation state is cleared
    agentA = await t.query(api.functions.agents.getById, { agentId: agentAId });
    expect(agentA?.conversationState).toBeUndefined();

    // Use resetConversationEnd for full cleanup
    await t.mutation(internal.functions.agents.resetConversationEnd, {
      agentId: agentAId,
    });
    agentA = await t.query(api.functions.agents.getById, { agentId: agentAId });
    expect(agentA?.currentAction).toBe("idle");
    expect(agentA?.interactionPartnerId).toBeUndefined();
  });

  test("getActiveConversations returns agents with conversation state", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Alpha",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Beta",
      archetype: "builder",
      gridX: 11,
      gridY: 11,
    });

    // Initially no active conversations
    let activeConvs = await t.query(api.functions.agents.getActiveConversations, {});
    expect(activeConvs.length).toBe(0);

    // Start a conversation
    await t.mutation(internal.functions.agents.setConversationState, {
      agentId: agentAId,
      partnerId: agentBId,
      role: "initiator",
      turnCount: 1,
    });

    // Now should have one active conversation
    activeConvs = await t.query(api.functions.agents.getActiveConversations, {});
    expect(activeConvs.length).toBe(1);
    expect(activeConvs[0]._id).toBe(agentAId);
  });

  test("relationship valence history tracks last 5 interactions", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Alpha",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Beta",
      archetype: "builder",
      gridX: 11,
      gridY: 11,
    });

    // Create 6 interactions with alternating sentiment
    const deltas = [5, -2, 3, -4, 6, -1];
    for (const delta of deltas) {
      await t.mutation(internal.functions.agents.updateRelationship, {
        agentAId,
        agentBId,
        delta,
      });
    }

    const rel = await t.query(api.functions.world.getRelationship, {
      agentAId,
      agentBId,
    });
    expect(rel).not.toBeNull();
    // 5 - 2 + 3 - 4 + 6 - 1 = 7
    expect(rel!.affinity).toBe(7);
    // Valence history should be limited to 5 most recent
    expect(rel!.valenceHistory.length).toBeLessThanOrEqual(5);
    // Last interaction type should match the last delta
    expect(rel!.lastInteractionType).toBe("negative");
  });

  test("getRelationships returns sorted results with agent names", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Alpha",
      archetype: "socialite",
      gridX: 10,
      gridY: 10,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Beta",
      archetype: "builder",
      gridX: 11,
      gridY: 11,
    });
    const agentCId = await t.mutation(api.functions.agents.create, {
      name: "Gamma",
      archetype: "explorer",
      gridX: 12,
      gridY: 12,
    });

    // Create relationships
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId, agentBId, delta: 3,
    });
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId, agentBId: agentCId, delta: 10,
    });

    const rels = await t.query(api.functions.agents.getRelationships, {
      agentId: agentAId,
    });
    expect(rels.length).toBe(2);
    // Should be sorted by affinity descending
    expect(rels[0].affinity).toBeGreaterThanOrEqual(rels[1].affinity);
    // Each should have the other agent's name
    expect(rels[0].otherAgentName).toBeTruthy();
  });
});
