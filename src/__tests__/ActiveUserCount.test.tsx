import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActiveUserCount from '../components/ui/ActiveUserCount'
import usePresence from '@convex-dev/presence/react'

// Mock @convex-dev/presence/react
vi.mock('@convex-dev/presence/react', () => ({
  default: vi.fn().mockReturnValue([]),
}))

// Mock convex/_generated/api
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    presence: {},
  },
}))

describe('ActiveUserCount', () => {
  it('renders with zero observers', () => {
    render(<ActiveUserCount />)
    const text = screen.getByText(/0 observers/)
    expect(text).toBeTruthy()
  })

  it('renders with plural observers', () => {
    vi.mocked(usePresence).mockReturnValue([
      { userId: 'user1', online: true, lastDisconnected: 0 },
      { userId: 'user2', online: true, lastDisconnected: 0 },
    ])
    render(<ActiveUserCount />)
    const text = screen.getByText(/2 observers/)
    expect(text).toBeTruthy()
  })
})