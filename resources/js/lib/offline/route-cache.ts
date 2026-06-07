import axios from 'axios';
import type { Feature } from 'geojson';

import { db } from './db';

/**
 * Cache rute laut "sempurna" dari server (searoute) di IndexedDB.
 *
 * Saat online & sebuah zona diklik, kita prefetch rute dari posisi nelayan ke
 * zona itu dan menyimpannya. Saat offline lalu menekan "Mulai Navigasi", rute
 * tersimpan ini dipakai — jadi navigasi tetap memakai jalur server yang akurat,
 * bukan perute graf klien atau garis lurus.
 */

export interface CachedRoute {
    route: Feature;
    distance: number;
}

// Pembulatan ~2 desimal (≈1.1 km) agar jitter GPS kecil di pelabuhan tetap cocok.
function round(n: number): number {
    return Math.round(n * 100) / 100;
}

function endKeyOf(endLat: number, endLng: number): string {
    return `${round(endLat)},${round(endLng)}`;
}

function routeKeyOf(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
): string {
    return `${round(startLat)},${round(startLng)}|${endKeyOf(endLat, endLng)}`;
}

/** Rute tersimpan untuk pasangan asal→tujuan (dibulatkan), atau undefined. */
export async function readCachedRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
): Promise<CachedRoute | undefined> {
    const row = await db.routes.get(
        routeKeyOf(startLat, startLng, endLat, endLng),
    );

    return row ? { route: row.route, distance: row.distance } : undefined;
}

async function saveRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    route: Feature,
    distance: number,
): Promise<void> {
    await db.routes.put({
        key: routeKeyOf(startLat, startLng, endLat, endLng),
        endKey: endKeyOf(endLat, endLng),
        route,
        distance,
        startLat,
        startLng,
        endLat,
        endLng,
        savedAt: Date.now(),
    });
}

/**
 * Prefetch + simpan rute server dari posisi nelayan ke sebuah zona. Dipanggil
 * fire-and-forget saat zona diklik (online). Senyap saat gagal/offline, dan
 * melewati permintaan bila rute untuk pasangan ini sudah tersimpan.
 */
export async function prefetchRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
    }

    if (await readCachedRoute(startLat, startLng, endLat, endLng)) {
        return;
    }

    try {
        const { data } = await axios.get('/api/map/route', {
            params: {
                start_lat: startLat,
                start_lng: startLng,
                end_lat: endLat,
                end_lng: endLng,
            },
        });

        if (!data?.route) {
            return;
        }

        const distance =
            typeof data.distance === 'number'
                ? data.distance
                : Number(data.distance) || 0;
        await saveRoute(
            startLat,
            startLng,
            endLat,
            endLng,
            data.route as Feature,
            distance,
        );
    } catch {
        // Senyap — prefetch hanya optimasi; navigasi tetap punya fallback.
    }
}

/** Simpan rute yang baru dihitung (mis. dari planRoute online) ke cache. */
export async function cacheComputedRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    route: Feature,
    distance: number | null,
): Promise<void> {
    if (distance == null) {
        return;
    }

    try {
        await saveRoute(startLat, startLng, endLat, endLng, route, distance);
    } catch {
        // Abaikan kegagalan penyimpanan cache.
    }
}
