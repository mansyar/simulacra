import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState, useCallback } from 'react'
import GlobalThoughtStream from '../components/GlobalThoughtStream'
import { DrawerContext } from '../lib/drawer-context'
import { useQuery } from "convex/react";
import type { ReactNode } from 'react'

// Helper to render with DrawerContext provider
function renderWithDrawer(ui: ReactNode, initialExpanded = false) {
  function Wrapper({ children }: { children: ReactNode }) {
    const [isExpanded, setExpanded] = useState(initialExpanded)
    const toggle = useCallback(() => setExpanded((prev) => !prev), [])
    return (
      <DrawerContext.Provider value={{ isExpanded, toggle, setExpanded }}>
        {children}
      </DrawerContext.Provider>
    )
  }
  return render(<Wrapper>{ui}</Wrapper>)
}

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
    vi.mocked(useQuery).mockImplementation(((fn: unknown, ..._args: unknown[]) => {
      if (fn === 'memory:getGlobalEvents') return undefined
      if (fn === 'agents:getAll') return undefined
      return undefined
    }) as never)
    const { container } = renderWithDrawer(<GlobalThoughtStream />)
    expect(container.firstChild).toBeNull()
  })

  it('shows empty state when there are no events', () => {
    vi.mocked(useQuery).mockImplementation(((fn: unknown, ..._args: unknown[]) => {
      if (fn === 'memory:getGlobalEvents') return []
      if (fn === 'agents:getAll') return []
      return []
    }) as never)
    renderWithDrawer(<GlobalThoughtStream />)
    expect(screen.getByText('Waiting for simulation events...')).toBeDefined()
  })

  it('renders all events with agent names and descriptions when expanded', () => {
    vi.mocked(useQuery).mockImplementation(((fn: unknown, ..._args: unknown[]) => {
      if (fn === 'memory:getGlobalEvents') return mockEvents
      if (fn === 'agents:getAll') return mockAgents
      return undefined
    }) as never)
    const { container } = renderWithDrawer(<GlobalThoughtStream />)
    // Expand the drawer first
    const expandHandle = container.querySelector('[data-testid="expand-handle"]')
    fireEvent.click(expandHandle!)
    expect(screen.getByText('Alice moved to position')).toBeDefined()
    expect(screen.getByText('Bob spoke to someone')).toBeDefined()
    expect(screen.getByText('Sky turned cloudy')).toBeDefined()
  })

  describe('Filtering', () => {
    beforeEach(() => {
      vi.mocked(useQuery).mockImplementation(((fn: unknown, ..._args: unknown[]) => {
        if (fn === 'memory:getGlobalEvents') return mockEvents
        if (fn === 'agents:getAll') return mockAgents
        return undefined
      }) as never)
    })

    it('renders a scrollable container for events when expanded', () => {
      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      // Expand the drawer to reveal the scroll container
      const expandHandle = container.querySelector('[data-testid="expand-handle"]')
      fireEvent.click(expandHandle!)
      const scrollContainer = container.querySelector('.overflow-y-auto')
      expect(scrollContainer).not.toBeNull()
    })
  })

  describe('Bottom Drawer Behavior', () => {
    beforeEach(() => {
      vi.mocked(useQuery).mockImplementation(((fn: unknown, ..._args: unknown[]) => {
        if (fn === 'memory:getGlobalEvents') return mockEvents
        if (fn === 'agents:getAll') return mockAgents
        return undefined
      }) as never)
    })

    it('shows only the last event in collapsed state with expand handle', () => {
      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      
      // Last event is "Bob walked south" (index 4) - text is nested in a composite span "Bob: Bob walked south"
      expect(screen.getByText(/Bob walked south/)).toBeDefined()
      
      // Earlier events should not be visible in collapsed state
      expect(screen.queryByText('Alice moved to position')).toBeNull()
      expect(screen.queryByText('Bob spoke to someone')).toBeNull()
      
      // Should have an expand handle (▲)
      const expandHandle = container.querySelector('[data-testid="expand-handle"]')
      expect(expandHandle).not.toBeNull()
      expect(expandHandle?.textContent).toBe('▲')
    })

    it('expands to show full event feed when toggled', () => {
      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      
      // Click the expand handle
      const expandHandle = container.querySelector('[data-testid="expand-handle"]')
      fireEvent.click(expandHandle!)
      
      // All events should now be visible
      expect(screen.getByText('Alice moved to position')).toBeDefined()
      expect(screen.getByText('Bob spoke to someone')).toBeDefined()
      expect(screen.getByText('Bob walked south')).toBeDefined()
      
      // Should have a collapse handle (▼)
      const collapseHandle = container.querySelector('[data-testid="collapse-handle"]')
      expect(collapseHandle).not.toBeNull()
      expect(collapseHandle?.textContent).toBe('▼')
    })

    it('expanded state has 200px height class', () => {
      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      
      // Click to expand
      const expandHandle = container.querySelector('[data-testid="expand-handle"]')
      fireEvent.click(expandHandle!)
      
      // The drawer should have the expanded height class
      const drawer = container.querySelector('[data-testid="thoughtstream-drawer"]')
      expect(drawer).not.toBeNull()
      expect(drawer?.classList.toString()).toContain('h-')
    })

    it('collapses back when toggled again', () => {
      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      
      // Expand
      const handle = container.querySelector('[data-testid="expand-handle"]')
      fireEvent.click(handle!)
      
      // Check expanded - earlier event visible
      expect(screen.getByText('Alice moved to position')).toBeDefined()
      
      // Find collapse handle and click
      const collapseHandle = container.querySelector('[data-testid="collapse-handle"]')
      fireEvent.click(collapseHandle!)
      
      // Should be collapsed again - earlier events hidden
      expect(screen.queryByText('Alice moved to position')).toBeNull()
    })
  })

  describe('Highlighting', () => {
    beforeEach(() => {
      vi.mocked(useQuery).mockImplementation(((fn: unknown, ..._args: unknown[]) => {
        if (fn === 'memory:getGlobalEvents') return mockEvents
        if (fn === 'agents:getAll') return mockAgents
        return undefined
      }) as never)
    })

    it('highlights events for the selected agent when on /agent/$id route', () => {
      // Simulate being on the agent detail route for Alice (agent-123)
      mockUseRouterState.mockReturnValue({
        location: { pathname: '/agent/agent-123' },
      })

      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      // Expand the drawer to reveal the event feed
      const expandHandle = container.querySelector('[data-testid="expand-handle"]')
      fireEvent.click(expandHandle!)
      
      // Alice events (2 events) should have the blue highlight class
      const highlightedCards = container.querySelectorAll('.bg-blue-800\\/30')
      
      // Expect 2 Alice events to be highlighted
      expect(highlightedCards.length).toBe(2)
    })

    it('does not highlight events when no agent is selected (home route)', () => {
      mockUseRouterState.mockReturnValue({
        location: { pathname: '/' },
      })

      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      const expandHandle = container.querySelector('[data-testid="expand-handle"]')
      fireEvent.click(expandHandle!)
      const highlightedCards = container.querySelectorAll('.bg-blue-800\\/30')
      expect(highlightedCards.length).toBe(0)
    })

    it('highlights events by matching agent ID from route to agent name from agents list', () => {
      // Simulate being on Charlie's detail route
      mockUseRouterState.mockReturnValue({
        location: { pathname: '/agent/agent-789' },
      })

      const { container } = renderWithDrawer(<GlobalThoughtStream />)
      // Expand the drawer to reveal the event feed
      const expandHandle = container.querySelector('[data-testid="expand-handle"]')
      fireEvent.click(expandHandle!)
      
      // Only Charlie has 1 event (weather_change) - should be highlighted
      const highlightedCards = container.querySelectorAll('.bg-blue-800\\/30')
      
      // Expect 1 Charlie event to be highlighted
      expect(highlightedCards.length).toBe(1)
    })
  })
})
