import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid TypeScript error about missing 'cwd' property on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './', // Ensures assets are loaded correctly on GitHub Pages
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    server: {
      port: 3000,
    },
    // Fix: Polyfill process.env to prevent "process is not defined" crash
    define: {
      'process.env': {
        API_KEY: env.API_KEY || ''
      }
    }
  };
});