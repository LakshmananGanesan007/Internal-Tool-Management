import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor code so the first paint only loads what it needs
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('vuedraggable') || id.includes('sortablejs')) return 'draggable'
          if (id.includes('fuse.js')) return 'fuse'
          if (id.includes('lucide')) return 'icons'
          return 'vendor'
        },
      },
    },
  },
})
