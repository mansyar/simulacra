import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from '../routes/agent.$id'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- router mock accepts any config
  createFileRoute: vi.fn(() => (config: any) => ({
    ...config,
    useParams: vi.fn().mockReturnValue({ id: 'agent1' }),
  })),
  useNavigate: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React props mock
  Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React props mock
    div: ({ children, className, onClick }: any) => <div className={className} onClick={onClick}>{children}</div>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React props mock
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    functions: {
      agents: {
        getById: 'agents:getById',
      },
      relationships: {
        getRelationships: 'relationships:getRelationships',
      },
      memory: {
        getEvents: 'memory:getEvents',
      },
    },
  },
}))

describe('AgentDetail Route Component', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vi.mock return type
    ;(useNavigate as any).mockReturnValue(mockNavigate)
  })

  it('should render agent identity, needs, inventory, relationships and events', () => {
    const mockAgent = {
      _id: 'agent1',
      name: 'Test Agent',
      archetype: 'builder',
      bio: 'A test agent bio.',
      coreTraits: ['hardworking', 'loyal'],
      hunger: 40,
      energy: 80,
      social: 60,
      inventory: ['wrench', 'hammer'],
      currentGoal: 'Building a house',
    }
    const mockRelationships = [
      { _id: 'rel1', agentAId: 'agent1', agentBId: 'agent2', otherAgentName: 'Friend Agent', affinity: 75 },
    ]
    const mockEvents = [
      { _id: 'ev1', type: 'movement', description: 'Arrived at the construction site.', _creationTime: Date.now() },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Convex query name is dynamic
    vi.mocked(useQuery).mockImplementation((name: any, ..._args) => { void _args
      if (typeof name === 'string') {
        if (name === 'agents:getById') return mockAgent
        if (name === 'relationships:getRelationships') return mockRelationships
        if (name === 'memory:getEvents') return mockEvents
      } else if (name && name.name === 'getById') {
        return mockAgent
      } else if (name && name.name === 'getRelationships') {
        return mockRelationships
      } else if (name && name.name === 'getEvents') {
        return mockEvents
      }
      return null
    })

    // @ts-expect-error - mock component
    const AgentDetail = Route.component
    render(<AgentDetail />)
    
    expect(screen.getByRole('heading', { name: /Test Agent/i })).toBeDefined()
    expect(screen.getByText(/Building a house/i)).toBeDefined()
    expect(screen.getByText(/wrench/i)).toBeDefined()
    expect(screen.getByText(/Friend Agent/i)).toBeDefined()
    expect(screen.getByText(/Arrived at the construction site/i)).toBeDefined()
  })

  it('should render loading state', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    // @ts-expect-error - mock component
    const AgentDetail = Route.component
    const { container } = render(<AgentDetail />)
    
    expect(container.querySelector('.animate-spin')).toBeDefined()
  })

  it('should render not found state', () => {
    vi.mocked(useQuery).mockReturnValue(null)

    // @ts-expect-error - mock component
    const AgentDetail = Route.component
    render(<AgentDetail />)
    
    expect(screen.getByRole('heading', { name: /Not Found/i })).toBeDefined()
  })

  it('should navigate back to home on close', () => {
    // @ts-expect-error - mock component
    const AgentDetail = Route.component
    render(<AgentDetail />)
    
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })
})
