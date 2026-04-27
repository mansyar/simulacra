import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GlobalThoughtStream from '../components/GlobalThoughtStream'
import { useQuery } from "convex/react";

// Mock convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

// Mock the API
vi.mock('../../convex/_generated/api', () => ({
  api: {
    functions: {
      memory: {
        getGlobalEvents: 'memory:getGlobalEvents',
      },
      agents: {
        getAll: 'agents:getAll',
      },
    },
  },
}))

// Mock router - will be customized per test
const mockUseRouterState = vi.fn().mockReturnValue({
  location: { pathname: '/' },
})

vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => mockUseRouterState(),
}))

const mockEvents = [
  { _id: '1', agentName: 'Alice', type: 'movement', description: 'Alice moved to position', _creationTime: 1000 },
  { _id: '2', agentName: 'Bob', type: 'conversation', description: 'Bob spoke to someone', _creationTime: 2000 },
  { _id: '3', agentName: 'Alice', type: 'interaction', description: 'Alice found an item', _creationTime: 3000 },
  { _id: '4', agentName: 'Charlie', type: 'weather_change', description: 'Sky turned cloudy', _creationTime: 4000 },
  { _id: '5', agentName: 'Bob', type: 'movement', description: 'Bob walked south', _creationTime: 5000 },
]

const mockAgents = [
  { _id: 'agent-123', name: 'Alice', archetype: 'builder' },
  { _id: 'agent-456', name: 'Bob', archetype: 'socialite' },
  { _id: 'agent-789', name: 'Charlie', archetype: 'explorer' },
]

