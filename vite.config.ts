import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

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
