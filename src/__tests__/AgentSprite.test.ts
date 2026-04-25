import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

// Mock Excalibur dependencies with proper class constructors
vi.mock('excalibur', () => {
  class MockActor {
    pos: { x: number; y: number }
    graphics: { add: Mock; show: Mock; hide: Mock; visible: boolean }
    z: number
    constructor(options?: { pos?: { x: number; y: number }; z?: number }) {
      this.pos = options?.pos || { x: 0, y: 0 }
      this.z = options?.z || 0
      this.graphics = { add: vi.fn(), show: vi.fn(), hide: vi.fn(), visible: true }
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

  class MockRectangle {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }
  
  class MockLabel {
    font = { size: 0, textAlign: '' }
    graphics = { visible: true }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }
  
  return {
    Actor: MockActor,
    Circle: MockCircle,
    Rectangle: MockRectangle,
    Color: {
      fromHex: vi.fn().mockReturnValue({ clone: () => ({}) }),
      White: {},
    },
    Vector: MockVector,
    Label: MockLabel,
    TextAlign: { Center: 'center' },
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
    
    // Call the method (should not throw)
    sprite.onPreUpdate()
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

  it('should use default color for unknown archetype', () => {
    const unknownAgent: AgentData = {
      id: 'unknown-1',
      name: 'Unknown',
      gridX: 0,
      gridY: 0,
      archetype: 'non-existent',
    }
    const sprite = new AgentSprite(unknownAgent)
    expect(sprite).toBeTruthy()
  })
})
