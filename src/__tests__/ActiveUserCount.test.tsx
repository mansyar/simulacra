import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActiveUserCount from '../components/ui/ActiveUserCount'
import usePresenceWithSessionStorage from '../lib/usePresenceWithSessionStorage'
import { useQuery } from 'convex/react'

// Mock convex/react
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

// Mock ../lib/usePresenceWithSessionStorage
vi.mock('../lib/usePresenceWithSessionStorage', () => ({
  default: vi.fn().mockReturnValue([]),
}))

// Mock convex/_generated/api
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    presence: {
      heartbeat: 'presence:heartbeat',
      list: 'presence:list',
      disconnect: 'presence:disconnect',
    },
  },
}))

describe('ActiveUserCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(useQuery).mockReturnValue({ roomId: 'main-app' })
  })

  it('renders with zero observers', () => {
    vi.mocked(usePresenceWithSessionStorage).mockReturnValue([])
    render(<ActiveUserCount />)
    const text = screen.getByText(/0 observers/)
    expect(text).toBeTruthy()
  })

  it('renders with plural observers', () => {
    vi.mocked(usePresenceWithSessionStorage).mockReturnValue([
      { userId: 'user1', online: true, lastDisconnected: 0 },
      { userId: 'user2', online: true, lastDisconnected: 0 },
    ])
    render(<ActiveUserCount />)
    const text = screen.getByText(/2 observers/)
    expect(text).toBeTruthy()
  })

  it('generates and persists a user ID in localStorage', () => {
    render(<ActiveUserCount />)
    const userId = localStorage.getItem('simulacra_user_id')
    expect(userId).toMatch(/^user_\d+$/)
    
    // Rerender should use the same ID
    const { unmount } = render(<ActiveUserCount />)
    unmount()
    render(<ActiveUserCount />)
    expect(localStorage.getItem('simulacra_user_id')).toBe(userId)
  })

  it('shows connecting state when presence is loading (undefined)', () => {
    vi.mocked(usePresenceWithSessionStorage).mockReturnValue(undefined)
    render(<ActiveUserCount />)
    const text = screen.getByText(/1 observer \(connecting\.\.\.\)/)
    expect(text).toBeTruthy()
  })

  it('handles null presence state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(usePresenceWithSessionStorage).mockReturnValue(null as any)
    render(<ActiveUserCount />)
    const text = screen.getByText(/0 observers/)
    expect(text).toBeTruthy()
  })
})