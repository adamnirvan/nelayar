import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Layer, LeafletMouseEvent, PathOptions, Path } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { canonProvince, priceColor, priceThresholds } from '@/lib/geo';
import type { PriceChoroplethProps } from './PriceChoropleth';

type GeoProps = { PROVINSI?: string; KODE_PROV?: number | string };

const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
    [-11.0, 95.0],
    [6.0, 141.0],
];

function formatRupiah(value: number): string {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

export default function PriceChoroplethLeaflet({ data, selected, onSelect }: PriceChoroplethProps) {
    const [geo, setGeo] = useState<FeatureCollection | null>(null);

    useEffect(() => {
        let active = true;
        fetch('/geo/idn-provinces.geojson')
            .then((r) => r.json())
            .then((g: FeatureCollection) => {
                if (active) {
setGeo(g);
}
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, []);

    // Lookup harga per provinsi (bentuk kanonik) + ambang warna kuantil.
    const { priceByProv, thresholds } = useMemo(() => {
        const map = new Map<string, number>();

        for (const d of data) {
            map.set(canonProvince(d.name), d.price);
        }

        return { priceByProv: map, thresholds: priceThresholds(data.map((d) => d.price)) };
    }, [data]);

    const styleFor = (feature?: Feature<Geometry, GeoProps>): PathOptions => {
        const name = feature?.properties?.PROVINSI ?? '';
        const canon = canonProvince(name);
        const price = priceByProv.get(canon);
        const isSelected = selected != null && canon === canonProvince(selected);

        return {
            fillColor: priceColor(price, thresholds),
            weight: isSelected ? 2.5 : 0.6,
            color: isSelected ? '#f59e0b' : '#ffffff',
            fillOpacity: price ? 0.85 : 0.35,
        };
    };

    const onEachFeature = (feature: Feature<Geometry, GeoProps>, layer: Layer) => {
        const name = feature.properties?.PROVINSI ?? '-';
        const price = priceByProv.get(canonProvince(name));

        layer.bindTooltip(
            `<strong>${name}</strong><br/>${price ? formatRupiah(price) : 'Tidak ada data'}`,
            { sticky: true, className: 'price-choropleth-tooltip' },
        );

        layer.on({
            click: () => {
                // Kirim nama versi DB bila cocok; jika tidak, pakai nama dari GeoJSON.
                const match = data.find((d) => canonProvince(d.name) === canonProvince(name));
                onSelect?.(match ? match.name : name);
            },
            mouseover: (e: LeafletMouseEvent) =>
                (e.target as Path).setStyle({ weight: 2, fillOpacity: 1 }),
            mouseout: (e: LeafletMouseEvent) => (e.target as Path).setStyle(styleFor(feature)),
        });
    };

    // react-leaflet membekukan GeoJSON pada mount pertama; ganti `key` saat data atau
    // pilihan berubah agar warna & handler ikut diperbarui.
    const geoKey = useMemo(
        () => `${selected ?? ''}-${data.map((d) => `${d.name}:${d.price}`).join('|')}`,
        [data, selected],
    );

    return (
        <MapContainer
            center={[-2.5, 118]}
            zoom={4}
            minZoom={4}
            maxZoom={9}
            maxBounds={INDONESIA_BOUNDS}
            maxBoundsViscosity={1.0}
            scrollWheelZoom={true}
            attributionControl={false}
            zoomControl={true}
            style={{
                height: '100%',
                width: '100%',
                background: 'transparent',
                borderRadius: '1rem',
            }}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png" />
            {geo && (
                <GeoJSON
                    key={geoKey}
                    data={geo}
                    style={styleFor as PathOptions}
                    onEachFeature={onEachFeature}
                />
            )}
        </MapContainer>
    );
}
