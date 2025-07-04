import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')  // Généralement on alias `src/` à `@`
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Nettoyage de chemin multiplateforme
              return id.split('node_modules/')[1].split('/')[0].replace(/\\/g, '/');
            }
          }
        }
      }
    },
    plugins: [
      // Gzip compression
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // compress files >10kB
        deleteOriginFile: false
      }),
      // Brotli compression
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      })
    ]
  };
});
