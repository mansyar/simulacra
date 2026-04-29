import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      'ui-design/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '.output/',
        'dist/',
        'build/',
        'scripts/',
        'coverage/',
        '**/*.config.ts',
        '**/*.config.js',
        'vitest.config.ts',
        'vite.config.ts',
        'eslint.config.js',
        'ui-design/**',
        // Ignored files
        'src/routeTree.gen.ts',
        'src/router.tsx',
        'src/components/index.ts',
        'src/routes/__root.tsx',
        'convex/_generated/**',
        'convex/functions/seed.ts',
        'convex/presence.ts',
        'convex/README.md',
        'src/lib/**',
        'src/routes/**',
        'src/components/**',
      ],
    },
  },
})