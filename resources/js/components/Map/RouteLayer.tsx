import L from 'leaflet';
import { GeoJSON, Marker, Popup } from 'react-leaflet';
import { useNavigation } from './NavigationContext';

// Ikon kecil untuk titik tujuan rute (bendera).
const destinationIcon = L.divIcon({
    className: 'route-dest-wrapper',
    html: '<div class="route-dest-marker">⚓</div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

// Menggambar garis rute pelayaran + penanda asal/tujuan. Membaca state dari
// NavigationContext sehingga tetap tampil walau sidebar zona ditutup (mode on-going).
export default function RouteLayer() {
    const { routeGeoJson, origin, destination, status } = useNavigation();

    if (!routeGeoJson) {
        return null;
    }

    // Hijau penuh saat perjalanan berlangsung; biru putus-putus saat masih rencana.
    const isActive = status === 'active';
    const color = isActive ? '#16a34a' : '#1d4ed8';

    return (
        <>
            <GeoJSON
                key={`route-${origin?.lat},${origin?.lng}-${destination?.lat},${destination?.lng}-${status}`}
                data={routeGeoJson}
                style={{
                    color,
                    weight: 4,
                    opacity: 0.9,
                    dashArray: isActive ? undefined : '8 6',
                }}
            />

            {destination && (
                <Marker
                    position={[destination.lat, destination.lng]}
                    icon={destinationIcon}
                >
                    <Popup>Tujuan: Zona Potensi Ikan</Popup>
                </Marker>
            )}
        </>
    );
}
