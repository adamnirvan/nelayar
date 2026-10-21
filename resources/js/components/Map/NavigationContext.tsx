import axios from 'axios';
import type { Feature } from 'geojson';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';

import { projectOntoRoute } from '@/lib/geo';
import { findRouteOffline } from '@/lib/offline/route';
import { cacheComputedRoute, readCachedRoute } from '@/lib/offline/route-cache';

export type LatLng = { lat: number; lng: number };

// idle → planning → planned → (confirm) → active ; error bisa terjadi dari planning.
export type NavStatus = 'idle' | 'planning' | 'planned' | 'active' | 'error';

// Asumsi kecepatan jelajah perahu nelayan (~10 knot) untuk estimasi ETA.
const BOAT_SPEED_KMH = 18;

// Asumsi konsumsi BBM perahu motor tempel kecil (~15 PK): ~0.4 liter per km.
const LITERS_PER_KM = 0.4;

// Ambang menyimpang: bila posisi menjauh lebih dari ini (km) dari garis rute saat
// navigasi aktif, rute dihitung ulang dari posisi sekarang.
const OFF_COURSE_KM = 2;

// Jeda minimal antar perhitungan ulang agar GPS yang bergoyang tidak membanjiri
// server dengan permintaan rute.
const REROUTE_COOLDOWN_MS = 20_000;

export type FuelType = 'pertalite' | 'solar';

// Harga BBM yang dilampirkan backend pada respons rute (Rupiah/liter).
export interface FuelPrices {
    province: string;
    province_slug: string | null;
    source: 'province' | 'national';
    pertalite: number | null;
    solar: number | null;
    updated_at: string | null;
}

// Estimasi biaya BBM perjalanan pulang-pergi untuk satu jenis bahan bakar.
export interface FuelEstimate {
    fuelType: FuelType;
    pricePerLiter: number | null;
    roundTripKm: number;
    liters: number;
    cost: number | null;
}

interface NavState {
    status: NavStatus;
    origin: LatLng | null;
    destination: LatLng | null;
    routeGeoJson: Feature | null;
    distanceKm: number | null;
    etaHours: number | null;
    fuelPrices: FuelPrices | null;
    error: string | null;
    // true bila rute dihitung sebagai perkiraan kasar (garis lurus offline),
    // bukan jalur jaringan laut — UI menandainya.
    approximate: boolean;
}

interface NavContextValue extends NavState {
    userPosition: LatLng | null;
    setUserPosition: (p: LatLng | null) => void;
    planRoute: (destination: LatLng) => Promise<void>;
    confirmDeparture: () => void;
    cancelNavigation: () => void;
    fuelType: FuelType;
    setFuelType: (t: FuelType) => void;
    fuelEstimate: FuelEstimate | null;
    // Sisa jarak/ETA yang menghitung mundur saat status 'active' (mengikuti posisi
    // GPS langsung); di luar navigasi aktif sama dengan jarak/ETA rute penuh.
    remainingKm: number | null;
    remainingEtaHours: number | null;
    // Mode "ikuti": peta terpusat otomatis ke perahu selama navigasi aktif.
    // Dinyalakan saat keberangkatan dikonfirmasi, dimatikan saat pengguna menggeser
    // peta manual, dan dinyalakan lagi lewat tombol pusatkan di peta.
    following: boolean;
    setFollowing: (v: boolean) => void;
}

// Ekstrak koordinat garis [lng, lat] dari Feature rute (LineString atau
// MultiLineString) untuk perhitungan sisa jarak.
function routeLineCoords(feature: Feature | null): number[][] {
    const geom = feature?.geometry;

    if (!geom) {
        return [];
    }

    if (geom.type === 'LineString') {
        return geom.coordinates;
    }

    if (geom.type === 'MultiLineString') {
        return geom.coordinates.flat();
    }

    return [];
}

interface ResolvedRoute {
    routeGeoJson: Feature;
    distanceKm: number | null;
    fuelPrices: FuelPrices | null;
    approximate: boolean;
}

