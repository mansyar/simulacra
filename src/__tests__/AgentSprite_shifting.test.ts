import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'
import { createNoise } from '../lib/noise'

vi.mock('../lib/noise', () => ({
  createNoise: vi.fn(),
}))

describe('AgentSprite Shifting Logic', () => {
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
    vi.mocked(createNoise).mockReturnValue(() => 0.5)
  })

  it('should update visualContainer.scale.x (flipping) when noise crosses threshold', () => {
    // Mock noise to return -0.8 (threshold for flipping)
    vi.mocked(createNoise).mockReturnValue(() => -0.8)

    const sprite = new AgentSprite(mockAgent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visual = (sprite as any).visualContainer
    
    sprite.tick(1)
    
    // Expect flipped
    expect(visual.scale.x).toBe(-1)
  })

  it('should apply vertical bounce (shifting) based on noise', () => {
    const sprite = new AgentSprite(mockAgent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visual = (sprite as any).visualContainer
    const initialY = visual.y
    
    sprite.tick(1)
    
    const newY = visual.y
    expect(newY).not.toBe(initialY)
  })
})
