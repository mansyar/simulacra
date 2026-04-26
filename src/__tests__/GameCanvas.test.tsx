import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import GameCanvas from '../components/game/GameCanvas'

// Mock PixiJS
const mockDestroy = vi.fn()
const mockInit = vi.fn().mockResolvedValue(undefined)
const mockApp = {
  init: mockInit,
  destroy: mockDestroy,
  canvas: document.createElement('canvas'),
  stage: { addChild: vi.fn() },
  ticker: { add: vi.fn(), remove: vi.fn(), stop: vi.fn(), start: vi.fn() },
}

vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => mockApp),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
  })),
  Graphics: vi.fn().mockImplementation(() => ({
    setStrokeStyle: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    poly: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
  })),
  Text: vi.fn().mockImplementation(() => ({
    style: {},
  })),
}))

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn().mockReturnValue([]),
  useMutation: vi.fn().mockReturnValue(vi.fn()),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    functions: {
      agents: {
        getAll: 'agents:getAll',
        updatePosition: 'agents:updatePosition',
      },
      world: {
        getPois: 'world:getPois',
      },
    },
  },
}))

describe('GameCanvas (PixiJS)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize PixiJS Application and destroy it on unmount', async () => {
    const { unmount } = render(<GameCanvas />)
    
    // Check if Application constructor was called
    const { Application } = await import('pixi.js')
    expect(Application).toHaveBeenCalled()
    
    // Check if init was called
    expect(mockInit).toHaveBeenCalled()
    
    // Unmount and check destroy
    unmount()
    expect(mockDestroy).toHaveBeenCalledWith(true, { children: true, texture: true, baseTexture: true })
  })

  it('should handle visibility change', async () => {
    render(<GameCanvas />)
    
    const mockTickerStop = vi.spyOn(mockApp.ticker, 'stop')
    const mockTickerStart = vi.spyOn(mockApp.ticker, 'start')
    
    // Wait for init to complete
    await waitFor(() => expect(mockInit).toHaveBeenCalled())

    // Simulate hidden
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(mockTickerStop).toHaveBeenCalled()
    
    // Simulate visible
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(mockTickerStart).toHaveBeenCalled()
  })
})
