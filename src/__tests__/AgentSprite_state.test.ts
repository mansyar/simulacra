import { describe, it, expect } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'

describe('AgentSprite State Extensions', () => {
  const mockAgent: AgentData = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _id: 'agent1' as any,
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle'
  }

  it('should have visualX and visualY offsets initialized to 0', () => {
    const sprite = new AgentSprite(mockAgent)
    // We expect these to be added
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).visualX).toBe(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).visualY).toBe(0)
  })

  it('should have estimatedGridX and estimatedGridY initialized to agent grid coordinates', () => {
    const sprite = new AgentSprite(mockAgent)
    // We expect these to be added
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).estimatedGridX).toBe(mockAgent.gridX)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).estimatedGridY).toBe(mockAgent.gridY)
  })
})
