import { MapContainer as LeafletMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Wajib agar CSS peta tidak hancur

import BasemapLayer from './BasemapLayer';

type MapProps = { children?: React.ReactNode };

export default function MapContainerLeaflet({ children }: MapProps) {
    // Batas area khusus Indonesia
    const indonesiaBounds: [[number, number], [number, number]] = [
        [-11.0, 95.0],
        [6.0, 141.0],
    ];

    return (
        <LeafletMap
            center={[-2.5, 118]}
            zoom={5}
            minZoom={4}
            maxZoom={18}
            maxBounds={indonesiaBounds}
            maxBoundsViscosity={1.0}
            zoomControl={false} // Default top-left bertabrakan dengan header; dipindah ke bawah-kanan
            style={{ height: '100vh', width: '100%', zIndex: 0 }}
        >
            {/* Kontrol zoom dipindah ke pojok kanan-bawah agar tidak menutupi header */}
            <ZoomControl position="bottomright" />

            {/* Basemap: PMTiles vektor offline bila tersedia, jika tidak CARTO online */}
            <BasemapLayer />

            {/* Layer ZPPI, Heatmap, dll akan di-render di sini */}
            {children}
        </LeafletMap>
    );
}
