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

describe('AgentSprite Interaction', () => {
  const mockAgent = {
    _id: 'agent_1' as Id<'agents'>,
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle',
  }

  it('should have eventMode set to static', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    expect(sprite.eventMode).toBe('static')
  })

  it('should be interactive', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    expect(sprite.interactive).toBe(true)
  })

  it('should cursor be pointer', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    expect(sprite.cursor).toBe('pointer')
  })

  it('should emit select event on pointertap', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    const emitSpy = vi.spyOn(sprite, 'emit')
    
    // Simulate pointertap
    // @ts-expect-error - accessing private listeners for testing
    const callback = sprite.listeners['pointertap']
    expect(callback).toBeDefined()
    callback()

    expect(emitSpy).toHaveBeenCalledWith('select', 'agent_1')
  })
})
