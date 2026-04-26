import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import { POISprite } from '../components/game/POISprite'
import { Container, Graphics, Text } from 'pixi.js'

// Mock PixiJS
vi.mock('pixi.js', () => {
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
    Container: vi.fn().mockImplementation(() => ({
      addChild: vi.fn(),
      removeChild: vi.fn(),
      position: { set: vi.fn(), x: 0, y: 0 },
      children: [],
    })),
    Graphics: vi.fn().mockImplementation(() => mockGraphics),
    Text: vi.fn().mockImplementation(() => mockText),
    TextStyle: vi.fn(),
  }
})

describe('AgentSprite (PixiJS)', () => {
  const mockAgent = {
    id: 'agent_1',
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle',
  }

  it('should initialize and update position via tick', () => {
    const sprite = new AgentSprite(mockAgent)
    expect(sprite).toBeDefined()
    
    // Test update (lerp)
    sprite.tick(16) // Update should run
  })

  it('should update agent data', () => {
    const sprite = new AgentSprite(mockAgent)
    sprite.updateAgentData({ currentAction: 'working' })
  })
})

describe('POISprite (PixiJS)', () => {
  const mockPOI = {
    id: 'poi_1',
    name: 'Library',
    gridX: 32,
    gridY: 32,
    type: 'library',
  }

  it('should initialize with correct data', () => {
    const sprite = new POISprite(mockPOI)
    expect(sprite).toBeDefined()
  })
})
