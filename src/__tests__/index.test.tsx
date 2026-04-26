import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Route } from '../routes/index'

// Mock IntroOverlay
vi.mock('../components/ui/IntroOverlay', () => ({
  IntroOverlay: ({ onDismiss }: { onDismiss: () => void }) => (
    <div data-testid="intro-overlay">
      <button onClick={onDismiss}>Enter World</button>
    </div>
  ),
}))

describe('Index Route', () => {
  const AppComponent = Route.options.component!

  it('should render App component with IntroOverlay', () => {
    render(<AppComponent />)
    expect(screen.getByTestId('intro-overlay')).toBeTruthy()
  })

  it('should dismiss IntroOverlay when onDismiss is called', async () => {
    render(<AppComponent />)
    const button = screen.getByText(/Enter World/i)
    
    await act(async () => {
      fireEvent.click(button)
    })
    
    expect(screen.queryByTestId('intro-overlay')).toBeNull()
  })
})
