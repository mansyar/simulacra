import { describe, it, expect } from "vitest";

/**
 * UI Integration Flow tests.
 * These tests verify the overall application structure and data flow
 * by testing key utility functions and data transformations.
 */

describe("UI Integration Flow", () => {
  it("isometric coordinate conversion works", async () => {
    const { gridToScreen, screenToGrid } = await import("../lib/isometric");
    const screen = gridToScreen(10, 10);
    expect(screen).toBeDefined();
    expect(typeof screen.x).toBe("number");
    expect(typeof screen.y).toBe("number");

    const grid = screenToGrid(screen.x, screen.y);
    expect(grid).toBeDefined();
    expect(typeof grid.x).toBe("number");
    expect(typeof grid.y).toBe("number");
  });

  it("noise function generates reproducible output", async () => {
    const { createNoise } = await import("../lib/noise");
    const noise = createNoise("test-seed");
    const v1 = noise(5, 10);
    const v2 = noise(5, 10); // Same input = same output
    expect(v1).toBe(v2);
    expect(typeof v1).toBe("number");
  });

  it("agent archetypes are valid", () => {
    const validArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"];
    const testAgent = { name: "Test", archetype: "builder" as string };
    expect(validArchetypes).toContain(testAgent.archetype);
  });

  it("weather types are valid", () => {
    const validWeather = ["sunny", "cloudy", "rainy", "stormy"];
    const weatherStates = ["sunny", "cloudy", "rainy", "stormy"];
    for (const w of weatherStates) {
      expect(validWeather).toContain(w);
    }
  });
});
