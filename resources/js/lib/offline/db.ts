import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Feature, FeatureCollection } from 'geojson';

/**
 * Penyimpanan offline (IndexedDB) untuk peta ZPPI.
 *
 * Nelayan kehilangan sinyal di laut, jadi seluruh data 10 hari (H+0..H+9)
 * disinkronkan selagi di darat (lihat sync.ts) lalu dibaca dari sini saat
 * offline (Phase 3). Bentuk data sengaja dibuat "drop-in":
 *   - `zoneIndex` meniru prop Inertia `zppiGeoJson` (centroid Points) untuk
 *     lapisan marker.
 *   - `zones` meniru respons `/api/map/zone/{id}` (poligon penuh) untuk
 *     digambar saat marker diklik.
 */

export interface StoredZoneIndex {
    /** Tanggal 'YYYY-MM-DD' (primary key). */
    date: string;
    /** FeatureCollection berisi centroid (Point) — drop-in untuk prop zppiGeoJson. */
    collection: FeatureCollection;
    sstFileUrl: string | null;
    chlFileUrl: string | null;
    syncedAt: number;
}

export interface StoredZone {
    /** id zona (primary key). */
    id: number;
    /** Tanggal pemilik zona, untuk pembersihan jendela geser. */
    date: string;
    /** Feature poligon penuh — drop-in untuk respons /api/map/zone/{id}. */
    feature: Feature;
}

export interface SyncMeta {
    /** Selalu 'state' — satu baris meta. */
    key: string;
    lastSyncAt: number | null;
    /** Tanggal yang sudah lengkap tersimpan offline. */
    dates: string[];
}

export interface StoredRoute {
    /** Kunci `roundStart|roundEnd` (lihat route-cache.ts). */
    key: string;
    /** Kunci tujuan saja (`roundEnd`) untuk pencarian per-zona. */
    endKey: string;
    /** Rute searoute server (Feature LineString) — rute "sempurna" yang di-cache. */
    route: Feature;
    /** Jarak (km) dari server. */
    distance: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    savedAt: number;
}

class OfflineDb extends Dexie {
    zoneIndex!: Table<StoredZoneIndex, string>;
    zones!: Table<StoredZone, number>;
    meta!: Table<SyncMeta, string>;
    routes!: Table<StoredRoute, string>;

    constructor() {
        super('nelayar-offline');
        this.version(1).stores({
            // Hanya kolom yang diindeks; nilai lain disimpan tanpa indeks.
            zoneIndex: 'date',
            zones: 'id, date',
            meta: 'key',
        });
        // v2: cache rute searoute server (di-prefetch saat zona diklik online)
        // agar navigasi offline tetap memakai rute laut yang akurat.
        this.version(2).stores({
            routes: 'key, endKey',
        });
    }
}

export const db = new OfflineDb();

export const SYNC_META_KEY = 'state';
