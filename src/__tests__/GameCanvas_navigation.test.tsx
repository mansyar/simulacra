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

interface MockAgentSprite {
  on: { mock: { calls: [string, () => void][] } };
  position: { x: number; y: number };
  updateAgentData: ReturnType<typeof vi.fn>;
  tick: ReturnType<typeof vi.fn>;
  addChild: ReturnType<typeof vi.fn>;
  setSelected: ReturnType<typeof vi.fn>;
  setSpeedMultiplier: ReturnType<typeof vi.fn>;
}

let lastAgentSpriteInstance: MockAgentSprite | null = null

// Mock AgentSprite
vi.mock('../components/game/AgentSprite', () => {
  return {
    AgentSprite: vi.fn().mockImplementation(() => {
      const instance = {
        on: vi.fn() as unknown as MockAgentSprite['on'],
        position: { x: 100, y: 100 },
        updateAgentData: vi.fn(),
        tick: vi.fn(),
        addChild: vi.fn(),
        setSelected: vi.fn(),
        setSpeedMultiplier: vi.fn(),
      }
      lastAgentSpriteInstance = instance as unknown as MockAgentSprite
      return instance
    }),
    ARCHETYPE_COLORS: {
      builder: 0x3b82f6,
      socialite: 0xec4899,
      philosopher: 0x8b5cf6,
      explorer: 0xf59e0b,
      nurturer: 0x10b981,
    },
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
    vi.mocked(useNavigate).mockReturnValue(mockNavigate as never) 
    lastAgentSpriteInstance = null
  })

  it('should navigate to /agent/$id when an agent is selected', async () => {
    const mockAgents = [
      { _id: 'agent1', name: 'Agent 1', gridX: 10, gridY: 10, archetype: 'builder' }
    ]
    
    vi.mocked(useQuery).mockImplementation(((name: unknown, ..._args: unknown[]) => {
      if (name === 'agents:getAll') return mockAgents
      if (name === 'world:getState') return { weather: 'sunny' }
      return []
    }) as never)

    render(<GameCanvas />)

    await waitFor(() => {
      expect(lastAgentSpriteInstance).not.toBeNull()
      
      // Trigger select event
      const calls = (lastAgentSpriteInstance!.on as unknown as { mock: { calls: [string, () => void][] } }).mock.calls
      const selectCall = calls.find((call: [string, () => void]) => call[0] === 'select')
      expect(selectCall).toBeDefined()
      
      const selectCallback = selectCall?.[1]
      if (selectCallback) selectCallback()
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
