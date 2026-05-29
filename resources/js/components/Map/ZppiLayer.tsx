import { useState, useMemo, useEffect } from 'react';
import { GeoJSON, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FeatureCollection, Feature } from 'geojson';
import ZoneDetailSidebar from './ZoneDetailSidebar';

// Ikon kustom menggunakan CSS murni (tanpa file gambar .png)
const createPulsingIcon = () => {
    return L.divIcon({
        className: 'pulsing-marker-wrapper',
        html: '<div class="pulsing-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

interface Props {
    geojson: FeatureCollection;
}

export default function ZppiLayer({ geojson }: Props) {
    const map = useMap();
    const [selectedZone, setSelectedZone] = useState<Feature | null>(null);

    // 1. Parsing string koordinat mentah dari Laravel menjadi JSON Object
    const safeGeojson = useMemo(() => {
        if (!geojson || !geojson.features) return { type: 'FeatureCollection', features: [] };
        return {
            ...geojson,
            features: geojson.features.map(feature => ({
                ...feature,
                geometry: typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry
            }))
        };
    }, [geojson]);

    // 2. Kalkulasi Centroid (Titik Tengah) untuk masing-masing poligon
    const zonesWithCenters = useMemo(() => {
        return safeGeojson.features.map(feature => {
            const layer = L.geoJSON(feature);
            const bounds = layer.getBounds();
            // Ambil titik tengah jika koordinatnya valid
            return {
                feature,
                center: bounds.isValid() ? bounds.getCenter() : null
            };
        }).filter(z => z.center !== null); // Buang yang tidak punya titik tengah
    }, [safeGeojson]);

    // 3. Aksi saat Marker Denyut diklik
    const handleZoneClick = (zone: any) => {
        setSelectedZone(zone.feature); 
        
        // Animasi terbang (FlyTo) ke area poligon
        const layer = L.geoJSON(zone.feature);
        const bounds = layer.getBounds();
        // Menggeser kamera sedikit ke kanan agar poligon tidak tertutup Sidebar di kiri
        map.flyToBounds(bounds, { paddingBottomRight: [0, 0], paddingTopLeft: [350, 0], duration: 1.5 });
    };

    return (
        <>
            {/* KONDISI 1: Tampilkan Marker Berdenyut (Jika belum ada zona yang dipilih) */}
            {!selectedZone && zonesWithCenters.map((zone, idx) => (
                <Marker 
                    key={`marker-${idx}`} 
                    position={zone.center!} 
                    icon={createPulsingIcon()}
                    eventHandlers={{ click: () => handleZoneClick(zone) }}
                />
            ))}

            {/* KONDISI 2: Tampilkan Poligon (Hanya poligon dari zona yang diklik) */}
            {selectedZone && (
                <GeoJSON 
                    key={`selected-${selectedZone.properties?.zone_date}-${Math.random()}`}
                    data={selectedZone as Feature}
                    style={{
                        fillColor: '#3b82f6', // Biru laut cerah
                        color: '#1e3a8a',     // Biru tua
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.4
                    }}
                />
            )}

            {/* KONDISI 3: Tampilkan Sidebar UI */}
            {selectedZone && (
                <ZoneDetailSidebar 
                    zone={selectedZone} 
                    onClose={() => setSelectedZone(null)} 
                />
            )}
        </>
    );
}