import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Project Initialization', () => {
  it('should have a package.json file', () => {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
    expect(fs.existsSync(packageJsonPath)).toBe(true)
  })

  it('should have required scripts in package.json', () => {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    expect(packageJson.scripts).toBeDefined()
    expect(packageJson.scripts.dev).toBeDefined()
    expect(packageJson.scripts.build).toBeDefined()
    expect(packageJson.scripts.test).toBeDefined()
  })

  it('should have TanStack Start dependencies', () => {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    expect(packageJson.dependencies).toBeDefined()
    expect(packageJson.dependencies['@tanstack/react-start']).toBeDefined()
  })

  it('should have TypeScript configuration', () => {
    const tsconfigPath = path.join(__dirname, '..', '..', 'tsconfig.json')
    expect(fs.existsSync(tsconfigPath)).toBe(true)
  })

  it('should have Vite configuration', () => {
    const viteConfigPath = path.join(__dirname, '..', '..', 'vite.config.ts')
    expect(fs.existsSync(viteConfigPath)).toBe(true)
  })
})