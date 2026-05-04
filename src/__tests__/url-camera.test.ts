import { describe, it, expect, beforeEach } from 'vitest'
import { parseCameraUrlParams, buildCameraUrlSearchString } from '../lib/url-camera'

describe('parseCameraUrlParams', () => {
  it('should parse ?focus=agent1&zoom=1.5', () => {
    const params = new URLSearchParams('focus=agent1&zoom=1.5')
    const result = parseCameraUrlParams(params)
    expect(result.focusAgentId).toBe('agent1')
    expect(result.zoom).toBe(1.5)
    expect(result.centerGridX).toBeUndefined()
    expect(result.centerGridY).toBeUndefined()
  })

  it('should parse ?cx=32&cy=32 when no focus param', () => {
    const params = new URLSearchParams('cx=32&cy=32')
    const result = parseCameraUrlParams(params)
    expect(result.focusAgentId).toBeUndefined()
    expect(result.centerGridX).toBe(32)
    expect(result.centerGridY).toBe(32)
    expect(result.zoom).toBeUndefined()
  })

  it('should return empty params when no camera URL params present', () => {
    const params = new URLSearchParams('')
    const result = parseCameraUrlParams(params)
    expect(result.focusAgentId).toBeUndefined()
    expect(result.zoom).toBeUndefined()
    expect(result.centerGridX).toBeUndefined()
    expect(result.centerGridY).toBeUndefined()
  })

  it('should parse zoom at the edge of range (0.5 and 2.0)', () => {
    const params1 = new URLSearchParams('zoom=0.5')
    expect(parseCameraUrlParams(params1).zoom).toBe(0.5)

    const params2 = new URLSearchParams('zoom=2')
    expect(parseCameraUrlParams(params2).zoom).toBe(2)
  })

  it('should reject zoom outside valid range', () => {
    const params1 = new URLSearchParams('zoom=0.1')
    expect(parseCameraUrlParams(params1).zoom).toBeUndefined()

    const params2 = new URLSearchParams('zoom=5')
    expect(parseCameraUrlParams(params2).zoom).toBeUndefined()
  })

  it('should reject invalid zoom value', () => {
    const params = new URLSearchParams('zoom=abc')
    expect(parseCameraUrlParams(params).zoom).toBeUndefined()
  })

  it('should reject cx/cy if either is missing', () => {
    const paramsOnlyCx = new URLSearchParams('cx=32')
    const resultOnlyCx = parseCameraUrlParams(paramsOnlyCx)
    expect(resultOnlyCx.centerGridX).toBeUndefined()

    const paramsOnlyCy = new URLSearchParams('cy=32')
    const resultOnlyCy = parseCameraUrlParams(paramsOnlyCy)
    expect(resultOnlyCy.centerGridY).toBeUndefined()
  })

  it('should handle focus with zoom and cx/cy simultaneously (focus takes priority in GameCanvas)', () => {
    const params = new URLSearchParams('focus=agent1&zoom=1.5&cx=32&cy=32')
    const result = parseCameraUrlParams(params)
    expect(result.focusAgentId).toBe('agent1')
    expect(result.zoom).toBe(1.5)
    expect(result.centerGridX).toBe(32)
    expect(result.centerGridY).toBe(32)
    // Priority logic is handled by GameCanvas, not the parser
  })
})

describe('buildCameraUrlSearchString', () => {
  beforeEach(() => {
    // Reset window.location for each test
    window.history.replaceState({}, '', window.location.pathname)
  })

  it('should build search string with zoom and center coords', () => {
    const result = buildCameraUrlSearchString(1.5, 32, 16)
    expect(result).toContain('zoom=1.5')
    expect(result).toContain('cx=32')
    expect(result).toContain('cy=16')
  })

  it('should round zoom to 2 decimal places', () => {
    const result = buildCameraUrlSearchString(1.33333, 32, 16)
    expect(result).toContain('zoom=1.33')
  })

  it('should clear focus param when writing camera state', () => {
    // Set initial URL with focus param
    window.history.replaceState({}, '', '?focus=agent1')

    const result = buildCameraUrlSearchString(1.0, 32, 16)
    expect(result).not.toContain('focus')
    expect(result).toContain('zoom=1')
    expect(result).toContain('cx=32')
    expect(result).toContain('cy=16')
  })

  it('should preserve non-camera URL params', () => {
    window.history.replaceState({}, '', '?other=value')

    const result = buildCameraUrlSearchString(1.0, 10, 10)
    expect(result).toContain('other=value')
    expect(result).toContain('zoom=1')
    expect(result).toContain('cx=10')
    expect(result).toContain('cy=10')
  })
})
