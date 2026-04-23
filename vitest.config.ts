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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
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
        // Ignored files
        'src/routeTree.gen.ts',
        'src/router.tsx',
        'src/components/index.ts',
        'src/routes/__root.tsx',
      ],
    },
    projects: [
      {
        // Frontend tests (jsdom environment)
        test: {
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
        },
      },
      {
        // Convex function tests (edge-runtime environment)
        test: {
          environment: 'edge-runtime',
          include: ['convex/**/*.{test,spec}.{ts,tsx}'],
        },
      },
    ],
  },
})