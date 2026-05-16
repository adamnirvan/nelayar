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
}

function formatChange(pct: number): string {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
}

export default function PriceTable({ prices }: Props) {
    return (
        <table>
            <thead>
                <tr>
                    <th>Komoditas</th>
                    <th>Provinsi</th>
                    <th>Kabupaten/Kota</th>
                    <th>Harga</th>
                    <th>Perubahan (%)</th>
                    <th>Periode</th>
                </tr>
            </thead>
            <tbody>
                {prices.map((row, i) => (
                    <tr key={i}>
                        <td>{row.commodity}</td>
                        <td>{row.province}</td>
                        <td>{row.regency}</td>
                        <td>Rp {row.price.toLocaleString('id-ID')}</td>
                        <td>{formatChange(row.price_change_pct)}</td>
                        <td>{row.period}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
