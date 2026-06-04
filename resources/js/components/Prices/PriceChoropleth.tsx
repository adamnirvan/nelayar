import { useEffect, useState  } from 'react';
import type {ComponentType} from 'react';

export interface ProvincePrice {
    id: string;
    name: string;
    price: number;
    count?: number;
}

export interface PriceChoroplethProps {
    data: ProvincePrice[];
    selected?: string | null;
    onSelect?: (province: string) => void;
}

// Pembungkus yang memuat implementasi Leaflet secara dinamis (lihat MapContainer.tsx)
// agar tidak memicu error SSR akibat akses `window` saat render di server.
export default function PriceChoropleth(props: PriceChoroplethProps) {
    const [Impl, setImpl] = useState<ComponentType<PriceChoroplethProps> | null>(null);

    useEffect(() => {
        import('./PriceChoroplethLeaflet').then((m) => setImpl(() => m.default));
    }, []);

    if (!Impl) {
        return <div className="h-full w-full animate-pulse rounded-2xl bg-white/20" />;
    }

    return <Impl {...props} />;
}
