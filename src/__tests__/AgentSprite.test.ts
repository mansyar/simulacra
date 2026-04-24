import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { Engine } from 'excalibur'

// Mock Excalibur dependencies with proper class constructors
vi.mock('excalibur', () => {
  class MockActor {
    pos: { x: number; y: number }
    graphics: { add: Mock }
    constructor(options?: { pos?: { x: number; y: number } }) {
      this.pos = options?.pos || { x: 0, y: 0 }
      this.graphics = { add: vi.fn() }
    }
    addChild() {}
  }
  
  class MockVector {
    constructor(public x: number, public y: number) {}
  }
  
  class MockCircle {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }
  
  class MockLabel {
    font = { size: 0 }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }
  
  return {
    Actor: MockActor,
    Circle: MockCircle,
    Color: {
      fromHex: vi.fn().mockReturnValue({}),
      White: {},
    },
    Vector: MockVector,
    Label: MockLabel,
    Engine: vi.fn(),
  }
})

// Mock gridToScreen
vi.mock('../../lib/isometric', () => ({
  gridToScreen: vi.fn().mockReturnValue({ x: 100, y: 200 }),
}))

// Import AgentSprite AFTER mocking
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'

describe('AgentSprite', () => {
  let mockAgent: AgentData

  beforeEach(() => {
    mockAgent = {
      id: 'test-1',
      name: 'Test Agent',
      gridX: 5,
      gridY: 10,
      archetype: 'builder',
    }
  })

  it('should create an AgentSprite instance', () => {
    const sprite = new AgentSprite(mockAgent)
    expect(sprite).toBeTruthy()
    expect(sprite.updateGridPosition).toBeTruthy()
    expect(sprite.onPreUpdate).toBeTruthy()
  })

  it('should have updateGridPosition method', () => {
    const sprite = new AgentSprite(mockAgent)
    expect(typeof sprite.updateGridPosition).toBe('function')
    
    // Call the method (should not throw)
    sprite.updateGridPosition(15, 20)
  })

  it('should have onPreUpdate method', () => {
    const sprite = new AgentSprite(mockAgent)
    expect(typeof sprite.onPreUpdate).toBe('function')
    
    // Mock engine parameter
    const mockEngine = { canvas: {} }
    // Call the method (should not throw)
    sprite.onPreUpdate(mockEngine as Engine, 16)
  })

  it('should use agent properties in constructor', () => {
    const customAgent: AgentData = {
      id: 'custom-1',
      name: 'Custom Agent',
      gridX: 100,
      gridY: 200,
      archetype: 'socialite',
    }
    
    const sprite = new AgentSprite(customAgent)
    expect(sprite).toBeTruthy()
  })
})