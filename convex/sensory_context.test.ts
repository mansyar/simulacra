/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Sensory Context in buildFullContext", () => {
  test("includes recent sensory events in the full context", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Test Agent",
      archetype: "socialite",
      gridX: 0,
      gridY: 0,
    });

    // Add 3 events for the agent
    await t.mutation(api.functions.memory.addEvent, {
      agentId,
      type: "movement",
      description: "Moved to the town square",
      gridX: 5,
      gridY: 3,
    });

    await t.mutation(api.functions.memory.addEvent, {
      agentId,
      type: "interaction",
      description: "Greeted a fellow villager",
      gridX: 5,
      gridY: 3,
      targetId: agentId,
    });

    await t.mutation(api.functions.memory.addEvent, {
      agentId,
      type: "need_change",
      description: "Hunger decreased after eating",
      gridX: 5,
      gridY: 3,
    });

    // Build full context
    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId,
      query: "test query",
    });

    // Verify events are present in the events field (without header — header added by decision)
    expect(fullContext.events).toContain("Moved to the town square");
    expect(fullContext.events).toContain("Greeted a fellow villager");
    expect(fullContext.events).toContain("Hunger decreased after eating");
  });

  test("shows placeholder when agent has no events", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Lonely Agent",
      archetype: "philosopher",
      gridX: 10,
      gridY: 10,
    });

    // Build full context for agent with no events
    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId,
      query: "test query",
    });

    // Should include the empty state placeholder
    expect(fullContext.events).toContain("(No recent events)");
  });

  test("formats events as chronological list with relative timestamps", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Eventful Agent",
      archetype: "explorer",
      gridX: 0,
      gridY: 0,
    });

    // Add events in a specific order
    await t.mutation(api.functions.memory.addEvent, {
      agentId,
      type: "movement",
      description: "First event",
      gridX: 1,
      gridY: 1,
    });

    await t.mutation(api.functions.memory.addEvent, {
      agentId,
      type: "conversation",
      description: "Second event",
      gridX: 2,
      gridY: 2,
    });

    await t.mutation(api.functions.memory.addEvent, {
      agentId,
      type: "movement",
      description: "Third event",
      gridX: 3,
      gridY: 3,
    });

    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId,
      query: "test query",
    });

    // Events are in the events field
    expect(fullContext.events).toBeDefined();

    // Events should contain timestamps in the format "[X min ago]" or "[<1 min ago]"
    expect(fullContext.events).toMatch(/\[(\d+|<1) min ago\]/);

    // Events should appear in oldest-first order
    const firstIdx = fullContext.events.indexOf("First event");
    const secondIdx = fullContext.events.indexOf("Second event");
    const thirdIdx = fullContext.events.indexOf("Third event");
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
  });

  test("sensory events appear before relationships and memories", async () => {
    const t = convexTest(schema, modules);

    const agentAId = await t.mutation(api.functions.agents.create, {
      name: "Ordered Agent",
      archetype: "builder",
      gridX: 0,
      gridY: 0,
    });

    // Create a second agent so we have a relationship to reference
    const agentBId = await t.mutation(api.functions.agents.create, {
      name: "Friend Agent",
      archetype: "socialite",
      gridX: 1,
      gridY: 1,
    });

    await t.mutation(api.functions.memory.addEvent, {
      agentId: agentAId,
      type: "movement",
      description: "Took a stroll",
      gridX: 2,
      gridY: 2,
    });

    // Create a relationship between the agents
    await t.mutation(internal.functions.relationships.updateRelationship, {
      agentAId,
      agentBId,
      delta: 5,
    });

    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId: agentAId,
      query: "test query",
    });

    // Events, relationships, and memories are now separate fields
    expect(fullContext.events).toBeDefined();
    expect(fullContext.relationshipContext).toBeDefined();
    expect(fullContext.memories).toBeDefined();

    // Events field contains event descriptions
    expect(fullContext.events).toContain("Took a stroll");
    // Relationship context contains relationship info
    expect(fullContext.relationshipContext).toContain("Friend Agent");
  });
});
