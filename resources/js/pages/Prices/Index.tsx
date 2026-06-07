import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    MapPin,
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp,
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

            {/* Immersive Glassmorphism Background: Soft aquatic gradient with floating light blobs */}
            <div
                className="flex min-h-screen flex-col bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#ccfbf1] text-slate-800 pb-20 relative overflow-hidden"
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Ambient Blur Blobs (Memberikan efek kedalaman/immersive ala Nelayar) */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-blue-300/30 blur-[120px]"></div>
                    <div className="absolute top-[20%] -right-[10%] w-[30%] h-[40%] rounded-full bg-teal-200/30 blur-[100px]"></div>
                    <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] rounded-full bg-sky-200/40 blur-[120px]"></div>
                </div>

                {/* ===================== MAIN CONTENT ===================== */}
                <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-10">
                    
                    {/* TOMBOL KEMBALI (Glass Pill) */}
                    <div className="mb-6 flex">
                        <Link
                            href="/map"
                            className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md border border-white/60 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-white hover:shadow-md hover:text-blue-600"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Peta
                        </Link>
                    </div>

                    {/* HERO & TITLE AREA */}
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Harga Ikan</h1>
                            <p className="mt-2 max-w-2xl text-sm md:text-base font-medium text-slate-600">
                                Analisis harga pasar per komoditas di seluruh Indonesia untuk
                                memaksimalkan nilai jual hasil tangkapanmu.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            // Warna kuning/amber ini persis seperti tombol "Masuk" dan "Bergabung" di screenshotmu
                            className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-500 hover:shadow-lg active:scale-95"
                        >
                            <RefreshCw className="size-4" />
                            Perbarui Data
                        </button>
                    </div>

                    {/* COMMODITY TABS (Glassy Pills) */}
                    <div className="mt-8 flex flex-wrap gap-2.5">
                        {commodities.map((c) => {
                            const active = c === commodity;

                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => applyFilters({ commodity: c, province: null })}
                                    className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                                        active
                                            ? 'bg-white text-blue-600 shadow-md border border-white scale-105'
                                            : 'bg-white/40 text-slate-600 border border-white/30 backdrop-blur-md hover:bg-white/60'
                                    }`}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>

                    {/* KPI CARDS (Soft Glass Panels) */}
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Rata-Rata Harga">
                            <p className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                                {formatRupiah(stats.avg)}
                            </p>
                            <div className="mt-2 text-xs font-bold">
                                {stats.change == null ? (
                                    <span className="text-slate-400">
                                        Tidak ada data lalu
                                    </span>
                                ) : (
                                    <span
                                        className={`inline-flex items-center gap-1 ${
                                            stats.change >= 0 ? 'text-emerald-600' : 'text-rose-500'
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
                            </div>
                        </StatCard>

                        <StatCard label="Harga Tertinggi">
                            <p className="text-3xl lg:text-4xl font-black text-rose-500 tracking-tight">
                                {formatRupiah(stats.max)}
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                <MapPin className="size-3.5 text-rose-400" /> {stats.max_loc}
                            </p>
                        </StatCard>

                        <StatCard label="Harga Terendah">
                            <p className="text-3xl lg:text-4xl font-black text-emerald-500 tracking-tight">
                                {formatRupiah(stats.min)}
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                <MapPin className="size-3.5 text-emerald-400" /> {stats.min_loc}
                            </p>
                        </StatCard>

                        <StatCard label={province ? 'Cakupan Kab/Kota' : 'Cakupan Provinsi'}>
                            <p className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">{stats.coverage}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">
                                Periode {stats.period}
                            </p>
                        </StatCard>
                    </div>

                    {/* MAP + TREND (Glass Panels) */}
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
                        {/* Choropleth map */}
                        <Panel className="lg:col-span-3">
                            <PanelHeader
                                title="Peta Harga Provinsi"
                                subtitle="Zoom, geser, dan klik provinsi untuk detail"
                            />
                            {/* Desain Perbatasan Peta yang Menyatu Halus */}
                            <div className="relative mt-5 h-[400px] overflow-hidden rounded-2xl border border-white/60 bg-white/30 shadow-inner">
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
                            <div className="mt-6 h-[380px] w-full">
                                {trend.length === 0 ? (
                                    <EmptyState label="Belum ada data tren" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={trend}
                                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                tickFormatter={formatCompact}
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={44}
                                            />
                                            <Tooltip content={<RupiahTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                            <Area
                                                type="monotone"
                                                dataKey="price"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fill="url(#trendFill)"
                                                dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                                                activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Panel>
                    </div>

                    {/* PROVINCE RANKING (Bar Chart) */}
                    <Panel className="mt-8">
                        <PanelHeader
                            title="Peringkat Harga per Provinsi"
                            subtitle="Klik batang untuk membuka detail kab/kota"
                        />
                        <div className="mt-6 max-h-[460px] overflow-y-auto pr-2 custom-scroll">
                            {rankedProv.length === 0 ? (
                                <EmptyState label="Belum ada data provinsi" />
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(rankedProv.length * 36, 120)}>
                                    <BarChart
                                        data={rankedProv}
                                        layout="vertical"
                                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                                    >
                                        <CartesianGrid horizontal={false} stroke="#94a3b8" strokeOpacity={0.15} />
                                        <XAxis
                                            type="number"
                                            tickFormatter={formatCompact}
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={140}
                                            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f1f5f9', fillOpacity: 0.5 }} />
                                        <Bar
                                            dataKey="price"
                                            radius={[0, 8, 8, 0]}
                                            cursor="pointer"
                                            barSize={16}
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
                                                    // Bar aktif berwarna kuning terang
                                                    fill={
                                                        p.name === province
                                                            ? '#fbbf24'
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

                    {/* PROVINCE DRILL-DOWN */}
                    {province && (
                        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Panel>
                                <div className="flex items-start justify-between">
                                    <PanelHeader
                                        title={`Harga Kab/Kota · ${province}`}
                                        subtitle={`${commodity}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => applyFilters({ province: null })}
                                        className="flex items-center gap-1.5 rounded-full bg-white/50 border border-white/60 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-white hover:text-rose-500"
                                    >
                                        <X className="size-3.5" /> Tutup
                                    </button>
                                </div>
                                <div className="mt-6 max-h-[360px] overflow-y-auto pr-2 custom-scroll">
                                    {kabSummary.length === 0 ? (
                                        <EmptyState label="Belum ada data kab/kota" />
                                    ) : (
                                        <ResponsiveContainer
                                            width="100%"
                                            height={Math.max(kabSummary.length * 36, 120)}
                                        >
                                            <BarChart
                                                data={kabSummary}
                                                layout="vertical"
                                                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                                            >
                                                <CartesianGrid horizontal={false} stroke="#94a3b8" strokeOpacity={0.15} />
                                                <XAxis
                                                    type="number"
                                                    tickFormatter={formatCompact}
                                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={130}
                                                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f1f5f9', fillOpacity: 0.5 }} />
                                                <Bar dataKey="price" radius={[0, 8, 8, 0]} fill="#38bdf8" barSize={16} />
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
                                <div className="mt-6 h-[360px] w-full">
                                    {regionTrend.length === 0 ? (
                                        <EmptyState label="Belum ada data tren" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={regionTrend}
                                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    tickFormatter={formatCompact}
                                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={44}
                                                />
                                                <Tooltip content={<RupiahTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                                                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Panel>
                        </div>
                    )}

                    {/* DETAILED TABLE (Glassmorphism Collapsible) */}
                    <div className="mt-8 rounded-3xl border border-white/60 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl transition-all">
                        <button
                            type="button"
                            onClick={() => setShowTable((s) => !s)}
                            className="flex w-full items-center justify-between p-6 text-left rounded-3xl transition-colors hover:bg-white/40"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Tabel Rincian</h2>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    {prices.length} baris data harga
                                </p>
                            </div>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm border border-white/60 transition-transform ${showTable ? 'rotate-180' : ''}`}>
                                <ChevronDown className="size-5 text-slate-600" />
                            </div>
                        </button>

                        {showTable && (
                            <div className="px-6 pb-6 pt-2">
                                <div className="relative mb-6 sm:w-80">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari wilayah atau kota..."
                                        className="w-full rounded-full border border-white/60 bg-white/50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-300/50"
                                    />
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/30">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-white/50 text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/60">
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
                                                        className="px-5 py-12 text-center text-sm font-medium text-slate-500"
                                                    >
                                                        Tidak ada data harga untuk pencarian ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredPrices.map((row, i) => (
                                                    <tr
                                                        key={`${row.regency}-${row.price_date}-${i}`}
                                                        className="border-b border-white/30 transition-colors hover:bg-white/60 last:border-b-0"
                                                    >
                                                        <td className="px-5 py-4 font-semibold text-slate-800">
                                                            {row.regency || row.province}
                                                        </td>
                                                        <td className="px-5 py-4 font-bold text-slate-900">
                                                            {formatRupiah(row.price)}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`font-bold ${
                                                                    row.price_change_pct == null
                                                                        ? 'text-slate-400'
                                                                        : row.price_change_pct >= 0
                                                                          ? 'text-emerald-500'
                                                                          : 'text-rose-500'
                                                                }`}
                                                            >
                                                                {formatChange(row.price_change_pct)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 font-medium text-slate-500">
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
            </div>
            
            {/* Custom scrollbar gaya elegan membaur dengan tema */}
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </>
    );
}

// ================= KOMPONEN UI TAMBAHAN =================

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl flex flex-col ${className}`}
        >
            {children}
        </div>
    );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-2">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>}
        </div>
    );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col justify-center rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex h-full min-h-[120px] items-center justify-center text-sm font-medium text-slate-500 bg-white/30 rounded-2xl border border-dashed border-white/60">
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
        <div className="rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
            {title && <p className="font-bold text-slate-700 mb-0.5 text-xs">{title}</p>}
            <p className="text-base font-black text-amber-500">{formatRupiah(point.value)}</p>
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
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-semibold text-slate-600">
            {labels.map((l, i) => (
                <span key={l} className="flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-full border border-white/60">
                    <span
                        className="inline-block size-3 rounded-full border border-white/50 shadow-sm"
                        style={{ background: PRICE_COLORS[i] ?? PRICE_COLORS[0] }}
                    />
                    {l}
                </span>
            ))}
        </div>
    );
}