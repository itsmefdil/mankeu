import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'html-env-transform',
        transformIndexHtml(html) {
          return html.replace(
            /%VITE_GOOGLE_CLIENT_ID%/g,
            env.VITE_GOOGLE_CLIENT_ID || ''
          );
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            recharts: ['recharts'],
            ui: ['lucide-react', '@radix-ui/react-checkbox', '@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-progress', '@radix-ui/react-select', '@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
            utils: ['axios', 'zustand', '@tanstack/react-query']
          }
        }
      }
    }
  }
})
