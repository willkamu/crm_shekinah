import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/', // ✔ Correcto para Cloud Run
    plugins: [react()],

    server: {
      port: 3000,
      host: '0.0.0.0'
    },

    define: {
      // ⚠️ Forma correcta en Vite (NO usar process.env directo en runtime)
      __GEMINI_API_KEY__: JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname)
      }
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      cssCodeSplit: true, // ✔ BIEN
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
