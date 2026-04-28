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

    // Verify the "## Recent Events" header is present
    expect(fullContext).toContain("## Recent Events");

    // Verify all 3 event descriptions are present
    expect(fullContext).toContain("Moved to the town square");
    expect(fullContext).toContain("Greeted a fellow villager");
    expect(fullContext).toContain("Hunger decreased after eating");
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
    expect(fullContext).toContain("## Recent Events");
    expect(fullContext).toContain("(No recent events)");
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

    // Extract the "## Recent Events" section
    const eventsSection = fullContext.split("## Recent Events")[1];
    expect(eventsSection).toBeDefined();

    // Events should contain timestamps in the format "[X min ago]" or "[<1 min ago]"
    expect(eventsSection).toMatch(/\[(\d+|<1) min ago\]/);

    // Events should appear in oldest-first order
    const firstIdx = eventsSection.indexOf("First event");
    const secondIdx = eventsSection.indexOf("Second event");
    const thirdIdx = eventsSection.indexOf("Third event");
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
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId,
      agentBId,
      delta: 5,
    });

    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId: agentAId,
      query: "test query",
    });

    // "## Recent Events" should come before "Your Relationships" and "Relevant Memories"
    const recentEventsIdx = fullContext.indexOf("## Recent Events");
    const relationshipsIdx = fullContext.indexOf("Your Relationships");
    const memoriesIdx = fullContext.indexOf("Relevant Memories");

    expect(recentEventsIdx).not.toBe(-1);
    expect(relationshipsIdx).not.toBe(-1);

    // Recent Events section should appear before relationships
    expect(recentEventsIdx).toBeLessThan(relationshipsIdx);

    // If memories exist, they should come after relationships
    if (memoriesIdx !== -1) {
      expect(relationshipsIdx).toBeLessThan(memoriesIdx);
    }
  });
});
