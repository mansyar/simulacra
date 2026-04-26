import { describe, it, expect } from 'vitest'
import { createNoise } from '../lib/noise'

describe('Noise Utilities', () => {
  it('should generate consistent noise values for same inputs', () => {
    const noise = createNoise('seed1')
    const val1 = noise(10, 20)
    const val2 = noise(10, 20)
    expect(val1).toBe(val2)
  })

  it('should generate different noise values for different inputs', () => {
    const noise = createNoise('seed1')
    const val1 = noise(10, 20)
    const val2 = noise(11, 20)
    expect(val1).not.toBe(val2)
  })

  it('should generate different noise values for different seeds', () => {
    const noise1 = createNoise('seed1')
    const noise2 = createNoise('seed2')
    const val1 = noise1(10, 20)
    const val2 = noise2(10, 20)
    expect(val1).not.toBe(val2)
  })

  it('should return values between -1 and 1', () => {
    const noise = createNoise('seed1')
    for (let i = 0; i < 100; i++) {
      const val = noise(Math.random() * 100, Math.random() * 100)
      expect(val).toBeGreaterThanOrEqual(-1)
      expect(val).toBeLessThanOrEqual(1)
    }
  })
})
