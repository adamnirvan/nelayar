import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    Facebook,
    Linkedin,
    MapPin,
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp,
    Twitter,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AppLogoIcon from '@/components/app-logo-icon';
import PriceChoropleth from '@/components/Prices/PriceChoropleth';
import { PRICE_COLORS, priceColor, priceThresholds } from '@/lib/geo';

interface PriceRow {
    commodity: string;
    province: string;
    regency: string;
    region_group: string;
    price: number | null;
    price_change_pct: number | null;
    price_date: string;
    period: string;
}

interface Stats {
    avg: number;
    max: number;
    min: number;
    coverage: number;
    max_loc: string;
    min_loc: string;
    period: string;
    change: number | null;
}

interface TrendPoint {
    label: string;
    price: number;
}

interface ProvSummary {
    id: string;
    name: string;
    price: number;
    count: number;
}

interface KabSummary {
    id: string;
    name: string;
    price: number;
}

interface RegionTrendPoint {
    month: string;
    price: number;
}

interface Props {
    prices: PriceRow[];
    stats: Stats;
    trend: TrendPoint[];
    provSummary: ProvSummary[];
    kabSummary: KabSummary[];
    regionTrend: RegionTrendPoint[];
    commodities: string[];
    filters: { commodity: string | null; province: string | null };
}

