import { useState, useEffect, type ComponentType } from 'react';

type MapProps = { children?: React.ReactNode };

export default function MapContainer({ children }: MapProps) {
    const [MapImpl, setMapImpl] = useState<ComponentType<MapProps> | null>(null);

    useEffect(() => {
        import('./MapContainerLeaflet').then((m) => setMapImpl(() => m.default));
    }, []);

    if (!MapImpl) return <div style={{ height: '100vh', width: '100%' }} />;

    return <MapImpl>{children}</MapImpl>;
}
