import { describe, it, expect, vi } from 'vitest'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createRouter: vi.fn().mockImplementation(() => ({
    // Mock router instance
  })),
}))

// Mock routeTree
vi.mock('../routeTree.gen', () => ({
  routeTree: {},
}))

// Import after mocking
import { getRouter } from '../router'

describe('Router', () => {
  it('should export getRouter function', () => {
    expect(getRouter).toBeTruthy()
    expect(typeof getRouter).toBe('function')
  })

  it('should return a router instance', () => {
    const router = getRouter()
    expect(router).toBeTruthy()
  })
})