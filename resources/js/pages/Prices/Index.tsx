import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Facebook,
    Linkedin,
    RefreshCw,
    Search,
    Twitter,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';

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

interface Stats {
    avg: number;
    max: number;
    min: number;
    coverage: number;
    max_loc: string;
    min_loc: string;
    period: string;
    change: number;
}

interface Props {
    prices: PriceRow[];
    stats: Stats;
    commodities: string[];
    provinces: string[];
    filters: { commodity: string | null; province: string | null };
}

function formatRupiah(value: number): string {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function formatChange(pct: number): string {
    const sign = pct > 0 ? '+' : '';

    return `${sign}${pct.toFixed(1)}%`;
}

const ID_MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
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
    commodities,
    provinces,
    filters,
}: Props) {
    const [commodity, setCommodity] = useState(filters.commodity ?? '');
    const [province, setProvince] = useState(filters.province ?? '');
    const [search, setSearch] = useState('');

    function applyFilters(next: { commodity?: string; province?: string }) {
        router.visit('/prices', {
            data: {
                commodity: next.commodity ?? commodity,
                province: next.province ?? province,
            },
            preserveScroll: true,
            preserveState: true,
        });
    }

    function handleCommodityChange(value: string) {
        setCommodity(value);
        applyFilters({ commodity: value });
    }

    function handleProvinceChange(value: string) {
        setProvince(value);
        applyFilters({ province: value });
    }

    const filteredPrices = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) {
            return prices;
        }

        return prices.filter(
            (row) =>
                row.regency?.toLowerCase().includes(q) ||
                row.province?.toLowerCase().includes(q)
        );
    }, [prices, search]);

    const selectClass =
        'w-full appearance-none rounded-2xl border border-white/40 bg-white/15 px-5 py-3.5 text-sm font-medium text-white shadow-inner backdrop-blur-md outline-none transition focus:border-amber-200/60 focus:bg-white/25 [&>option]:text-slate-800';

    return (
        <>
            <Head title="Harga Pasar Ikan">
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
                    <h1 className="text-4xl font-black text-slate-900">Harga Pasar Ikan</h1>
                    <p className="mt-3 max-w-2xl text-sm font-medium text-slate-700">
                        Pantau fluktuasi harga pasar secara real-time untuk memaksimalkan nilai jual
                        hasil tangkapanmu.
                    </p>

                    {/* ---------- Filter bar ---------- */}
                    <div className="mt-8 rounded-3xl border border-white/25 bg-white/10 p-5 shadow-[0_12px_40px_rgba(8,58,82,0.2)] ring-1 ring-white/5 backdrop-blur-xl">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="relative flex-1">
                                <select
                                    aria-label="Pilih Komoditas"
                                    value={commodity}
                                    onChange={(e) => handleCommodityChange(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Pilih Komoditas</option>
                                    {commodities.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                <ChevronIcon />
                            </div>

                            <div className="relative flex-1">
                                <select
                                    aria-label="Pilih Provinsi"
                                    value={province}
                                    onChange={(e) => handleProvinceChange(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Pilih Provinsi</option>
                                    {provinces.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                                <ChevronIcon />
                            </div>

                            <button
                                type="button"
                                onClick={() => router.reload()}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-[#2EA3B5] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(46,163,181,0.35)] transition hover:-translate-y-0.5 hover:bg-[#33b5c8]"
                            >
                                <RefreshCw className="size-4" />
                                Perbarui Data
                            </button>
                        </div>
                    </div>

                    {/* ---------- Stat cards ---------- */}
                    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                        <StatCard label="Rata-Rata Harga">
                            <p className="text-3xl font-black text-slate-900">
                                {formatRupiah(stats.avg)}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                <span
                                    className={
                                        stats.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                                    }
                                >
                                    {stats.change >= 0 ? '↑' : '↓'} {formatChange(stats.change)}
                                </span>{' '}
                                vs bulan lalu ({stats.period})
                            </p>
                        </StatCard>

                        <StatCard label="Harga Tertinggi (IDR)">
                            <p className="text-3xl font-black text-red-600">
                                {formatRupiah(stats.max)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-600">
                                {stats.max_loc} · {stats.period}
                            </p>
                        </StatCard>

                        <StatCard label="Harga Terendah (IDR)">
                            <p className="text-3xl font-black text-emerald-600">
                                {formatRupiah(stats.min)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-600">
                                {stats.min_loc} · {stats.period}
                            </p>
                        </StatCard>
                    </div>

                    {/* ---------- Table panel ---------- */}
                    <div className="mt-6 rounded-3xl border border-white/25 bg-white/10 p-6 shadow-[0_12px_40px_rgba(8,58,82,0.2)] ring-1 ring-white/5 backdrop-blur-xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-2xl font-bold text-slate-900">Tabel Harga</h2>
                            <div className="relative sm:w-72">
                                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari wilayah atau kota..."
                                    className="w-full rounded-full border border-white/40 bg-white/70 py-2.5 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:bg-white/90"
                                />
                            </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-white/20">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-white/25 text-xs font-bold uppercase tracking-wide text-slate-700">
                                        <th className="px-5 py-4 text-left">Kabupaten/Kota</th>
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
                                                className="border-t border-white/15 odd:bg-white/10 even:bg-white/5 transition hover:bg-white/25"
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
                                                            row.price_change_pct >= 0
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

function ChevronIcon() {
    return (
        <svg
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
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
