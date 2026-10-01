import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // Registro do Service Worker feito manualmente em
      // src/registerServiceWorker.ts (importado no main.tsx), para
      // garantir que a aba recarregue sozinha assim que uma versão nova
      // assumir o controle. Sem isso, o registro automático embutido do
      // plugin não força esse reload, e quem já estava com o app aberto
      // continua vendo a versão antiga até fechar e abrir de novo.
      injectRegister: false,

      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'Gestão',
        short_name: 'Gestão',
        description: 'Controle de gastos e parcelas',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        orientation: 'portrait-primary',
        icons: [
          { src: '/favicon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

        // Assim que uma versão nova do Service Worker termina de
        // instalar, ela assume o controle na hora (sem esperar todas as
        // abas antigas fecharem) e limpa os caches de versões anteriores.
        // registerType: 'autoUpdate' já ativa isso por padrão, mas deixar
        // explícito evita depender de comportamento implícito do plugin.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,

        // Qualquer navegação que não bata com um arquivo real cai no
        // index.html — necessário pro React Router funcionar também
        // quando o app está rodando offline/instalado como PWA.
        navigateFallback: '/index.html',
      },
    }),
  ],
  base: './',
})