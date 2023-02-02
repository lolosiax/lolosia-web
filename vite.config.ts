import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'
import packageJson from './package.json' with { type: 'json' }
import { settings } from './src/core/config/settings.ts'

const pathSrc = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  base: settings.viteBasePath,
  define: {
    'import.meta.env.PROJECT_VERSION': JSON.stringify(packageJson.version)
  },
  server: {
    port: 5005,
    host: true,
    open: false
  },
  preview: {
    port: 5006,
    host: true,
    strictPort: true
  },
  experimental: {
    renderBuiltUrl(filename, { hostType, type }) {
      if (type === 'public' || hostType !== 'js') return { relative: true }
      return { runtime: `(window.NGINX_BASE_URL || '') + \`${settings.viteBasePath}${filename}\`` }
    }
  },
  plugins: [
    vue(),
    UnoCSS(),
    Components({
      dirs: [],
      extensions: ['vue'],
      dts: 'typings/components.d.ts',
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': pathSrc
    }
  },
  optimizeDeps: {
    include: ['moment-mini']
  },
  build: {
    assetsDir: 'static/assets',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        chunkFileNames: 'static/js/chunk-[hash].js',
        entryFileNames: 'static/js/index.js',
        assetFileNames: 'static/[ext]/[hash].[ext]',
        codeSplitting: {
          groups: [
            { name: 'vue', test: /node_modules[\\/](vue|vue-router|pinia|@vue)[\\/]/, priority: 30 },
            { name: 'element-plus', test: /node_modules[\\/](element-plus|@element-plus)[\\/]/, priority: 20 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 10 }
          ]
        }
      }
    }
  }
})
