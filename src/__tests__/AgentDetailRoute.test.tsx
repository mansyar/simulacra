/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from '../routes/agent.$id'
import { useNavigate } from '@tanstack/react-router'

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

describe('AgentDetail Route Component', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useNavigate as any).mockReturnValue(mockNavigate)
  })

  it('should render agent ID from params', () => {
    // @ts-expect-error - mock component
    const AgentDetail = Route.component
    render(<AgentDetail />)
    
    expect(screen.getByText(/ID: agent1/i)).toBeDefined()
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