describe('GlobalThoughtStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouterState.mockReturnValue({ location: { pathname: '/' } })
  })

  it('returns null when events data is loading (undefined)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useQuery as any).mockImplementation((fn: any) => {
      if (fn === 'memory:getGlobalEvents') return undefined
      if (fn === 'agents:getAll') return undefined
      return undefined
    })
    const { container } = render(<GlobalThoughtStream />)
    expect(container.firstChild).toBeNull()
  })

  it('shows empty state when there are no events', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useQuery as any).mockImplementation((fn: any) => {
      if (fn === 'memory:getGlobalEvents') return []
      if (fn === 'agents:getAll') return []
      return []
    })
    render(<GlobalThoughtStream />)
    expect(screen.getByText('Waiting for simulation events...')).toBeDefined()
  })

  it('renders all events with agent names and descriptions', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useQuery as any).mockImplementation((fn: any) => {
      if (fn === 'memory:getGlobalEvents') return mockEvents
      if (fn === 'agents:getAll') return mockAgents
      return undefined
    })
    render(<GlobalThoughtStream />)
    expect(screen.getByText('Alice moved to position')).toBeDefined()
    expect(screen.getByText('Bob spoke to someone')).toBeDefined()
    expect(screen.getByText('Sky turned cloudy')).toBeDefined()
  })

  describe('Filtering', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (useQuery as any).mockImplementation((fn: any) => {
        if (fn === 'memory:getGlobalEvents') return mockEvents
        if (fn === 'agents:getAll') return mockAgents
        return undefined
      })
    })

    it('renders filter tags for unique agent names and types', () => {
      render(<GlobalThoughtStream />)
      expect(screen.getByRole('button', { name: /All Agents/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /All Types/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Alice/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Bob/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Charlie/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /movement/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /conversation/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /interaction/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /weather_change/i })).toBeDefined()
    })

    it('filters events by agent name when a name filter button is clicked', () => {
      render(<GlobalThoughtStream />)
      fireEvent.click(screen.getByRole('button', { name: /Alice/i }))
      expect(screen.getByText('Alice moved to position')).toBeDefined()
      expect(screen.getByText('Alice found an item')).toBeDefined()
      expect(screen.queryByText('Bob spoke to someone')).toBeNull()
      expect(screen.queryByText('Sky turned cloudy')).toBeNull()
    })

    it('filters events by type when a type filter button is clicked', () => {
      render(<GlobalThoughtStream />)
      fireEvent.click(screen.getByRole('button', { name: /movement/i }))
      expect(screen.getByText('Alice moved to position')).toBeDefined()
      expect(screen.getByText('Bob walked south')).toBeDefined()
      expect(screen.queryByText('Bob spoke to someone')).toBeNull()
      expect(screen.queryByText('Alice found an item')).toBeNull()
    })

    it('clears agent filter when clicking "All Agents"', () => {
      render(<GlobalThoughtStream />)
      fireEvent.click(screen.getByRole('button', { name: /Alice/i }))
      expect(screen.queryByText('Bob spoke to someone')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: /All Agents/i }))
      expect(screen.getByText('Bob spoke to someone')).toBeDefined()
      expect(screen.getByText('Sky turned cloudy')).toBeDefined()
    })

    it('clears type filter when clicking "All Types"', () => {
      render(<GlobalThoughtStream />)
      fireEvent.click(screen.getByRole('button', { name: /movement/i }))
      expect(screen.queryByText('Bob spoke to someone')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: /All Types/i }))
      expect(screen.getByText('Bob spoke to someone')).toBeDefined()
      expect(screen.getByText('Sky turned cloudy')).toBeDefined()
    })

    it('toggles agent filter off when clicking the same agent button again', () => {
      render(<GlobalThoughtStream />)
      fireEvent.click(screen.getByRole('button', { name: /Alice/i }))
      expect(screen.queryByText('Bob spoke to someone')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: /Alice/i }))
      expect(screen.getByText('Bob spoke to someone')).toBeDefined()
    })

    it('shows "no events match" message when filter yields no results', () => {
      render(<GlobalThoughtStream />)
      // Filter by an agent+type combo that doesn't exist
      // Bob has no weather_change events
      fireEvent.click(screen.getByRole('button', { name: /Bob/i }))
      fireEvent.click(screen.getByRole('button', { name: /weather_change/i }))
      expect(screen.getByText(/No events match/i)).toBeDefined()
    })
  })

  describe('Auto-scroll', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (useQuery as any).mockImplementation((fn: any) => {
        if (fn === 'memory:getGlobalEvents') return mockEvents
        if (fn === 'agents:getAll') return mockAgents
        return undefined
      })
    })

    it('renders a scrollable container for events', () => {
      const { container } = render(<GlobalThoughtStream />)
      // The scroll container is inside the component with overflow-y-auto
      const scrollContainer = container.querySelector('.overflow-y-auto')
      expect(scrollContainer).not.toBeNull()
    })
  })

  describe('Highlighting', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (useQuery as any).mockImplementation((fn: any) => {
        if (fn === 'memory:getGlobalEvents') return mockEvents
        if (fn === 'agents:getAll') return mockAgents
        return undefined
      })
    })

    it('highlights events for the selected agent when on /agent/$id route', () => {
      // Simulate being on the agent detail route for Alice (agent-123)
      mockUseRouterState.mockReturnValue({
        location: { pathname: '/agent/agent-123' },
      })

      const { container } = render(<GlobalThoughtStream />)
      
      // Alice events (2 events) should have the blue highlight class
      const highlightedCards = container.querySelectorAll('.bg-blue-800\\/30')
      
      // Expect 2 Alice events to be highlighted
      expect(highlightedCards.length).toBe(2)
    })

    it('does not highlight events when no agent is selected (home route)', () => {
      mockUseRouterState.mockReturnValue({
        location: { pathname: '/' },
      })

      const { container } = render(<GlobalThoughtStream />)
      const highlightedCards = container.querySelectorAll('.bg-blue-800\\/30')
      expect(highlightedCards.length).toBe(0)
    })

    it('highlights events by matching agent ID from route to agent name from agents list', () => {
      // Simulate being on Charlie's detail route
      mockUseRouterState.mockReturnValue({
        location: { pathname: '/agent/agent-789' },
      })

      const { container } = render(<GlobalThoughtStream />)
      
      // Only Charlie has 1 event (weather_change) - should be highlighted
      const highlightedCards = container.querySelectorAll('.bg-blue-800\\/30')
      
      // Expect 1 Charlie event to be highlighted
      expect(highlightedCards.length).toBe(1)
    })
  })
})
