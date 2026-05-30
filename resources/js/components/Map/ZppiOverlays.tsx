import { useEffect, useState, type ComponentType } from 'react';
import type { FeatureCollection } from 'geojson';
import type { MapLayer } from '@/components/Map/MapHeader';
import type { SearchTarget } from '@/components/Map/ZppiOverlaysLeaflet';

interface Props {
    selectedDate: string;
    zppiGeoJson: FeatureCollection | null;
    sstFileUrl: string | null;
    chlFileUrl: string | null;
    activeLayer: MapLayer;
    searchTarget: SearchTarget | null;
    onZoneOpenChange?: (open: boolean) => void;
}

// Wrapper lazy: dynamic import untuk mencegah error SSR di Leaflet.
// Page hanya mengimpor wrapper ini (tanpa react-leaflet), sehingga aman saat SSR.
export default function ZppiOverlays(props: Props) {
    const [Impl, setImpl] = useState<ComponentType<Props> | null>(null);

    useEffect(() => {
        import('./ZppiOverlaysLeaflet').then((m) => setImpl(() => m.default));
    }, []);

    if (!Impl) return null;

    return <Impl {...props} />;
}
