import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../components/Footer'
import { useQuery } from 'convex/react'

// Mock convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

// Mock the API
vi.mock('../../convex/_generated/api', () => ({
  api: {
    functions: {
      world: {
        getState: 'world:getState',
      },
      agents: {
        getAll: 'agents:getAll',
      },
      config: {
        getTickInterval: 'config:getTickInterval',
      },
    },
  },
}))

describe('Footer Status Bar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tick count from world state', () => {
    vi.mocked(useQuery).mockImplementation(((fn: unknown) => {
      if (fn === 'world:getState') return { totalTicks: 42, lastTickAt: Date.now(), tickIntervalSeconds: 60 }
      if (fn === 'agents:getAll') return []
      if (fn === 'config:getTickInterval') return 180
      if (fn === 'config:getTickInterval') return 180
      return undefined
    }) as never)
    render(<Footer />)
    expect(screen.getByText(/42/)).toBeDefined()
  })

  it('renders active agent count', () => {
    vi.mocked(useQuery).mockImplementation(((fn: unknown) => {
      if (fn === 'world:getState') return { totalTicks: 0, lastTickAt: Date.now(), tickIntervalSeconds: 60 }
      if (fn === 'agents:getAll') return [
        { _id: '1', name: 'Alice', isActive: true },
        { _id: '2', name: 'Bob', isActive: true },
        { _id: '3', name: 'Charlie', isActive: false },
      ]
      if (fn === 'config:getTickInterval') return 180
      return undefined
    }) as never)
    render(<Footer />)
    // Should show 2 active agents
    expect(screen.getByText(/2/)).toBeDefined()
  })

  it('renders relative time for last tick timestamp', () => {
    const tenSecondsAgo = Date.now() - 10000
    vi.mocked(useQuery).mockImplementation(((fn: unknown) => {
      if (fn === 'world:getState') return { totalTicks: 1, lastTickAt: tenSecondsAgo, tickIntervalSeconds: 60 }
      if (fn === 'agents:getAll') return []
      if (fn === 'config:getTickInterval') return 180
      return undefined
    }) as never)
    render(<Footer />)
    // Should show "10s ago" or similar
    expect(screen.getByText(/ago/)).toBeDefined()
  })

  it('renders sleep mode indicator', () => {
    vi.mocked(useQuery).mockImplementation(((fn: unknown) => {
      if (fn === 'world:getState') return { totalTicks: 5, lastTickAt: Date.now(), tickIntervalSeconds: 60, lastUserActivityAt: 0 }
      if (fn === 'agents:getAll') return []
      if (fn === 'config:getTickInterval') return 180
      return undefined
    }) as never)
    render(<Footer />)
    // Sleep indicator should be visible (sleeping or active)
    // Since lastUserActivityAt is 0 (far in the past), should show sleeping
    const sleepIndicators = screen.getAllByText(/sleep|Sleeping|Active/i)
    expect(sleepIndicators.length).toBeGreaterThan(0)
  })

  it('renders countdown timer display', () => {
    const tenSecondsAgo = Date.now() - 10000
    vi.mocked(useQuery).mockImplementation(((fn: unknown) => {
      if (fn === 'world:getState') return { totalTicks: 1, lastTickAt: tenSecondsAgo, tickIntervalSeconds: 60 }
      if (fn === 'agents:getAll') return []
      if (fn === 'config:getTickInterval') return 180
      return undefined
    }) as never)
    render(<Footer />)
    // Countdown should show ~170s remaining (180s interval - 10s since last tick, may vary by 1s)
    expect(screen.getByText(/(169|170)s/)).toBeDefined()
  })

  it('renders nothing when world state is loading', () => {
    vi.mocked(useQuery).mockImplementation(((fn: unknown) => {
      if (fn === 'world:getState') return undefined
      if (fn === 'agents:getAll') return undefined
      return undefined
    }) as never)
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeNull()
  })
})
