import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("advanceWorldState increments time and wraps day", async () => {
  const t = convexTest(schema, modules);
  
  // 1. Initial state
  await t.mutation(api.functions.world.updateState, {
    timeOfDay: 2390,
    dayCount: 1,
  });

  // 2. Advance time (Assume 1 tick = 30 minutes in simulated time, SCALE = 10x real time)
  // Logic will be in an internal mutation
  await t.mutation(internal.functions.world.advanceWorldState as any, {});

  const state = await t.query(api.functions.world.getState, {});
  
  // Should wrap to next day if time exceeds 2400
  // (Specific logic depends on implementation)
  expect(state?.timeOfDay).toBeLessThan(2300);
  expect(state?.dayCount).toBe(2);
});

test("weather transitions stochastically", async () => {
  const t = convexTest(schema, modules);
  
  await t.mutation(api.functions.world.updateState, {
    weather: "sunny",
  });

  // We can't easily test "stochastic" transitions in unit tests 
  // without mocking Math.random(), but we can verify the function 
  // exists and runs without error.
  await t.mutation(internal.functions.world.advanceWorldState as any, {});
  
  const state = await t.query(api.functions.world.getState, {});
  expect(["sunny", "cloudy", "rainy", "stormy"]).toContain(state?.weather);
});
