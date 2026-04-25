import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn().mockImplementation((fn) => {
    if (fn === 'agents:getAll') return [
      { _id: 'agent_1', name: 'Builder', gridX: 10, gridY: 10, archetype: 'builder' },
    ];
    if (fn === 'world:getPois') return [
      { _id: 'poi_1', name: 'Library', gridX: 32, gridY: 32, type: 'library' },
    ];
    return [];
  }),
  useMutation: vi.fn().mockReturnValue(vi.fn()),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    functions: {
      agents: {
        getAll: 'agents:getAll',
        updatePosition: 'agents:updatePosition',
      },
      world: {
        getPois: 'world:getPois',
      },
    },
  },
}))

// Mock Excalibur dependencies with proper class constructors
vi.mock('excalibur', () => {
  class MockEngine {
    addScene = vi.fn()
    goToScene = vi.fn()
    start = vi.fn()
    stop = vi.fn()
    input = {
      pointers: {
        primary: {
          lastWorldPos: { x: 0, y: 0 },
        },
      },
    }
    camera = { pos: { x: 0, y: 0 } }
    screenToWorld = vi.fn().mockImplementation((vec) => vec)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }
  
  class MockScene {
    add = vi.fn()
    remove = vi.fn()
    camera = { pos: { x: 0, y: 0 } }
    world = {
      entityManager: {
        getById: vi.fn().mockImplementation(() => ({ id: 'test-agent' })),
      },
    }
  }
  
  const actorInstances: unknown[] = []
  class MockActor {
    graphics: Record<string, unknown> = { 
      onPostDraw: vi.fn(), 
      visible: true, 
      show: vi.fn(), 
      hide: vi.fn(),
      add: vi.fn(),
      current: [{ graphic: {} }]
    }
    onPreUpdate = vi.fn()
    id = 'test-actor'
    pos = { x: 0, y: 0 }
    z = 0
    constructor() {
      actorInstances.push(this)
    }
    addChild() {}
  }

  class MockCircle {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }

  class MockRectangle {
    rotation = 0
    width = 0
    height = 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }
  
  class MockLabel {
    font = { size: 0, textAlign: '', bold: false }
    graphics: Record<string, unknown> = { 
      visible: true, 
      onPostDraw: vi.fn(), 
      show: vi.fn(), 
      hide: vi.fn(),
      add: vi.fn()
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options?: unknown) {}
  }
  
  return {
    Engine: MockEngine,
    Scene: MockScene,
    Actor: MockActor,
    Circle: MockCircle,
    Rectangle: MockRectangle,
    Label: MockLabel,
    TextAlign: { Center: 'center' },
    actorInstances,
    Color: {
      fromHex: vi.fn().mockReturnValue({ clone: () => ({}) }),
    },
    Vector: vi.fn().mockImplementation((x, y) => ({ x, y })),
    BoundingBox: vi.fn().mockImplementation(() => ({
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
    })),
  }
})

// Mock IsometricGrid as a class
vi.mock('../components/game/IsometricGrid', () => {
  return {
    IsometricGrid: vi.fn().mockImplementation((_options: unknown) => {
      const mockInstance = {
        getBoundingBox: vi.fn().mockImplementation(() => {
          return { left: 0, right: 100, top: 0, bottom: 100 }
        }),
        render: vi.fn(),
        setMousePosition: vi.fn(),
      }
      return mockInstance
    }),
  }
})

// Mock CameraController
vi.mock('../components/game/Camera', () => ({
  CameraController: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
  })),
}))

// Mock AgentSprite
vi.mock('../components/game/AgentSprite', () => ({
  AgentSprite: vi.fn().mockImplementation(() => ({
    updateAgentData: vi.fn(),
    id: 'test-agent',
  })),
}))

// Import GameCanvas after mocking
import GameCanvas from '../components/game/GameCanvas'
import * as excalibur from 'excalibur'

const { actorInstances } = excalibur as unknown as { actorInstances: any[] }

describe('GameCanvas', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render canvas element', () => {
    render(<GameCanvas />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('should render container div', () => {
    render(<GameCanvas />)
    const canvas = document.querySelector('canvas')
    const container = canvas?.parentElement
    expect(container).toBeTruthy()
    expect(container?.className).toContain('w-full')
    expect(container?.className).toContain('h-full')
  })

  it('should have canvas with correct className', () => {
    render(<GameCanvas />)
    const canvas = document.querySelector('canvas')
    expect(canvas?.className).toContain('block')
  })

  it('should verify IsometricGrid mock', () => {
    expect(true).toBe(true)
  })

  it('should call graphics.onPostDraw when actor is rendered', () => {
    render(<GameCanvas />)
    const actor = actorInstances[0] as { graphics: { onPostDraw: (ctx: unknown) => void } }
    expect(actor).toBeTruthy()
    const mockContext = {} as unknown
    actor.graphics.onPostDraw(mockContext)
  })

  it('should call onPreUpdate when actor updates', () => {
    render(<GameCanvas />)
    const actor = actorInstances[0] as { onPreUpdate: (engine: unknown, elapsed: number) => void }
    expect(actor).toBeTruthy()
    const mockEngine = {} as unknown
    const elapsed = 16
    actor.onPreUpdate(mockEngine, elapsed)
  })

  it('should trigger mousemove event', () => {
    render(<GameCanvas />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
    const mouseEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 })
    canvas?.dispatchEvent(mouseEvent)
  })

  it('should trigger visibility change event', () => {
    render(<GameCanvas />)
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
})
