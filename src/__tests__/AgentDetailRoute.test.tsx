import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Route } from '../routes/agent.$id'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (config: Record<string, unknown>) => ({
    ...config,
    useParams: vi.fn().mockReturnValue({ id: 'agent1' }),
  })),
  useNavigate: vi.fn(),
  Link: ({ children, to, className }: { children: ReactNode, to: string, className?: string }) => <a href={to} className={className}>{children}</a>,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick }: { children: ReactNode, className?: string, onClick?: () => void }) => <div className={className} onClick={onClick}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
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
    vi.mocked(useNavigate).mockReturnValue(mockNavigate as unknown as ReturnType<typeof useNavigate>)
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

    vi.mocked(useQuery).mockImplementation((name: unknown, ..._args: unknown[]) => { void _args
      if (typeof name === 'string') {
        if (name === 'agents:getById') return mockAgent
        if (name === 'relationships:getRelationships') return mockRelationships
        if (name === 'memory:getEvents') return mockEvents
      } else if (name && typeof name === 'object' && 'name' in name) {
        const query = name as { name: string }
        if (query.name === 'getById') return mockAgent
        if (query.name === 'getRelationships') return mockRelationships
        if (query.name === 'getEvents') return mockEvents
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
