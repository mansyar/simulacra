import { describe, it, expect } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'

describe('AgentSprite Prediction Logic', () => {
  const mockAgent: AgentData = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _id: 'agent1' as any,
    name: 'Test Agent',
    gridX: 0,
    gridY: 0,
    archetype: 'explorer',
    currentAction: 'walking',
    targetX: 6,
    targetY: 0
  }

  it('should move estimatedGridX toward targetX over time', () => {
    const sprite = new AgentSprite(mockAgent)
    
    // Initial position
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).estimatedGridX).toBe(0)
    
    // Simulate 60 seconds (1/3 of tick interval)
    // deltaTime = 1 means 1/60th of a second
    // 60 seconds = 3600 frames
    for (let i = 0; i < 3600; i++) {
      sprite.tick(1)
    }
    
    // After 60s, it should be around 1/3 of the way (2 units)
    // speed = 6 / 180 = 0.0333 units/sec
    // dist = 0.0333 * 60 = 2 units
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const estimatedX = (sprite as any).estimatedGridX
    expect(estimatedX).toBeGreaterThan(1.9)
    expect(estimatedX).toBeLessThan(2.1)
  })
})
