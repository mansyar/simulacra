import { describe, it, expect } from 'vitest'
import { Engine } from 'excalibur'
import packageJson from '../../package.json' assert { type: 'json' }

describe('Excalibur Integration', () => {
  it('should import Excalibur Engine', () => {
    expect(Engine).toBeDefined()
  })

  it('should create an Excalibur engine instance', () => {
    // Create a minimal engine instance (won't run without a canvas)
    const engine = new Engine({ width: 800, height: 600 })
    expect(engine).toBeInstanceOf(Engine)
  })

  it('should have Excalibur version in package.json', () => {
    expect(packageJson.dependencies.excalibur).toBeDefined()
  })
})