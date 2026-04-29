import { describe, it, expect } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'
import type { Id } from '../../convex/_generated/dataModel'

describe('AgentSprite State Extensions', () => {
  const mockAgent: AgentData = {
    _id: 'agent1' as Id<'agents'>,
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle'
  }

  it('should have visualX and visualY offsets initialized to 0', () => {
    const sprite = new AgentSprite(mockAgent)
    const s = sprite as unknown as { visualX: number; visualY: number }
    expect(s.visualX).toBe(0)
    expect(s.visualY).toBe(0)
  })

  it('should have estimatedGridX and estimatedGridY initialized to agent grid coordinates', () => {
    const sprite = new AgentSprite(mockAgent)
    const s = sprite as unknown as { estimatedGridX: number; estimatedGridY: number }
    expect(s.estimatedGridX).toBe(mockAgent.gridX)
    expect(s.estimatedGridY).toBe(mockAgent.gridY)
  })
})
