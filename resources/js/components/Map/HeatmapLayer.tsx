import { ImageOverlay } from 'react-leaflet';

interface HeatmapProps {
    url: string;
    type?: 'sst' | 'chl'; // Tetap dipertahankan agar tidak error di Index.tsx
}

export default function HeatmapLayer({ url }: HeatmapProps) {
    // Batas area Indonesia (Sama persis dengan min/max di Python)
    const bounds: [[number, number], [number, number]] = [
        [-11.0, 95.0], 
        [6.0, 141.0]
    ];

    return (
        <ImageOverlay 
            url={url} 
            bounds={bounds} 
            opacity={0.6} // KUNCI: 0.6 agar pulau dari basemap bisa tembus pandang
            zIndex={10} 
        />
    );
}