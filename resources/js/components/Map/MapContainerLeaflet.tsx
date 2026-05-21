import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';

export default function MapContainerLeaflet({ children }: { children?: React.ReactNode }) {
    useEffect(() => {
        import('leaflet').then(({ default: L }) => {
            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: markerIcon2x,
                iconUrl: markerIcon,
                shadowUrl: markerShadow,
            });
        });
    }, []);

    return (
        <LeafletMap
            center={[-2.5, 118]}
            zoom={5}
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {children}
        </LeafletMap>
    );
}
