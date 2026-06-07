import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import type { Feature, FeatureCollection, Point } from 'geojson';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, GeoJSON, useMap } from 'react-leaflet';
import { featureHasFish } from '@/lib/fishSearch';
import { findPointsWithinExpandingRadius } from '@/lib/geo';
import { useNavigation } from './NavigationContext';
import ZoneDetailSidebar from './ZoneDetailSidebar';

// IKON NORMAL (Berdenyut Bergantian)
const pulsingIcon = L.divIcon({
    className: 'bg-transparent border-none',
    html: `
        <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-full h-full bg-yellow-400 rounded-full staggered-ping opacity-60"></span>
            
            <div class="relative flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full border-[2.5px] border-white shadow-md z-10 transition-transform hover:scale-110">
                <svg class="w-4 h-4 text-yellow-900" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.4 3.6v11.52A3.36 3.36 0 0 1 11.04 18.48H9.6a3.36 3.36 0 0 1-3.36-3.36V12.72" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.4 7.44h4.32" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.8 9.84l2.4-2.4-2.4-2.4" />
                </svg>
            </div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

// IKON NEARBY / RADIUS (Berdenyut Breathing Scale untuk Zona Terdekat)
const nearbyIcon = L.divIcon({
    className: 'bg-transparent border-none',
    html: `
        <div class="relative flex items-center justify-center w-10 h-10">
            <span class="absolute w-full h-full bg-yellow-400 rounded-full staggered-ping opacity-60"></span>
            
            <div class="nearby-breathing-scale relative flex items-center justify-center w-8 h-8 bg-yellow-500 rounded-full border-[2.5px] border-white z-10 text-white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.4 3.6v11.52A3.36 3.36 0 0 1 11.04 18.48H9.6a3.36 3.36 0 0 1-3.36-3.36V12.72" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.4 7.44h4.32" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.8 9.84l2.4-2.4-2.4-2.4" />
                </svg>
            </div>
        </div>
    `,
    iconSize: [40, 40], // Diperbesar sedikit dari marker normal agar punya ruang bernapas
    iconAnchor: [20, 20],
});

interface ZoneWithCenter {
    feature: Feature;
    center: L.LatLng;
}

interface Props {
    geojson: FeatureCollection;
    fishFilter?: string | null;
    onZoneOpenChange?: (open: boolean) => void;
}

/**
 * Marker zona dirender lewat leaflet.markercluster secara imperatif: ~1000 titik
 * dikelompokkan menjadi sedikit gugus sehingga hanya marker yang terlihat yang
 * benar-benar masuk DOM. Ini memangkas Total Blocking Time dibanding merender
 * seribu komponen <Marker> beranimasi sekaligus.
 */
function ClusteredZoneMarkers({
    zones,
    nearbySet,
    hidden,
    onZoneClick,
}: {
    zones: ZoneWithCenter[];
    nearbySet: Set<number>;
    hidden: boolean;
    onZoneClick: (zone: ZoneWithCenter) => void;
}) {
    const map = useMap();
    const [group, setGroup] = useState<L.MarkerClusterGroup | null>(null);

    // Bangun ulang gugus hanya saat daftar/zona terdekat berubah.
    useEffect(() => {
        const g = L.markerClusterGroup({
            chunkedLoading: true, // render marker bertahap → main thread tidak macet
            maxClusterRadius: 60,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: false,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                const size = count < 10 ? 36 : count < 100 ? 44 : 52;

                return L.divIcon({
                    className: 'bg-transparent border-none',
                    html: `
                        <div style="font-family: 'Outfit', sans-serif;" class="flex items-center justify-center w-full h-full bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full border-[3px] border-white shadow-[0_5px_15px_rgba(250,204,21,0.4)]">
                            ${count}
                        </div>
                    `,
                    iconSize: [size, size],
                });
            },
        });

        const markers = zones.map((z, idx) => {
            const marker = L.marker(z.center, {
                icon: nearbySet.has(idx) ? nearbyIcon : pulsingIcon,
            });
            marker.on('click', () => onZoneClick(z));

            return marker;
        });
        g.addLayers(markers);

        setGroup(g);

        return () => {
            g.clearLayers();
            map.removeLayer(g);
            setGroup(null);
        };
    }, [zones, nearbySet, map, onZoneClick]);

    // Sembunyikan/ tampilkan gugus tanpa membangun ulang marker (mis. saat sidebar zona terbuka).
    useEffect(() => {
        if (!group) {
            return;
        }

        if (hidden) {
            map.removeLayer(group);
        } else {
            map.addLayer(group);
        }
    }, [group, hidden, map]);

    return null;
}

export default function ZppiLayerLeaflet({
    geojson,
    fishFilter = null,
    onZoneOpenChange,
}: Props) {
    const map = useMap();

    // GABUNGAN: Mengambil seluruh object nav (untuk fiturmu) dan mengekstrak userPosition (untuk fitur temanmu)
    const nav = useNavigation();
    const userPosition = nav.userPosition;

    // selectedZone menyimpan fitur TITIK (centroid + properti) untuk sidebar.
    // selectedGeometry menyimpan poligon penuh yang diambil lazy saat zona diklik.
    const [selectedZone, setSelectedZone] = useState<Feature | null>(null);
    const [selectedCenter, setSelectedCenter] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [selectedGeometry, setSelectedGeometry] = useState<Feature | null>(
        null,
    );
    const fetchAbort = useRef<AbortController | null>(null);

    useEffect(() => {
        onZoneOpenChange?.(selectedZone !== null);

        return () => onZoneOpenChange?.(false);
    }, [selectedZone, onZoneOpenChange]);

    // Muatan peta kini berupa fitur Point (centroid) — centernya langsung dari
    // koordinat, tanpa perlu mem-parse poligon tiap zona seperti sebelumnya.
    const zonesWithCenters = useMemo<ZoneWithCenter[]>(() => {
        const features = geojson?.features ?? [];

        return features.flatMap((feature) => {
            const geometry = feature.geometry;

            if (!geometry || geometry.type !== 'Point') {
                return [];
            }

            const [lng, lat] = (geometry as Point).coordinates;

            return [{ feature, center: L.latLng(lat, lng) }];
        });
    }, [geojson]);

    const visibleZones = useMemo(() => {
        if (!fishFilter) {
            return zonesWithCenters;
        }

        return zonesWithCenters.filter((z) =>
            featureHasFish(z.feature, fishFilter),
        );
    }, [zonesWithCenters, fishFilter]);

    // FITUR TEMAN: Mencari semua zona di dalam radius pencarian yang melebar otomatis (maks 500 km)
    const nearby = useMemo(() => {
        if (!userPosition) {
            return null;
        }

        const points = visibleZones.map((z) => ({
            lat: z.center.lat,
            lng: z.center.lng,
        }));

        return findPointsWithinExpandingRadius(userPosition, points, {
            minKm: 0,
            maxKm: 500,
        });
    }, [userPosition, visibleZones]);

    const nearbySet = useMemo(() => new Set(nearby?.nearby ?? []), [nearby]);

    // FITUR TEMAN: Kunjungan pertama: fokuskan peta ke pengguna beserta zona-zona terdekat
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
                const c = visibleZones[i].center;

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
    const [prevFilter, setPrevFilter] = useState<string | null>(fishFilter);

    if (fishFilter !== prevFilter) {
        setPrevFilter(fishFilter);
        setSelectedZone(null);
        setSelectedCenter(null);
        setSelectedGeometry(null);
    }

    useEffect(() => {
        if (!fishFilter) {
            return;
        }

        const points = visibleZones.map((z) => z.center);

        if (points.length === 0) {
            return;
        }

        map.flyToBounds(L.latLngBounds(points), {
            padding: [80, 80],
            maxZoom: 11,
            duration: 1.2,
        });
    }, [fishFilter, visibleZones, map]);

    // FITUR MU: EFFECT KAMERA RUTE & NAVIGASI
    useEffect(() => {
        if (!nav.routeGeoJson) {
            return;
        }

        if (nav.status === 'planned') {
            const routeLayer = L.geoJSON(nav.routeGeoJson);
            const routeBounds = routeLayer.getBounds();

            if (routeBounds.isValid()) {
                const isMobile = window.innerWidth < 768;
                const padTopLeft: [number, number] = isMobile
                    ? [40, 40]
                    : [420, 40];
                const padBottomRight: [number, number] = isMobile
                    ? [40, 300]
                    : [40, 40];

                map.flyToBounds(routeBounds, {
                    paddingTopLeft: padTopLeft,
                    paddingBottomRight: padBottomRight,
                    maxZoom: 11,
                    duration: 1.5,
                });
            }
        } else if (nav.status === 'active' && nav.userPosition) {
            const isMobile = window.innerWidth < 768;
            const padTopLeft: [number, number] = isMobile ? [0, 0] : [400, 0];
            const padBottomRight: [number, number] = isMobile
                ? [0, 200]
                : [0, 0];

            const userPoint = L.latLng(
                nav.userPosition.lat,
                nav.userPosition.lng,
            );

            map.flyToBounds(L.latLngBounds(userPoint, userPoint), {
                paddingTopLeft: padTopLeft,
                paddingBottomRight: padBottomRight,
                maxZoom: 16,
                duration: 2.5,
            });
        }
    }, [nav.routeGeoJson, nav.status, nav.userPosition, map]);

    const handleZoneClick = useCallback(
        (zone: ZoneWithCenter) => {
            setSelectedZone(zone.feature);
            setSelectedCenter({ lat: zone.center.lat, lng: zone.center.lng });
            setSelectedGeometry(null);

            // Geser kamera ke centroid (dengan offset untuk sidebar) — instan, tanpa
            // menunggu poligon. flyToBounds atas bounds degenerate meniru perilaku lama.
            const isMobile = window.innerWidth < 768;
            const padTopLeft: [number, number] = isMobile ? [0, 0] : [400, 0];
            const padBottomRight: [number, number] = isMobile
                ? [0, 250]
                : [0, 0];

            map.flyToBounds(L.latLngBounds(zone.center, zone.center), {
                paddingTopLeft: padTopLeft,
                paddingBottomRight: padBottomRight,
                maxZoom: 10,
                duration: 1.5,
            });

            // Ambil poligon penuh zona ini secara lazy (lihat MapController@showZone).
            const id = zone.feature.properties?.id;

            if (id != null) {
                fetchAbort.current?.abort();
                const controller = new AbortController();
                fetchAbort.current = controller;

                axios
                    .get<Feature>(`/api/map/zone/${id}`, {
                        signal: controller.signal,
                    })
                    .then((res) => setSelectedGeometry(res.data))
                    .catch(() => {
                        // Dibatalkan/gagal: cukup tampilkan marker + sidebar tanpa outline.
                    });
            }
        },
        [map],
    );

    // Batalkan permintaan poligon yang masih berjalan saat komponen dilepas.
    useEffect(() => () => fetchAbort.current?.abort(), []);

    const handleClose = () => {
        fetchAbort.current?.abort();
        setSelectedZone(null);
        setSelectedCenter(null);
        setSelectedGeometry(null);
        nav.cancelNavigation();
    };

    return (
        <>
            {/* 1. LINGKARAN RADIUS PENCARIAN (Abu-abu Slate agar tidak mencolok) */}
            {!selectedZone &&
                userPosition &&
                nearby &&
                nearby.nearby.length > 0 && (
                    <Circle
                        center={[userPosition.lat, userPosition.lng]}
                        radius={nearby.radiusKm * 1000}
                        pathOptions={{
                            color: '#94a3b8', // Tailwind slate-400
                            weight: 1.5,
                            fillColor: '#cbd5e1', // Tailwind slate-300
                            fillOpacity: 0.05,
                            dashArray: '4 8', // Jarak dash lebih renggang dan rapi
                        }}
                    />
                )}

            {/* GABUNGAN: Marker zona (clustered) */}
            <ClusteredZoneMarkers
                zones={visibleZones}
                nearbySet={nearbySet}
                hidden={selectedZone !== null}
                onZoneClick={handleZoneClick}
            />

            {/* POLIGON ZONA TERPILIH (Sama persis dengan marker ikan) */}
            {selectedGeometry && (
                <GeoJSON
                    key={`selected-${selectedGeometry.properties?.id}`}
                    data={selectedGeometry}
                    style={{
                        // Sama persis dengan warna bg-yellow-400 di marker ikan
                        fillColor: '#facc15', 
                        
                        // Garis tepi disamakan 100% agar berkesan "Flat & Minimalist"
                        color: '#facc15',     
                        
                        // Ketebalan dibuat pas (tidak terlalu tebal/tipis)
                        weight: 2,            
                        opacity: 1,
                        
                        // Opacity ditahan di 45% agar kuningnya tetap menyala (tidak jadi hijau)
                        fillOpacity: 0.45,    
                    }}
                />
            )}

            {/* 3. GARIS RUTE NAVIGASI (Biru Sama Dengan User Marker) */}
            {nav.routeGeoJson && (
                <GeoJSON
                    key={`route-${nav.status}-${Date.now()}`}
                    data={nav.routeGeoJson}
                    style={{
                        color: '#3b82f6', // Biru terang Tailwind blue-500
                        weight: 5,        // Ditebalkan agar sangat kontras
                        dashArray: '10, 10',
                        lineCap: 'round',
                        lineJoin: 'round',
                        opacity: 0.9,
                    }}
                />
            )}

            <AnimatePresence>
                {selectedZone && nav.status !== 'active' && (
                    <ZoneDetailSidebar
                        zone={selectedZone}
                        center={selectedCenter}
                        onClose={handleClose}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
