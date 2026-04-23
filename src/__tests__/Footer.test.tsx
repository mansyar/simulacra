import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../components/Footer'

describe('Footer', () => {
  it('should render copyright with current year', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    const copyrightElement = screen.getByText(new RegExp(`© ${currentYear}`))
    expect(copyrightElement).toBeTruthy()
  })

  it('should contain TanStack attribution', () => {
    render(<Footer />)
    const attribution = screen.getByText(/Built with TanStack Start/)
    expect(attribution).toBeTruthy()
  })

  it('should contain social links', () => {
    render(<Footer />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('should have X (Twitter) link', () => {
    render(<Footer />)
    const xLink = screen.getByRole('link', { name: /Follow TanStack on X/i })
    expect(xLink).toBeTruthy()
    expect(xLink.getAttribute('href')).toBe('https://x.com/tan_stack')
  })

  it('should have GitHub link', () => {
    render(<Footer />)
    const githubLink = screen.getByRole('link', { name: /Go to TanStack GitHub/i })
    expect(githubLink).toBeTruthy()
    expect(githubLink.getAttribute('href')).toBe('https://github.com/TanStack')
  })
})