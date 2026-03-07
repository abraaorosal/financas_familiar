import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'financas_familiar';
const configuredBase = process.env.VITE_BASE_PATH;

export default defineConfig({
  base: configuredBase ?? (process.env.GITHUB_ACTIONS ? `/${repositoryName}/` : '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
