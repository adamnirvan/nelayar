import type { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Circle, GeoJSON, Marker, useMap } from 'react-leaflet';
import { featureHasFish } from '@/lib/fishSearch';
import { findPointsWithinExpandingRadius } from '@/lib/geo';
import { useNavigation } from './NavigationContext';
import ZoneDetailSidebar from './ZoneDetailSidebar';

// Ikon kustom menggunakan CSS murni (tanpa file gambar .png)
const createPulsingIcon = () => {
    return L.divIcon({
        className: 'pulsing-marker-wrapper',
        html: '<div class="pulsing-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

// Ikon untuk zona yang berada di dalam radius pencarian pengguna (emas berdenyut).
const createNearbyIcon = () => {
    return L.divIcon({
        className: 'nearby-marker-wrapper',
        html: '<div class="nearby-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

interface Props {
    geojson: FeatureCollection;
    fishFilter?: string | null;
    onZoneOpenChange?: (open: boolean) => void;
}

export default function ZppiLayerLeaflet({
    geojson,
    fishFilter = null,
    onZoneOpenChange,
}: Props) {
    const map = useMap();
    const { userPosition } = useNavigation();
    const [selectedZone, setSelectedZone] = useState<Feature | null>(null);
    const [selectedCenter, setSelectedCenter] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    // Beri tahu halaman saat sidebar zona terbuka/tertutup agar header bisa menyesuaikan.
    useEffect(() => {
        onZoneOpenChange?.(selectedZone !== null);

        return () => onZoneOpenChange?.(false);
    }, [selectedZone, onZoneOpenChange]);

    // 1. Parsing string koordinat mentah dari Laravel menjadi JSON Object
    const safeGeojson = useMemo(() => {
        if (!geojson || !geojson.features) {
            return { type: 'FeatureCollection', features: [] };
        }

        return {
            ...geojson,
            features: geojson.features.map((feature) => ({
                ...feature,
                geometry:
                    typeof feature.geometry === 'string'
                        ? JSON.parse(feature.geometry)
                        : feature.geometry,
            })),
        };
    }, [geojson]);

    // 2. Kalkulasi Centroid (Titik Tengah) untuk masing-masing poligon
    const zonesWithCenters = useMemo(() => {
        return safeGeojson.features
            .map((feature) => {
                const layer = L.geoJSON(feature);
                const bounds = layer.getBounds();

                // Ambil titik tengah jika koordinatnya valid
                return {
                    feature,
                    center: bounds.isValid() ? bounds.getCenter() : null,
                };
            })
            .filter((z) => z.center !== null); // Buang yang tidak punya titik tengah
    }, [safeGeojson]);

    // 2b. Saat filter ikan aktif, hanya tampilkan zona yang memuat spesies tsebut.
    const visibleZones = useMemo(() => {
        if (!fishFilter) {
            return zonesWithCenters;
        }

        return zonesWithCenters.filter((z) =>
            featureHasFish(z.feature, fishFilter),
        );
    }, [zonesWithCenters, fishFilter]);

    // Setelah lokasi pengguna didapat, cari semua zona di dalam radius pencarian
    // yang melebar otomatis (30 km; melebar hingga zona terdekat, maks 2500 km).
    const nearby = useMemo(() => {
        if (!userPosition) {
            return null;
        }

        const points = visibleZones.map((z) => ({
            lat: z.center!.lat,
            lng: z.center!.lng,
        }));

        return findPointsWithinExpandingRadius(userPosition, points, {
            minKm: 0,
            maxKm: 50,
        });
    }, [userPosition, visibleZones]);

    const nearbySet = useMemo(
        () => new Set(nearby?.nearby ?? []),
        [nearby],
    );

    // Kunjungan pertama: begitu zona terdekat ditemukan, fokuskan peta ke pengguna
    // beserta zona-zona di dalam radius. Hanya sekali agar tidak mengganggu navigasi.
    const didFitNearby = useRef<boolean>(false);

    useEffect(() => {
        if (
            didFitNearby.current ||
            !userPosition ||
            !nearby ||
            nearby.nearby.length === 0
        ) {
            return;
        }

        didFitNearby.current = true;

        const points: [number, number][] = [
            [userPosition.lat, userPosition.lng],
            ...nearby.nearby.map((i) => {
                const c = visibleZones[i].center!;

                return [c.lat, c.lng] as [number, number];
            }),
        ];

        map.flyToBounds(L.latLngBounds(points), {
            padding: [80, 80],
            maxZoom: 11,
            duration: 1.2,
        });
    }, [userPosition, nearby, visibleZones, map]);

    // Saat filter berganti, tutup sidebar zona agar marker hasil filter terlihat.
    // Pola "menyesuaikan state saat prop berubah" (tanpa effect) sesuai anjuran React.
    const [prevFilter, setPrevFilter] = useState<string | null>(fishFilter);

    if (fishFilter !== prevFilter) {
        setPrevFilter(fishFilter);
        setSelectedZone(null);
        setSelectedCenter(null);
    }

    // Saat filter aktif, geser & zoom peta agar seluruh zona hasil filter terlihat.
    useEffect(() => {
        if (!fishFilter) {
            return;
        }

        const points = visibleZones
            .map((z) => z.center)
            .filter((c): c is L.LatLng => c !== null);

        if (points.length === 0) {
            return;
        }

        map.flyToBounds(L.latLngBounds(points), {
            padding: [80, 80],
            maxZoom: 11,
            duration: 1.2,
        });
    }, [fishFilter, visibleZones, map]);

    // 3. Aksi saat Marker Denyut diklik
    const handleZoneClick = (zone: any) => {
        setSelectedZone(zone.feature);
        setSelectedCenter(
            zone.center ? { lat: zone.center.lat, lng: zone.center.lng } : null,
        );

        // Animasi terbang (FlyTo) ke area poligon
        const layer = L.geoJSON(zone.feature);
        const bounds = layer.getBounds();
        // Menggeser kamera sedikit ke kanan agar poligon tidak tertutup Sidebar di kiri
        map.flyToBounds(bounds, {
            paddingBottomRight: [0, 0],
            paddingTopLeft: [350, 0],
            duration: 1.5,
        });
    };

    return (
        <>
            {/* Lingkaran radius pencarian di sekitar pengguna (kunjungan pertama) */}
            {!selectedZone && userPosition && nearby && nearby.nearby.length > 0 && (
                <Circle
                    center={[userPosition.lat, userPosition.lng]}
                    radius={nearby.radiusKm * 1000}
                    pathOptions={{
                        color: '#d97706', // Amber
                        weight: 1.5,
                        fillColor: '#f59e0b',
                        fillOpacity: 0.06,
                        dashArray: '6 6',
                    }}
                />
            )}

            {/* KONDISI 1: Tampilkan Marker Berdenyut (Jika belum ada zona yang dipilih).
                Zona di dalam radius pengguna disorot dengan ikon emas. */}
            {!selectedZone &&
                visibleZones.map((zone, idx) => (
                    <Marker
                        key={`marker-${idx}`}
                        position={zone.center!}
                        icon={
                            nearbySet.has(idx)
                                ? createNearbyIcon()
                                : createPulsingIcon()
                        }
                        eventHandlers={{ click: () => handleZoneClick(zone) }}
                    />
                ))}

            {/* KONDISI 2: Tampilkan Poligon (Hanya poligon dari zona yang diklik) */}
            {selectedZone && (
                <GeoJSON
                    key={`selected-${selectedZone.properties?.zone_date}-${selectedCenter?.lat},${selectedCenter?.lng}`}
                    data={selectedZone as Feature}
                    style={{
                        fillColor: '#3b82f6', // Biru laut cerah
                        color: '#1e3a8a', // Biru tua
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.4,
                    }}
                />
            )}

            {/* KONDISI 3: Tampilkan Sidebar UI */}
            {selectedZone && (
                <ZoneDetailSidebar
                    zone={selectedZone}
                    center={selectedCenter}
                    onClose={() => setSelectedZone(null)}
                />
            )}
        </>
    );
}
