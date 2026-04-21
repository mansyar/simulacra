import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { IsometricGrid } from '../components/game/IsometricGrid'
import type { ExcaliburGraphicsContext } from 'excalibur'
import { Debug, Color, Vector } from 'excalibur'

describe('IsometricGrid', () => {
  let mockCtx: ExcaliburGraphicsContext
  let drawPolygonSpy: any
  let drawLineSpy: any

  beforeEach(() => {
    // Mock ExcaliburGraphicsContext
    mockCtx = {
      drawLine: vi.fn(),
    } as unknown as ExcaliburGraphicsContext

    // Spy on Debug.drawPolygon
    drawPolygonSpy = vi.spyOn(Debug, 'drawPolygon').mockImplementation(() => {})
    // Spy on ctx.drawLine
    drawLineSpy = vi.spyOn(mockCtx, 'drawLine')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render grid with correct number of tiles', () => {
    const grid = new IsometricGrid({
      width: 64,
      height: 64,
      tileWidth: 32,
      tileHeight: 16,
    })

    grid.render(mockCtx)

    // Expect Debug.drawPolygon to be called for each tile (64*64 = 4096)
    expect(drawPolygonSpy).toHaveBeenCalledTimes(4096)
    // Expect drawLine to be called for each edge (approx 4 per tile, but edges shared)
    expect(drawLineSpy).toHaveBeenCalled()
  })

  it('should draw correct diamond shape for a single tile', () => {
    const grid = new IsometricGrid({
      width: 1,
      height: 1,
      tileWidth: 32,
      tileHeight: 16,
    })

    grid.render(mockCtx)

    // Expect Debug.drawPolygon to be called once with four vertices
    expect(drawPolygonSpy).toHaveBeenCalledTimes(1)
    const polygonCall = drawPolygonSpy.mock.calls[0]
    const vertices = polygonCall[0] as Vector[]
    expect(vertices).toHaveLength(4)
    // Check that vertices are correct (approximate)
    // Expect top, right, bottom, left
    expect(vertices[0].x).toBeCloseTo(0)
    expect(vertices[0].y).toBeCloseTo(-8) // halfHeight = 8
    expect(vertices[1].x).toBeCloseTo(16) // halfWidth = 16
    expect(vertices[1].y).toBeCloseTo(0)
    expect(vertices[2].x).toBeCloseTo(0)
    expect(vertices[2].y).toBeCloseTo(8)
    expect(vertices[3].x).toBeCloseTo(-16)
    expect(vertices[3].y).toBeCloseTo(0)

    // Expect drawLine to be called 4 times
    expect(drawLineSpy).toHaveBeenCalledTimes(4)
  })

  it('should fill tiles with Slate-800 color', () => {
    const grid = new IsometricGrid({
      width: 1,
      height: 1,
      tileWidth: 32,
      tileHeight: 16,
    })

    grid.render(mockCtx)

    // Verify Debug.drawPolygon called with color #1e293b
    const polygonCall = drawPolygonSpy.mock.calls[0]
    const options = polygonCall[1] as { color?: Color }
    expect(options.color).toBeDefined()
    expect(options.color?.toHex()).toBe('#1e293b')
  })

  it('should draw grid lines with Slate-600 color', () => {
    const grid = new IsometricGrid({
      width: 1,
      height: 1,
      tileWidth: 32,
      tileHeight: 16,
    })

    grid.render(mockCtx)

    // Verify drawLine calls have color #475569
    const calls = drawLineSpy.mock.calls
    calls.forEach((call: any) => {
      expect(call[2]).toBeInstanceOf(Color)
      // Color comparison: we can check hex
      const color = call[2] as Color
      expect(color.toHex()).toBe('#475569')
    })
  })
})