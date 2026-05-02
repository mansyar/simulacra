import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn().mockImplementation(() => (config: unknown) => config),
}))

// Import after mocking
import { Route } from '../routes/about'

interface MockRoute {
  component: ComponentType;
}

describe('About Route', () => {
  it('should export Route configuration', () => {
    expect(Route).toBeTruthy()
  })

  it('should render About component', () => {
    // Access component property with type assertion
    const AboutComponent = (Route as unknown as MockRoute).component
    expect(AboutComponent).toBeTruthy()
    
    render(<AboutComponent />)
    
    expect(screen.getByText(/About/i)).toBeTruthy()
    expect(screen.getByText(/A small starter with room to grow/i)).toBeTruthy()
  })

  it('should have correct page structure', () => {
    const AboutComponent = (Route as unknown as MockRoute).component
    render(<AboutComponent />)
    
    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    expect(main.className).toContain('page-wrap')
  })
})