import { useState, type FormEvent } from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { clearToken } from '@/lib/auth';
import { view as pricesView } from '@/routes/prices';

export type MapLayer = 'processed' | 'sst' | 'chl';

interface Props {
    activeLayer: MapLayer;
    onLayerChange: (layer: MapLayer) => void;
    onSearch: (query: string) => void;
    isSearching?: boolean;
    sidebarOpen?: boolean;
}

const LAYERS: { key: MapLayer; label: string }[] = [
    { key: 'processed', label: 'Processed' },
    { key: 'sst', label: 'SST' },
    { key: 'chl', label: 'Chl' },
];

export default function MapHeader({ activeLayer, onLayerChange, onSearch, isSearching = false, sidebarOpen = false }: Props) {
    const [query, setQuery] = useState<string>('');
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) onSearch(trimmed);
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
        <div className="absolute top-4 left-4 right-4 z-[1000] flex items-start justify-between gap-4 pointer-events-none">
            {/* ============== KIRI: Logo + Pemilih Layer ============== */}
            {/* Disembunyikan saat sidebar detail zona terbuka agar tidak menutupinya */}
            <div className={`glass-panel bg-gray-500 rounded-2xl flex flex-col transition-opacity ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
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
                            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
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

            {/* ============== TENGAH: Pencarian Wilayah ============== */}
            <form
                onSubmit={handleSubmit}
                className="pointer-events-auto flex-1 max-w-xl hidden md:block"
            >
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {isSearching ? (
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        )}
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari wilayah"
                        className="glass-panel w-full rounded-full pl-12 pr-5 py-3.5 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60"
                    />
                </div>
            </form>

            {/* ============== KANAN: Cek Harga + Profil ============== */}
            <div className="pointer-events-auto flex items-center gap-3">
                <Link
                    href={pricesView.url()}
                    className="glass-panel text-gray-900 text-sm font-semibold px-5 py-3 rounded-full transition-colors hover:bg-white/30 whitespace-nowrap"
                >
                    Cek Harga Ikan
                </Link>

                {/* Avatar + menu sederhana */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-gray-700 hover:text-gray-900 transition-colors"
                        title="Akun"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <>
                            {/* Penutup klik-di-luar */}
                            <div className="fixed inset-0 z-[1000]" onClick={() => setMenuOpen(false)} />
                            <div className="glass-panel absolute right-0 mt-2 w-48 z-[1001] rounded-xl overflow-hidden py-1">
                                <Link
                                    href="/settings/profile"
                                    className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-white/30"
                                >
                                    Pengaturan Profil
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-white/30"
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
