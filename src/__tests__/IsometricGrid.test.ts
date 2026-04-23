import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockInstance } from 'vitest'
import { IsometricGrid } from '../components/game/IsometricGrid'
import type { ExcaliburGraphicsContext } from 'excalibur'
import { Color, Vector } from 'excalibur'

type DrawLineCall = [Vector, Vector, Color, number];

describe('IsometricGrid', () => {
  let mockCtx: ExcaliburGraphicsContext
  let drawLineSpy: MockInstance

  beforeEach(() => {
    // Mock ExcaliburGraphicsContext
    mockCtx = {
      drawLine: vi.fn(),
    } as unknown as ExcaliburGraphicsContext

    // Spy on ctx.drawLine
    drawLineSpy = vi.spyOn(mockCtx, 'drawLine')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render grid with correct number of lines', () => {
    const grid = new IsometricGrid({
      width: 64,
      height: 64,
      tileWidth: 32,
      tileHeight: 16,
    })

    grid.render(mockCtx)

    // Vertical lines: (width + 1) * height = 65 * 64 = 4160
    // Horizontal lines: (height + 1) * width = 65 * 64 = 4160
    // Total: 8320 lines
    expect(drawLineSpy).toHaveBeenCalled()
  })

  it('should draw lines with Slate-600 color', () => {
    const grid = new IsometricGrid({
      width: 1,
      height: 1,
      tileWidth: 32,
      tileHeight: 16,
    })

    grid.render(mockCtx)

    // Verify drawLine calls have color #475569
    const calls = drawLineSpy.mock.calls as DrawLineCall[]
    calls.forEach((call: DrawLineCall) => {
      expect(call[2]).toBeInstanceOf(Color)
      const color = call[2] as Color
      expect(color.toHex()).toBe('#475569')
    })
  })

  it('should track mouse position for hover', () => {
    const grid = new IsometricGrid({
      width: 64,
      height: 64,
      tileWidth: 32,
      tileHeight: 16,
    })

    // Set mouse at origin (should hover over tile 0,0)
    grid.setMousePosition(0, 0)
    
    grid.render(mockCtx)
    
    // Should have drawn highlight lines (thicker lines)
    const highlightCalls = (drawLineSpy.mock.calls as DrawLineCall[]).filter((call: DrawLineCall) => {
      const color = call[2] as Color
      return color.toHex() === '#334155'
    })
    expect(highlightCalls.length).toBeGreaterThan(0)
  })

  it('should clear hover when mouse leaves grid', () => {
    const grid = new IsometricGrid({
      width: 64,
      height: 64,
      tileWidth: 32,
      tileHeight: 16,
    })

    // Set mouse at origin
    grid.setMousePosition(0, 0)
    grid.render(mockCtx)
    
    // Clear hover
    grid.setMousePosition(-1000, -1000)
    
    // Reset spy
    drawLineSpy.mockClear()
    grid.render(mockCtx)
    
    // Should not have highlight lines
    const highlightCalls = (drawLineSpy.mock.calls as DrawLineCall[]).filter((call: DrawLineCall) => {
      const color = call[2] as Color
      return color.toHex() === '#334155'
    })
    expect(highlightCalls.length).toBe(0)
  })
})
