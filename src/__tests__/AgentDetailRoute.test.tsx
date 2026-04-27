/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from '../routes/agent.$id'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (config: any) => ({
    ...config,
    useParams: vi.fn().mockReturnValue({ id: 'agent1' }),
  })),
  useNavigate: vi.fn(),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick }: any) => <div className={className} onClick={onClick}>{children}</div>,
  },
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
    },
  },
}))

describe('AgentDetail Route Component', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useNavigate as any).mockReturnValue(mockNavigate)
  })

  it('should render agent identity and needs', () => {
    const mockAgent = {
      _id: 'agent1',
      name: 'Test Agent',
      archetype: 'builder',
      bio: 'A test agent bio.',
      coreTraits: ['hardworking', 'loyal'],
      hunger: 40,
      energy: 80,
      social: 60,
    }
    vi.mocked(useQuery).mockReturnValue(mockAgent)

    // @ts-expect-error - mock component
    const AgentDetail = Route.component
    render(<AgentDetail />)
    
    expect(screen.getByRole('heading', { name: /Test Agent/i })).toBeDefined()
    expect(screen.getByText(/builder/i)).toBeDefined()
    expect(screen.getByText(/A test agent bio./i)).toBeDefined()
    expect(screen.getByText(/hardworking/i)).toBeDefined()
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
