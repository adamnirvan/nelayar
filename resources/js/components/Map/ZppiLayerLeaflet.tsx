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

// Ikon dibuat sekali lalu dipakai ulang oleh seluruh marker (hemat alokasi).
const pulsingIcon = L.divIcon({
    className: 'pulsing-marker-wrapper',
    html: '<div class="pulsing-marker"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// Ikon untuk zona yang berada di dalam radius pencarian pengguna (emas berdenyut).
const nearbyIcon = L.divIcon({
    className: 'nearby-marker-wrapper',
    html: '<div class="nearby-marker"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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
                    html: `<div class="zppi-cluster"><span>${count}</span></div>`,
                    className: 'zppi-cluster-wrapper',
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
            {/* FITUR TEMAN: Lingkaran radius pencarian di sekitar pengguna (kunjungan pertama) */}
            {!selectedZone &&
                userPosition &&
                nearby &&
                nearby.nearby.length > 0 && (
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

            {/* GABUNGAN: Marker zona (clustered) — disembunyikan saat satu zona dipilih */}
            <ClusteredZoneMarkers
                zones={visibleZones}
                nearbySet={nearbySet}
                hidden={selectedZone !== null}
                onZoneClick={handleZoneClick}
            />

            {/* Outline poligon zona terpilih (diambil lazy) */}
            {selectedGeometry && (
                <GeoJSON
                    key={`selected-${selectedGeometry.properties?.id}`}
                    data={selectedGeometry}
                    style={{
                        fillColor: '#3b82f6',
                        color: '#1e3a8a',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.4,
                    }}
                />
            )}

            {/* FITUR MU: GARIS RUTE NAVIGASI PUTUS-PUTUS */}
            {nav.routeGeoJson && (
                <GeoJSON
                    key={`route-${nav.status}-${Date.now()}`}
                    data={nav.routeGeoJson}
                    style={{
                        color: '#0284c7',
                        weight: 4,
                        dashArray: '8, 8',
                        lineCap: 'round',
                        lineJoin: 'round',
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
