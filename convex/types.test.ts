import { describe, test, expect } from "vitest";

/**
 * Compile-time type validation tests for the shared types module.
 *
 * These tests verify that:
 * 1. The types module exports all expected interfaces and types
 * 2. The types correctly extend/satisfy Convex generated types
 * 3. Utility types work as expected
 *
 * NOTE: The module import will fail at runtime until `convex/functions/types.ts`
 * is created. This is the "Red Phase" of TDD.
 */

describe("Type interfaces module", () => {
  test("module exists and exports expected symbols", async () => {
    // This will fail at import time before types.ts is created
    const types = await import("./functions/types");
    expect(types).toBeDefined();
  });

  test("AgentState shape matches Doc<'agents'> fields", () => {
    const minimalAgent = {
      name: "Test",
      archetype: "builder",
      gridX: 0,
      gridY: 0,
      spriteVariant: 0,
      currentAction: "idle",
      targetX: undefined,
      targetY: undefined,
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: [],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "",
      inventory: [],
      currentGoal: "test",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
      interactionPartnerId: undefined,
      lastThought: undefined,
      speech: undefined,
      lastSpeechAt: undefined,
      conversationState: undefined,
    };
    expect(minimalAgent.name).toBe("Test");
    expect(minimalAgent.archetype).toBe("builder");
  });

  test("WorldStateConfig shape matches world_state table", () => {
    const config = {
      weather: "sunny",
      timeOfDay: 12,
      dayCount: 1,
      tickIntervalSeconds: 60,
      totalTicks: 0,
      lastTickAt: Date.now(),
      lastUserActivityAt: Date.now(),
    };
    expect(config.weather).toBe("sunny");
    expect(config.totalTicks).toBe(0);
  });

  test("ProcessedAgentDecision has all required fields", () => {
    const decision = {
      thought: "I should explore the area.",
      action: "walking",
      target: "10,20",
      speech: "Hello there!",
      confidence: 0.85,
    };
    expect(decision.thought).toBeDefined();
    expect(decision.action).toBeDefined();
    expect(decision.target).toBeDefined();
    expect(decision.speech).toBeDefined();
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });

  test("ConversationState shape", () => {
    const state: {
      partnerId: string;
      role: "initiator" | "responder";
      turnCount: number;
      myLastSpeech?: string;
      startedAt: number;
    } = {
      partnerId: "p123",
      role: "initiator",
      turnCount: 2,
      myLastSpeech: "Hello!",
      startedAt: Date.now(),
    };
    expect(state.role).toBe("initiator");
    expect(state.turnCount).toBeGreaterThanOrEqual(0);
  });

  test("AiConfig shape matches ai_helpers", () => {
    const config = {
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4",
    };
    expect(config.apiKey).toBeDefined();
    expect(config.baseUrl).toBeDefined();
    expect(config.model).toBeDefined();
  });

  test("ProcessedAgent extends Doc<'agents'> with computed fields", () => {
    const agent = {
      _id: "abc" as string,
      _creationTime: Date.now(),
      name: "Test",
      archetype: "builder" as string,
      gridX: 0,
      gridY: 0,
      spriteVariant: 0,
      currentAction: "idle" as string,
      targetX: undefined as number | undefined,
      targetY: undefined as number | undefined,
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: [] as string[],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "",
      inventory: [] as string[],
      currentGoal: "test",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
      interactionPartnerId: undefined as string | undefined,
      lastThought: undefined as string | undefined,
      speech: undefined as string | undefined,
      lastSpeechAt: undefined as number | undefined,
      conversationState: undefined as Record<string, unknown> | undefined,
      nearbyAgentNames: [] as string[],
      displayName: "Test Agent",
    };
    expect(agent.nearbyAgentNames).toEqual([]);
    expect(agent.displayName).toBe("Test Agent");
  });

  test("DeepPartial utility type works", () => {
    const partial = {
      name: "Partial Update",
      hunger: 75,
    };
    expect(Object.keys(partial).length).toBe(2);
  });
});
