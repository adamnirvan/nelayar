import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';

export default function MapContainer({ children }: { children?: React.ReactNode }) {
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

    // Batas area khusus Indonesia
    const indonesiaBounds: [[number, number], [number, number]] = [
        [-11.0, 95.0], 
        [6.0, 141.0]
    ];

    return (
        <LeafletMap
            center={[-2.5, 118]}
            zoom={5}
            maxBounds={indonesiaBounds}
            maxBoundsViscosity={1.0}
            style={{ height: '100vh', width: '100%', zIndex: 0 }}
        >
            {/* TileLayer diganti ke versi Clean/Premium dari CARTO */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
            />
            {children}
        </LeafletMap>
    );
}