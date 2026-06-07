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
            {/* INTERMUKA DESKTOP (MD-UP) - DILENGKAPI FONT OUTFIT                       */}
            {/* ========================================================================= */}
            <div 
                style={{ fontFamily: "'Outfit', sans-serif" }}
                className={`
                hidden md:grid pointer-events-none absolute top-5 right-6 left-6 z-[1000]
                grid-cols-[1fr_auto_1fr] items-center transition-all duration-500 ease-in-out
                ${sidebarOpen ? 'md:left-[400px]' : 'md:left-6'}
            `}>
                
                {/* KOLOM KIRI: Tombol Layer */}
                <div className="pointer-events-auto justify-self-start relative">
                    <button
                        type="button"
                        onClick={() => { setLayerMenuOpen((v) => !v); setMenuOpen(false); }}
                        className={`glass-panel flex h-[52px] items-center justify-center gap-2 rounded-full px-5 text-gray-700 transition-all hover:text-gray-900 shadow-sm ${layerMenuOpen ? 'ring-2 ring-white/60' : ''}`}
                    >
                        {/* Ikon Solid Layer Peta */}
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.02L2 7.21l10 5.19 10-5.19-10-5.19zM2 11.99l10 5.19 10-5.19-1.39-.72-8.61 4.47-8.61-4.47L2 11.99zm0 4.79l10 5.19 10-5.19-1.39-.72-8.61 4.47-8.61-4.47L2 16.78z"/>
                        </svg>
                        <span className="text-sm font-bold">{activeLayerLabel}</span>
                    </button>

                    {layerMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-[1000]" onClick={() => setLayerMenuOpen(false)} />
                            <div className="glass-panel absolute left-0 z-[1001] mt-2 w-48 overflow-hidden rounded-xl py-1 shadow-xl">
                                <div className="px-4 pt-2 pb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">Tampilan Peta</div>
                                {LAYERS.map((layer) => (
                                    <button
                                        key={layer.key}
                                        type="button"
                                        onClick={() => { onLayerChange(layer.key); setLayerMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/50 ${activeLayer === layer.key ? 'font-bold text-blue-700' : 'font-medium text-gray-700'}`}
                                    >
                                        {layer.label}
                                        {activeLayer === layer.key && (
                                            /* Ikon Solid Ceklis */
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* KOLOM TENGAH: Search Bar */}
                <form onSubmit={handleSubmit} className="pointer-events-auto relative w-[400px] justify-self-center">
                    
                    {/* ICON KACA PEMBESAR DI UJUNG KIRI (SOLID) */}
                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                        {isSearching ? (
                            <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                        )}
                    </span>
                    
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { setFocused(true); setMenuOpen(false); setLayerMenuOpen(false); }}
                        onBlur={() => setTimeout(() => setFocused(false), 150)}
                        placeholder="Cari wilayah atau ikan"
                        // pl-11 memberi ruang untuk ikon kiri
                        className="glass-panel w-full h-[52px] rounded-full pl-11 pr-10 text-base font-medium text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-white/60 focus:outline-none shadow-sm"
                    />
                    
                    {query.length > 0 && (
                        <button type="button" onClick={resetSearch} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors z-10">
                            {/* Ikon Solid Silang (X) */}
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    )}

                    {showDropdown && (
                        <div className="glass-panel absolute top-full left-0 right-0 z-[1001] mt-2 overflow-hidden rounded-2xl py-1 shadow-xl">
                            {matchedFish.map((fish) => (
                                <button key={fish.key} type="button" onMouseDown={(e) => { e.preventDefault(); pickFish(fish); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/60 p-1 shadow-sm">
                                            <img src={fish.image_path ? `/${fish.image_path}` : '/fish/default.png'} alt={fish.nama_lokal} className="max-h-full max-w-full object-contain" />
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block truncate text-sm font-bold text-gray-800">
                                                {fish.nama_lokal} {fish.nama_lain && <span className="font-medium text-gray-500"> / {fish.nama_lain}</span>}
                                            </span>
                                            {fish.nama_ilmiah && <span className="block truncate text-xs text-slate-500 italic font-medium">{fish.nama_ilmiah}</span>}
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
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); searchRegion(query.trim()); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/50 transition-colors">
                                {/* Ikon Solid Info/Search */}
                                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                </svg>
                                <span className="text-sm font-semibold text-gray-800">Cari peta untuk &ldquo;{query.trim()}&rdquo;</span>
                            </button>
                        </div>
                    )}
                </form>

                {/* KOLOM KANAN: Cek Harga + Akun */}
                <div className="pointer-events-auto justify-self-end flex items-center gap-3">
                    <Link href={pricesView.url()} className="glass-panel flex h-[52px] items-center justify-center rounded-full px-5 text-sm font-bold text-gray-900 shadow-sm transition-colors hover:bg-white/40">
                        Cek Harga
                    </Link>
                    <div className="relative">
                        <button type="button" onClick={() => { setMenuOpen((v) => !v); setLayerMenuOpen(false); }} className="glass-panel flex h-[52px] w-[52px] items-center justify-center rounded-full text-gray-700 shadow-sm transition-all hover:text-gray-900">
                            {/* Ikon Solid Akun */}
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-[1000]" onClick={() => setMenuOpen(false)} />
                                <div className="glass-panel absolute right-0 z-[1001] mt-2 w-48 overflow-hidden rounded-xl py-1 shadow-xl">
                                    <Link href="/settings/profile" className="block px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-white/50">Pengaturan Profil</Link>
                                    <button type="button" onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-white/50">Keluar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* INTERMUKA MOBILE (SMARTPHONE) - DILENGKAPI FONT OUTFIT                    */}
            {/* ========================================================================= */}
            <div 
                style={{ fontFamily: "'Outfit', sans-serif" }}
                className={`
                block md:hidden pointer-events-none absolute top-4 left-4 right-4 z-[1000]
                flex flex-col gap-3 transition-all duration-500 ease-in-out
                ${sidebarOpen ? '-translate-y-28 opacity-0' : 'translate-y-0 opacity-100'}
            `}>
                
                {/* BARIS 1: Search Bar Luas + Tombol Akun */}
                <div className="flex w-full items-center gap-2">
                    <form onSubmit={handleSubmit} className="pointer-events-auto relative flex-grow">
                        
                        {/* ICON KACA PEMBESAR DI UJUNG KIRI (SOLID) */}
                        <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                        </span>
                        
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => { setFocused(true); setMenuOpen(false); setLayerMenuOpen(false); }}
                            onBlur={() => setTimeout(() => setFocused(false), 150)}
                            placeholder="Cari wilayah atau ikan"
                            className="glass-panel w-full h-[48px] rounded-full pl-10 pr-10 text-[13px] font-medium text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-white/60 focus:outline-none shadow-sm"
                        />
                        
                        {query.length > 0 && (
                            <button type="button" onClick={resetSearch} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-700 z-10">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        )}

                        {showDropdown && (
                            <div className="glass-panel absolute top-full left-0 right-0 z-[1001] mt-2 overflow-hidden rounded-2xl py-1 shadow-xl">
                                {matchedFish.map((fish) => (
                                    <button key={fish.key} type="button" onMouseDown={(e) => { e.preventDefault(); pickFish(fish); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/60 p-1 shadow-sm">
                                                <img src={fish.image_path ? `/${fish.image_path}` : '/fish/default.png'} alt={fish.nama_lokal} className="max-h-full max-w-full object-contain" />
                                            </span>
                                            <div className="min-w-0">
                                                <span className="block truncate text-xs font-bold text-gray-800">{fish.nama_lokal}</span>
                                                {fish.nama_ilmiah && <span className="block truncate text-[10px] text-slate-500 italic font-medium">{fish.nama_ilmiah}</span>}
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
                                
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); searchRegion(query.trim()); }} className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/50 transition-colors">
                                    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                    </svg>
                                    <span className="text-xs font-semibold text-gray-800">Cari peta &ldquo;{query.trim()}&rdquo;</span>
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="pointer-events-auto relative shrink-0">
                        <button type="button" onClick={() => { setMenuOpen((v) => !v); setLayerMenuOpen(false); }} className="glass-panel flex h-[48px] w-[48px] items-center justify-center rounded-full text-gray-700 shadow-sm transition-colors hover:text-gray-900">
                            {/* Ikon Solid Akun */}
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </button>
                        {menuOpen && (
                            <div className="glass-panel absolute right-0 z-[1001] mt-2 w-40 overflow-hidden rounded-xl py-1 shadow-xl">
                                <button type="button" onClick={handleLogout} className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-white/50 transition-colors">Keluar</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* BARIS 2: Tombol Layer Kiri + Cek Harga Kanan */}
                <div className="flex w-full items-center justify-between">
                    <div className="pointer-events-auto relative">
                        <button type="button" onClick={() => { setLayerMenuOpen((v) => !v); setMenuOpen(false); }} className="glass-panel flex h-[44px] items-center gap-1.5 rounded-full px-4 text-gray-700 shadow-sm text-xs font-bold transition-colors hover:text-gray-900">
                            {/* Ikon Solid Layer Peta */}
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.02L2 7.21l10 5.19 10-5.19-10-5.19zM2 11.99l10 5.19 10-5.19-1.39-.72-8.61 4.47-8.61-4.47L2 11.99zm0 4.79l10 5.19 10-5.19-1.39-.72-8.61 4.47-8.61-4.47L2 16.78z"/>
                            </svg>
                            {activeLayerLabel}
                        </button>
                        {layerMenuOpen && (
                            <div className="glass-panel absolute left-0 z-[1001] mt-1 w-40 overflow-hidden rounded-xl py-1 shadow-xl">
                                {LAYERS.map((layer) => (
                                    <button 
                                        key={layer.key} 
                                        type="button" 
                                        onClick={() => { onLayerChange(layer.key); setLayerMenuOpen(false); }} 
                                        className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-white/50 ${activeLayer === layer.key ? 'font-bold text-blue-700' : 'font-medium text-gray-800'}`}
                                    >
                                        {layer.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href={pricesView.url()} className="pointer-events-auto glass-panel flex h-[44px] items-center rounded-full px-4 text-xs font-bold text-gray-900 shadow-sm transition-colors hover:bg-white/50">
                        Cek Harga
                    </Link>
                </div>
            </div>
        </>
    );
}