function formatRupiah(value: number | null | undefined): string {
    if (value == null) {
        return '-';
    }

    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function formatCompact(value: number): string {
    if (value >= 1000) {
        return `${Math.round(value / 1000)}rb`;
    }

    return `${value}`;
}

function formatChange(pct: number | null | undefined): string {
    if (pct == null) {
        return '-';
    }

    const sign = pct > 0 ? '+' : '';

    return `${sign}${pct.toFixed(1)}%`;
}

const ID_MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function formatDate(value: string): string {
    if (!value) {
        return '-';
    }

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return value;
    }

    return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PricesIndex({
    prices,
    stats,
    trend,
    provSummary,
    kabSummary,
    regionTrend,
    commodities,
    filters,
}: Props) {
    const commodity = filters.commodity ?? commodities[0] ?? '';
    const province = filters.province ?? '';
    const [search, setSearch] = useState('');
    const [showTable, setShowTable] = useState(false);

    function applyFilters(next: { commodity?: string; province?: string | null }) {
        const data: Record<string, string> = {};
        const c = next.commodity ?? commodity;
        const p = next.province === undefined ? province : next.province;

        if (c) {
data.commodity = c;
}

        if (p) {
data.province = p;
}

        router.visit('/prices', {
            data,
            preserveScroll: true,
            preserveState: false,
        });
    }

    const filteredPrices = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) {
            return prices;
        }

        return prices.filter(
            (row) =>
                row.regency?.toLowerCase().includes(q) ||
                row.province?.toLowerCase().includes(q),
        );
    }, [prices, search]);

    // Provinsi diurut termahal → termurah untuk grafik peringkat & pewarnaan konsisten.
    const rankedProv = useMemo(
        () => [...provSummary].sort((a, b) => b.price - a.price),
        [provSummary],
    );
    const provThresholds = useMemo(
        () => priceThresholds(provSummary.map((p) => p.price)),
        [provSummary],
    );

    return (
        <>
            <Head title="Dashboard Harga Ikan">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="flex min-h-screen flex-col bg-gradient-to-b from-[#4cc6ed] via-[#2f9fd6] to-[#062a3d] text-white"
                style={{ fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif' }}
            >
                {/* ===================== HEADER ===================== */}
                <header className="border-b border-white/15 bg-white/10 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                        <Link href="/" className="flex items-center">
                            <AppLogoIcon className="h-7 w-auto" />
                        </Link>
                        <Link
                            href="/map"
                            className="flex items-center gap-2 text-sm font-semibold text-white transition hover:text-amber-300"
                        >
                            <ArrowLeft className="size-4" />
                            Dashboard
                        </Link>
                    </div>
                </header>

                {/* ===================== MAIN ===================== */}
                <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900">Harga Ikan</h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-700">
                                Analisis harga pasar per komoditas di seluruh Indonesia untuk
                                memaksimalkan nilai jual hasil tangkapanmu.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            className="flex items-center justify-center gap-2 self-start rounded-2xl bg-[#2EA3B5] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(46,163,181,0.35)] transition hover:-translate-y-0.5 hover:bg-[#33b5c8]"
                        >
                            <RefreshCw className="size-4" />
                            Perbarui
                        </button>
                    </div>

                    {/* ---------- Commodity tabs ---------- */}
                    <div className="mt-7 flex flex-wrap gap-2.5">
                        {commodities.map((c) => {
                            const active = c === commodity;

                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => applyFilters({ commodity: c, province: null })}
                                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                                        active
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'border border-white/40 bg-white/15 text-slate-800 backdrop-blur-md hover:bg-white/30'
                                    }`}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>

                    {/* ---------- KPI cards ---------- */}
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Rata-Rata Harga">
                            <p className="text-3xl font-black text-slate-900">
                                {formatRupiah(stats.avg)}
                            </p>
                            <p className="mt-1 text-xs font-semibold">
                                {stats.change == null ? (
                                    <span className="text-slate-500">
                                        Belum ada pembanding bulan lalu
                                    </span>
                                ) : (
                                    <span
                                        className={`inline-flex items-center gap-1 ${
                                            stats.change >= 0 ? 'text-emerald-700' : 'text-red-600'
                                        }`}
                                    >
                                        {stats.change >= 0 ? (
                                            <TrendingUp className="size-3.5" />
                                        ) : (
                                            <TrendingDown className="size-3.5" />
                                        )}
                                        {formatChange(stats.change)} vs bulan lalu
                                    </span>
                                )}
                            </p>
                        </StatCard>

                        <StatCard label="Harga Tertinggi">
                            <p className="text-3xl font-black text-red-600">
                                {formatRupiah(stats.max)}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                                <MapPin className="size-3.5" /> {stats.max_loc}
                            </p>
                        </StatCard>

                        <StatCard label="Harga Terendah">
                            <p className="text-3xl font-black text-emerald-600">
                                {formatRupiah(stats.min)}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                                <MapPin className="size-3.5" /> {stats.min_loc}
                            </p>
                        </StatCard>

                        <StatCard label={province ? 'Cakupan Kab/Kota' : 'Cakupan Provinsi'}>
                            <p className="text-3xl font-black text-slate-900">{stats.coverage}</p>
                            <p className="mt-1 text-xs font-medium text-slate-600">
                                Periode {stats.period}
                            </p>
                        </StatCard>
                    </div>

                    {/* ---------- Map + Trend ---------- */}
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
                        {/* Choropleth map */}
                        <Panel className="lg:col-span-3">
                            <PanelHeader
                                title="Peta Harga Provinsi"
                                subtitle="Zoom, geser, dan klik provinsi untuk detail"
                            />
                            <div className="relative mt-4 h-96 overflow-hidden rounded-2xl">
                                <PriceChoropleth
                                    data={provSummary}
                                    selected={province || null}
                                    onSelect={(p) =>
                                        applyFilters({
                                            province: p === province ? null : p,
                                        })
                                    }
                                />
                            </div>
                            <Legend thresholds={provThresholds} />
                        </Panel>

                        {/* Trend chart */}
                        <Panel className="lg:col-span-2">
                            <PanelHeader
                                title="Tren Harga 12 Bulan"
                                subtitle={`Rata-rata nasional · ${commodity}`}
                            />
                            <div className="mt-4 h-96 w-full">
                                {trend.length === 0 ? (
                                    <EmptyState label="Belum ada data tren" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={trend}
                                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="trendFill"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop offset="0%" stopColor="#0b3a5a" stopOpacity={0.5} />
                                                    <stop offset="100%" stopColor="#0b3a5a" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.2} />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fill: '#1e293b', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={formatCompact}
                                                tick={{ fill: '#1e293b', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={44}
                                            />
                                            <Tooltip content={<RupiahTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="price"
                                                stroke="#0b3a5a"
                                                strokeWidth={2.5}
                                                fill="url(#trendFill)"
                                                dot={{ r: 2.5, fill: '#0b3a5a' }}
                                                activeDot={{ r: 5 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Panel>
                    </div>

                    {/* ---------- Province ranking ---------- */}
                    <Panel className="mt-6">
                        <PanelHeader
                            title="Peringkat Harga per Provinsi"
                            subtitle="Klik batang untuk membuka detail kab/kota"
                        />
                        <div className="mt-4 max-h-[460px] overflow-y-auto pr-2">
                            {rankedProv.length === 0 ? (
                                <EmptyState label="Belum ada data provinsi" />
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(rankedProv.length * 26, 120)}>
                                    <BarChart
                                        data={rankedProv}
                                        layout="vertical"
                                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                                    >
                                        <CartesianGrid horizontal={false} stroke="#475569" strokeOpacity={0.15} />
                                        <XAxis
                                            type="number"
                                            tickFormatter={formatCompact}
                                            tick={{ fill: '#1e293b', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={130}
                                            tick={{ fill: '#1e293b', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#ffffff', fillOpacity: 0.15 }} />
                                        <Bar
                                            dataKey="price"
                                            radius={[0, 6, 6, 0]}
                                            cursor="pointer"
                                            onClick={(d: { name?: string }) =>
                                                d?.name &&
                                                applyFilters({
                                                    province: d.name === province ? null : d.name,
                                                })
                                            }
                                        >
                                            {rankedProv.map((p) => (
                                                <Cell
                                                    key={p.id}
                                                    fill={
                                                        p.name === province
                                                            ? '#f59e0b'
                                                            : priceColor(p.price, provThresholds)
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Panel>

                    {/* ---------- Province drill-down ---------- */}
                    {province && (
                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Panel>
                                <div className="flex items-start justify-between">
                                    <PanelHeader
                                        title={`Harga Kab/Kota · ${province}`}
                                        subtitle={`${commodity}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => applyFilters({ province: null })}
                                        className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-white/40"
                                    >
                                        <X className="size-3.5" /> Tutup
                                    </button>
                                </div>
                                <div className="mt-4 max-h-[360px] overflow-y-auto pr-2">
                                    {kabSummary.length === 0 ? (
                                        <EmptyState label="Belum ada data kab/kota" />
                                    ) : (
                                        <ResponsiveContainer
                                            width="100%"
                                            height={Math.max(kabSummary.length * 28, 120)}
                                        >
                                            <BarChart
                                                data={kabSummary}
                                                layout="vertical"
                                                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                                            >
                                                <CartesianGrid horizontal={false} stroke="#475569" strokeOpacity={0.15} />
                                                <XAxis
                                                    type="number"
                                                    tickFormatter={formatCompact}
                                                    tick={{ fill: '#1e293b', fontSize: 11 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={120}
                                                    tick={{ fill: '#1e293b', fontSize: 11 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#ffffff', fillOpacity: 0.15 }} />
                                                <Bar dataKey="price" radius={[0, 6, 6, 0]} fill="#3a9fc4" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Panel>

                            <Panel>
                                <PanelHeader
                                    title="Tren Bulanan Provinsi"
                                    subtitle={`${province} · ${commodity}`}
                                />
                                <div className="mt-4 h-[360px] w-full">
                                    {regionTrend.length === 0 ? (
                                        <EmptyState label="Belum ada data tren" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={regionTrend}
                                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.2} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fill: '#1e293b', fontSize: 11 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tickFormatter={formatCompact}
                                                    tick={{ fill: '#1e293b', fontSize: 11 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={44}
                                                />
                                                <Tooltip content={<RupiahTooltip />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke="#0b3a5a"
                                                    strokeWidth={2.5}
                                                    dot={{ r: 3, fill: '#0b3a5a' }}
                                                    activeDot={{ r: 5 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Panel>
                        </div>
                    )}

                    {/* ---------- Detailed table (collapsible) ---------- */}
                    <div className="mt-6 rounded-3xl border border-white/25 bg-white/10 shadow-[0_12px_40px_rgba(8,58,82,0.2)] ring-1 ring-white/5 backdrop-blur-xl">
                        <button
                            type="button"
                            onClick={() => setShowTable((s) => !s)}
                            className="flex w-full items-center justify-between px-6 py-5 text-left"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Tabel Rincian</h2>
                                <p className="text-xs font-medium text-slate-600">
                                    {prices.length} baris data harga
                                </p>
                            </div>
                            <ChevronDown
                                className={`size-5 text-slate-700 transition ${showTable ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {showTable && (
                            <div className="px-6 pb-6">
                                <div className="relative mb-4 sm:w-72">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari wilayah atau kota..."
                                        className="w-full rounded-full border border-white/40 bg-white/70 py-2.5 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:bg-white/90"
                                    />
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-white/20">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-white/25 text-xs font-bold uppercase tracking-wide text-slate-700">
                                                <th className="px-5 py-4 text-left">Wilayah</th>
                                                <th className="px-5 py-4 text-left">Harga (IDR)</th>
                                                <th className="px-5 py-4 text-left">Perubahan (%)</th>
                                                <th className="px-5 py-4 text-left">Periode</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPrices.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-5 py-12 text-center text-sm font-medium text-slate-600"
                                                    >
                                                        Tidak ada data harga untuk filter ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredPrices.map((row, i) => (
                                                    <tr
                                                        key={`${row.regency}-${row.price_date}-${i}`}
                                                        className="border-t border-white/15 transition odd:bg-white/10 even:bg-white/5 hover:bg-white/25"
                                                    >
                                                        <td className="px-5 py-3.5 font-medium text-slate-800">
                                                            {row.regency || row.province}
                                                        </td>
                                                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                                                            {formatRupiah(row.price)}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span
                                                                className={`font-semibold ${
                                                                    row.price_change_pct == null
                                                                        ? 'text-slate-500'
                                                                        : row.price_change_pct >= 0
                                                                          ? 'text-emerald-600'
                                                                          : 'text-red-600'
                                                                }`}
                                                            >
                                                                {formatChange(row.price_change_pct)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-slate-700">
                                                            {formatDate(row.price_date)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* ===================== FOOTER ===================== */}
                <footer className="bg-[#062a3d] py-12 text-white">
                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-3">
                        <div className="space-y-4">
                            <AppLogoIcon className="h-7 w-auto" />
                            <span className="inline-block rounded-full border border-white/30 px-4 py-1 text-xs font-semibold text-amber-300">
                                Contact Us
                            </span>
                            <ul className="space-y-1 text-xs text-white/70">
                                <li>Email: nelayar.com</li>
                                <li>Phone: 00000000000</li>
                                <li>Address: 1234 Surabaya</li>
                            </ul>
                        </div>

                        <div className="flex flex-col items-start gap-4 md:items-center md:justify-center">
                            <div className="flex items-center gap-3">
                                {[Linkedin, Facebook, Twitter].map((Icon, i) => (
                                    <a
                                        key={i}
                                        href="#"
                                        className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-amber-300 hover:text-slate-900"
                                    >
                                        <Icon className="size-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-4 md:items-end">
                            <Link
                                href="/register"
                                className="rounded-full border border-white/30 bg-[#2EA3B5]/80 px-6 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(46,163,181,0.35)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#33b5c8]/90"
                            >
                                Bergabung Sekarang
                            </Link>
                        </div>
                    </div>

                    <div className="mx-auto mt-10 flex max-w-6xl flex-col items-start justify-between gap-2 border-t border-white/10 px-6 pt-6 text-xs text-white/60 sm:flex-row sm:items-center">
                        <span>© 2026 Nelayar. All Rights Reserved.</span>
                        <a href="#" className="hover:text-white">
                            Privacy Policy
                        </a>
                    </div>
                </footer>
            </div>
        </>
    );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-3xl border border-white/25 bg-white/15 p-6 shadow-[0_12px_40px_rgba(8,58,82,0.2)] ring-1 ring-white/5 backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs font-medium text-slate-600">{subtitle}</p>}
        </div>
    );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-3xl border border-white/30 bg-white/20 p-6 shadow-[0_10px_30px_rgba(8,58,82,0.18)] ring-1 ring-white/10 backdrop-blur-xl">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex h-full min-h-[120px] items-center justify-center text-sm font-medium text-slate-600">
            {label}
        </div>
    );
}

function RupiahTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { value: number; payload: { name?: string; month?: string; label?: string } }[];
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const point = payload[0];
    const title = point.payload.name ?? point.payload.month ?? label ?? '';

    return (
        <div className="rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
            {title && <p className="font-semibold">{title}</p>}
            <p className="text-amber-300">{formatRupiah(point.value)}</p>
        </div>
    );
}

function Legend({ thresholds }: { thresholds: number[] }) {
    const labels =
        thresholds.length === 0
            ? ['Harga']
            : [
                  `< ${formatCompact(thresholds[0])}`,
                  `${formatCompact(thresholds[0])}–${formatCompact(thresholds[1])}`,
                  `${formatCompact(thresholds[1])}–${formatCompact(thresholds[2])}`,
                  `${formatCompact(thresholds[2])}–${formatCompact(thresholds[3])}`,
                  `> ${formatCompact(thresholds[3])}`,
              ];

    return (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-700">
            {labels.map((l, i) => (
                <span key={l} className="flex items-center gap-1">
                    <span
                        className="inline-block size-3 rounded-sm"
                        style={{ background: PRICE_COLORS[i] ?? PRICE_COLORS[0] }}
                    />
                    {l}
                </span>
            ))}
        </div>
    );
}
