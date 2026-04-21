import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Tailwind CSS Configuration', () => {
  it('should have Tailwind CSS imported in styles.css', () => {
    const stylesPath = path.join(__dirname, '..', 'styles.css')
    const content = fs.readFileSync(stylesPath, 'utf-8')
    expect(content).toContain('@import "tailwindcss"')
  })

  it('should have Tailwind CSS plugin in vite.config.ts', () => {
    const viteConfigPath = path.join(__dirname, '..', '..', 'vite.config.ts')
    const content = fs.readFileSync(viteConfigPath, 'utf-8')
    expect(content).toContain('tailwindcss')
  })

  it('should have custom theme colors defined', () => {
    const stylesPath = path.join(__dirname, '..', 'styles.css')
    const content = fs.readFileSync(stylesPath, 'utf-8')
    // Check for CSS custom properties
    expect(content).toContain('--sea-ink')
    expect(content).toContain('--lagoon')
    expect(content).toContain('--palm')
  })

  it('should have Tailwind plugin for typography', () => {
    const stylesPath = path.join(__dirname, '..', 'styles.css')
    const content = fs.readFileSync(stylesPath, 'utf-8')
    expect(content).toContain('@plugin "@tailwindcss/typography"')
  })
})