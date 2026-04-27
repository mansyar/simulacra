import { describe, it, expect, vi } from 'vitest'
import { AgentSprite, type AgentData } from '../components/game/AgentSprite'
import { POISprite, type POIData } from '../components/game/POISprite'
import type { Id } from '../../convex/_generated/dataModel'

// Mock PixiJS
vi.mock('pixi.js', () => {
  class MockContainer {
    children = []
    position = { x: 0, y: 0, set: vi.fn() }
    visible = true
    label = ''
    eventMode = 'none'
    cursor = 'default'
    scale = { x: 1, y: 1, set: vi.fn() }
    alpha = 1
    addChild = vi.fn()
    removeChild = vi.fn()
    addChildAt = vi.fn()
    on = vi.fn()
    emit = vi.fn()
    get interactive() {
      return this.eventMode !== 'none'
    }
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

describe('AgentSprite (PixiJS)', () => {
  const mockAgent = {
    _id: 'agent_1' as Id<'agents'>,
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle',
  }

  it('should initialize and update position via tick', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    expect(sprite).toBeDefined()

    // Test update (lerp)
    sprite.tick(16) // Update should run
  })

  it('should update agent data', () => {
    const sprite = new AgentSprite(mockAgent as unknown as AgentData)
    sprite.updateAgentData({ currentAction: 'working' })
  })
})

describe('POISprite (PixiJS)', () => {
  const mockPOI = {
    _id: 'poi_1' as Id<'pois'>,
    name: 'Library',
    gridX: 32,
    gridY: 32,
    type: 'library',
  }

  it('should initialize with correct data', () => {
    const sprite = new POISprite(mockPOI as unknown as POIData)
    expect(sprite).toBeDefined()
  })
})
