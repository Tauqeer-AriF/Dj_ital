import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const workspaceRoot = import.meta.dirname || '.';
  const mutableStoragePaths = [
    path.resolve(workspaceRoot, 'data', '**').replace(/\\/g, '/'),
    path.resolve(workspaceRoot, 'public', 'uploads', '**').replace(/\\/g, '/'),
  ];

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Ignore server-side mutable files so saves and uploads don't trigger a page reload.
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: mutableStoragePaths },
    },
  };
});
