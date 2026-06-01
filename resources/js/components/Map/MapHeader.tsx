import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { clearToken } from '@/lib/auth';
import { filterFishSuggestions } from '@/lib/fishSearch';
import type { FishSuggestion } from '@/lib/fishSearch';
import { view as pricesView } from '@/routes/prices';

export type MapLayer = 'processed' | 'sst' | 'chl';

interface Props {
    activeLayer: MapLayer;
    onLayerChange: (layer: MapLayer) => void;
    onSearch: (query: string) => void;
    fishSuggestions: FishSuggestion[];
    onSelectFish: (fish: FishSuggestion) => void;
    onClearFish: () => void;
    activeFishKey?: string | null;
    clearSignal?: number;
    isSearching?: boolean;
    sidebarOpen?: boolean;
}

const LAYERS: { key: MapLayer; label: string }[] = [
    { key: 'processed', label: 'Processed' },
    { key: 'sst', label: 'SST' },
    { key: 'chl', label: 'Chl' },
];

export default function MapHeader({
    activeLayer,
    onLayerChange,
    onSearch,
    fishSuggestions,
    onSelectFish,
    onClearFish,
    activeFishKey = null,
    clearSignal = 0,
    isSearching = false,
    sidebarOpen = false,
}: Props) {
    const [query, setQuery] = useState<string>('');
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [focused, setFocused] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Saran spesies yang cocok dengan kata kunci saat ini.
    const matchedFish = useMemo(
        () => filterFishSuggestions(fishSuggestions, query),
        [fishSuggestions, query],
    );

    // Dropdown muncul saat input fokus dan ada kata kunci yang diketik.
    const showDropdown = focused && query.trim().length > 0;

    // Parent (mis. saat tanggal berganti) meminta reset kolom pencarian.
    // Disesuaikan saat render mengikuti perubahan prop (tanpa effect).
    const [prevClearSignal, setPrevClearSignal] = useState<number>(clearSignal);

    if (clearSignal !== prevClearSignal) {
        setPrevClearSignal(clearSignal);
        setQuery('');
        setFocused(false);
    }

    const resetSearch = () => {
        setQuery('');
        setFocused(false);
        onClearFish();
    };

    const pickFish = (fish: FishSuggestion) => {
        setQuery(fish.nama_lokal);
        setFocused(false);
        inputRef.current?.blur();
        onSelectFish(fish);
    };

    const searchRegion = (q: string) => {
        setFocused(false);
        inputRef.current?.blur();
        onClearFish();
        onSearch(q);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();

        if (!trimmed) {
            return;
        }

        // Enter memilih spesies teratas bila ada, jika tidak cari wilayah.
        if (matchedFish.length > 0) {
            pickFish(matchedFish[0]);
        } else {
            searchRegion(trimmed);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            clearToken();
            router.flushAll();
            router.visit('/login');
        }
    };

    return (
        <div className="pointer-events-none absolute top-4 right-4 left-4 z-[1000] flex items-start justify-between gap-4">
            {/* ============== KIRI: Logo + Pemilih Layer ============== */}
            {/* Disembunyikan saat sidebar detail zona terbuka agar tidak menutupinya */}
            <div
                className={`glass-panel flex flex-col rounded-2xl bg-gray-500 transition-opacity ${sidebarOpen ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'}`}
            >
                <div className="px-5 py-5">
                    <img
                        src="/icon-blue.svg"
                        alt="Nelayar"
                        className="h-7 w-auto"
                    />
                </div>

                {/* Toggle layer peta: Processed / SST / Chl */}
                <div className="glass-panel inline-flex self-start rounded-xl p-1">
                    {LAYERS.map((layer) => (
                        <button
                            key={layer.key}
                            type="button"
                            onClick={() => onLayerChange(layer.key)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                                activeLayer === layer.key
                                    ? 'glass-inset text-gray-900 shadow-sm'
                                    : 'text-gray-700 hover:bg-white/20'
                            }`}
                        >
                            {layer.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ============== TENGAH: Pencarian Wilayah / Ikan ============== */}
            <form
                onSubmit={handleSubmit}
                className="pointer-events-auto hidden max-w-xl flex-1 md:block"
            >
                <div className="relative">
                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                        {isSearching ? (
                            <svg
                                className="h-5 w-5 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        )}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setFocused(true)}
                        // Tunda agar klik item dropdown sempat diproses sebelum menutup.
                        onBlur={() => setTimeout(() => setFocused(false), 150)}
                        placeholder="Cari wilayah atau ikan"
                        className="glass-panel w-full rounded-full py-3.5 pr-11 pl-12 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-white/60 focus:outline-none"
                    />

                    {/* Tombol bersihkan: kosongkan kata kunci & hapus filter ikan aktif */}
                    {(query.length > 0 || activeFishKey) && (
                        <button
                            type="button"
                            onClick={resetSearch}
                            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            title="Bersihkan pencarian"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    {/* ---------- Dropdown saran ---------- */}
                    {showDropdown && (
                        <div className="glass-panel absolute top-full right-0 left-0 z-[1001] mt-2 overflow-hidden rounded-2xl py-1">
                            {matchedFish.length > 0 && (
                                <div className="px-4 pt-2 pb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                    Ikan Potensial
                                </div>
                            )}

                            {matchedFish.map((fish) => {
                                const imgPath = fish.image_path
                                    ? `/${fish.image_path}`
                                    : '/fish/default.png';

                                return (
                                    <button
                                        key={fish.key}
                                        type="button"
                                        // onMouseDown agar input tidak blur sebelum aksi berjalan.
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            pickFish(fish);
                                        }}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/30"
                                    >
                                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/40 p-0.5">
                                            <img
                                                src={imgPath}
                                                alt={fish.nama_lokal}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </span>
                                        <span className="min-w-0 flex-grow">
                                            <span className="block truncate text-sm font-semibold text-gray-800">
                                                {fish.nama_lokal}
                                                {fish.nama_lain && (
                                                    <span className="font-normal text-gray-500">
                                                        {' '}
                                                        / {fish.nama_lain}
                                                    </span>
                                                )}
                                            </span>
                                            {fish.nama_ilmiah && (
                                                <span className="block truncate text-xs text-slate-600 italic">
                                                    {fish.nama_ilmiah}
                                                </span>
                                            )}
                                        </span>
                                        <span className="glass-inset flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-gray-900">
                                            {fish.zoneCount} zona
                                        </span>
                                    </button>
                                );
                            })}

                            {/* Pemisah + opsi cari wilayah (fallback Nominatim) */}
                            {matchedFish.length > 0 && (
                                <div className="my-1 border-t border-white/30" />
                            )}
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    searchRegion(query.trim());
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/30"
                            >
                                <svg
                                    className="h-5 w-5 flex-shrink-0 text-gray-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span className="text-sm text-gray-800">
                                    Cari wilayah{' '}
                                    <span className="font-semibold">
                                        &ldquo;{query.trim()}&rdquo;
                                    </span>
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </form>

            {/* ============== KANAN: Cek Harga + Profil ============== */}
            <div className="pointer-events-auto flex items-center gap-3">
                <Link
                    href={pricesView.url()}
                    className="glass-panel rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap text-gray-900 transition-colors hover:bg-white/30"
                >
                    Cek Harga Ikan
                </Link>

                {/* Avatar + menu sederhana */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-gray-700 transition-colors hover:text-gray-900"
                        title="Akun"
                    >
                        <svg
                            className="h-6 w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <>
                            {/* Penutup klik-di-luar */}
                            <div
                                className="fixed inset-0 z-[1000]"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="glass-panel absolute right-0 z-[1001] mt-2 w-48 overflow-hidden rounded-xl py-1">
                                <Link
                                    href="/settings/profile"
                                    className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-white/30"
                                >
                                    Pengaturan Profil
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-white/30"
                                >
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
