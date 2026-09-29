import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

function commit(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha) return sha.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_COMMIT': JSON.stringify(commit()),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
} as never);
