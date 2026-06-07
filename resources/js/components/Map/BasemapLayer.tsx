import type L from 'leaflet';
import { leafletLayer } from 'protomaps-leaflet';
import { useEffect, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

// Basemap PMTiles vektor offline (Indonesia, z0–z10) untuk navigasi rute tanpa
// internet. pmtiles membaca file via HTTP byte-range. Server statis produksi
// (nginx) mendukungnya, TAPI `php artisan serve` tidak — jadi kita selalu
// mengandalkan cache service worker: file diunduh PENUH sekali (CacheFirst),
// lalu workbox `rangeRequests` menyajikan potongan 206 dari file utuh itu, baik
// online maupun offline. Penting: JANGAN memancing dengan request range sebelum
// file utuh ter-cache — respons parsial akan meracuni cache & memecah pmtiles.
const PMTILES_URL = '/tiles/id.pmtiles';

// Ditandai setelah file utuh berhasil di-cache. Versi dinaikkan agar cache
// lama yang mungkin berisi potongan parsial (dari percobaan terdahulu) diabaikan
// dan di-warm ulang dari awal.
const WARMED_KEY = 'pmtiles_warmed_v2';

type Mode = 'pmtiles' | 'carto' | null;

/** Hapus cache basemap (mis. potongan range parsial yang merusak pmtiles). */
async function clearBasemapCache(): Promise<void> {
    if (typeof caches === 'undefined') {
        return;
    }

    const keys = await caches.keys();
    await Promise.all(
        keys
            .filter((key) => key.includes('basemap-pmtiles'))
            .map((key) => caches.delete(key)),
    );
}

/**
 * Memilih basemap: PMTiles vektor (disajikan dari cache SW) bila siap, jika tidak
 * jatuh ke raster CARTO online. Tidak pernah membiarkan peta kosong.
 */
export default function BasemapLayer() {
    const map = useMap();
    const [mode, setMode] = useState<Mode>(null);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const controller =
                'serviceWorker' in navigator &&
                navigator.serviceWorker.controller;

            // Tanpa SW yang mengontrol halaman, range hanya bisa dari server —
            // yang tak diandalkan (dev). Pakai CARTO online.
            if (!controller) {
                if (!cancelled) {
                    setMode('carto');
                }

                return;
            }

            // Sudah pernah di-warm: cache memuat file utuh → langsung pakai vektor
            // (range disajikan SW dari cache, online maupun offline).
            if (localStorage.getItem(WARMED_KEY) === '1') {
                if (!cancelled) {
                    setMode('pmtiles');
                }

                return;
            }

            // Belum di-warm dan offline: belum bisa mengunduh → CARTO dulu.
            if (!navigator.onLine) {
                if (!cancelled) {
                    setMode('carto');
                }

                return;
            }

            try {
                const head = await fetch(PMTILES_URL, { method: 'HEAD' });

                if (!head.ok) {
                    if (!cancelled) {
                        setMode('carto');
                    }

                    return;
                }

                // Buang potongan parsial lama, lalu unduh PENUH (tanpa header Range)
                // agar CacheFirst menyimpan arsip utuh untuk di-slice jadi 206.
                await clearBasemapCache();
                const full = await fetch(PMTILES_URL);

                if (!full.ok) {
                    if (!cancelled) {
                        setMode('carto');
                    }

                    return;
                }

                await full.blob(); // pastikan seluruh isi mengalir → tersimpan SW
                localStorage.setItem(WARMED_KEY, '1');

                if (!cancelled) {
                    setMode('pmtiles');
                }
            } catch {
                if (!cancelled) {
                    setMode('carto');
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (mode !== 'pmtiles') {
            return;
        }

        // leafletLayer mengembalikan GridLayer, tapi tipe pustaka tidak meng-expose
        // anggota L.Layer — cast agar addTo/removeLayer lolos pemeriksaan tipe.
        // maxZoom wajib (tanpa itu Leaflet melempar "Map has no maxZoom specified");
        // maxDataZoom = batas data (z10), di atasnya peta meng-overzoom vektor.
        const layer = leafletLayer({
            url: PMTILES_URL,
            flavor: 'light',
            lang: 'id',
            maxZoom: 18,
            maxDataZoom: 10,
        }) as unknown as L.Layer;
        layer.addTo(map);

        return () => {
            map.removeLayer(layer);
        };
    }, [mode, map]);

    if (mode === 'pmtiles') {
        return null;
    }

    // Selagi mengecek (null) atau bila PMTiles tak siap: raster CARTO online.
    return (
        <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO"
        />
    );
}
