import type { FeatureCollection } from 'geojson';
import MapContainer from '@/components/Map/MapContainer';
import ZppiLayer from '@/components/Map/ZppiLayer';
import ForecastSlider from '@/components/Forecast/ForecastSlider';

interface Props {
    forecastDates: string[];
    selectedDate: string;
    zppiGeoJson: FeatureCollection;
}

export default function Forecast({ forecastDates, selectedDate, zppiGeoJson }: Props) {
    return (
        <div>
            <ForecastSlider dates={forecastDates} selectedDate={selectedDate} />
            {zppiGeoJson && zppiGeoJson.features.length > 0 ? (
                <MapContainer>
                    <ZppiLayer geojson={zppiGeoJson} />
                </MapContainer>
            ) : (
                <p>Tidak ada data ZPPI untuk tanggal ini.</p>
            )}
        </div>
    );
}
