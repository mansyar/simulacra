import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import WorldHUD from "../components/WorldHUD";
import { useQuery } from "convex/react";

// Mock convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

test("WorldHUD renders correctly for different weather", () => {
  const mockUseQuery = vi.mocked(useQuery);
  
  // Sunny (10:30 = 630 mins)
  mockUseQuery.mockReturnValue({
    weather: "sunny",
    timeOfDay: 630,
    dayCount: 5,
  });
  
  const { rerender } = render(<WorldHUD />);
  expect(screen.getByText("sunny")).toBeDefined();
  expect(screen.getByText("10:30")).toBeDefined();
  expect(screen.getByText("Day 5")).toBeDefined();

  // Cloudy (14:45 = 885 mins)
  mockUseQuery.mockReturnValue({
    weather: "cloudy",
    timeOfDay: 885,
    dayCount: 5,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("cloudy")).toBeDefined();
  expect(screen.getByText("14:45")).toBeDefined();

  // Rainy (20:06 = 1206 mins)
  mockUseQuery.mockReturnValue({
    weather: "rainy",
    timeOfDay: 1206,
    dayCount: 5,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("rainy")).toBeDefined();
  expect(screen.getByText("20:06")).toBeDefined();

  // Stormy (02:30 = 150 mins)
  mockUseQuery.mockReturnValue({
    weather: "stormy",
    timeOfDay: 150,
    dayCount: 6,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("stormy")).toBeDefined();
  expect(screen.getByText("02:30")).toBeDefined();

  // Unknown weather (default icon fallback)
  mockUseQuery.mockReturnValue({
    weather: "unknown",
    timeOfDay: 720,
    dayCount: 1,
  });
  rerender(<WorldHUD />);
  expect(screen.getByText("unknown")).toBeDefined();
});

test("WorldHUD returns null when state is missing", () => {
  vi.mocked(useQuery).mockReturnValue(null);
  const { container } = render(<WorldHUD />);
  expect(container.firstChild).toBeNull();
});
