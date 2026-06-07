import axios from 'axios';
import { addDays, format } from 'date-fns';
import type { Feature, FeatureCollection, Point } from 'geojson';

import { getToken } from '@/lib/auth';

import { db, SYNC_META_KEY } from './db';
import type { StoredZone } from './db';

// Jendela peramalan: hari ini (H+0) sampai H+9 — sama dengan slider peta &
// jendela geser server (lihat SyncOceanForecast). Disinkronkan penuh selagi
// online agar salinan offline selalu siap saat sinyal hilang di laut.
const FORECAST_DAYS = 10;

// Jangan menyinkron ulang lebih sering dari ini saat dipicu rutin (mis. tiap
// pemuatan halaman). Dilewati saat pemicunya event `online`.
const THROTTLE_MS = 60 * 60 * 1000;

// Basemap PMTiles vektor offline (lihat BasemapLayer.tsx). Diunduh penuh sekali
// agar service worker menyimpannya; setelah itu protomaps membaca dari cache.
const BASEMAP_URL = '/tiles/id.pmtiles';
const BASEMAP_WARMED_KEY = 'pmtiles_warmed';
const BASEMAP_AVAILABLE_KEY = 'pmtiles_available';

// Graf jaringan laut untuk perute offline (lihat lib/offline/route.ts).
const MARNET_URL = '/geo/marnet.geojson';

let inFlight: Promise<void> | null = null;
let onlineListenerBound = false;

// ── Status sinkronisasi (untuk indikator di UI) ─────────────────────────────
export type SyncPhase = 'idle' | 'syncing' | 'done' | 'error';

export interface SyncStatus {
    phase: SyncPhase;
    done: number; // tanggal yang sudah tersimpan pada proses berjalan
    total: number; // target tanggal (H+0..H+9)
    lastSyncAt: number | null; // epoch ms sinkronisasi sukses terakhir
}

let status: SyncStatus = {
    phase: 'idle',
    done: 0,
    total: FORECAST_DAYS,
    lastSyncAt: null,
};
const statusListeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatus>): void {
    status = { ...status, ...patch };
    statusListeners.forEach((l) => l());
}

/** Berlangganan perubahan status sinkronisasi (untuk useSyncExternalStore). */
export function subscribeSyncStatus(cb: () => void): () => void {
    statusListeners.add(cb);

    return () => {
        statusListeners.delete(cb);
    };
}

/** Snapshot status terkini (referensi stabil sampai ada perubahan). */
export function getSyncStatus(): SyncStatus {
    return status;
}

function targetDates(): string[] {
    const today = new Date();

    return Array.from({ length: FORECAST_DAYS }, (_, i) =>
        format(addDays(today, i), 'yyyy-MM-dd'),
    );
}

interface BulkResponse extends FeatureCollection {
    sstFileUrl: string | null;
    chlFileUrl: string | null;
    date: string;
}

/**
 * Bangun ulang FeatureCollection centroid (Point) dari poligon penuh — bentuknya
 * dibuat identik dengan OceanService::getGeoJsonByDate sehingga bisa langsung
 * dipakai sebagai prop `zppiGeoJson` lapisan marker saat offline.
 */
function toCentroidCollection(bulk: BulkResponse): FeatureCollection {
    const features = bulk.features.map((f) => {
        const props = { ...(f.properties ?? {}) } as Record<string, unknown>;
        const centroid = props.centroid as [number, number] | undefined;
        delete props.centroid;

        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: centroid ?? [0, 0],
            } as Point,
            properties: props,
        } as Feature;
    });

    return { type: 'FeatureCollection', features };
}

/** Hangatkan satu URL (raster, graf, dll) agar service worker meng-cache-nya offline. */
async function warmUrl(url: string | null): Promise<void> {
    if (!url) {
        return;
    }

    try {
        await fetch(url, { credentials: 'same-origin' });
    } catch {
        // Abaikan — raster tidak wajib agar peta tetap berfungsi.
    }
}

async function syncDate(date: string): Promise<void> {
    const { data } = await axios.get<BulkResponse>('/api/map/zones/bulk', {
        params: { date },
    });

    const zones: StoredZone[] = data.features
        .map((f) => ({
            id: Number((f.properties as { id?: number } | null)?.id),
            date,
            feature: f,
        }))
        .filter((z) => Number.isFinite(z.id));

    await db.transaction('rw', db.zoneIndex, db.zones, async () => {
        await db.zones.where('date').equals(date).delete();
        await db.zones.bulkPut(zones);
        await db.zoneIndex.put({
            date,
            collection: toCentroidCollection(data),
            sstFileUrl: data.sstFileUrl,
            chlFileUrl: data.chlFileUrl,
            syncedAt: Date.now(),
        });
    });

    await Promise.all([warmUrl(data.sstFileUrl), warmUrl(data.chlFileUrl)]);
}

