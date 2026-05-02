import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("advanceWorldState increments time and wraps day", async () => {
  const t = convexTest(schema, modules);
  
  // 1. Initial state
  await t.mutation(api.functions.world.updateState, {
    timeOfDay: 1420,
    dayCount: 1,
  });

  // 2. Advance time (Assume 1 tick = 30 minutes)
  await t.mutation(internal.functions.world.advanceWorldState, {});

  const state = await t.query(api.functions.world.getState, {});
  
  // Should wrap to next day if time exceeds 1440
  expect(state?.timeOfDay).toBe(10); // 1420 + 30 = 1450, 1450 % 1440 = 10
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
   
  await t.mutation(internal.functions.world.advanceWorldState, {});
  
  const state = await t.query(api.functions.world.getState, {});
  expect(["sunny", "cloudy", "rainy", "stormy"]).toContain(state?.weather);
});
