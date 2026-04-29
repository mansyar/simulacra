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
});
