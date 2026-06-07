import type { Feature } from 'geojson';

import { db } from './db';
import type { StoredZoneIndex } from './db';

/**
 * Pembacaan offline dari IndexedDB (diisi oleh sync.ts). Dipakai komponen peta
 * saat nelayan kehilangan sinyal: lapisan marker & geometri zona dibaca dari
 * sini alih-alih dari server.
 */

/** Indeks centroid + URL raster untuk satu tanggal, atau `undefined` bila belum tersinkron. */
export function readZoneIndex(
    date: string,
): Promise<StoredZoneIndex | undefined> {
    return db.zoneIndex.get(date);
}

/** Poligon penuh satu zona (drop-in untuk respons /api/map/zone/{id}). */
export async function readZone(id: number): Promise<Feature | undefined> {
    const row = await db.zones.get(id);

    return row?.feature;
}
