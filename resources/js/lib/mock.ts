import type { FeatureCollection } from 'geojson';

export const mockZppiGeoJson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: { confidence: 0.87, zone_date: '2026-05-16' },
            geometry: {
                type: 'Polygon',
                coordinates: [[[110, -5], [112, -5], [112, -3], [110, -3], [110, -5]]],
            },
        },
    ],
};

export const mockWeather = {
    source: 'bmkg' as const,
    wind_speed: 12.4,
    wind_direction: 'Barat Laut',
    wave_height: 1.2,
    temperature: 28.5,
    fetched_at: '2026-05-16T06:00:00Z',
};

export const mockPrices = [
    {
        commodity: 'Ikan Tongkol',
        province: 'Jawa Timur',
        regency: 'Surabaya',
        region_group: 'JAWA',
        price: 38000,
        price_change_pct: -1.0,
        price_date: '2026-05-16',
        period: 'Mei 2026',
    },
    {
        commodity: 'Ikan Kembung',
        province: 'Sulawesi Selatan',
        regency: 'Makassar',
        region_group: 'SULAWESI',
        price: 37591,
        price_change_pct: -0.9,
        price_date: '2026-05-16',
        period: 'Mei 2026',
    },
];
