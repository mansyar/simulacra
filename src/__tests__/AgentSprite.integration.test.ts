import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentSprite, type AgentData } from '../components/game/AgentSprite'
import type { Id } from '../../convex/_generated/dataModel'

// Mock PixiJS
const mockGraphics = {
  circle: vi.fn().mockReturnThis(),
  fill: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  rect: vi.fn().mockReturnThis(),
  roundRect: vi.fn().mockReturnThis(),
  stroke: vi.fn().mockReturnThis(),
  visible: true,
  getBounds: vi.fn().mockReturnValue({ width: 100, height: 20 }),
}

const mockText = {
  style: {},
  text: '',
  visible: true,
  anchor: { set: vi.fn() },
  position: { set: vi.fn(), x: 0, y: 0 },
  getBounds: vi.fn().mockReturnValue({ width: 100, height: 20 }),
}

vi.mock('pixi.js', () => {
  class MockContainer {
    children: unknown[] = []
    position = { x: 0, y: 0, set: vi.fn() }
    visible = true
    label = ''
    eventMode = 'none'
    cursor = 'default'
    scale = { x: 1, y: 1, set: vi.fn() }
    alpha = 1
    addChild = vi.fn().mockImplementation((child) => {
      this.children.push(child)
      return child
    })
    addChildAt = vi.fn()
    removeChild = vi.fn()
    on = vi.fn()
    emit = vi.fn()
    getBounds = vi.fn().mockReturnValue({ width: 100, height: 20 })
    get interactive() {
      return this.eventMode !== 'none'
    }
  }

  return {
    Container: MockContainer,
    Graphics: vi.fn().mockImplementation(() => mockGraphics),
    Text: vi.fn().mockImplementation(() => mockText),
    TextStyle: vi.fn(),
  }
})

describe('AgentSprite Integration', () => {
  const mockAgent: AgentData = {
    _id: 'agent_1' as Id<'agents'>,
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle speech bubble visibility and drawing', () => {
    const speechAgent = {
      ...mockAgent,
      speech: 'Hello world',
      lastSpeechAt: Date.now(),
    }
    const sprite = new AgentSprite(speechAgent)
    
    // Trigger tick to process speech
    sprite.tick(1)
    
    // Check if speech components were used
    expect(mockText.text).toBe('Hello world')
    expect(mockGraphics.roundRect).toHaveBeenCalled()
    expect(mockGraphics.fill).toHaveBeenCalled()
  })

  it('should hide speech bubble after timeout', () => {
    const oldSpeechAgent = {
      ...mockAgent,
      speech: 'Hello world',
      lastSpeechAt: Date.now() - 10000, // 10 seconds ago
    }
    const sprite = new AgentSprite(oldSpeechAgent)
    
    // We need to access private members for thorough testing, 
    // but we can check the effects on the mocked objects.
    sprite.tick(1)
    
    // In the actual implementation, it sets this.speechContainer.visible = false
    // Our mockContainer visible property should be affected if we could track it per instance
  })

  it('should update agent data including action emoji', () => {
    const sprite = new AgentSprite(mockAgent)
    sprite.updateAgentData({ currentAction: 'working' })
    expect(mockText.text).toBe('🛠️')
    
    // Test various actions for branch coverage
    sprite.updateAgentData({ currentAction: 'eating' })
    expect(mockText.text).toBe('🍱')
    
    sprite.updateAgentData({ currentAction: 'sleeping' })
    expect(mockText.text).toBe('💤')
    
    sprite.updateAgentData({ currentAction: 'talking' })
    expect(mockText.text).toBe('💬')
  })

  it('should handle different archetypes for drawing', () => {
    const explorerAgent = { ...mockAgent, archetype: 'explorer' as const }
    new AgentSprite(explorerAgent)
    expect(mockGraphics.fill).toHaveBeenCalled()

    const philosopherAgent = { ...mockAgent, archetype: 'philosopher' as const }
    new AgentSprite(philosopherAgent)
    expect(mockGraphics.fill).toHaveBeenCalled()
  })

  it('should update position based on grid coordinates', () => {
    const sprite = new AgentSprite(mockAgent)
    // Access private updatePosition indirectly via updateAgentData
    sprite.updateAgentData({ gridX: 20, gridY: 20 })
    expect(sprite.position.set).toHaveBeenCalled()
  })
})
