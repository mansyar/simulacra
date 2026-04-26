import { describe, it, expect } from 'vitest'
import { AgentSprite } from '../components/game/AgentSprite'
import type { AgentData } from '../components/game/AgentSprite'

describe('AgentSprite Multi-Agent Performance', () => {
  const createMockAgent = (id: string): AgentData => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _id: id as any,
    name: `Agent ${id}`,
    gridX: Math.random() * 64,
    gridY: Math.random() * 64,
    archetype: 'explorer',
    currentAction: 'idle'
  })

  it('should handle 100 agents ticking within performance budget', () => {
    const agents = Array.from({ length: 100 }, (_, i) => new AgentSprite(createMockAgent(`agent${i}`)))
    
    const start = performance.now()
    for (let i = 0; i < 60; i++) { // 1 second of frames at 60fps
      agents.forEach(a => a.tick(1))
    }
    const end = performance.now()
    const totalTime = end - start
    
    // 100 agents * 60 frames = 6000 tick calls.
    // Target: < 1ms total per frame for all agents -> < 60ms for 60 frames.
    
    // eslint-disable-next-line no-console
    console.log(`Total time for 6000 ticks (100 agents * 60 frames): ${totalTime.toFixed(2)}ms`)
    expect(totalTime).toBeLessThan(200) // Generous budget for test environment
  })
})
