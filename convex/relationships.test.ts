import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Relationships", () => {
  it("should update lastInteractionType and valenceHistory on every interaction", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup: Create two agents
    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Agent A",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Agent B",
      archetype: "socialite",
      gridX: 1,
      gridY: 1,
    });

    // 2. First interaction (positive)
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId,
      agentBId,
      delta: 5,
    });

    let relationship = await t.query(api.functions.world.getRelationship, {
      agentAId,
      agentBId,
    });
    expect(relationship?.lastInteractionType).toBe("positive");
    expect(relationship?.valenceHistory).toEqual(["positive"]);

    // 3. Second interaction (negative)
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId,
      agentBId,
      delta: -10,
    });

    relationship = await t.query(api.functions.world.getRelationship, {
      agentAId,
      agentBId,
    });
    
    expect(relationship?.lastInteractionType).toBe("negative");
    expect(relationship?.valenceHistory).toEqual(["negative", "positive"]);

    // 4. Fill history (max 5)
    await t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: 0 }); // neutral
    await t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: 1 }); // positive
    await t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: 2 }); // positive
    await t.mutation(internal.functions.agents.updateRelationship, { agentAId, agentBId, delta: -1 }); // negative

    relationship = await t.query(api.functions.world.getRelationship, {
      agentAId,
      agentBId,
    });
    expect(relationship?.lastInteractionType).toBe("negative");
    expect(relationship?.valenceHistory).toHaveLength(5);
    expect(relationship?.valenceHistory[0]).toBe("negative");
    expect(relationship?.valenceHistory).toEqual(["negative", "positive", "positive", "neutral", "negative"]);
  });
});
