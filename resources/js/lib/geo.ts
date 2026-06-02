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
