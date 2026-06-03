import { router } from '@inertiajs/react';
import { format, addDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import type { FeatureCollection } from 'geojson';
import { useMemo, useState } from 'react';

import MapContainer from '@/components/Map/MapContainer';
import MapHeader from '@/components/Map/MapHeader';
import type { MapLayer } from '@/components/Map/MapHeader';
import NavigationBanner from '@/components/Map/NavigationBanner';
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
    // Menghitung offset hari saat ini berdasarkan selectedDate yang dikirim backend
    const [dayOffset, setDayOffset] = useState<number>(0);
    const [isChangingDate, setIsChangingDate] = useState<boolean>(false);

    // State header: layer aktif + target pencarian wilayah
    const [activeLayer, setActiveLayer] = useState<MapLayer>('processed');
    const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // Filter pencarian ikan: key spesies aktif (null = tampilkan semua zona).
    // `clearSignal` dipakai untuk mereset kolom pencarian di header saat tanggal berganti.
    const [fishFilter, setFishFilter] = useState<string | null>(null);
    const [clearSignal, setClearSignal] = useState<number>(0);

    // Indeks spesies unik dari seluruh zona pada tanggal aktif (sumber saran pencarian).
    const fishSuggestions = useMemo(
        () => buildFishIndex(zppiGeoJson),
        [zppiGeoJson],
    );

    // Sidebar detail zona sedang terbuka? (untuk menyembunyikan elemen header yang menutupinya)
    const [zoneOpen, setZoneOpen] = useState<boolean>(false);

    // Memilih spesies dari dropdown: aktifkan filter marker, batalkan fly wilayah.
    const handleSelectFish = (fish: FishSuggestion) => {
        setSearchTarget(null);
        setFishFilter(fish.key);
    };

    const handleClearFish = () => setFishFilter(null);

    // Pencarian wilayah via Nominatim (OpenStreetMap), dibatasi ke Indonesia
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
            // Abaikan kegagalan jaringan; biarkan peta tetap di posisi semula
        } finally {
            setIsSearching(false);
        }
    };

    // Format tampilan tanggal yang elegan untuk UI (Contoh: Sabtu, 30 Mei)
    const formattedDisplayDate = format(
        parseISO(selectedDate),
        'EEEE, d MMMM',
        { locale: id },
    );

    // Efek penangan perubahan slider untuk melakukan rotasi data via Inertia Partial Reload
    const handleSliderChange = (value: number) => {
        setDayOffset(value);
        setIsChangingDate(true);

        // Data zona berganti → reset filter ikan & kolom pencarian agar tak menyaring data lama.
        setFishFilter(null);
        setClearSignal((n) => n + 1);

        const targetDateString = format(
            addDays(new Date(), value),
            'yyyy-MM-dd',
        );

        // Menembak kembali ke MapController@index dengan muatan parameter date dinamis
        router.get(
            window.location.pathname,
            { date: targetDateString },
            {
                preserveState: true, // Jaga agar peta tidak ke-reset ke posisi awal
                preserveScroll: true,
                only: [
                    'selectedDate',
                    'zppiGeoJson',
                    'sstFileUrl',
                    'chlFileUrl',
                ], // Ambil data yang perlu saja
                onFinish: () => setIsChangingDate(false),
            },
        );
    };

return (
        <NavigationProvider>
            <div className="relative h-screen w-full overflow-hidden">
                {/* 1. Kanvas Utama Peta (Tetap menyala di belakang) */}
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

                {/* 2. ZEN MODE KONTROL (Membungkus elemen yang bisa hilang) */}
                <ZenModeController>
                    {(isZen) => (
                        <>
                            {/* HEADER: Ditambahkan pointer-events-none agar tidak memblokir klik pada elemen di bawahnya */}
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

                            {/* SLIDER WAKTU: Dilengkapi "Spatial Awareness" */}
                            <div className={`
                                pointer-events-auto absolute left-1/2 z-[900] w-[90%] max-w-md -translate-x-1/2 
                                transition-all duration-500 ease-in-out bottom-10
                                
                                /* Visibilitas Zen Mode (Tanpa md:ml yang bikin offside) */
                                ${isZen 
                                    ? 'translate-y-20 opacity-0 pointer-events-none' 
                                    : zoneOpen 
                                        ? 'translate-y-8 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto' 
                                        : 'translate-y-0 opacity-100' 
                                }
                            `}>
                                <div className="glass-panel rounded-2xl p-5 shadow-xl transition-all">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <span className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                                Navigasi Waktu Operasional
                                            </span>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <h3 className="text-base font-bold text-gray-800">
                                                    {formattedDisplayDate}
                                                </h3>
                                                {isChangingDate && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="glass-inset rounded-full px-3 py-1 text-xs font-bold text-gray-900">
                                                {dayOffset === 0 ? 'Hari Ini' : `H+${dayOffset}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative pt-1">
                                        <input
                                            type="range"
                                            min="0"
                                            max="9"
                                            step="1"
                                            value={dayOffset}
                                            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/30 accent-slate-700 focus:outline-none"
                                        />
                                        <div className="mt-2 flex justify-between px-0.5 text-[10px] font-semibold text-gray-400">
                                            <span>Sekarang</span>
                                            <span>H+3</span>
                                            <span>H+6</span>
                                            <span>H+9 (Maksimal)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </ZenModeController>

                {/* 3. Banner Navigasi (Tidak ikut di-hide, karena dia tokoh utamanya saat Zen Mode aktif) */}
                <NavigationBanner />
            </div>
        </NavigationProvider>
    );
}
