/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Per-Turn Sentiment Integration", () => {
  it("should apply sentiment-based affinity delta to relationship when agents talk", async () => {
    const t = convexTest(schema, modules);

    // Setup: Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Alice", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Bob", archetype: "socialite", gridX: 1, gridY: 1,
    });

    // Seed world state and config
    await t.mutation(api.functions.seed.agents, {});

    // Before tick: no relationship should exist
    let relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });
    expect(relationship).toBeNull();

    // Run tick (socialite archetype + nearby agent → mock AI returns "talking" action)
    const result = await t.action(api.functions.world.tick, {});
    expect(result.success).toBe(true);

    // After tick: a relationship should have been created or updated
    relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });
    expect(relationship).not.toBeNull();
    expect(relationship!.interactionsCount).toBeGreaterThan(0);
    expect(relationship!.valenceHistory.length).toBeGreaterThan(0);
    // lastInteractionType should be one of the valid types
    expect(["positive", "negative", "neutral"]).toContain(relationship!.lastInteractionType);
  });

  it("should create relationship with correct structure after conversation turn", async () => {
    const t = convexTest(schema, modules);

    // Setup: Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Charlie", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Diana", archetype: "socialite", gridX: 1, gridY: 1,
    });

    await t.mutation(api.functions.seed.agents, {});

    // Run tick to trigger conversation
    await t.action(api.functions.world.tick, {});

    const relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });

    if (relationship) {
      // Verify relationship has all required fields
      expect(relationship).toHaveProperty("affinity");
      expect(relationship).toHaveProperty("interactionsCount");
      expect(relationship).toHaveProperty("lastInteractionAt");
      expect(relationship).toHaveProperty("lastInteractionType");
      expect(relationship).toHaveProperty("valenceHistory");
      expect(typeof relationship.affinity).toBe("number");
      expect(relationship.interactionsCount).toBeGreaterThan(0);
    }
  });

  it("should update valenceHistory on every conversation turn", async () => {
    const t = convexTest(schema, modules);

    // Test: manually call updateRelationship with different deltas and check valenceHistory
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Eve", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Frank", archetype: "socialite", gridX: 1, gridY: 1,
    });

    // Simulate a positive conversation turn (delta: +3 from "wonderful")
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId, agentBId, delta: 3,
    });

    let relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });
    expect(relationship?.lastInteractionType).toBe("positive");
    expect(relationship?.valenceHistory).toEqual(["positive"]);

    // Simulate a negative conversation turn (delta: -2 from "bad")
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId, agentBId, delta: -2,
    });
    relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });
    expect(relationship?.lastInteractionType).toBe("negative");
    expect(relationship?.valenceHistory).toEqual(["negative", "positive"]);

    // Verify affinity accumulated correctly
    expect(relationship?.affinity).toBe(1); // +3 + (-2) = 1
  });

  it("should accumulate affinity across multiple conversation turns with mixed sentiment", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Grace", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Henry", archetype: "socialite", gridX: 1, gridY: 1,
    });

    // Turn 1: Positive (+3 for "wonderful")
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId, agentBId, delta: 3,
    });

    // Turn 2: Positive (+1 for "good")
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId, agentBId, delta: 1,
    });

    // Turn 3: Negative (-2 for "bad")
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId, agentBId, delta: -2,
    });

    const relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });

    // Affinity should be cumulative: +3 + 1 + (-2) = 2
    expect(relationship?.affinity).toBe(2);
    // interactionsCount should be 3
    expect(relationship?.interactionsCount).toBe(3);
    // valenceHistory should have 3 entries (newest first)
    expect(relationship?.valenceHistory).toEqual(["negative", "positive", "positive"]);
  });

  it("should handle multi-turn conversation with mixed positive/negative/neutral entries", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Iris", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Jack", archetype: "socialite", gridX: 1, gridY: 1,
    });

    // Simulate a 5-turn conversation with mixed sentiment
    await Promise.all([
      t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: 3 }),  // positive
      t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: -3 }), // negative
      t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: 0 }),  // neutral
      t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: 1 }),  // positive
      t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: -1 }), // negative
    ]);

    const relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });

    // valenceHistory should have 5 entries (newest first)
    expect(relationship?.valenceHistory).toHaveLength(5);
    // lastInteractionType should reflect the last delta (-1 = negative)
    expect(relationship?.lastInteractionType).toBe("negative");
    // valenceHistory should contain mixed entries
    expect(relationship?.valenceHistory).toContain("positive");
    expect(relationship?.valenceHistory).toContain("negative");
    expect(relationship?.valenceHistory).toContain("neutral");
    // Affinity should be 0: +3 + (-3) + 0 + 1 + (-1) = 0
    expect(relationship?.affinity).toBe(0);
  });

  it("should cap valenceHistory at 5 entries (newest first)", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Kate", archetype: "socialite", gridX: 0, gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Leo", archetype: "socialite", gridX: 1, gridY: 1,
    });

    // Simulate 7 conversation turns
    for (let i = 1; i <= 7; i++) {
      await t.mutation(internal.functions.agents.updateRelationship, {
        agentAId, agentBId, delta: i % 2 === 0 ? 1 : -1,
      });
    }

    const relationship = await t.query(api.functions.world.getRelationship, {
      agentAId, agentBId,
    });

    // Should still be capped at 5
    expect(relationship?.valenceHistory).toHaveLength(5);
    expect(relationship?.interactionsCount).toBe(7);
  });
});
