import type {
    Feature,
    FeatureCollection,
    LineString,
    Point,
    Position,
} from 'geojson';

import { haversineKm } from '@/lib/geo';

/**
 * Perutean laut sisi-klien untuk dipakai saat offline (tanpa server `searoute`).
 *
 * Memakai graf jaringan laut yang SAMA dengan server (marnet_searoute.geojson,
 * disalin ke /geo/marnet.geojson), lalu menjalankan Dijkstra di browser via
 * geojson-path-finder. Titik asal/tujuan di-snap ke simpul jaringan terdekat
 * dan disambungkan kembali ke koordinat asli — meniru `append_orig_dest` searoute,
 * sehingga hasilnya setara dengan rute server.
 *
 * Bila tak ada jalur (mis. titik jauh dari jaringan), jatuh ke garis lurus
 * dengan flag `approximate` agar UI bisa menandainya sebagai perkiraan kasar.
 */

const NETWORK_URL = '/geo/marnet.geojson';

export interface OfflineRoute {
    route: Feature<LineString>;
    distance: number; // km
    units: 'km';
    approximate?: boolean;
}

// Tipe minimal dari geojson-path-finder (diimpor dinamis agar tetap lazy).
interface PathResult {
    path: Position[];
    weight: number;
}
interface PathFinderLike {
    graph: { sourceCoordinates: Record<string, Position> };
    findPath(a: Feature<Point>, b: Feature<Point>): PathResult | undefined;
}
type PathFinderCtor = new (
    network: FeatureCollection<LineString>,
    options: Record<string, unknown>,
) => PathFinderLike;

// Bangun PathFinder sekali (graf + topologi mahal), lalu dipakai ulang.
let finderPromise: Promise<PathFinderLike> | null = null;

async function buildFinder(): Promise<PathFinderLike> {
    const [mod, network] = await Promise.all([
        import('geojson-path-finder'),
        fetch(NETWORK_URL).then(
            (r) => r.json() as Promise<FeatureCollection<LineString>>,
        ),
    ]);

    // Tahan terhadap perbedaan interop default ESM/CJS — kalau salah,
    // try/catch akan diam-diam menurunkan SEMUA rute jadi garis lurus.
    const PathFinder = ((mod as { default?: PathFinderCtor }).default ??
        (mod as unknown as PathFinderCtor)) as PathFinderCtor;

    return new PathFinder(network, {
        // compact:false → setiap simpul bisa jadi titik rute (tanpa phantom),
        // jadi snap-ke-terdekat selalu cocok.
        compact: false,
        // Bobot = jarak haversine (km) supaya `weight` = panjang rute nyata.
        weight: (a: Position, b: Position) =>
            haversineKm({ lat: a[1], lng: a[0] }, { lat: b[1], lng: b[0] }),
    });
}

async function getFinder(): Promise<PathFinderLike> {
    if (!finderPromise) {
        // PENTING: jangan men-cache promise yang gagal. Kalau graf belum ter-cache
        // (mis. coba pertama saat baru offline) lalu kita simpan promise yang
        // reject, SEMUA rute berikutnya akan jadi garis lurus sampai reload.
        // Reset agar percobaan berikutnya bisa membangun ulang.
        finderPromise = buildFinder().catch((e) => {
            finderPromise = null;

            throw e;
        });
    }

    return finderPromise;
}

function asPoint(pos: Position): Feature<Point> {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pos },
        properties: {},
    };
}

function nearestVertex(verts: Position[], lng: number, lat: number): Position {
    let best = verts[0];
    let bestKm = Infinity;

    for (const v of verts) {
        const km = haversineKm({ lat, lng }, { lat: v[1], lng: v[0] });

        if (km < bestKm) {
            bestKm = km;
            best = v;
        }
    }

    return best;
}

function straightLine(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
): OfflineRoute {
    const coordinates: Position[] = [
        [startLng, startLat],
        [endLng, endLat],
    ];

    return {
        route: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates },
            properties: { approximate: true },
        },
        distance: haversineKm(
            { lat: startLat, lng: startLng },
            { lat: endLat, lng: endLng },
        ),
        units: 'km',
        approximate: true,
    };
}

/**
 * Hitung rute laut offline antara dua titik. Tidak pernah melempar — selalu
 * mengembalikan rute (jalur jaringan, atau garis lurus sebagai perkiraan).
 */
export async function findRouteOffline(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
): Promise<OfflineRoute> {
    try {
        const finder = await getFinder();
        const verts = Object.values(finder.graph.sourceCoordinates);

        if (verts.length === 0) {
            console.warn('[rute-offline] graf kosong → garis lurus');

            return straightLine(startLat, startLng, endLat, endLng);
        }

        const a = nearestVertex(verts, startLng, startLat);
        const b = nearestVertex(verts, endLng, endLat);
        const result = finder.findPath(asPoint(a), asPoint(b));

        if (!result || result.path.length === 0) {
            console.warn(
                '[rute-offline] tak ada jalur antar simpul → garis lurus',
            );

            return straightLine(startLat, startLng, endLat, endLng);
        }

        // Sambungkan posisi asli ke jalur jaringan (seperti append_orig_dest).
        const coordinates: Position[] = [
            [startLng, startLat],
            ...result.path,
            [endLng, endLat],
        ];

        const distance =
            haversineKm(
                { lat: startLat, lng: startLng },
                { lat: a[1], lng: a[0] },
            ) +
            result.weight +
            haversineKm({ lat: b[1], lng: b[0] }, { lat: endLat, lng: endLng });

        return {
            route: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: {},
            },
            distance,
            units: 'km',
        };
    } catch (e) {
        console.warn(
            '[rute-offline] gagal memuat graf/pathfinder → garis lurus',
            e,
        );

        return straightLine(startLat, startLng, endLat, endLng);
    }
}
