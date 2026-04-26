import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import ThemeToggle from '../components/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // Reset document class list and localStorage
    document.documentElement.classList.remove('dark', 'light')
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should toggle between light, dark, and auto modes', () => {
    const { getByRole } = render(<ThemeToggle />)
    const button = getByRole('button')

    // Initial state (auto)
    expect(button.textContent).toBe('Auto')

    // Click to toggle to light
    fireEvent.click(button)
    expect(button.textContent).toBe('Light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('light')

    // Click to toggle to dark
    fireEvent.click(button)
    expect(button.textContent).toBe('Dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')

    // Click to toggle to auto
    fireEvent.click(button)
    expect(button.textContent).toBe('Auto')
    expect(localStorage.getItem('theme')).toBe('auto')
  })

  it('should initialize based on localStorage', () => {
    localStorage.setItem('theme', 'dark')
    const { getByRole } = render(<ThemeToggle />)
    expect(getByRole('button').textContent).toBe('Dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should handle system preference in auto mode', () => {
    const { getByRole } = render(<ThemeToggle />)
    expect(getByRole('button').textContent).toBe('Auto')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
