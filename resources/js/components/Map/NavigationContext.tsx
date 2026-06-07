import axios from 'axios';
import type { Feature } from 'geojson';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import type { ReactNode } from 'react';

import { findRouteOffline } from '@/lib/offline/route';
import { cacheComputedRoute, readCachedRoute } from '@/lib/offline/route-cache';

export type LatLng = { lat: number; lng: number };

// idle → planning → planned → (confirm) → active ; error bisa terjadi dari planning.
export type NavStatus = 'idle' | 'planning' | 'planned' | 'active' | 'error';

// Asumsi kecepatan jelajah perahu nelayan (~10 knot) untuk estimasi ETA.
const BOAT_SPEED_KMH = 18;

// Asumsi konsumsi BBM perahu motor tempel kecil (~15 PK): ~0.4 liter per km.
const LITERS_PER_KM = 0.4;

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

            setState((s) => ({
                ...s,
                status: 'planning',
                origin: userPosition,
                destination,
                error: null,
            }));

            // Perute offline (graf laut di sisi klien) — dipakai saat tanpa sinyal
            // atau bila server gagal. Tidak melempar; bila titik jauh dari jaringan,
            // mengembalikan garis lurus dengan flag `approximate`.
            const planOffline = async () => {
                const r = await findRouteOffline(
                    userPosition.lat,
                    userPosition.lng,
                    destination.lat,
                    destination.lng,
                );
                const distanceKm = r.distance;

                setState({
                    status: 'planned',
                    origin: userPosition,
                    destination,
                    routeGeoJson: r.route as Feature,
                    distanceKm,
                    etaHours: distanceKm / BOAT_SPEED_KMH,
                    fuelPrices: null, // harga BBM butuh server — tak tersedia offline
                    error: null,
                    approximate: r.approximate ?? false,
                });
            };

            // Tanpa sinyal: pakai rute server yang sudah di-cache saat zona diklik
            // online (rute laut akurat); kalau tak ada, baru perute graf klien.
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const cached = await readCachedRoute(
                    userPosition.lat,
                    userPosition.lng,
                    destination.lat,
                    destination.lng,
                );

                if (cached) {
                    setState({
                        status: 'planned',
                        origin: userPosition,
                        destination,
                        routeGeoJson: cached.route,
                        distanceKm: cached.distance,
                        etaHours: cached.distance / BOAT_SPEED_KMH,
                        fuelPrices: null,
                        error: null,
                        approximate: false,
                    });

                    return;
                }

                await planOffline();

                return;
            }

            try {
                const res = await axios.get('/api/map/route', {
                    params: {
                        start_lat: userPosition.lat,
                        start_lng: userPosition.lng,
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
                const etaHours = distanceKm
                    ? distanceKm / BOAT_SPEED_KMH
                    : null;

                setState({
                    status: 'planned',
                    origin: userPosition,
                    destination,
                    routeGeoJson: data.route as Feature,
                    distanceKm,
                    etaHours,
                    fuelPrices: (data.fuel as FuelPrices) ?? null,
                    error: null,
                    approximate: false,
                });

                // Simpan rute server ini agar tersedia saat offline nanti.
                void cacheComputedRoute(
                    userPosition.lat,
                    userPosition.lng,
                    destination.lat,
                    destination.lng,
                    data.route as Feature,
                    distanceKm,
                );
            } catch {
                // Server gagal walau online — coba perute offline sebelum menyerah.
                try {
                    await planOffline();
                } catch {
                    setState((s) => ({
                        ...s,
                        status: 'error',
                        error: 'Gagal menghitung rute.',
                    }));
                }
            }
        },
        [userPosition],
    );

    // Konfirmasi keberangkatan: perjalanan menjadi "berlangsung" (mode PWA on-going).
    const confirmDeparture = useCallback(() => {
        setState((s) =>
            s.status === 'planned' ? { ...s, status: 'active' } : s,
        );
    }, []);

    const cancelNavigation = useCallback(() => {
        setState(initialState);
    }, []);

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
