import { describe, it, expect } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'
import type { Id } from '../../convex/_generated/dataModel'

describe('AgentSprite Prediction Logic', () => {
  const mockAgent: AgentData = {
    _id: 'agent1' as Id<'agents'>,
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
    const s = sprite as unknown as { estimatedGridX: number }
    
    // Initial position
    expect(s.estimatedGridX).toBe(0)
    
    // Simulate 60 seconds (1/3 of tick interval)
    // deltaTime = 1 means 1/60th of a second
    // 60 seconds = 3600 frames
    for (let i = 0; i < 3600; i++) {
      sprite.tick(1)
    }
    
    // After 60s, it should be around 1/3 of the way (2 units)
    // speed = 6 / 180 = 0.0333 units/sec
    // dist = 0.0333 * 60 = 2 units
    const estimatedX = s.estimatedGridX
    expect(estimatedX).toBeGreaterThan(1.9)
    expect(estimatedX).toBeLessThan(2.1)
  })
})

describe('AgentSprite Weather-Aware Speed', () => {
  const mockAgent: AgentData = {
    _id: 'agent1' as Id<'agents'>,
    name: 'Test Agent',
    gridX: 0,
    gridY: 0,
    archetype: 'explorer',
    currentAction: 'walking',
    targetX: 6,
    targetY: 0
  }

  it('should move at half speed when speedMultiplier=0.5 (stormy)', () => {
    const sprite = new AgentSprite(mockAgent, 0.5)
    const s = sprite as unknown as { estimatedGridX: number }
    
    expect(s.estimatedGridX).toBe(0)
    
    // Simulate 60 seconds
    for (let i = 0; i < 3600; i++) {
      sprite.tick(1)
    }
    
    // After 60s with 0.5x multiplier: speed = (6 * 0.5) / 180 = 0.0167 units/sec
    // dist = 0.0167 * 60 = 1 unit
    const estimatedX = s.estimatedGridX
    expect(estimatedX).toBeGreaterThan(0.9)
    expect(estimatedX).toBeLessThan(1.1)
  })

  it('should move at default speed when no speedMultiplier is provided', () => {
    const sprite = new AgentSprite(mockAgent)
    const s = sprite as unknown as { estimatedGridX: number }
    
    expect(s.estimatedGridX).toBe(0)
    
    // Simulate 60 seconds
    for (let i = 0; i < 3600; i++) {
      sprite.tick(1)
    }
    
    // After 60s with no multiplier: speed = 6 / 180 = 0.0333 units/sec
    // dist = 0.0333 * 60 = 2 units
    const estimatedX = s.estimatedGridX
    expect(estimatedX).toBeGreaterThan(1.9)
    expect(estimatedX).toBeLessThan(2.1)
  })

  it('should dynamically change speed when setSpeedMultiplier is called', () => {
    const sprite = new AgentSprite(mockAgent)
    const s = sprite as unknown as { estimatedGridX: number }
    
    // Simulate 30 seconds at default speed
    for (let i = 0; i < 1800; i++) {
      sprite.tick(1)
    }
    
    // After 30s: dist = 0.0333 * 30 = 1 unit
    expect(s.estimatedGridX).toBeGreaterThan(0.9)
    expect(s.estimatedGridX).toBeLessThan(1.1)
    
    // Change to 0.5x speed
    sprite.setSpeedMultiplier(0.5)
    
    // Simulate another 60 seconds
    for (let i = 0; i < 3600; i++) {
      sprite.tick(1)
    }
    
    // Second segment: 0.5x speed for 60s = 0.5 * 2 = 1 unit
    // Total = 1 + 1 = 2 units
    expect(s.estimatedGridX).toBeGreaterThan(1.9)
    expect(s.estimatedGridX).toBeLessThan(2.1)
  })
})
