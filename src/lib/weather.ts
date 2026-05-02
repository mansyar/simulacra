/**
 * Weather speed multiplier utility.
 *
 * Maps weather types to movement speed multipliers, matching the backend logic
 * in convex/functions/world.ts. Used by both frontend (AgentSprite) and backend
 * to keep movement prediction consistent in all weather conditions.
 *
 * @param weather - Weather type string from world_state
 * @returns Speed multiplier (1.0 for normal, <1.0 for slowed movement)
 */

const WEATHER_SPEED_MULTIPLIERS: Record<string, number> = {
  sunny: 1.0,
  cloudy: 1.0,
  rainy: 0.8,
  stormy: 0.5,
}

export function getWeatherSpeedMultiplier(weather?: string): number {
  if (weather === undefined) return 1.0
  return WEATHER_SPEED_MULTIPLIERS[weather] ?? 1.0
}