// Hitung rute laut origin→destination memakai sumber terbaik yang tersedia:
// tanpa sinyal → cache rute server lalu perute graf laut klien; online → endpoint
// server /api/map/route dengan fallback ke perute offline. Melempar hanya bila
// semua jalur gagal. Murni (tak menyentuh state React) sehingga bisa dipakai baik
// untuk merencanakan rute baru maupun menghitung ulang saat perahu menyimpang.
async function resolveRoute(
    origin: LatLng,
    destination: LatLng,
): Promise<ResolvedRoute> {
    // Perute offline (graf laut sisi klien). Tidak melempar untuk titik jauh dari
    // jaringan; mengembalikan garis lurus dengan flag `approximate`.
    const planOffline = async (): Promise<ResolvedRoute> => {
        const r = await findRouteOffline(
            origin.lat,
            origin.lng,
            destination.lat,
            destination.lng,
        );

        return {
            routeGeoJson: r.route as Feature,
            distanceKm: r.distance,
            fuelPrices: null, // harga BBM butuh server — tak tersedia offline
            approximate: r.approximate ?? false,
        };
    };

    // Tanpa sinyal: pakai rute server yang sudah di-cache (akurat); kalau tak ada,
    // baru perute graf klien.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = await readCachedRoute(
            origin.lat,
            origin.lng,
            destination.lat,
            destination.lng,
        );

        if (cached) {
            return {
                routeGeoJson: cached.route,
                distanceKm: cached.distance,
                fuelPrices: null,
                approximate: false,
            };
        }

        return planOffline();
    }

    try {
        const res = await axios.get('/api/map/route', {
            params: {
                start_lat: origin.lat,
                start_lng: origin.lng,
                end_lat: destination.lat,
                end_lng: destination.lng,
            },
        });

        const data = res.data;

        if (!data?.route) {
            throw new Error(data?.error || 'Rute tidak ditemukan.');
        }

        const distanceKm =
            typeof data.distance === 'number' ? data.distance : null;

        // Simpan rute server ini agar tersedia saat offline nanti.
        void cacheComputedRoute(
            origin.lat,
            origin.lng,
            destination.lat,
            destination.lng,
            data.route as Feature,
            distanceKm,
        );

        return {
            routeGeoJson: data.route as Feature,
            distanceKm,
            fuelPrices: (data.fuel as FuelPrices) ?? null,
            approximate: false,
        };
    } catch {
        // Server gagal walau online — coba perute offline sebelum menyerah.
        return planOffline();
    }
}

const initialState: NavState = {
    status: 'idle',
    origin: null,
    destination: null,
    routeGeoJson: null,
    distanceKm: null,
    etaHours: null,
    fuelPrices: null,
    error: null,
    approximate: false,
};

