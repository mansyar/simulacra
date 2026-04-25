import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import WorldHUD from "../components/WorldHUD";
import { useQuery } from "convex/react";

// Mock convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

test("WorldHUD renders correctly for different weather", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUseQuery = useQuery as any;
  
  // Sunny
  mockUseQuery.mockReturnValue({
    weather: "sunny",
    timeOfDay: 10.5,
    dayCount: 5,
  });
  
  const { rerender } = render(<WorldHUD />);
  expect(screen.getByText("sunny")).toBeDefined();
  expect(screen.getByText("10:30")).toBeDefined();
  expect(screen.getByText("Day 5")).toBeDefined();

  // Cloudy
  mockUseQuery.mockReturnValue({
    weather: "cloudy",
    timeOfDay: 14.75,
    dayCount: 5,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("cloudy")).toBeDefined();
  expect(screen.getByText("14:45")).toBeDefined();

  // Rainy
  mockUseQuery.mockReturnValue({
    weather: "rainy",
    timeOfDay: 20.1,
    dayCount: 5,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("rainy")).toBeDefined();
  expect(screen.getByText("20:06")).toBeDefined();

  // Stormy
  mockUseQuery.mockReturnValue({
    weather: "stormy",
    timeOfDay: 2.5,
    dayCount: 6,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("stormy")).toBeDefined();
  expect(screen.getByText("02:30")).toBeDefined();

  // Unknown weather (default icon fallback)
  mockUseQuery.mockReturnValue({
    weather: "unknown",
    timeOfDay: 12,
    dayCount: 1,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("unknown")).toBeDefined();
});

test("WorldHUD returns null when state is missing", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (useQuery as any).mockReturnValue(null);
  const { container } = render(<WorldHUD />);
  expect(container.firstChild).toBeNull();
});
