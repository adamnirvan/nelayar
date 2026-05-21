import { useState, useEffect, type ComponentType } from 'react';
import type { FeatureCollection } from 'geojson';

interface Props {
    geojson: FeatureCollection;
}

export default function ZppiLayer({ geojson }: Props) {
    const [Impl, setImpl] = useState<ComponentType<Props> | null>(null);

    useEffect(() => {
        import('./ZppiLayerLeaflet').then((m) => setImpl(() => m.default));
    }, []);

    if (!Impl) return null;

    return <Impl geojson={geojson} />;
}
