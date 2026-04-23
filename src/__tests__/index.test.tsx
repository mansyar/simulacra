import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn().mockImplementation(() => (config: unknown) => config),
}))

// Import after mocking
import { Route } from '../routes/index'

describe('Index Route', () => {
  it('should export Route configuration', () => {
    expect(Route).toBeTruthy()
  })

  it('should render App component', () => {
    const routeAny = Route as unknown as { component: ComponentType }
    const AppComponent = routeAny.component
    expect(AppComponent).toBeTruthy()
    
    render(<AppComponent />)
    
    expect(screen.getByText(/TanStack Start Base Template/i)).toBeTruthy()
    expect(screen.getByText(/Start simple, ship quickly/i)).toBeTruthy()
  })

  it('should have correct page structure', () => {
    const routeAny = Route as unknown as { component: ComponentType }
    const AppComponent = routeAny.component
    render(<AppComponent />)
    
    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    expect(main.className).toContain('page-wrap')
  })

  it('should render feature cards', () => {
    const routeAny = Route as unknown as { component: ComponentType }
    const AppComponent = routeAny.component
    render(<AppComponent />)
    
    expect(screen.getByText(/Type-Safe Routing/i)).toBeTruthy()
    expect(screen.getByText(/Server Functions/i)).toBeTruthy()
    expect(screen.getByText(/Streaming by Default/i)).toBeTruthy()
    expect(screen.getByText(/Tailwind Native/i)).toBeTruthy()
  })

  it('should render links', () => {
    const routeAny = Route as unknown as { component: ComponentType }
    const AppComponent = routeAny.component
    render(<AppComponent />)
    
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})