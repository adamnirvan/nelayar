import type { FeatureCollection } from 'geojson';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import HeatmapLayer from '@/components/Map/HeatmapLayer';
import LocateControl from '@/components/Map/LocateControl';
import type { MapLayer } from '@/components/Map/MapHeader';
import RouteLayer from '@/components/Map/RouteLayer';
import ZppiLayer from '@/components/Map/ZppiLayer';

export interface SearchTarget {
    lat: number;
    lng: number;
    nonce: number; // memaksa fly ulang walau koordinat sama
}

interface Props {
    selectedDate: string;
    zppiGeoJson: FeatureCollection | null;
    sstFileUrl: string | null;
    chlFileUrl: string | null;
    activeLayer: MapLayer;
    searchTarget: SearchTarget | null;
    fishFilter: string | null;
    onZoneOpenChange?: (open: boolean) => void;
}

// Jembatan kecil: terbang ke hasil pencarian saat target berubah.
function SearchFly({ target }: { target: SearchTarget | null }) {
    const map = useMap();

    useEffect(() => {
        if (target) {
            map.flyTo([target.lat, target.lng], 11, { duration: 1.5 });
        }
    }, [target, map]);

    return null;
}

// Komponen ini HANYA di-load di sisi client (via ZppiOverlays) agar import
// react-leaflet/leaflet tidak ikut tereksekusi saat SSR (mencegah "window is not defined").
export default function ZppiOverlaysLeaflet({
    selectedDate,
    zppiGeoJson,
    sstFileUrl,
    chlFileUrl,
    activeLayer,
    searchTarget,
    fishFilter,
    onZoneOpenChange,
}: Props) {
    return (
        <>
            <LocateControl />
            <RouteLayer />
            <SearchFly target={searchTarget} />

            {/* Layer aktif dipilih lewat toggle di header (Processed / SST / Chl) */}
            {activeLayer === 'processed' &&
                zppiGeoJson &&
                zppiGeoJson.features.length > 0 && (
                    <ZppiLayer
                        geojson={zppiGeoJson}
                        fishFilter={fishFilter}
                        onZoneOpenChange={onZoneOpenChange}
                    />
                )}

            {activeLayer === 'sst' && sstFileUrl && (
                <HeatmapLayer
                    key={`sst-${selectedDate}`}
                    url={sstFileUrl}
                    type="sst"
                />
            )}

            {activeLayer === 'chl' && chlFileUrl && (
                <HeatmapLayer
                    key={`chl-${selectedDate}`}
                    url={chlFileUrl}
                    type="chl"
                />
            )}
        </>
    );
}
