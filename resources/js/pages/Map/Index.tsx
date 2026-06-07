import { router } from '@inertiajs/react';
import { format, addDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import type { FeatureCollection } from 'geojson';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import MapContainer from '@/components/Map/MapContainer';
import MapHeader from '@/components/Map/MapHeader';
import type { MapLayer } from '@/components/Map/MapHeader';
import NavigationBanner from '@/components/Map/NavigationBanner';
import {
    NavigationProvider,
    useNavigation,
} from '@/components/Map/NavigationContext';
import SyncStatusBadge from '@/components/Map/SyncStatusBadge';
// GABUNGAN IMPORT: Mengambil NavigationProvider, useNavigation (milikmu) dan WeatherCard (milik temanmu)
import ZppiOverlays from '@/components/Map/ZppiOverlays';
import type { SearchTarget } from '@/components/Map/ZppiOverlaysLeaflet';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { buildFishIndex } from '@/lib/fishSearch';
import type { FishSuggestion } from '@/lib/fishSearch';
import { readZoneIndex } from '@/lib/offline/read';

interface Props {
    selectedDate: string;
    zppiGeoJson: FeatureCollection | null;
    sstFileUrl: string | null;
    chlFileUrl: string | null;
}

// Komponen pembantu untuk membaca status Zen Mode tanpa memecah file Index
function ZenModeController({
    children,
}: {
    children: (isZen: boolean) => React.ReactNode;
}) {
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

    const online = useOnlineStatus();
    // Saat offline, slider tanggal membaca IndexedDB (disinkron selagi di darat)
    // dan menimpa prop Inertia di sini. Saat online, prop server yang dipakai.
    const [offlineView, setOfflineView] = useState<{
        selectedDate: string;
        zppiGeoJson: FeatureCollection | null;
        sstFileUrl: string | null;
        chlFileUrl: string | null;
    } | null>(null);

    const view = offlineView ?? {
        selectedDate,
        zppiGeoJson,
        sstFileUrl,
        chlFileUrl,
    };

    const [activeLayer, setActiveLayer] = useState<MapLayer>('processed');
    const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const [fishFilter, setFishFilter] = useState<string | null>(null);
    const [clearSignal, setClearSignal] = useState<number>(0);

    const fishSuggestions = useMemo(
        () => buildFishIndex(view.zppiGeoJson),
        [view.zppiGeoJson],
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
        parseISO(view.selectedDate),
        'EEEE, d MMMM',
        { locale: id },
    );

    const handleSliderChange = (value: number) => {
        setDayOffset(value);
        setIsChangingDate(true);

        setFishFilter(null);
        setClearSignal((n) => n + 1);

        const targetDateString = format(
            addDays(new Date(), value),
            'yyyy-MM-dd',
        );

        // ONLINE: ambil dari server seperti biasa; lepas penimpaan offline.
        if (online) {
            setOfflineView(null);

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

            return;
        }

        // OFFLINE: baca tanggal ini dari IndexedDB (router.get akan gagal tanpa jaringan).
        readZoneIndex(targetDateString)
            .then((idx) => {
                if (idx) {
                    setOfflineView({
                        selectedDate: targetDateString,
                        zppiGeoJson: idx.collection,
                        sstFileUrl: idx.sstFileUrl,
                        chlFileUrl: idx.chlFileUrl,
                    });
                } else {
                    toast.error(
                        'Data tanggal ini belum tersimpan untuk mode offline.',
                    );
                }
            })
            .finally(() => setIsChangingDate(false));
    };

    return (
        <NavigationProvider>
            <div className="relative h-screen w-full overflow-hidden">
                {/* 1. Kanvas Utama Peta */}
                <MapContainer>
                    <ZppiOverlays
                        selectedDate={view.selectedDate}
                        zppiGeoJson={view.zppiGeoJson}
                        sstFileUrl={view.sstFileUrl}
                        chlFileUrl={view.chlFileUrl}
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
                            <div
                                className={`pointer-events-none absolute top-0 z-[40] w-full transition-all duration-700 ease-in-out ${isZen ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}
                            >
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

                            {/* STATUS SINKRONISASI OFFLINE (pojok kiri-bawah) */}
                            <div
                                className={`pointer-events-none absolute bottom-10 left-4 z-[45] transition-all duration-500 ease-in-out ${
                                    isZen
                                        ? 'translate-y-20 opacity-0'
                                        : 'translate-y-0 opacity-100'
                                }`}
                            >
                                <SyncStatusBadge />
                            </div>

                            {/* SLIDER WAKTU: Dilengkapi "Spatial Awareness" milikmu */}
                            <div
                                className={`/* Visibilitas Zen Mode & Spatial Awareness */ pointer-events-auto absolute bottom-10 left-1/2 z-[900] w-[90%] max-w-md -translate-x-1/2 transition-all duration-500 ease-in-out ${
                                    isZen
                                        ? 'pointer-events-none translate-y-20 opacity-0'
                                        : zoneOpen
                                          ? 'pointer-events-none translate-y-8 opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100'
                                          : 'translate-y-0 opacity-100'
                                } `}
                            >
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
                                                {dayOffset === 0
                                                    ? 'Hari Ini'
                                                    : `H+${dayOffset}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative pt-1">
                                        <input
                                            id="forecast-day-offset"
                                            name="forecast_day_offset"
                                            type="range"
                                            min="0"
                                            max="9"
                                            step="1"
                                            value={dayOffset}
                                            aria-label="Pilih tanggal prakiraan"
                                            onChange={(e) =>
                                                handleSliderChange(
                                                    parseInt(e.target.value),
                                                )
                                            }
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

                {/* 3. Banner Navigasi (Milikmu & Temanmu sama-sama sepakat meletakkan ini di luar) */}
                <NavigationBanner />
            </div>
        </NavigationProvider>
    );
}
