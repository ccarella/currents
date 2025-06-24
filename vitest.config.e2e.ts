import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    testTimeout: 30000, // 30 seconds for e2e tests
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
