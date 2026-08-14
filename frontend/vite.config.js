import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Le CLI `prisma` embarque `@prisma/studio-core`, qui dépend de React 18 ; npm hisse
    // cette copie à la racine du workspace. Sans dédoublonnage, Vite en met deux dans le
    // bundle et les hooks plantent sur `Cannot read properties of null (reading 'useRef')`.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
