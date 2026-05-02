import { describe, it, expect } from 'vitest'
import { getWeatherSpeedMultiplier } from '../lib/weather'

describe('getWeatherSpeedMultiplier', () => {
  it('returns 1.0 for sunny weather', () => {
    expect(getWeatherSpeedMultiplier('sunny')).toBe(1.0)
  })

  it('returns 1.0 for cloudy weather', () => {
    expect(getWeatherSpeedMultiplier('cloudy')).toBe(1.0)
  })

  it('returns 0.8 for rainy weather', () => {
    expect(getWeatherSpeedMultiplier('rainy')).toBe(0.8)
  })

  it('returns 0.5 for stormy weather', () => {
    expect(getWeatherSpeedMultiplier('stormy')).toBe(0.5)
  })

  it('returns 1.0 when weather is undefined (graceful degradation)', () => {
    expect(getWeatherSpeedMultiplier(undefined)).toBe(1.0)
  })

  it('returns 1.0 for unknown weather values', () => {
    expect(getWeatherSpeedMultiplier('unknown' as string)).toBe(1.0)
  })
})
