import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // Carrega as variáveis de ambiente do arquivo .env
  envDir: '.',
  envPrefix: 'VITE_',
});
