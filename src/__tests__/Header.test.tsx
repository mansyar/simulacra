import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import Header from '../components/Header'

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className, activeProps }: { to: string; children: ReactNode; className?: string; activeProps?: { className?: string } }) => (
    <a href={to} className={className} data-active={activeProps?.className}>
      {children}
    </a>
  ),
}))

// Mock ThemeToggle
vi.mock('../components/ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}))

describe('Header', () => {
  it('should render TanStack Start link', () => {
    render(<Header />)
    const link = screen.getByText(/TanStack Start/i)
    expect(link).toBeTruthy()
  })

  it('should render navigation links', () => {
    render(<Header />)
    expect(screen.getByText(/Home/i)).toBeTruthy()
    expect(screen.getByText(/About/i)).toBeTruthy()
    expect(screen.getByText(/Docs/i)).toBeTruthy()
  })

  it('should render social links', () => {
    render(<Header />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('should render X (Twitter) link', () => {
    render(<Header />)
    const xLink = screen.getByRole('link', { name: /Follow TanStack on X/i })
    expect(xLink).toBeTruthy()
    expect(xLink.getAttribute('href')).toBe('https://x.com/tan_stack')
  })

  it('should render GitHub link', () => {
    render(<Header />)
    const githubLink = screen.getByRole('link', { name: /Go to TanStack GitHub/i })
    expect(githubLink).toBeTruthy()
    expect(githubLink.getAttribute('href')).toBe('https://github.com/TanStack')
  })

  it('should render ThemeToggle component', () => {
    render(<Header />)
    expect(screen.getByTestId('theme-toggle')).toBeTruthy()
  })
})