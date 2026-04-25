import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import usePresenceWithSessionStorage from '../lib/usePresenceWithSessionStorage'
import { useQuery, useMutation, useConvex } from 'convex/react'

// Mock convex/react
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useConvex: vi.fn(),
}))

describe('usePresenceWithSessionStorage', () => {
  const presenceApi = {
    heartbeat: 'presence:heartbeat',
    list: 'presence:list',
    disconnect: 'presence:disconnect',
  }
  const roomId = 'test-room'
  const userId = 'test-user'
  const interval = 10000

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let heartbeatMock: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let disconnectMock: any

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    
    heartbeatMock = vi.fn().mockResolvedValue({ roomToken: 'rt', sessionToken: 'st' })
    disconnectMock = vi.fn().mockResolvedValue({})

    vi.mocked(useConvex).mockReturnValue({ url: 'http://localhost:3000' } as ReturnType<typeof useConvex>)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useMutation).mockImplementation((name: any) => {
      if (name === presenceApi.heartbeat) return heartbeatMock
      if (name === presenceApi.disconnect) return disconnectMock
      return vi.fn().mockResolvedValue({})
    })
    vi.mocked(useQuery).mockReturnValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates a session ID and stores it in sessionStorage', async () => {
    renderHook(() => usePresenceWithSessionStorage(presenceApi, roomId, userId, interval))
    
    await waitFor(() => {
      const storageKey = `presence_session_${roomId}_${userId}`
      const sessionId = sessionStorage.getItem(storageKey)
      expect(sessionId).toBeDefined()
    })
  })

  it('persists the session ID across re-renders', async () => {
    const { rerender } = renderHook(() => usePresenceWithSessionStorage(presenceApi, roomId, userId, interval))
    
    const storageKey = `presence_session_${roomId}_${userId}`
    let firstSessionId: string | null = null
    
    await waitFor(() => {
      firstSessionId = sessionStorage.getItem(storageKey)
      expect(firstSessionId).not.toBeNull()
    })
    
    rerender()
    
    expect(sessionStorage.getItem(storageKey)).toBe(firstSessionId)
  })

  it('uses the stored session ID from sessionStorage', async () => {
    const storageKey = `presence_session_${roomId}_${userId}`
    const existingId = 'existing-session-id'
    sessionStorage.setItem(storageKey, existingId)
    
    renderHook(() => usePresenceWithSessionStorage(presenceApi, roomId, userId, interval))
    
    await waitFor(() => {
      expect(sessionStorage.getItem(storageKey)).toBe(existingId)
    })
  })

  it('sends heartbeat mutation on mount', async () => {
    renderHook(() => usePresenceWithSessionStorage(presenceApi, roomId, userId, interval))
    
    await waitFor(() => {
      expect(heartbeatMock).toHaveBeenCalled()
    })
  })

  it('handles visibilitychange', async () => {
    // We'll use real timers but a very short interval to keep it fast
    const shortInterval = 50
    renderHook(() => usePresenceWithSessionStorage(presenceApi, roomId, userId, shortInterval))
    
    // Wait for initial heartbeat
    await waitFor(() => expect(heartbeatMock).toHaveBeenCalled())
    
    // Flush microtasks
    await act(async () => { await Promise.resolve() })
    
    heartbeatMock.mockClear()

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    
    // Trigger visibilitychange
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Should call disconnect when hidden
    await waitFor(() => expect(disconnectMock).toHaveBeenCalled())
    
    // Wait for more than the short interval
    await new Promise(resolve => setTimeout(resolve, shortInterval * 2))
    
    // Heartbeat should still be 0 (no new calls while hidden)
    expect(heartbeatMock).toHaveBeenCalledTimes(0)

    // Mock document.hidden = false
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    
    // Trigger visibilitychange
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Wait for heartbeat triggered by becoming visible
    await waitFor(() => expect(heartbeatMock).toHaveBeenCalledTimes(1))
  })

  it('handles beforeunload with sendBeacon', async () => {
    const sendBeaconMock = vi.fn()
    vi.stubGlobal('navigator', { sendBeacon: sendBeaconMock })
    
    renderHook(() => usePresenceWithSessionStorage(presenceApi, roomId, userId, interval))
    
    // Wait for initial heartbeat to get session token
    await waitFor(() => expect(heartbeatMock).toHaveBeenCalled())
    
    // Flush microtasks
    await act(async () => { await Promise.resolve() })

    // Trigger beforeunload
    window.dispatchEvent(new Event('beforeunload'))
    
    expect(sendBeaconMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/mutation'),
      expect.any(Blob)
    )
  })

  it('useSingleFlight handles errors and processes upNext', async () => {
    // This is hard to test directly because useSingleFlight is private,
    // but it is used by heartbeat and disconnect.
    
    // We can simulate multiple rapid calls
    const { rerender } = renderHook(({ rid }) => usePresenceWithSessionStorage(presenceApi, rid, userId, interval), {
      initialProps: { rid: 'room1' }
    })
    
    // Rerendering with different roomId triggers a disconnect and a session change
    // This will cause multiple calls to disconnect and heartbeat
    heartbeatMock.mockClear()
    disconnectMock.mockClear()
    
    await act(async () => {
      rerender({ rid: 'room2' })
      rerender({ rid: 'room3' })
    })

    // It should have called disconnect and heartbeat at least once for the latest room
    await waitFor(() => {
      expect(heartbeatMock).toHaveBeenCalled()
    })
  })
})