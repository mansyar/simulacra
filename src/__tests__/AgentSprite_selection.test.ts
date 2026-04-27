import { describe, it, expect, vi } from 'vitest'
import { AgentSprite, type AgentData } from '../components/game/AgentSprite'
import type { Id } from '../../convex/_generated/dataModel'

// Mock PixiJS
vi.mock('pixi.js', () => {
  class MockContainer {
    children = []
    position = { x: 0, y: 0, set: vi.fn() }
    visible = true
    label = ''
    addChild = vi.fn()
    removeChild = vi.fn()
    addChildAt = vi.fn()
    eventMode = 'none'
    get interactive() {
      return this.eventMode !== 'none'
    }
    listeners: Record<string, (...args: unknown[]) => void> = {}
    on = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      this.listeners[event] = cb
    })
    emit = vi.fn()
    scale = { x: 1, y: 1, set: vi.fn() }
    y = 0
  }

  const mockGraphics = {
    circle: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    roundRect: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    poly: vi.fn().mockReturnThis(),
    visible: true,
    alpha: 1,
    scale: { x: 1, y: 1, set: vi.fn() },
  }
  const mockText = {
    style: {},
    text: '',
    visible: true,
    anchor: { set: vi.fn() },
    position: { set: vi.fn(), x: 0, y: 0 },
    getBounds: vi.fn().mockReturnValue({ width: 100, height: 20 }),
  }
  return {
    Container: MockContainer,
    Graphics: vi.fn().mockImplementation(() => mockGraphics),
    Text: vi.fn().mockImplementation(() => mockText),
    TextStyle: vi.fn(),
  }
})

describe('AgentSprite Selection', () => {
  const mockAgent = {
    _id: 'agent_1' as Id<'agents'>,
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle',
  }

  it('should have a setSelected method', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    expect(sprite.setSelected).toBeDefined()
  })

  it('should toggle selection ring visibility', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    sprite.setSelected(true)
    // @ts-expect-error - accessing private property for testing
    expect(sprite.selectionRing.visible).toBe(true)

    sprite.setSelected(false)
    // @ts-expect-error - accessing private property for testing
    expect(sprite.selectionRing.visible).toBe(false)
  })

  it('should pulse selection ring in tick when visible', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    sprite.setSelected(true)
    
    // @ts-expect-error - accessing private property for testing
    const ring = sprite.selectionRing
    
    sprite.tick(16) // ~1 frame
    
    expect(ring.scale.set).toHaveBeenCalled()
  })
})
