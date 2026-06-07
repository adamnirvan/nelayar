import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useMemo, useRef, useState, useEffect } from 'react';
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
    const [layerMenuOpen, setLayerMenuOpen] = useState<boolean>(false);
    const [focused, setFocused] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const matchedFish = useMemo(
        () => filterFishSuggestions(fishSuggestions, query),
        [fishSuggestions, query],
    );

    const showDropdown = focused && query.trim().length > 0;
    const [prevClearSignal, setPrevClearSignal] = useState<number>(clearSignal);

    if (clearSignal !== prevClearSignal) {
        setPrevClearSignal(clearSignal);
        setQuery('');
        setFocused(false);
    }

    // CCTV Pengawas untuk menutup dropdown ketika sidebar ZPPI terbuka
    useEffect(() => {
        if (sidebarOpen) {
            setMenuOpen(false);
            setLayerMenuOpen(false);
            setFocused(false);
            inputRef.current?.blur();
        }
    }, [sidebarOpen]);

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
        if (!trimmed) return;

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

    const activeLayerLabel = LAYERS.find(l => l.key === activeLayer)?.label;

    return (
        <>
            {/* ========================================================================= */}
            {/* INTERMUKA DESKTOP (MD-UP): Menggunakan Arsitektur Grid 3-Kolom Mutlak */}
            {/* ========================================================================= */}
            <div className={`
                hidden md:grid pointer-events-none absolute top-5 right-6 left-6 z-[1000]
                grid-cols-[1fr_auto_1fr] items-center transition-all duration-500 ease-in-out
                /* Jika sidebar kiri terbuka, geser batas kiri sejauh 400px secara proporsional */
                ${sidebarOpen ? 'md:left-[400px]' : 'md:left-6'}
            `}>
                
                {/* KOLOM KIRI DESKTOP: Tombol Layer */}
                <div className="pointer-events-auto justify-self-start relative">
                    <button
                        type="button"
                        onClick={() => { setLayerMenuOpen((v) => !v); setMenuOpen(false); }}
                        className={`glass-panel flex h-[52px] items-center justify-center gap-2 rounded-full px-5 text-gray-700 transition-all hover:text-gray-900 shadow-sm ${layerMenuOpen ? 'ring-2 ring-white/60' : ''}`}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 12 12 17 22 12" />
                            <polyline points="2 17 12 22 22 17" />
                        </svg>
                        <span className="text-sm font-semibold">{activeLayerLabel}</span>
                    </button>

                    {layerMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-[1000]" onClick={() => setLayerMenuOpen(false)} />
                            <div className="glass-panel absolute left-0 z-[1001] mt-2 w-48 overflow-hidden rounded-xl py-1 shadow-xl">
                                <div className="px-4 pt-2 pb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Tampilan Peta</div>
                                {LAYERS.map((layer) => (
                                    <button
                                        key={layer.key}
                                        type="button"
                                        onClick={() => { onLayerChange(layer.key); setLayerMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/30 ${activeLayer === layer.key ? 'font-bold text-blue-700' : 'text-gray-800'}`}
                                    >
                                        {layer.label}
                                        {activeLayer === layer.key && (
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* KOLOM TENGAH DESKTOP: Search Bar (Terkunci Lebar & Posisi Ditengah) */}
                <form onSubmit={handleSubmit} className="pointer-events-auto relative w-[400px] justify-self-center">
                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                        {isSearching ? (
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        )}
                    </span>
                    <input
                        ref={inputRef}
                        id="map-search-desktop"
                        name="map_search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { setFocused(true); setMenuOpen(false); setLayerMenuOpen(false); }}
                        onBlur={() => setTimeout(() => setFocused(false), 150)}
                        aria-label="Cari wilayah atau ikan"
                        placeholder="Cari wilayah atau ikan"
                        className="glass-panel w-full h-[52px] rounded-full pl-11 pr-10 text-base text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-white/60 focus:outline-none shadow-sm"
                    />
                    {query.length > 0 && (
                        <button type="button" onClick={resetSearch} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                    )}

                    {showDropdown && (
                        <div className="glass-panel absolute top-full left-0 right-0 z-[1001] mt-2 overflow-hidden rounded-2xl py-1 shadow-xl">
                            {matchedFish.map((fish) => (
                                <button key={fish.key} type="button" onMouseDown={(e) => { e.preventDefault(); pickFish(fish); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/30">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/40 p-1">
                                            <img src={fish.image_path ? `/${fish.image_path}` : '/fish/default.png'} alt={fish.nama_lokal} className="max-h-full max-w-full object-contain" />
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-gray-800">
                                                {fish.nama_lokal} {fish.nama_lain && <span className="font-normal text-gray-500"> / {fish.nama_lain}</span>}
                                            </span>
                                            {fish.nama_ilmiah && <span className="block truncate text-xs text-slate-500 italic">{fish.nama_ilmiah}</span>}
                                        </div>
                                    </div>
                                    {fish.zoneCount !== undefined && (
                                        <span className="text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-full shrink-0 border border-blue-100">
                                            {fish.zoneCount} Zona
                                        </span>
                                    )}
                                </button>
                            ))}
                            <div className="my-1 border-t border-white/30" />
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); searchRegion(query.trim()); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/30">
                                <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                <span className="text-sm text-gray-800">Cari wilayah &ldquo;{query.trim()}&rdquo;</span>
                            </button>
                        </div>
                    )}
                </form>

                {/* KOLOM KANAN DESKTOP: Cek Harga + Akun */}
                <div className="pointer-events-auto justify-self-end flex items-center gap-3">
                    <Link href={pricesView.url()} className="glass-panel flex h-[52px] items-center justify-center rounded-full px-5 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-white/40">
                        Cek Harga
                    </Link>
                    <div className="relative">
                        <button type="button" onClick={() => { setMenuOpen((v) => !v); setLayerMenuOpen(false); }} className="glass-panel flex h-[52px] w-[52px] items-center justify-center rounded-full text-gray-700 shadow-sm transition-all hover:text-gray-900">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-[1000]" onClick={() => setMenuOpen(false)} />
                                <div className="glass-panel absolute right-0 z-[1001] mt-2 w-48 overflow-hidden rounded-xl py-1 shadow-xl">
                                    <Link href="/settings/profile" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-white/30">Pengaturan Profil</Link>
                                    <button type="button" onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-white/30">Keluar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* INTERMUKA MOBILE (SMARTPHONE): Menggunakan Struktur Mandiri 2-Baris Flex */}
            {/* ========================================================================= */}
            <div className={`
                block md:hidden pointer-events-none absolute top-4 left-4 right-4 z-[1000]
                flex flex-col gap-3 transition-all duration-500 ease-in-out
                /* Skenario Khusus Mobile: Jika detail sheet terbuka, sembunyikan seluruh header ke langit-langit */
                ${sidebarOpen ? '-translate-y-28 opacity-0' : 'translate-y-0 opacity-100'}
            `}>
                
                {/* BARIS MOBILE 1: Search Bar Luas + Tombol Akun */}
                <div className="flex w-full items-center gap-2">
                    <form onSubmit={handleSubmit} className="pointer-events-auto relative flex-grow">
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                            {/* PERBAIKAN: Penambahan strokeLinecap="round" strokeLinejoin="round" pada Kaca Pembesar Mobile */}
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </span>
                        <input
                            id="map-search-mobile"
                            name="map_search"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => { setFocused(true); setMenuOpen(false); setLayerMenuOpen(false); }}
                            onBlur={() => setTimeout(() => setFocused(false), 150)}
                            aria-label="Cari wilayah atau ikan"
                            placeholder="Cari wilayah atau ikan"
                            className="glass-panel w-full h-[48px] rounded-full pl-11 pr-10 text-[13px] text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-white/60 focus:outline-none shadow-sm"
                        />
                        {query.length > 0 && (
                            <button type="button" onClick={resetSearch} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        )}

                        {showDropdown && (
                            <div className="glass-panel absolute top-full left-0 right-0 z-[1001] mt-2 overflow-hidden rounded-2xl py-1 shadow-xl">
                                {matchedFish.map((fish) => (
                                    <button key={fish.key} type="button" onMouseDown={(e) => { e.preventDefault(); pickFish(fish); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/30">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/40 p-1">
                                                <img src={fish.image_path ? `/${fish.image_path}` : '/fish/default.png'} alt={fish.nama_lokal} className="max-h-full max-w-full object-contain" />
                                            </span>
                                            <div className="min-w-0">
                                                <span className="block truncate text-xs font-semibold text-gray-800">{fish.nama_lokal}</span>
                                                {fish.nama_ilmiah && <span className="block truncate text-[10px] text-slate-500 italic">{fish.nama_ilmiah}</span>}
                                            </div>
                                        </div>
                                        {fish.zoneCount !== undefined && (
                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full shrink-0 border border-blue-100">
                                                {fish.zoneCount} Zona
                                            </span>
                                        )}
                                    </button>
                                ))}
                                
                                {matchedFish.length > 0 && <div className="my-1 border-t border-white/30" />}
                                
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); searchRegion(query.trim()); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/30">
                                    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    <span className="text-xs text-gray-800">Cari wilayah &ldquo;{query.trim()}&rdquo;</span>
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="pointer-events-auto relative shrink-0">
                        <button type="button" onClick={() => { setMenuOpen((v) => !v); setLayerMenuOpen(false); }} className="glass-panel flex h-[48px] w-[48px] items-center justify-center rounded-full text-gray-700 shadow-sm">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                        </button>
                        {menuOpen && (
                            <div className="glass-panel absolute right-0 z-[1001] mt-2 w-40 overflow-hidden rounded-xl py-1 shadow-xl">
                                <button type="button" onClick={handleLogout} className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-white/30">Keluar</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* BARIS MOBILE 2: Tombol Layer Kiri + Cek Harga Kanan */}
                <div className="flex w-full items-center justify-between">
                    <div className="pointer-events-auto relative">
                        <button type="button" onClick={() => { setLayerMenuOpen((v) => !v); setMenuOpen(false); }} className="glass-panel flex h-[44px] items-center gap-1.5 rounded-full px-4 text-gray-700 shadow-sm text-xs font-bold">
                            {/* PERBAIKAN: Penambahan strokeLinecap="round" strokeLinejoin="round" dan <polyline> pada Ikon Layer Mobile */}
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 12 12 17 22 12" />
                                <polyline points="2 17 12 22 22 17" />
                            </svg>
                            {activeLayerLabel}
                        </button>
                        {layerMenuOpen && (
                            <div className="glass-panel absolute left-0 z-[1001] mt-1 w-40 overflow-hidden rounded-xl py-1 shadow-xl">
                                {LAYERS.map((layer) => (
                                    <button key={layer.key} type="button" onClick={() => { onLayerChange(layer.key); setLayerMenuOpen(false); }} className="w-full px-4 py-2 text-left text-xs text-gray-800 hover:bg-white/30">{layer.label}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href={pricesView.url()} className="pointer-events-auto glass-panel flex h-[44px] items-center rounded-full px-4 text-xs font-bold text-gray-900 shadow-sm">
                        Cek Harga
                    </Link>
                </div>
            </div>
        </>
    );
}
