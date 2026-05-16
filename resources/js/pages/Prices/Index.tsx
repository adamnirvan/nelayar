import { useState } from 'react';
import { router } from '@inertiajs/react';
import PriceTable from '@/components/Prices/PriceTable';

interface PriceRow {
    commodity: string;
    province: string;
    regency: string;
    region_group: string;
    price: number;
    price_change_pct: number;
    price_date: string;
    period: string;
}

interface Props {
    prices: PriceRow[];
    commodities: string[];
    provinces: string[];
}

export default function PricesIndex({ prices, commodities, provinces }: Props) {
    const [commodity, setCommodity] = useState('');
    const [province, setProvince] = useState('');

    function handleCommodityChange(value: string) {
        setCommodity(value);
        router.visit('/prices', { data: { commodity: value, province } });
    }

    function handleProvinceChange(value: string) {
        setProvince(value);
        router.visit('/prices', { data: { commodity, province: value } });
    }

    return (
        <div>
            <div>
                <label htmlFor="commodity-filter">Komoditas</label>
                <select
                    id="commodity-filter"
                    value={commodity}
                    onChange={(e) => handleCommodityChange(e.target.value)}
                >
                    <option value="">Semua</option>
                    {commodities.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <label htmlFor="province-filter">Provinsi</label>
                <select
                    id="province-filter"
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                >
                    <option value="">Semua</option>
                    {provinces.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
            </div>

            <PriceTable prices={prices} />
        </div>
    );
}
