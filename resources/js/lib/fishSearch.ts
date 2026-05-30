import type { Feature, FeatureCollection } from 'geojson';

// Bentuk satu entri spesies pada properti `ikan_cocok` tiap zona ZPPI.
export interface IkanCocok {
    nama_lokal?: string;
    nama_lain?: string;
    nama_ilmiah?: string;
    image_path?: string;
    confidence?: number;
}

// Ringkasan satu spesies hasil agregasi seluruh zona (untuk dropdown pencarian).
export interface FishSuggestion {
    key: string; // nama_lokal yang dinormalisasi (huruf kecil) — dipakai untuk filter marker
    nama_lokal: string;
    nama_lain?: string;
    nama_ilmiah?: string;
    image_path?: string;
    zoneCount: number; // jumlah zona/pinpoint yang memuat spesies ini
    maxConfidence: number; // confidence tertinggi di antara zona tersebut
}

export function normalizeFishKey(name: string): string {
    return name.trim().toLowerCase();
}

function ikanList(feature: Feature): IkanCocok[] {
    const raw = feature.properties?.ikan_cocok;

    return Array.isArray(raw) ? (raw as IkanCocok[]) : [];
}

// Membangun indeks spesies unik dari seluruh fitur GeoJSON, diurutkan dari
// confidence tertinggi. Dipakai header untuk menampilkan saran pencarian.
export function buildFishIndex(
    geojson: FeatureCollection | null,
): FishSuggestion[] {
    if (!geojson?.features) {
        return [];
    }

    const byKey = new Map<string, FishSuggestion>();

    for (const feature of geojson.features) {
        for (const ikan of ikanList(feature)) {
            const nama = ikan.nama_lokal?.trim();

            if (!nama) {
                continue;
            }

            const key = normalizeFishKey(nama);
            const conf =
                typeof ikan.confidence === 'number' ? ikan.confidence : 0;
            const existing = byKey.get(key);

            if (existing) {
                existing.zoneCount += 1;
                existing.maxConfidence = Math.max(existing.maxConfidence, conf);
            } else {
                byKey.set(key, {
                    key,
                    nama_lokal: nama,
                    nama_lain: ikan.nama_lain,
                    nama_ilmiah: ikan.nama_ilmiah,
                    image_path: ikan.image_path,
                    zoneCount: 1,
                    maxConfidence: conf,
                });
            }
        }
    }

    return Array.from(byKey.values()).sort(
        (a, b) =>
            b.maxConfidence - a.maxConfidence ||
            a.nama_lokal.localeCompare(b.nama_lokal),
    );
}

// Apakah sebuah zona memuat spesies dengan key tertentu?
export function featureHasFish(feature: Feature, fishKey: string): boolean {
    return ikanList(feature).some(
        (ikan) =>
            ikan.nama_lokal && normalizeFishKey(ikan.nama_lokal) === fishKey,
    );
}

// Menyaring saran spesies berdasarkan kata kunci (cocokkan nama lokal/lain/ilmiah).
export function filterFishSuggestions(
    suggestions: FishSuggestion[],
    query: string,
    limit = 6,
): FishSuggestion[] {
    const q = query.trim().toLowerCase();

    if (!q) {
        return [];
    }

    return suggestions
        .filter(
            (f) =>
                f.nama_lokal.toLowerCase().includes(q) ||
                (f.nama_lain?.toLowerCase().includes(q) ?? false) ||
                (f.nama_ilmiah?.toLowerCase().includes(q) ?? false),
        )
        .slice(0, limit);
}
