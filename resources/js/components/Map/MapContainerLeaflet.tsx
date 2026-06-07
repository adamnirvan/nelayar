import { MapContainer as LeafletMap, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Wajib agar CSS peta tidak hancur

type MapProps = { children?: React.ReactNode };

export default function MapContainerLeaflet({ children }: MapProps) {
    // Batas area khusus Indonesia
    const indonesiaBounds: [[number, number], [number, number]] = [
        [-11.0, 95.0], 
        [6.0, 141.0]
    ];

    return (
        <LeafletMap
            center={[-2.5, 118]}
            zoom={5}
            attributionControl={false}
            maxBounds={indonesiaBounds}
            maxBoundsViscosity={1.0}
            zoomControl={false} // Default top-left bertabrakan dengan header; dipindah ke bawah-kanan
            style={{ height: '100vh', width: '100%', zIndex: 0 }}
        >
            {/* Kontrol zoom dipindah ke pojok kanan-bawah agar tidak menutupi header */}
            <ZoomControl position="bottomright" />

            {/* TileLayer diganti ke versi Clean/Premium dari CARTO */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
            />
            
            {/* Layer ZPPI, Heatmap, dll akan di-render di sini */}
            {children}
        </LeafletMap>
    );
}