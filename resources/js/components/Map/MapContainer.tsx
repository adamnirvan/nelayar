import { useState, useEffect, type ComponentType } from 'react';

type MapProps = { children?: React.ReactNode };

export default function MapContainer({ children }: MapProps) {
    const [MapImpl, setMapImpl] = useState<ComponentType<MapProps> | null>(null);

    // Dynamic import untuk mencegah error SSR di Leaflet
    useEffect(() => {
        import('./MapContainerLeaflet').then((m) => setMapImpl(() => m.default));
    }, []);

    // Fallback UI saat peta sedang di-load (mencegah layout shift)
    if (!MapImpl) return <div style={{ height: '100vh', width: '100%', backgroundColor: '#f3f4f6' }} />;

    return <MapImpl>{children}</MapImpl>;
}