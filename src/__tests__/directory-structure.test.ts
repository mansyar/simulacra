import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Project Directory Structure', () => {
  const srcPath = path.join(__dirname, '..')

  it('should have src/components/game directory', () => {
    const gamePath = path.join(srcPath, 'components', 'game')
    expect(fs.existsSync(gamePath)).toBe(true)
    expect(fs.statSync(gamePath).isDirectory()).toBe(true)
  })

  it('should have src/components/ui directory', () => {
    const uiPath = path.join(srcPath, 'components', 'ui')
    expect(fs.existsSync(uiPath)).toBe(true)
    expect(fs.statSync(uiPath).isDirectory()).toBe(true)
  })

  it('should have src/lib directory', () => {
    const libPath = path.join(srcPath, 'lib')
    expect(fs.existsSync(libPath)).toBe(true)
    expect(fs.statSync(libPath).isDirectory()).toBe(true)
  })

  it('should have src/routes directory', () => {
    const routesPath = path.join(srcPath, 'routes')
    expect(fs.existsSync(routesPath)).toBe(true)
    expect(fs.statSync(routesPath).isDirectory()).toBe(true)
  })

  it('should have src/components/index.ts file', () => {
    const indexPath = path.join(srcPath, 'components', 'index.ts')
    expect(fs.existsSync(indexPath)).toBe(true)
  })
})