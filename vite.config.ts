import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import mkcert from 'vite-plugin-mkcert';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [
        svelte(),
        tailwindcss(),
        mkcert(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: [
                'apple-touch-icon.png'
            ],
            manifest: {
                name: 'dayline',
                short_name: 'dayline',
                description: 'dayline',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                navigateFallback: '/index.html',
                cleanupOutdatedCaches: true,
                clientsClaim: false,
                skipWaiting: false,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}']
            }
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(process.cwd(), 'src')
        }
    },
    // ✅ 必须 - 禁用客户端预构建本地包的缓存
    optimizeDeps: {
        exclude: ['@knowckx/infa-s5']
    },
    server: { // 开发地址
        https: {},
        port: 23001,
        host: true,
    },
    preview: { // 生产的pwa地址
        port: 33001,
        host: true
    },
});
