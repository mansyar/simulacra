import { describe, it, expect } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'
import type { Id } from '../../convex/_generated/dataModel'

describe('AgentSprite Course Correction', () => {
  const mockAgent: AgentData = {
    _id: 'agent1' as Id<'agents'>,
    name: 'Test Agent',
    gridX: 0,
    gridY: 0,
    archetype: 'explorer',
    currentAction: 'idle'
  }

  it('should blend estimatedGridX toward backend truth over 500ms instead of snapping', () => {
    const sprite = new AgentSprite(mockAgent)
    const s = sprite as unknown as { estimatedGridX: number; estimatedGridY: number }
    
    // Simulate frontend has drifted to 0.5
    s.estimatedGridX = 0.5
    
    // Backend update arrives with truth = 0
    sprite.updateAgentData({ gridX: 0, gridY: 0 })
    
    // Immediately after update, it shouldn't have snapped to 0
    expect(s.estimatedGridX).toBe(0.5)
    
    // Simulate some time passing (250ms = 15 frames at 60fps)
    // deltaTime = 1 means 1/60th of a second (16.6ms)
    // 250ms / 16.6ms = 15 frames
    for (let i = 0; i < 15; i++) {
      sprite.tick(1)
    }
    
    // Should be roughly halfway (0.25)
    const estimatedX = s.estimatedGridX
    expect(estimatedX).toBeGreaterThan(0.2)
    expect(estimatedX).toBeLessThan(0.3)
    
    // Simulate remaining time (total 500ms = 30 frames)
    for (let i = 0; i < 15; i++) {
      sprite.tick(1)
    }
    
    // Should be at 0 (or very close)
    expect(s.estimatedGridX).toBeCloseTo(0)
  })
})
