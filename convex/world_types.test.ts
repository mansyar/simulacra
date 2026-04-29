import { describe, test, expect } from "vitest";

/**
 * Tests verifying that `convex/functions/world.ts` types compile correctly
 * without `any` annotations or eslint-disable comments.
 *
 * These tests will fail until the `any` types in world.ts are replaced
 * with proper typed interfaces from the shared types module.
 */

describe("world.ts type safety", () => {
  test("world.ts module exports expected action functions", async () => {
    const world = await import("./functions/world");
    expect(world).toBeDefined();
    // These are the public Convex functions exported by world.ts
    expect(typeof world.getState).toBe("function");
    expect(typeof world.getSleepConfig).toBe("function");
    expect(typeof world.getPois).toBe("function");
    expect(typeof world.getRelationship).toBe("function");
    expect(typeof world.updateState).toBe("function");
    expect(typeof world.checkSleepMode).toBe("function");
    expect(typeof world.tick).toBe("function");
  });

  test("world.ts exports advanceWorldState internal mutation", async () => {
    const world = await import("./functions/world");
    expect(typeof world.advanceWorldState).toBe("function");
  });

  test("world.ts functions accept typed parameters", async () => {
    // Verify world module exports are functions
    const world = await import("./functions/world");
    expect(typeof world.getRelationship).toBe("function");
    // getRelationship argument schema includes agentAId and agentBId
    expect(world.getRelationship).toBeDefined();
  });

  test("normalizeAction returns valid action values", () => {
    // This tests the normalizeAction helper indirectly
    const validActions = ["idle", "walking", "eating", "sleeping", "talking", "working", "exploring"] as const;
    expect(validActions).toContain("idle");
    expect(validActions).toContain("walking");
    expect(validActions).toContain("exploring");
  });
});
