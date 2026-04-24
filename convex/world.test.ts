/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("world state query and mutation", async () => {
  const t = convexTest(schema, modules);
  
  // Initial state should be null
  let state = await t.query(api.functions.world.getState);
  expect(state).toBeNull();

  // Create state via mutation
  await t.mutation(api.functions.world.updateState, {
    weather: "rainy",
    timeOfDay: 18,
  });

  state = await t.query(api.functions.world.getState);
  expect(state).toBeTruthy();
  expect(state?.weather).toBe("rainy");
  expect(state?.timeOfDay).toBe(18);
  expect(state?.dayCount).toBe(1); // default value

  // Update existing state
  await t.mutation(api.functions.world.updateState, {
    weather: "sunny",
    dayCount: 2,
  });

  state = await t.query(api.functions.world.getState);
  expect(state?.weather).toBe("sunny");
  expect(state?.dayCount).toBe(2);
  expect(state?.timeOfDay).toBe(18); // unchanged
});
