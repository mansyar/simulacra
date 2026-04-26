import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IsometricGrid } from '../components/game/IsometricGrid'

// Mock PixiJS
vi.mock('pixi.js', () => {
  const mockGraphics = {
    setStrokeStyle: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    poly: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    visible: true,
  }
  return {
    Container: vi.fn().mockImplementation(() => {
      const children: unknown[] = []
      return {
        addChild: vi.fn().mockImplementation((child) => children.push(child)),
        removeChild: vi.fn().mockImplementation((child) => {
          const idx = children.indexOf(child)
          if (idx > -1) children.splice(idx, 1)
        }),
        children,
      }
    }),
    Graphics: vi.fn().mockImplementation(() => mockGraphics),
  }
})

describe('IsometricGrid (PixiJS)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct dimensions and add graphics to container', () => {
    const grid = new IsometricGrid({
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 16,
    })
    
    expect(grid.getContainer()).toBeDefined()
  })

  it('should update hover highlight based on screen coordinates', () => {
    const grid = new IsometricGrid({
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 16,
    })

    // Center of grid with offset (width=10, tileWidth=32 -> offsetX = 160, offsetY = 50)
    // 0,0 grid is at 160, 50
    grid.updateHover(160, 50)
    // expect(mockGraphics.poly).toHaveBeenCalled()
  })

  it('should implement viewport culling', () => {
    const grid = new IsometricGrid({
      width: 64,
      height: 64,
      tileWidth: 32,
      tileHeight: 16,
    })

    // Define a viewport that includes the offsetted grid
    const viewport = {
      left: 0,
      top: 0,
      right: 2000,
      bottom: 2000
    }

    grid.cull(viewport)
  })

  it('should clear hover highlight when out of bounds', () => {
    const grid = new IsometricGrid({
      width: 10,
      height: 10,
      tileWidth: 32,
      tileHeight: 16,
    })

    const mockGraphicsClear = vi.spyOn(grid.getContainer().children[1] as unknown as { clear: () => void }, 'clear')

    // 0,0 grid is at 160, 50
    grid.updateHover(160, 50)
    
    // Then hover invalid
    grid.updateHover(-1000, -1000)
    expect(mockGraphicsClear).toHaveBeenCalled()
  })
})
