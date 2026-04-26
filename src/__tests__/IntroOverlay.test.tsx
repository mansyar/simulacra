import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { IntroOverlay } from '../components/ui/IntroOverlay'

describe('IntroOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render with welcome message', () => {
    const { getByText, getAllByText } = render(<IntroOverlay onDismiss={vi.fn()} />)
    expect(getByText(/Welcome to/i)).toBeTruthy()
    expect(getAllByText(/Simulacra/i).length).toBeGreaterThan(0)
    expect(getByText(/A living, breathing isometric world/i)).toBeTruthy()
  })

  it('should call onDismiss after animation delay when the button is clicked', () => {
    const onDismiss = vi.fn()
    const { getByRole } = render(<IntroOverlay onDismiss={onDismiss} />)
    const button = getByRole('button', { name: /Enter World/i })
    
    fireEvent.click(button)
    
    // onDismiss shouldn't be called immediately
    expect(onDismiss).not.toHaveBeenCalled()
    
    // Advance time
    act(() => {
      vi.advanceTimersByTime(800)
    })
    
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