/**
 * Unduh penuh basemap PMTiles sekali (jika sudah dibuat) supaya service worker
 * meng-cache-nya untuk navigasi rute offline. Berat (~puluhan MB), jadi
 * dilindungi flag agar hanya sekali; GET berikutnya dilayani dari cache.
 */
async function warmBasemap(): Promise<void> {
    if (typeof localStorage === 'undefined') {
        return;
    }

    if (localStorage.getItem(BASEMAP_WARMED_KEY) === '1') {
        return;
    }

    try {
        const head = await fetch(BASEMAP_URL, { method: 'HEAD' });

        if (!head.ok) {
            return; // File belum dibuat/di-deploy.
        }

        const res = await fetch(BASEMAP_URL);

        if (res.ok) {
            await res.blob(); // Pastikan seluruh isi mengalir → tersimpan SW.
            localStorage.setItem(BASEMAP_WARMED_KEY, '1');
            localStorage.setItem(BASEMAP_AVAILABLE_KEY, '1');
        }
    } catch {
        // Offline / belum ada — dicoba lagi pada sinkronisasi berikutnya.
    }
}

/** Buang tanggal yang sudah lewat (mirror jendela geser server). */
async function pruneStale(keep: string[]): Promise<void> {
    const keepSet = new Set(keep);
    const staleIndex = await db.zoneIndex.toCollection().primaryKeys();
    const staleDates = staleIndex.filter((d) => !keepSet.has(d));

    if (staleDates.length === 0) {
        return;
    }

    await db.transaction('rw', db.zoneIndex, db.zones, async () => {
        await db.zoneIndex.bulkDelete(staleDates);
        await db.zones.where('date').anyOf(staleDates).delete();
    });
}

async function run(force: boolean): Promise<void> {
    // Hanya saat terautentikasi — endpoint bulk butuh token Sanctum.
    if (!getToken()) {
        return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
    }

    const meta = await db.meta.get(SYNC_META_KEY);

    if (
        !force &&
        meta?.lastSyncAt &&
        Date.now() - meta.lastSyncAt < THROTTLE_MS
    ) {
        return;
    }

    const dates = targetDates();
    const synced: string[] = [];

    setStatus({ phase: 'syncing', done: 0, total: dates.length });

    for (const date of dates) {
        try {
            await syncDate(date);
            synced.push(date);
            setStatus({ done: synced.length });
        } catch {
            // Lewati tanggal yang gagal (offline/401/belum dirender server);
            // percobaan berikutnya akan mencoba lagi.
        }
    }

    await pruneStale(dates);
    await warmBasemap();
    await warmUrl(MARNET_URL); // cache marine graph for offline routing

    const now = Date.now();
    await db.meta.put({ key: SYNC_META_KEY, lastSyncAt: now, dates: synced });
    setStatus({
        phase: synced.length > 0 ? 'done' : 'error',
        done: synced.length,
        lastSyncAt: synced.length > 0 ? now : status.lastSyncAt,
    });
}

/**
 * Picu sinkronisasi offline. Aman dipanggil di setiap pemuatan halaman:
 * di-throttle, anti-tumpang-tindih, dan senyap saat gagal. Juga memasang
 * listener `online` sekali agar menyinkron ulang begitu sinyal kembali.
 */
export function startOfflineSync(): void {
    if (typeof window === 'undefined') {
        return;
    }

    // Tampilkan status "tersimpan" dari sinkronisasi sebelumnya secepatnya,
    // sebelum proses baru berjalan.
    void db.meta.get(SYNC_META_KEY).then((meta) => {
        if (meta?.lastSyncAt && status.phase === 'idle') {
            setStatus({
                phase: 'done',
                lastSyncAt: meta.lastSyncAt,
                done: meta.dates?.length ?? 0,
            });
        }
    });

    if (!onlineListenerBound) {
        onlineListenerBound = true;
        window.addEventListener('online', () => {
            triggerSync(true);
        });
    }

    triggerSync(false);
}

function triggerSync(force: boolean): void {
    if (inFlight) {
        return;
    }

    inFlight = run(force).finally(() => {
        inFlight = null;
    });
}
