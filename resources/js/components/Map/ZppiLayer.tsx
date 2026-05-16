import { GeoJSON } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';

interface Props {
    geojson: FeatureCollection;
}

export default function ZppiLayer({ geojson }: Props) {
    return <GeoJSON key={JSON.stringify(geojson)} data={geojson} />;
}
