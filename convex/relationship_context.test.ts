/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Relationship Context", () => {
  test("buildRelationshipContext formats relationship data into human-readable strings", async () => {
    const t = convexTest(schema, modules);

    // Create test agents
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

    const agentCId = await t.mutation(api.functions.agents.create, {
      name: "Charlie",
      archetype: "explorer",
      gridX: 2,
      gridY: 2,
    });

    // Create relationships with different affinities
    await t.mutation(internal.functions.relationships.updateRelationship, {
      agentAId,
      agentBId,
      delta: 14, // Alice likes Bob
    });

    await t.mutation(internal.functions.relationships.updateRelationship, {
      agentAId,
      agentBId: agentCId,
      delta: -8, // Alice dislikes Charlie
    });

    // Build relationship context for Alice
    const context = await t.action(api.functions.ai.buildRelationshipContext, {
      agentId: agentAId,
    });

    // Verify the context contains formatted relationship data
    expect(context).toContain("Your Relationships");
    expect(context).toContain("Bob");
    expect(context).toContain("Charlie");
    expect(context).toContain("affinity");
  });

  test("buildRelationshipContext handles agents with no relationships", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Isolated",
      archetype: "philosopher",
      gridX: 10,
      gridY: 10,
    });

    // Build relationship context for agent with no relationships
    const context = await t.action(api.functions.ai.buildRelationshipContext, {
      agentId,
    });

    // Should return a message about no relationships
    expect(context).toContain("no established relationships");
  });

  test("buildRelationshipContext handles recency-weighted affinity", async () => {
    const t = convexTest(schema, modules);

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

    // Create a relationship with a recent interaction
    await t.mutation(internal.functions.relationships.updateRelationship, {
      agentAId,
      agentBId,
      delta: 10,
    });

    // Build relationship context - should include recency-weighted affinity
    const context = await t.action(api.functions.ai.buildRelationshipContext, {
      agentId: agentAId,
    });

    expect(context).toContain("Agent B");
  });

  test("computeRecencyWeightedAffinity decays older interactions", async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Test that recency weighting is applied
    const result = await t.action(api.functions.ai.computeRecencyWeightedAffinity, {
      lastInteractionAt: oneWeekAgo,
      currentTime: now,
      affinity: 10,
    });

    // The weighted affinity should be less than the original due to time decay
    expect(result).toBeLessThan(10);
    expect(result).toBeGreaterThan(0);
  });

  test("computeRecencyWeightedAffinity handles recent interactions", async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const result = await t.action(api.functions.ai.computeRecencyWeightedAffinity, {
      lastInteractionAt: oneHourAgo,
      currentTime: now,
      affinity: 10,
    });

    // Recent interactions should have minimal decay
    expect(result).toBeCloseTo(10, 1);
  });

  test("buildRelationshipContext is integrated into buildFullContext", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Test Agent",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Friend Agent",
      archetype: "builder",
      gridX: 1,
      gridY: 1,
    });

    // Create a relationship
    await t.mutation(internal.functions.relationships.updateRelationship, {
      agentAId,
      agentBId,
      delta: 5,
    });

    // Build full context should include relationship information
    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId: agentAId,
      query: "test query",
    });

    // Verify relationship context is included in the relationshipContext field
    expect(fullContext.relationshipContext).toContain("Friend Agent");
    expect(fullContext.relationshipContext).toContain("affinity");
  });
});
