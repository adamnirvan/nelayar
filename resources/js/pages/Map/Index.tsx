import { router } from '@inertiajs/react';
import { format, addDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import type { FeatureCollection } from 'geojson';
import { useMemo, useState } from 'react';

import MapContainer from '@/components/Map/MapContainer';
import MapHeader from '@/components/Map/MapHeader';
import type { MapLayer } from '@/components/Map/MapHeader';
import NavigationBanner from '@/components/Map/NavigationBanner';
// GABUNGAN IMPORT: Mengambil NavigationProvider, useNavigation (milikmu) dan WeatherCard (milik temanmu)
import { NavigationProvider, useNavigation } from '@/components/Map/NavigationContext';
import ZppiOverlays from '@/components/Map/ZppiOverlays';
import type { SearchTarget } from '@/components/Map/ZppiOverlaysLeaflet';
import { buildFishIndex } from '@/lib/fishSearch';
import type { FishSuggestion } from '@/lib/fishSearch';

interface Props {
    selectedDate: string;
    zppiGeoJson: FeatureCollection | null;
    sstFileUrl: string | null;
    chlFileUrl: string | null;
}

// Komponen pembantu untuk membaca status Zen Mode tanpa memecah file Index
function ZenModeController({ children }: { children: (isZen: boolean) => React.ReactNode }) {
    const nav = useNavigation();
    const isZen = nav.status === 'planned' || nav.status === 'active';
    return <>{children(isZen)}</>;
}

export default function MapIndex({
    selectedDate,
    zppiGeoJson,
    sstFileUrl,
    chlFileUrl,
}: Props) {
    const [dayOffset, setDayOffset] = useState<number>(0);
    const [isChangingDate, setIsChangingDate] = useState<boolean>(false);

    const [activeLayer, setActiveLayer] = useState<MapLayer>('processed');
    const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const [fishFilter, setFishFilter] = useState<string | null>(null);
    const [clearSignal, setClearSignal] = useState<number>(0);

    const fishSuggestions = useMemo(
        () => buildFishIndex(zppiGeoJson),
        [zppiGeoJson],
    );

    const [zoneOpen, setZoneOpen] = useState<boolean>(false);

    const handleSelectFish = (fish: FishSuggestion) => {
        setSearchTarget(null);
        setFishFilter(fish.key);
    };

    const handleClearFish = () => setFishFilter(null);

    const handleSearch = async (query: string) => {
        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(query)}`,
            );
            const results = await res.json();

            if (Array.isArray(results) && results.length > 0) {
                setSearchTarget({
                    lat: parseFloat(results[0].lat),
                    lng: parseFloat(results[0].lon),
                    nonce: Date.now(),
                });
            }
        } catch {
            // Abaikan kegagalan jaringan
        } finally {
            setIsSearching(false);
        }
    };

    const formattedDisplayDate = format(
        parseISO(selectedDate),
        'EEEE, d MMMM',
        { locale: id },
    );

    // 1. Fungsi menggeser visual kapal (instan tanpa memanggil backend)
    const handleSliderDrag = (value: number) => {
        setDayOffset(value);
    };

    // 2. Fungsi memanggil backend (hanya saat mouse/layar sentuh dilepas)
    const commitSliderChange = () => {
        setIsChangingDate(true);
        setFishFilter(null);
        setClearSignal((n) => n + 1);

        const targetDateString = format(
            addDays(new Date(), dayOffset),
            'yyyy-MM-dd',
        );

        router.get(
            window.location.pathname,
            { date: targetDateString },
            {
                preserveState: true,
                preserveScroll: true,
                only: [
                    'selectedDate',
                    'zppiGeoJson',
                    'sstFileUrl',
                    'chlFileUrl',
                ],
                onFinish: () => setIsChangingDate(false),
            },
        );
    };

    return (
        <NavigationProvider>
            <div className="relative h-screen w-full overflow-hidden">
                {/* 1. Kanvas Utama Peta */}
                <MapContainer>
                    <ZppiOverlays
                        selectedDate={selectedDate}
                        zppiGeoJson={zppiGeoJson}
                        sstFileUrl={sstFileUrl}
                        chlFileUrl={chlFileUrl}
                        activeLayer={activeLayer}
                        searchTarget={searchTarget}
                        fishFilter={fishFilter}
                        onZoneOpenChange={setZoneOpen}
                    />
                </MapContainer>

                {/* 2. ZEN MODE KONTROL (Membungkus elemen UI yang bisa hilang) */}
                <ZenModeController>
                    {(isZen) => (
                        <>
                            {/* HEADER */}
                            <div className={`transition-all duration-700 ease-in-out z-[40] absolute top-0 w-full pointer-events-none ${isZen ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
                                <MapHeader
                                    activeLayer={activeLayer}
                                    onLayerChange={setActiveLayer}
                                    onSearch={handleSearch}
                                    fishSuggestions={fishSuggestions}
                                    onSelectFish={handleSelectFish}
                                    onClearFish={handleClearFish}
                                    activeFishKey={fishFilter}
                                    clearSignal={clearSignal}
                                    isSearching={isSearching}
                                    sidebarOpen={zoneOpen}
                                />
                            </div>

                           

                            {/* PANEL SLIDER KAPAL LAYAR BAWAH */}
                            <div 
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                                className={`
                                /* DIUBAH: w-[95%] agar di mobile lebih lega, max-w-[500px] agar di desktop lebih lebar dari sebelumnya (max-w-md) */
                                pointer-events-auto absolute left-1/2 z-[900] w-[95%] max-w-[500px] -translate-x-1/2 
                                transition-all duration-500 ease-in-out bottom-8
                                ${isZen 
                                    ? 'translate-y-20 opacity-0 pointer-events-none' 
                                    : zoneOpen 
                                        ? 'translate-y-8 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto' 
                                        : 'translate-y-0 opacity-100' 
                                }
                            `}>
                                <div className="glass-panel rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all border border-white/60 backdrop-blur-xl bg-white/70">
                                    
                                    {/* HEADER */}
                                    <div className="mb-3 flex items-center justify-between px-2">
                                        <div>
                                            <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">
                                                Navigasi Waktu Operasional
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[18px] leading-none font-black text-slate-800 tracking-tight">
                                                    {formattedDisplayDate}
                                                </h3>
                                                {isChangingDate && (
                                                    <span className="relative flex h-2 w-2 ml-1">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* TEKS RESPONSIF */}
                                        <div className="flex-shrink-0 text-right pr-1">
                                            <button 
                                                onClick={() => {
                                                    if (dayOffset !== 0) {
                                                        setDayOffset(0);
                                                        router.get(window.location.pathname, { date: format(new Date(), 'yyyy-MM-dd') }, { preserveState: true, preserveScroll: true, only: ['selectedDate', 'zppiGeoJson', 'sstFileUrl', 'chlFileUrl'] });
                                                    }
                                                }}
                                                disabled={dayOffset === 0}
                                                title={dayOffset !== 0 ? "Kembali ke Hari Ini" : ""}
                                                className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${
                                                    dayOffset === 0 
                                                        ? 'text-blue-600 cursor-default' 
                                                        : 'text-slate-400 hover:text-blue-600 cursor-pointer'
                                                }`}
                                            >
                                                {dayOffset === 0 ? 'Hari Ini' : `H+${dayOffset}`}
                                            </button>
                                        </div>
                                    </div>

                                    {/* AREA SLIDER KAPAL LAYAR CUSTOM */}
                                    {/* DIUBAH: Margin horizontal ditambah dari mx-4 menjadi mx-6 agar jarak dari dinding lebih jauh */}
                                    <div className="relative h-8 flex items-center mb-1 mt-4 mx-6">
                                        
                                        <div className="absolute w-full h-2 bg-slate-200/70 rounded-full pointer-events-none shadow-inner border border-black/5"></div>

                                        <div
                                            className="absolute h-2 bg-blue-500 rounded-full pointer-events-none transition-all duration-150 ease-out"
                                            style={{ width: `${(dayOffset / 9) * 100}%` }}
                                        ></div>

                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full shadow-[0_4px_10px_rgba(37,99,235,0.4)] border-[2.5px] border-white flex items-center justify-center pointer-events-none z-10 transition-transform"
                                            style={{ left: `${(dayOffset / 9) * 100}%` }}
                                        >
                                            <svg className="w-3.5 h-3.5 text-white ml-[1px]" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L4 14h8V2z" />
                                                <path d="M14 2v12h6L14 2z" />
                                                <path d="M3 16h18c1.1 0 1.6.8 1.1 1.7l-2.2 3.3C19.3 21.6 18.2 22 17 22H7c-1.2 0-2.3-.4-2.9-1L1.9 17.7C1.4 16.8 1.9 16 3 16z" />
                                            </svg>
                                        </div>

                                        <input
                                            type="range"
                                            min="0"
                                            max="9"
                                            step="1"
                                            value={dayOffset}
                                            onChange={(e) => handleSliderDrag(parseInt(e.target.value))}
                                            onMouseUp={commitSliderChange}
                                            onTouchEnd={commitSliderChange}
                                            className="absolute w-full h-full opacity-0 cursor-pointer z-20 m-0 touch-none left-0"
                                        />
                                    </div>

                                    {/* LABEL SKALA WAKTU */}
                                    {/* DIUBAH: Margin horizontal menyesuaikan slider di atasnya (mx-6) */}
                                    <div className="relative mt-2 h-4 mx-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                                        <span className="absolute top-0 left-[0%] -translate-x-1/2 whitespace-nowrap">Sekarang</span>
                                        <span className="absolute top-0 left-[33.33%] -translate-x-1/2 whitespace-nowrap">H+3</span>
                                        <span className="absolute top-0 left-[66.66%] -translate-x-1/2 whitespace-nowrap">H+6</span>
                                        <span className="absolute top-0 left-[100%] -translate-x-1/2 whitespace-nowrap">H+9 (Maks)</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </ZenModeController>

                {/* 3. Banner Navigasi (Milikmu & Temanmu sama-sama sepakat meletakkan ini di luar) */}
                <NavigationBanner />
            </div>
        </NavigationProvider>
    );
}