import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import type { FeatureCollection } from 'geojson';
import { LayersControl, LayerGroup } from 'react-leaflet';
import { format, addDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

import MapContainer from '@/components/Map/MapContainer';
import ZppiLayer from '@/components/Map/ZppiLayer';
import HeatmapLayer from '@/components/Map/HeatmapLayer';

interface Props {
    selectedDate: string;
    zppiGeoJson: FeatureCollection | null;
    sstFileUrl: string | null;
    chlFileUrl: string | null;
}

export default function MapIndex({ selectedDate, zppiGeoJson, sstFileUrl, chlFileUrl }: Props) {
    // Menghitung offset hari saat ini berdasarkan selectedDate yang dikirim backend
    const [dayOffset, setDayOffset] = useState<number>(0);
    const [isChangingDate, setIsChangingDate] = useState<boolean>(false);

    // Format tampilan tanggal yang elegan untuk UI (Contoh: Sabtu, 30 Mei)
    const formattedDisplayDate = format(parseISO(selectedDate), 'EEEE, d MMMM', { locale: id });

    // Efek penangan perubahan slider untuk melakukan rotasi data via Inertia Partial Reload
    const handleSliderChange = (value: number) => {
        setDayOffset(value);
        setIsChangingDate(true);

        const targetDateString = format(addDays(new Date(), value), 'yyyy-MM-dd');

        // Menembak kembali ke MapController@index dengan muatan parameter date dinamis
        router.get(
            window.location.pathname, 
            { date: targetDateString }, 
            {
                preserveState: true,  // Jaga agar peta tidak ke-reset ke posisi awal
                preserveScroll: true,
                only: ['selectedDate', 'zppiGeoJson', 'sstFileUrl', 'chlFileUrl'], // Ambil data yang perlu saja
                onFinish: () => setIsChangingDate(false)
            }
        );
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            
            {/* Kanvas Utama Peta Geografis */}
            <MapContainer>
                <LayersControl position="topright">
                    
                    {/* 1. LAYER UTAMA: Poligon Rekomendasi Titik Tangkap Ikan */}
                    <LayersControl.Overlay checked name="1. Hasil Analisis ZPPI (Rekomendasi)">
                        <LayerGroup>
                            {zppiGeoJson && zppiGeoJson.features.length > 0 && (
                                <ZppiLayer geojson={zppiGeoJson} />
                            )}
                        </LayerGroup>
                    </LayersControl.Overlay>

                    {/* 2. LAYER RASTER: Heatmap Suhu Permukaan Laut Dinamis */}
                    <LayersControl.Overlay name="2. Data Mentah Suhu (SST)">
                        <LayerGroup>
                            {sstFileUrl && (
                                <HeatmapLayer 
                                    key={`sst-${selectedDate}`} // Key unik memaksa Leaflet mengganti gambar saat tanggal berubah
                                    url={sstFileUrl} 
                                    type="sst" 
                                />
                            )}
                        </LayerGroup>
                    </LayersControl.Overlay>

                    {/* 3. LAYER RASTER: Heatmap Konsentrasi Klorofil-a Dinamis */}
                    <LayersControl.Overlay name="3. Data Mentah Klorofil (CHL)">
                        <LayerGroup>
                            {chlFileUrl && (
                                <HeatmapLayer 
                                    key={`chl-${selectedDate}`} // Key unik memaksa Leaflet mengganti gambar saat tanggal berubah
                                    url={chlFileUrl} 
                                    type="chl" 
                                />
                            )}
                        </LayerGroup>
                    </LayersControl.Overlay>

                </LayersControl>
            </MapContainer>

            {/* ========================================================================= */}
            {/* TIMELINE TIMEFRAME FORECAST SLIDER (Floating Panel Premium) */}
            {/* ========================================================================= */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%] max-w-md pointer-events-auto">
                <div className="bg-white/85 backdrop-blur-md border border-white/40 shadow-2xl rounded-2xl p-5 transition-all">
                    
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                Navigasi Waktu Operasional
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <h3 className="text-base font-bold text-gray-800">
                                    {formattedDisplayDate}
                                </h3>
                                {isChangingDate && (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
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
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-2 px-0.5">
                            <span>Sekarang</span>
                            <span>H+3</span>
                            <span>H+6</span>
                            <span>H+9 (Maksimal)</span>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}