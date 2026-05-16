import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';

export default function MapContainer({ children }: { children?: React.ReactNode }) {
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