const NavigationContext = createContext<NavContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const [userPosition, setUserPosition] = useState<LatLng | null>(null);
    const [state, setState] = useState<NavState>(initialState);
    const [fuelType, setFuelType] = useState<FuelType>('solar');
    const [following, setFollowing] = useState<boolean>(false);

    // Penjaga perhitungan ulang rute saat menyimpang: `reroutingRef` mencegah
    // permintaan tumpang tindih, `lastRerouteRef` menegakkan jeda antar-hitung.
    const reroutingRef = useRef<boolean>(false);
    const lastRerouteRef = useRef<number>(0);

    const planRoute = useCallback(
        async (destination: LatLng) => {
            if (!userPosition) {
                setState((s) => ({
                    ...s,
                    status: 'error',
                    error: 'Aktifkan lokasi Anda dulu (tombol pin di kanan bawah peta).',
                }));

                return;
            }

            const origin = userPosition;

            setState((s) => ({
                ...s,
                status: 'planning',
                origin,
                destination,
                error: null,
            }));

            try {
                const r = await resolveRoute(origin, destination);

                setState({
                    status: 'planned',
                    origin,
                    destination,
                    routeGeoJson: r.routeGeoJson,
                    distanceKm: r.distanceKm,
                    etaHours:
                        r.distanceKm != null
                            ? r.distanceKm / BOAT_SPEED_KMH
                            : null,
                    fuelPrices: r.fuelPrices,
                    error: null,
                    approximate: r.approximate,
                });
            } catch {
                setState((s) => ({
                    ...s,
                    status: 'error',
                    error: 'Gagal menghitung rute.',
                }));
            }
        },
        [userPosition],
    );

    // Pelacakan GPS langsung selama navigasi berlangsung: selama status 'active'
    // (pengguna sudah menekan "Mulai"), berlangganan watchPosition agar posisi
    // pengguna — dan marker "Lokasi Anda" — bergerak mengikuti perahu. Berhenti
    // (clearWatch) saat navigasi diakhiri/komponen dilepas supaya GPS & baterai
    // tidak terpakai sia-sia di luar perjalanan.
    useEffect(() => {
        if (state.status !== 'active') {
            return;
        }

        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setUserPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            (err) => {
                // Jangan akhiri navigasi karena satu fix gagal — fix berikutnya
                // bisa berhasil; cukup catat. Posisi terakhir tetap dipakai.
                console.warn('Pelacakan GPS terganggu.', err.message);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [state.status]);

    // Konfirmasi keberangkatan: perjalanan menjadi "berlangsung" (mode PWA on-going).
    const confirmDeparture = useCallback(() => {
        setState((s) =>
            s.status === 'planned' ? { ...s, status: 'active' } : s,
        );
        // Mulai dengan peta mengikuti perahu begitu perjalanan dimulai.
        setFollowing(true);
    }, []);

    const cancelNavigation = useCallback(() => {
        setState(initialState);
        setFollowing(false);
    }, []);

    // Sisa jarak hingga tujuan: saat navigasi aktif, proyeksikan posisi GPS
    // terkini ke rute dan ukur sisanya; di luar itu pakai jarak rute penuh.
    const remainingKm = useMemo<number | null>(() => {
        if (state.status !== 'active' || !userPosition) {
            return state.distanceKm;
        }

        const coords = routeLineCoords(state.routeGeoJson);

        if (coords.length < 2) {
            return state.distanceKm;
        }

        return projectOntoRoute(coords, userPosition).remainingKm;
    }, [state.status, state.routeGeoJson, state.distanceKm, userPosition]);

    const remainingEtaHours = useMemo<number | null>(
        () => (remainingKm != null ? remainingKm / BOAT_SPEED_KMH : null),
        [remainingKm],
    );

    // Perhitungan ulang otomatis saat menyimpang: selama navigasi aktif, ukur jarak
    // posisi terkini ke garis rute; bila melewati ambang (dengan jeda antar-hitung &
    // penjaga in-flight agar tak membanjiri server), hitung ulang rute dari posisi
    // sekarang ke tujuan yang sama tanpa keluar dari status 'active'. Bila gagal,
    // rute lama dipertahankan dan dicoba lagi setelah jeda berikutnya. Tidak ada
    // setState sinkron di sini — pembaruan hanya terjadi di callback async.
    useEffect(() => {
        if (state.status !== 'active' || !userPosition || !state.destination) {
            return;
        }

        const coords = routeLineCoords(state.routeGeoJson);

        if (coords.length < 2) {
            return;
        }

        const { deviationKm } = projectOntoRoute(coords, userPosition);

        if (deviationKm < OFF_COURSE_KM || reroutingRef.current) {
            return;
        }

        if (Date.now() - lastRerouteRef.current < REROUTE_COOLDOWN_MS) {
            return;
        }

        reroutingRef.current = true;
        lastRerouteRef.current = Date.now();

        const origin = userPosition;
        const destination = state.destination;

        resolveRoute(origin, destination)
            .then((r) => {
                setState((s) =>
                    // Pastikan masih bernavigasi ke tujuan yang sama saat hasil tiba.
                    s.status === 'active' && s.destination === destination
                        ? {
                              ...s,
                              origin,
                              routeGeoJson: r.routeGeoJson,
                              distanceKm: r.distanceKm,
                              etaHours:
                                  r.distanceKm != null
                                      ? r.distanceKm / BOAT_SPEED_KMH
                                      : null,
                              fuelPrices: r.fuelPrices ?? s.fuelPrices,
                              approximate: r.approximate,
                          }
                        : s,
                );
            })
            .catch(() => {
                // Pertahankan rute lama; coba lagi setelah cooldown berikutnya.
            })
            .finally(() => {
                reroutingRef.current = false;
            });
    }, [state.status, state.destination, state.routeGeoJson, userPosition]);

    // Estimasi biaya BBM pulang-pergi: jarak ×2 × konsumsi × harga/liter.
    const fuelEstimate = useMemo<FuelEstimate | null>(() => {
        if (state.distanceKm == null) {
            return null;
        }

        const roundTripKm = state.distanceKm * 2;
        const liters = roundTripKm * LITERS_PER_KM;
        const pricePerLiter = state.fuelPrices?.[fuelType] ?? null;

        return {
            fuelType,
            pricePerLiter,
            roundTripKm,
            liters,
            cost: pricePerLiter != null ? liters * pricePerLiter : null,
        };
    }, [state.distanceKm, state.fuelPrices, fuelType]);

    return (
        <NavigationContext.Provider
            value={{
                ...state,
                userPosition,
                setUserPosition,
                planRoute,
                confirmDeparture,
                cancelNavigation,
                fuelType,
                setFuelType,
                fuelEstimate,
                remainingKm,
                remainingEtaHours,
                following,
                setFollowing,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation(): NavContextValue {
    const ctx = useContext(NavigationContext);

    if (!ctx) {
        throw new Error(
            'useNavigation harus dipakai di dalam <NavigationProvider>',
        );
    }

    return ctx;
}

// Helper format ETA yang dipakai sidebar & banner.
export function formatEta(hours: number | null): string {
    if (hours == null) {
        return '—';
    }

    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h <= 0) {
        return `${m} mnt`;
    }

    return `${h} jam ${m} mnt`;
}

// Helper format Rupiah (tanpa desimal) untuk biaya BBM.
export function formatRupiah(value: number | null): string {
    if (value == null) {
        return '—';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}
