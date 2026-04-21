import { describe, it, expect } from 'vitest'
import { gridToScreen, screenToGrid, TILE_WIDTH, TILE_HEIGHT } from '../lib/isometric'

describe('Isometric Coordinate Utilities', () => {
  describe('gridToScreen', () => {
    it('should convert (0,0) to (0,0)', () => {
      const result = gridToScreen(0, 0)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should convert (1,0) to correct screen coordinates', () => {
      const result = gridToScreen(1, 0)
      // screenX = (1 - 0) * (32/2) = 16
      // screenY = (1 + 0) * (16/2) = 8
      expect(result.x).toBe(16)
      expect(result.y).toBe(8)
    })

    it('should convert (0,1) to correct screen coordinates', () => {
      const result = gridToScreen(0, 1)
      // screenX = (0 - 1) * 16 = -16
      // screenY = (0 + 1) * 8 = 8
      expect(result.x).toBe(-16)
      expect(result.y).toBe(8)
    })

    it('should convert (1,1) to correct screen coordinates', () => {
      const result = gridToScreen(1, 1)
      // screenX = (1 - 1) * 16 = 0
      // screenY = (1 + 1) * 8 = 16
      expect(result.x).toBe(0)
      expect(result.y).toBe(16)
    })
  })

  describe('screenToGrid', () => {
    it('should convert (0,0) to (0,0)', () => {
      const result = screenToGrid(0, 0)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should convert (16,8) to (1,0)', () => {
      const result = screenToGrid(16, 8)
      expect(result.x).toBe(1)
      expect(result.y).toBe(0)
    })

    it('should convert (-16,8) to (0,1)', () => {
      const result = screenToGrid(-16, 8)
      expect(result.x).toBe(0)
      expect(result.y).toBe(1)
    })

    it('should convert (0,16) to (1,1)', () => {
      const result = screenToGrid(0, 16)
      expect(result.x).toBe(1)
      expect(result.y).toBe(1)
    })
  })

  describe('round-trip conversion', () => {
    it('should preserve grid coordinates after round-trip', () => {
      const original = { x: 10, y: 20 }
      const screen = gridToScreen(original.x, original.y)
      const back = screenToGrid(screen.x, screen.y)
      expect(back.x).toBe(original.x)
      expect(back.y).toBe(original.y)
    })
  })

  describe('constants', () => {
    it('should have TILE_WIDTH = 32', () => {
      expect(TILE_WIDTH).toBe(32)
    })

    it('should have TILE_HEIGHT = 16', () => {
      expect(TILE_HEIGHT).toBe(16)
    })
  })
})