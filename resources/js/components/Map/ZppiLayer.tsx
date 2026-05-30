import type { FeatureCollection } from 'geojson';
import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';

interface Props {
    geojson: FeatureCollection;
    fishFilter?: string | null;
    onZoneOpenChange?: (open: boolean) => void;
}

export default function ZppiLayer({
    geojson,
    fishFilter = null,
    onZoneOpenChange,
}: Props) {
    const [Impl, setImpl] = useState<ComponentType<Props> | null>(null);

    // Dynamic import untuk mencegah error SSR (Server-Side Rendering)
    useEffect(() => {
        import('./ZppiLayerLeaflet').then((m) => setImpl(() => m.default));
    }, []);

    if (!Impl) {
        return null;
    }

    return (
        <Impl
            geojson={geojson}
            fishFilter={fishFilter}
            onZoneOpenChange={onZoneOpenChange}
        />
    );
}
