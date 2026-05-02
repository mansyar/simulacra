import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { GameCanvas } from '../components/game/GameCanvas'
import { useQuery } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'

// Mock PixiJS
const mockApp = {
  init: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  canvas: document.createElement('canvas'),
  stage: { 
    addChild: vi.fn(),
    position: { x: 0, y: 0, set: vi.fn() },
    scale: { x: 1, y: 1, set: vi.fn() },
  },
  ticker: { add: vi.fn(), remove: vi.fn(), stop: vi.fn(), start: vi.fn() },
  screen: { width: 800, height: 600 },
}

vi.mock('pixi.js', () => {
  return {
    Application: vi.fn().mockImplementation(() => mockApp),
    Container: class {
      position = { x: 0, y: 0, set: vi.fn() }
      scale = { x: 1, y: 1, set: vi.fn() }
      addChild = vi.fn()
      removeChild = vi.fn()
      on = vi.fn()
    },
    Graphics: vi.fn().mockImplementation(() => ({
      clear: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      fill: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      poly: vi.fn().mockReturnThis(),
      addChild: vi.fn(),
    })),
    Text: vi.fn().mockImplementation(() => ({})),
    TextStyle: vi.fn(),
  }
})

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    functions: {
      agents: {
        getAll: 'agents:getAll',
      },
      world: {
        getPois: 'world:getPois',
        getState: 'world:getState',
      },
    },
  },
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock type
let lastAgentSpriteInstance: Record<string, any> | null = null

// Mock AgentSprite
vi.mock('../components/game/AgentSprite', () => {
  return {
    AgentSprite: vi.fn().mockImplementation(() => {
      const instance = {
        on: vi.fn(),
        position: { x: 100, y: 100 },
        updateAgentData: vi.fn(),
        tick: vi.fn(),
        addChild: vi.fn(),
        setSelected: vi.fn(),
        setSpeedMultiplier: vi.fn(),
      }
      lastAgentSpriteInstance = instance
      return instance
    })
  }
})

// Mock useNavigate
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn().mockReturnValue({ id: 'agent1' }),
}))

describe('GameCanvas Navigation', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vi.mock return type cast
    ;(useNavigate as unknown as { mockReturnValue: (v: any) => void }).mockReturnValue(mockNavigate)
    lastAgentSpriteInstance = null
  })

  it('should navigate to /agent/$id when an agent is selected', async () => {
    const mockAgents = [
      { _id: 'agent1', name: 'Agent 1', gridX: 10, gridY: 10, archetype: 'builder' }
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vi.mock return type cast
    ;(useQuery as unknown as { mockImplementation: (cb: any) => void }).mockImplementation((name: string) => {
      if (name === 'agents:getAll') return mockAgents
      if (name === 'world:getState') return { weather: 'sunny' }
      return []
    })

    render(<GameCanvas />)

    await waitFor(() => {
      expect(lastAgentSpriteInstance).not.toBeNull()
      
      // Trigger select event
      const calls = lastAgentSpriteInstance!.on.mock.calls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock call args are dynamic
      const selectCall = calls.find((call: [string, any]) => call[0] === 'select')
      expect(selectCall).toBeDefined()
      
      const selectCallback = selectCall[1]
      selectCallback()
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/agent/$id',
      params: { id: 'agent1' }
    })

    // Verify setSelected was called (sync effect will trigger it)
    await waitFor(() => {
      expect(lastAgentSpriteInstance!.setSelected).toHaveBeenCalledWith(true)
    })
  })
})
