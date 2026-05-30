import axios from 'axios';
import type { Feature } from 'geojson';
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type LatLng = { lat: number; lng: number };

// idle → planning → planned → (confirm) → active ; error bisa terjadi dari planning.
export type NavStatus = 'idle' | 'planning' | 'planned' | 'active' | 'error';

// Asumsi kecepatan jelajah perahu nelayan (~10 knot) untuk estimasi ETA.
const BOAT_SPEED_KMH = 18;

interface NavState {
    status: NavStatus;
    origin: LatLng | null;
    destination: LatLng | null;
    routeGeoJson: Feature | null;
    distanceKm: number | null;
    etaHours: number | null;
    error: string | null;
}

interface NavContextValue extends NavState {
    userPosition: LatLng | null;
    setUserPosition: (p: LatLng | null) => void;
    planRoute: (destination: LatLng) => Promise<void>;
    confirmDeparture: () => void;
    cancelNavigation: () => void;
}

const initialState: NavState = {
    status: 'idle',
    origin: null,
    destination: null,
    routeGeoJson: null,
    distanceKm: null,
    etaHours: null,
    error: null,
};

const NavigationContext = createContext<NavContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const [userPosition, setUserPosition] = useState<LatLng | null>(null);
    const [state, setState] = useState<NavState>(initialState);

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
                    error: null,
                });
            } catch (e: unknown) {
                const message =
                    (axios.isAxiosError(e) &&
                        (e.response?.data?.error as string)) ||
                    (e instanceof Error ? e.message : 'Gagal menghitung rute.');
                setState((s) => ({ ...s, status: 'error', error: message }));
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

    return (
        <NavigationContext.Provider
            value={{
                ...state,
                userPosition,
                setUserPosition,
                planRoute,
                confirmDeparture,
                cancelNavigation,
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
