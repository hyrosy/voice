import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // <-- 1. ADD THIS IMPORT

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  /* --- 2. ADD THIS RESOLVE OBJECT --- */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  /* --- END OF ADDITION --- */
});