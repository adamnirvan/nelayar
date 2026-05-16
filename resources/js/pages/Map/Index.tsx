import type { FeatureCollection } from 'geojson';
import MapContainer from '@/components/Map/MapContainer';
import ZppiLayer from '@/components/Map/ZppiLayer';

interface Props {
    zppiGeoJson: FeatureCollection;
}

export default function MapIndex({ zppiGeoJson }: Props) {
    if (!zppiGeoJson || zppiGeoJson.features.length === 0) {
        return <p>Tidak ada data ZPPI untuk hari ini.</p>;
    }

    return (
        <MapContainer>
            <ZppiLayer geojson={zppiGeoJson} />
        </MapContainer>
    );
}
