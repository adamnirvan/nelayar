import type { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import { useState, useMemo, useEffect } from 'react';
import { GeoJSON, Marker, useMap } from 'react-leaflet';
import { featureHasFish } from '@/lib/fishSearch';
import ZoneDetailSidebar from './ZoneDetailSidebar';
import { AnimatePresence } from 'framer-motion';

// [BARU] 1. Mengimpor Context Navigasi
import { useNavigation } from './NavigationContext'; 

const createPulsingIcon = () => {
    return L.divIcon({
        className: 'pulsing-marker-wrapper',
        html: '<div class="pulsing-marker"></div>',
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
    
    // [BARU] 2. Memanggil status navigasi
    const nav = useNavigation(); 
    
    const [selectedZone, setSelectedZone] = useState<Feature | null>(null);
    const [selectedCenter, setSelectedCenter] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    useEffect(() => {
        onZoneOpenChange?.(selectedZone !== null);
        return () => onZoneOpenChange?.(false);
    }, [selectedZone, onZoneOpenChange]);

    const safeGeojson = useMemo(() => {
        if (!geojson || !geojson.features) {
            return { type: 'FeatureCollection', features: [] };
        }
        return {
            ...geojson,
            features: geojson.features.map((feature) => ({
                ...feature,
                geometry: typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry,
            })),
        };
    }, [geojson]);

    const zonesWithCenters = useMemo(() => {
        return safeGeojson.features
            .map((feature) => {
                const layer = L.geoJSON(feature);
                const bounds = layer.getBounds();
                return {
                    feature,
                    center: bounds.isValid() ? bounds.getCenter() : null,
                };
            })
            .filter((z) => z.center !== null);
    }, [safeGeojson]);

    const visibleZones = useMemo(() => {
        if (!fishFilter) return zonesWithCenters;
        return zonesWithCenters.filter((z) => featureHasFish(z.feature, fishFilter));
    }, [zonesWithCenters, fishFilter]);

    const [prevFilter, setPrevFilter] = useState<string | null>(fishFilter);

    if (fishFilter !== prevFilter) {
        setPrevFilter(fishFilter);
        setSelectedZone(null);
        setSelectedCenter(null);
    }

    useEffect(() => {
        if (!fishFilter) return;
        const points = visibleZones.map((z) => z.center).filter((c): c is L.LatLng => c !== null);
        if (points.length === 0) return;
        map.flyToBounds(L.latLngBounds(points), {
            padding: [80, 80],
            maxZoom: 11,
            duration: 1.2,
        });
    }, [fishFilter, visibleZones, map]);


    // [BARU] 3. EFFECT KAMERA RUTE & NAVIGASI
    useEffect(() => {
        // Jika rute belum ada, abaikan perintah kamera
        if (!nav.routeGeoJson) return;

        if (nav.status === 'planned') {
            // TAHAP 2: MODE OVERVIEW (Menampilkan keseluruhan rute)
            const routeLayer = L.geoJSON(nav.routeGeoJson);
            const routeBounds = routeLayer.getBounds();

            if (routeBounds.isValid()) {
                const isMobile = window.innerWidth < 768;
                const padTopLeft: [number, number] = isMobile ? [40, 40] : [420, 40];
                const padBottomRight: [number, number] = isMobile ? [40, 300] : [40, 40];

                map.flyToBounds(routeBounds, {
                    paddingTopLeft: padTopLeft,
                    paddingBottomRight: padBottomRight,
                    maxZoom: 11, 
                    duration: 1.5,
                });
            }
        } 
        else if (nav.status === 'active' && nav.userPosition) {
            // TAHAP 3: MODE NAVIGASI (Zoom in ekstrem ke lokasi nelayan)
            const isMobile = window.innerWidth < 768;
            
            // Padding agar nelayan tidak tertutup sidebar desktop / bottom sheet
            const padTopLeft: [number, number] = isMobile ? [0, 0] : [400, 0];
            const padBottomRight: [number, number] = isMobile ? [0, 200] : [0, 0];

            // Trik: Kita gunakan flyToBounds pada area berukuran 0 (hanya titik user) 
            // agar fitur padding otomatis Leaflet tetap bisa bekerja!
            const userPoint = L.latLng(nav.userPosition.lat, nav.userPosition.lng);
            
            map.flyToBounds(L.latLngBounds(userPoint, userPoint), {
                paddingTopLeft: padTopLeft,
                paddingBottomRight: padBottomRight,
                maxZoom: 16, // Zoom in sangat dekat!
                duration: 2.5, // Dibuat sedikit lebih lambat agar dramatis seperti Gmaps
            });
        }
    }, [nav.routeGeoJson, nav.status, nav.userPosition, map]);


    const handleZoneClick = (zone: any) => {
        setSelectedZone(zone.feature);
        setSelectedCenter(zone.center ? { lat: zone.center.lat, lng: zone.center.lng } : null);

        const layer = L.geoJSON(zone.feature);
        const bounds = layer.getBounds();
        const isMobile = window.innerWidth < 768;
        
        const padTopLeft: [number, number] = isMobile ? [0, 0] : [400, 0]; 
        const padBottomRight: [number, number] = isMobile ? [0, 250] : [0, 0];

        map.flyToBounds(bounds, {
            paddingTopLeft: padTopLeft,
            paddingBottomRight: padBottomRight,
            maxZoom: 10,
            duration: 1.5,
        });
    };

    return (
        <>
            {!selectedZone &&
                visibleZones.map((zone, idx) => (
                    <Marker
                        key={`marker-${idx}`}
                        position={zone.center!}
                        icon={createPulsingIcon()}
                        eventHandlers={{ click: () => handleZoneClick(zone) }}
                    />
                ))}

            {selectedZone && (
                <GeoJSON
                    key={`selected-${selectedZone.properties?.zone_date}-${selectedCenter?.lat},${selectedCenter?.lng}`}
                    data={selectedZone as Feature}
                    style={{
                        fillColor: '#3b82f6',
                        color: '#1e3a8a',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.4,
                    }}
                />
            )}

            {/* [BARU] 4. GARIS RUTE NAVIGASI */}
            {/* Merender GeoJSON rute menjadi garis putus-putus ala maritim */}
            {nav.routeGeoJson && (
                <GeoJSON
                    key={`route-${nav.status}-${Date.now()}`}
                    data={nav.routeGeoJson}
                    style={{
                        color: '#0284c7', // Biru cerah (Sky 600)
                        weight: 4,
                        dashArray: '8, 8', // Garis putus-putus
                        lineCap: 'round',
                        lineJoin: 'round',
                    }}
                />
            )}

            <AnimatePresence>
                {/* Hanya tampil jika ada zona yang dipilih, DAN status navigasi belum active */}
                {selectedZone && nav.status !== 'active' && (
                    <ZoneDetailSidebar 
                        zone={selectedZone} 
                        center={selectedCenter} 
                        onClose={() => {
                            setSelectedZone(null);
                            nav.cancelNavigation();
                        }} 
                    />
                )}
            </AnimatePresence>
        </>
    );
}