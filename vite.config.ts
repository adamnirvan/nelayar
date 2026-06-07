import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            // We register the SW ourselves in app.tsx (with explicit `/` scope),
            // so disable the plugin's auto-injected registration.
            injectRegister: false,
            registerType: 'autoUpdate',
            scope: '/',
            manifestFilename: 'manifest.webmanifest',
            manifest: {
                name: 'Nelayar GIS — Peta Nelayan',
                short_name: 'Nelayar',
                description:
                    'Peta zona potensi ikan, cuaca, dan rute laut untuk nelayan — dapat dipakai tanpa internet.',
                lang: 'id',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#ffffff',
                theme_color: '#0f172a',
                icons: [
                    {
                        src: '/icon-blue.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: '/apple-touch-icon.png',
                        sizes: '180x180',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                cleanupOutdatedCaches: true,
                // Ambil alih kendali halaman secepatnya: tanpa clientsClaim, SW tidak
                // mengontrol load pertama → rute navigasi NetworkFirst tak pernah
                // meng-cache /map, sehingga halaman gagal dibuka saat offline.
                // Dengan ini, satu kunjungan online (yang otomatis reload via
                // workbox-window 'controlling') sudah menyimpan halaman ke cache.
                clientsClaim: true,
                skipWaiting: true,
                // Single self-contained sw.js (no separate workbox-*.js import) so it
                // can be lifted to the web root by scripts/pwa-postbuild.mjs.
                inlineWorkboxRuntime: true,
                // This is a Laravel/Inertia app — HTML is rendered by PHP, there is no
                // SPA index.html, so disable the default navigation fallback. Documents
                // are handled by the NetworkFirst `navigate` runtimeCaching rule below.
                navigateFallback: null,
                // Precache the built app shell (JS/CSS/fonts/icons).
                globPatterns: ['**/*.{js,css,ico,svg,woff,woff2}'],
                // The Inertia HTML is rendered by PHP per-request, not part of the
                // build, so it cannot be precached — cache it at runtime instead.
                runtimeCaching: [
                    {
                        // HTML documents (Inertia pages): keep them fresh online,
                        // fall back to the last-seen copy when offline at sea.
                        urlPattern: ({ request }) =>
                            request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'html-pages',
                            networkTimeoutSeconds: 3,
                            expiration: {
                                maxEntries: 32,
                                maxAgeSeconds: 60 * 60 * 24 * 14,
                            },
                        },
                    },
                    {
                        // Offline vector basemap (PMTiles). protomaps-leaflet fetches
                        // byte ranges, so rangeRequests slices them out of the fully
                        // cached file — the whole archive is warmed once by sync.ts.
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith('/tiles/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'basemap-pmtiles',
                            rangeRequests: true,
                            cacheableResponse: { statuses: [0, 200, 206] },
                            expiration: {
                                maxEntries: 2,
                                maxAgeSeconds: 60 * 60 * 24 * 90,
                            },
                        },
                    },
                    {
                        // Static geo assets: marine routing graph (marnet) +
                        // province boundaries. Cached so offline routing works.
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith('/geo/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'geo-static',
                            expiration: {
                                maxEntries: 8,
                                maxAgeSeconds: 60 * 60 * 24 * 90,
                            },
                        },
                    },
                    {
                        // Pre-rendered SST/Chl raster overlays per forecast date.
                        urlPattern: ({ url }) =>
                            url.pathname.includes('/storage/grids/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'ocean-rasters',
                            expiration: {
                                maxEntries: 80,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                    {
                        // Zone polygons + weather JSON (Phase 2 also mirrors these to
                        // IndexedDB; this gives a cache fallback for ad-hoc requests).
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith('/api/map/zone') ||
                            url.pathname.startsWith('/api/map/weather'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'map-api',
                            networkTimeoutSeconds: 4,
                            expiration: {
                                maxEntries: 500,
                                maxAgeSeconds: 60 * 60 * 24 * 14,
                            },
                        },
                    },
                    {
                        // Remote webfonts (bunny.net) — serve cached when offline.
                        urlPattern: ({ url }) =>
                            url.origin === 'https://fonts.bunny.net',
                        handler: 'StaleWhileRevalidate',
                        options: { cacheName: 'webfonts' },
                    },
                ],
            },
            devOptions: {
                // No SW in dev so it never shadows Vite HMR / artisan serve.
                enabled: false,
            },
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                // Pisahkan library berat ke chunk vendor sendiri agar tidak
                // membengkakkan bundle `app` yang dimuat di SETIAP halaman, dan
                // agar tiap chunk bisa di-cache terpisah. Library yang hanya
                // dipakai satu halaman (leaflet → peta, recharts → harga) tetap
                // lazy karena hanya diimpor dari chunk halaman tersebut.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;

                    // leaflet + react-leaflet + leaflet.markercluster (hanya halaman peta)
                    if (id.includes('leaflet')) return 'leaflet';

                    // recharts dan dependensi d3-nya (hanya halaman harga)
                    if (
                        id.includes('recharts') ||
                        id.includes('node_modules/d3-') ||
                        id.includes('victory-vendor') ||
                        id.includes('decimal.js')
                    ) {
                        return 'charts';
                    }

                    // animasi (landing + sidebar peta)
                    if (
                        id.includes('framer-motion') ||
                        id.includes('node_modules/motion')
                    ) {
                        return 'motion';
                    }

                    // inti runtime React/Inertia (dipakai semua halaman → vendor bersama)
                    if (
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/scheduler/') ||
                        id.includes('node_modules/react-is/') ||
                        id.includes('@inertiajs')
                    ) {
                        return 'react-vendor';
                    }
                },
            },
        },
    },
});
