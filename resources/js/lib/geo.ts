// Utilitas geospasial murni (tanpa Leaflet) untuk mencari titik ZPPI terdekat
// dari posisi pengguna. Dipakai saat kunjungan pertama: setelah lokasi pengguna
// didapat, semua zona di dalam radius pencarian disorot dan peta difokuskan ke sana.

export interface LatLngLike {
    lat: number;
    lng: number;
}

const EARTH_RADIUS_KM = 6371;

// Jarak lingkaran besar (great-circle) antara dua koordinat dalam kilometer.
export function haversineKm(a: LatLngLike, b: LatLngLike): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface NearbyResult {
    // Radius akhir yang dipakai (km). Mulai dari `minKm`; bila tidak ada titik
    // sedekat itu, melebar pas hingga mencapai titik terdekat — dibatasi `maxKm`.
    radiusKm: number;
    // Jarak tiap titik ke pengguna (km), selaras dengan index `points`.
    distances: number[];
    // Index titik yang berada di dalam `radiusKm`, terurut dari yang terdekat.
    nearby: number[];
}

// Mencari titik di dalam radius yang melebar otomatis.
// - Jika ada titik dalam `minKm` → pakai radius `minKm` dan ambil semua yang masuk.
// - Jika tidak → lebarkan radius pas hingga titik terdekat (maksimal `maxKm`).
export function findPointsWithinExpandingRadius(
    user: LatLngLike,
    points: LatLngLike[],
    { minKm = 30, maxKm = 2500 }: { minKm?: number; maxKm?: number } = {},
): NearbyResult {
    const distances = points.map((p) => haversineKm(user, p));

    if (distances.length === 0) {
        return { radiusKm: minKm, distances, nearby: [] };
    }

    const nearest = Math.min(...distances);
    const radiusKm = Math.min(Math.max(minKm, nearest), maxKm);

    const nearby = distances
        .map((d, i) => ({ d, i }))
        .filter((x) => x.d <= radiusKm)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.i);

    return { radiusKm, distances, nearby };
}

// ----------------------------------------------------------------------------
// Choropleth harga: pencocokan nama provinsi & skala warna diskret.
// ----------------------------------------------------------------------------

// Nama provinsi di DB harga (KKP) tidak selalu identik dengan field PROVINSI di
// GeoJSON. Hanya satu yang berbeda saat ini, tapi alias disimpan terpusat agar
// mudah ditambah bila sumber data berubah.
const PROVINCE_ALIASES: Record<string, string> = {
    'di yogyakarta': 'daerah istimewa yogyakarta',
};

// Bentuk kanonik (lowercase + trim + alias) untuk mencocokkan nama provinsi
// dari DB dengan properti GeoJSON, terlepas dari beda ejaan/kapital.
export function canonProvince(name: string): string {
    const key = name.trim().toLowerCase();

    return PROVINCE_ALIASES[key] ?? key;
}

// Palet teal sekuensial (terang = murah, gelap = mahal) agar selaras dengan tema laut.
export const PRICE_COLORS = ['#cde7f0', '#7fc9dd', '#3a9fc4', '#1f6f9c', '#0b3a5a'];
export const PRICE_NO_DATA = '#e5e7eb';

// Empat ambang (kuantil) yang membagi nilai menjadi 5 kelompok warna.
// Mengembalikan array kosong bila data terlalu sedikit untuk dibagi.
export function priceThresholds(values: number[]): number[] {
    const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);

    if (sorted.length < 2) {
        return [];
    }

    const quantile = (q: number) => {
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        const next = sorted[base + 1] ?? sorted[base];

        return sorted[base] + rest * (next - sorted[base]);
    };

    return [quantile(0.2), quantile(0.4), quantile(0.6), quantile(0.8)];
}

// Warna untuk sebuah nilai berdasarkan ambang kuantil di atas.
export function priceColor(value: number | null | undefined, thresholds: number[]): string {
    if (value == null || value <= 0) {
        return PRICE_NO_DATA;
    }

    if (thresholds.length === 0) {
        return PRICE_COLORS[Math.floor(PRICE_COLORS.length / 2)];
    }

    let bucket = thresholds.findIndex((t) => value <= t);

    if (bucket === -1) {
        bucket = thresholds.length; // di atas ambang tertinggi
    }

    return PRICE_COLORS[bucket];
}
