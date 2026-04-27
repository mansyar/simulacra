import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { IntroOverlay } from '../components/ui/IntroOverlay'

describe('IntroOverlay', () => {
  it('should render with welcome message', () => {
    const { getByText, getAllByText } = render(<IntroOverlay onDismiss={vi.fn()} />)
    expect(getByText(/Welcome to/i)).toBeTruthy()
    expect(getAllByText(/Simulacra/i).length).toBeGreaterThan(0)
    expect(getByText(/A living, breathing isometric world/i)).toBeTruthy()
  })

  it('should call onDismiss after animation delay when the button is clicked', async () => {
    const onDismiss = vi.fn()
    const { getByRole } = render(<IntroOverlay onDismiss={onDismiss} />)
    const button = getByRole('button', { name: /Enter World/i })
    
    fireEvent.click(button)
    
    // onDismiss shouldn't be called immediately
    expect(onDismiss).not.toHaveBeenCalled()
    
    // Wait for the exit animation to complete (duration 0.8s)
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1)
    }, { timeout: 2000 })
  })
})
