import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'
import { createNoise } from '../lib/noise'

vi.mock('../lib/noise', () => ({
  createNoise: vi.fn(),
}))

describe('AgentSprite Pacing Logic', () => {
  const mockAgent: AgentData = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _id: 'agent1' as any,
    name: 'Test Agent',
    gridX: 10,
    gridY: 10,
    archetype: 'builder',
    currentAction: 'idle'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock noise to return a function that returns 0.5
    vi.mocked(createNoise).mockReturnValue(() => 0.5)
  })

  it('should update visualX and visualY when idle using noise', () => {
    const sprite = new AgentSprite(mockAgent)
    // Initially 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).visualX).toBe(0)
    
    // Simulate tick
    sprite.tick(1)
    
    // Expect visualX/Y to be non-zero
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).visualX).not.toBe(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).visualY).not.toBe(0)
  })

  it('should not update visual offsets if not in idle/working state', () => {
    const walkingAgent = { ...mockAgent, currentAction: 'walking' }
    const sprite = new AgentSprite(walkingAgent)
    
    sprite.tick(1)
    
    // For now, walking doesn't have pacing (it has interpolation later)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).visualX).toBe(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((sprite as any).visualY).toBe(0)
  })
})
