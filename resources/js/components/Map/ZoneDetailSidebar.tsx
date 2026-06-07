import type { Feature } from 'geojson';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatEta, formatRupiah, useNavigation } from './NavigationContext';
import type { FuelType, LatLng } from './NavigationContext';
import WeatherCard from '@/components/Map/WeatherCard';

interface ZoneDetailSidebarProps {
    zone: Feature;
    center: LatLng | null;
    onClose: () => void;
}

export default function ZoneDetailSidebar({
    zone,
    center,
    onClose,
}: ZoneDetailSidebarProps) {
    const props = zone.properties;
    const nav = useNavigation();

    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        setIsExpanded(false);
    }, [zone]);

    const isThisZone =
        !!center &&
        !!nav.destination &&
        Math.abs(nav.destination.lat - center.lat) < 1e-6 &&
        Math.abs(nav.destination.lng - center.lng) < 1e-6;

    const handleNavigate = () => {
        if (center) {
            nav.planRoute(center);
            setIsExpanded(false);
        }
    };

    const mobileVariants = {
        hidden: { y: '100%', x: 0 },
        peek: { y: 'calc(100% - 240px)', x: 0 },
        expanded: { y: 0, x: 0 },
    };

    const desktopVariants = {
        hidden: { x: '-100%', y: 0 },
        expanded: { x: 0, y: 0 },
    };

    // KOMPONEN TOMBOL ACTION (Dinamis berdasarkan State & Device)
    const NavigasiButton = ({ className = "" }: { className?: string }) => {
        if (isThisZone && nav.status === 'planning') {
            return (
                <button disabled className={`flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 shadow-sm cursor-wait ${className}`}>
                    <svg className="h-4 w-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                    Mencari...
                </button>
            );
        }
        return (
            <button
                type="button"
                onClick={handleNavigate}
                disabled={!center}
                className={`flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 disabled:opacity-50 transition-all ${className}`}
            >
                <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                </svg>
                Navigasi
            </button>
        );
    };

    const MulaiButton = ({ className = "" }: { className?: string }) => {
        if (nav.status === 'active') {
            return (
                <button
                    type="button"
                    onClick={nav.cancelNavigation}
                    className={`flex items-center justify-center gap-1.5 rounded-xl bg-red-100 border border-red-200 px-4 py-2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-200 active:scale-95 transition-all ${className}`}
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h12v12H6z" />
                    </svg>
                    Akhiri
                </button>
            );
        }
        return (
            <button
                type="button"
                onClick={nav.confirmDeparture}
                // DIUBAH: Menggunakan warna kuning (yellow-400) dengan teks gelap
                className={`flex items-center justify-center gap-1.5 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-yellow-500 active:scale-95 transition-all ${className}`}
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                </svg>
                Mulai
            </button>
        );
    };

    return (
        <motion.div
            style={{ fontFamily: "'Outfit', sans-serif" }}
            drag={isMobile ? "y" : false}
            dragConstraints={isMobile ? { top: 0, bottom: 0 } : undefined}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
                if (!isMobile) return;
                const swipeUp = info.offset.y < -40 || info.velocity.y < -400;
                const swipeDown = info.offset.y > 40 || info.velocity.y > 400;

                if (isExpanded && swipeDown) setIsExpanded(false);
                else if (!isExpanded && swipeUp) setIsExpanded(true);
                else if (!isExpanded && swipeDown) onClose();
            }}
            initial="hidden"
            animate={isMobile ? (isExpanded ? "expanded" : "peek") : "expanded"}
            exit="hidden"
            variants={isMobile ? mobileVariants : desktopVariants}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="
                glass-panel z-[1000] flex flex-col overflow-hidden
                fixed bottom-0 left-0 w-full h-[85vh] rounded-t-[2rem] rounded-b-none p-5 pb-8 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.3)]
                md:absolute md:top-0 md:bottom-auto md:h-full md:max-h-none md:w-[400px] md:rounded-none md:shadow-2xl md:p-6
            "
            ref={(ref) => {
                if (ref) {
                    L.DomEvent.disableClickPropagation(ref);
                    if (!isMobile) L.DomEvent.disableScrollPropagation(ref);
                }
            }}
        >
            <div
                className="mx-auto mb-4 h-1.5 w-12 shrink-0 cursor-pointer rounded-full bg-slate-400/50 md:hidden"
                onClick={() => setIsExpanded(!isExpanded)}
            />

            {/* HEADER ACTIONS */}
            <div className="mb-5 flex shrink-0 items-center justify-between gap-2 pointer-events-auto">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                    Zona Potensi Ikan
                </h2>
                
                <div className="flex items-center gap-2">
                    {/* HANYA TAMPIL DI MOBILE (Sesuai Aturan) */}
                    {isMobile && (!isThisZone || nav.status === 'idle' || nav.status === 'planning' || nav.status === 'error') && (
                        <NavigasiButton />
                    )}
                    {isMobile && isThisZone && (nav.status === 'planned' || nav.status === 'active') && (
                        <MulaiButton />
                    )}

                    <button 
                        type="button"
                        onClick={onClose} 
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/50 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-500 ml-1"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
            </div>

            <div
                // DIUBAH: Membunuh scrollbar secara total di semua browser (Chrome, Safari, Firefox)
                className="flex-grow overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                onPointerDown={(e) => {
                    if (isMobile && isExpanded) e.stopPropagation();
                }}
            >
                {/* BENTO GRID: PARAMETER AREA */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter Oseanografi</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{props?.zone_date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Box Suhu */}
                        <div className="glass-inset rounded-xl p-3.5 border border-white/40 shadow-sm flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1 text-orange-500">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13Z" /></svg>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Suhu Permukaan</span>
                            </div>
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{props?.sst_rata}<span className="text-sm font-bold text-slate-400 ml-0.5">°C</span></span>
                        </div>
                        {/* Box Klorofil */}
                        <div className="glass-inset rounded-xl p-3.5 border border-white/40 shadow-sm flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1 text-emerald-500">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 2 5 9 5 14A7 7 0 0 0 19 14C19 9 12 2 12 2Z" /></svg>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Klorofil-A</span>
                            </div>
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{props?.chl_rata !== 'N/A' ? props?.chl_rata : '--'}<span className="text-xs font-bold text-slate-400 ml-1">mg/m³</span></span>
                        </div>
                    </div>
                </div>

                {/* KARTU CUACA */}
               {center && (
                   <div className="mb-4">
                       <WeatherCard 
                           date={props?.zone_date}
                           dateLabel="Cuaca di Zona Ini"
                           koordinat={center} 
                       />
                   </div>
               )}

               {/* DESKTOP BUTTON: Navigasi (Tampil di bawah Cuaca) */}
               {!isMobile && (!isThisZone || nav.status === 'idle' || nav.status === 'planning' || nav.status === 'error') && (
                   <div className="mb-4">
                       <NavigasiButton className="w-full py-3 text-sm" />
                   </div>
               )}

                {/* RECEIPT CARD: ESTIMASI PELAYARAN */}
                {isThisZone && (nav.status === 'planned' || nav.status === 'active') && (
                    <div className="glass-inset mb-4 rounded-xl p-4 shadow-sm border border-blue-100/60 bg-gradient-to-b from-blue-50/30 to-transparent">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimasi Operasional</span>
                            <div className="flex overflow-hidden rounded-lg border border-slate-200 text-[10px] font-bold bg-white/50">
                                {(['solar', 'pertalite'] as FuelType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => nav.setFuelType(type)}
                                        className={`px-3 py-1.5 capitalize transition-colors ${
                                            nav.fuelType === type
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-600 hover:bg-white'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400">JARAK</span>
                                    <span className="block text-sm font-black text-slate-800">{nav.distanceKm != null ? `${nav.distanceKm.toFixed(1)} km` : '—'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.28 13.22l-5.28-3.16V6h1.5v5.2l4.53 2.72z" /></svg>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400">WAKTU</span>
                                    <span className="block text-sm font-black text-slate-800">{formatEta(nav.etaHours)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 my-3"></div>

                        <div>
                            <span className="block text-xs font-bold text-slate-500 mb-0.5">ESTIMASI BIAYA BBM</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black tracking-tight text-blue-700">
                                    {formatRupiah(nav.fuelEstimate?.cost ?? null)}
                                </span>
                                {nav.fuelEstimate && (
                                    <span className="text-xs font-bold text-slate-500">
                                        / ±{nav.fuelEstimate.liters.toFixed(1)} L
                                    </span>
                                )}
                            </div>
                            {nav.fuelEstimate?.pricePerLiter != null ? (
                                <p className="text-[10px] font-bold text-slate-400 mt-1">
                                    {formatRupiah(nav.fuelEstimate.pricePerLiter)} per liter ({nav.fuelPrices?.province})
                                </p>
                            ) : (
                                <p className="mt-1 text-[10px] font-bold text-red-500">
                                    Harga {nav.fuelType} tidak tersedia.
                                </p>
                            )}
                        </div>

                        {/* DESKTOP BUTTON: Mulai (Tampil di bawah Estimasi BBM) */}
                        {!isMobile && (
                            <div className="mt-4 pt-4 border-t border-slate-200/50">
                                <MulaiButton className="w-full py-3 text-sm" />
                            </div>
                        )}
                    </div>
                )}

                {/* TARGET SPESIES POTENSIAL (Vertical Cards Horizontal Scroll) */}
                <div className="mt-2 mb-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block px-1">Target Spesies Potensial</span>
                    
                    {/* Container Scroll Horizontal dengan hilangnya scrollbar bawaan */}
                    {/* Container Scroll Horizontal dengan hilangnya scrollbar bawaan */}
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {props?.ikan_cocok?.map((ikan: any, idx: number) => {
                            // 1. DEKLARASI SEMUA VARIABEL DI SINI (SEBELUM RETURN)
                            const imgPath = ikan.image_path 
                                ? `/${ikan.image_path}` 
                                : '/fish/default.png';
                            
                            // Hitung Radial SVG
                            const percentage = Math.round(ikan.confidence * 100);
                            const radius = 16;
                            const center = 20; // 40px width/height -> center at 20
                            const circumference = 2 * Math.PI * radius;
                            const strokeDashoffset = circumference - (percentage / 100) * circumference;

                            // 2. KEMBALIKAN (RETURN) SELURUH ELEMEN UI-NYA DI SINI
                            return (
                                <div 
                                    key={idx} 
                                    className="glass-inset relative flex flex-col w-[140px] flex-shrink-0 snap-center rounded-2xl p-3.5 border border-white/50 shadow-sm bg-gradient-to-b from-white/30 to-white/10"
                                >
                                    {/* 1. Gambar Ikan di Atas (Transparan & Bebas) */}
                                    <div className="flex h-20 w-full items-center justify-center mb-3">
                                        <img 
                                            src={imgPath} 
                                            alt={ikan.nama_lokal} 
                                            className="max-h-full max-w-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.15)] transition-transform hover:scale-110" 
                                        />
                                    </div>

                                    {/* 2. Teks di Tengah */}
                                    <div className="flex flex-col flex-grow mb-4">
                                        <h4 className="text-sm font-black text-slate-800 leading-tight line-clamp-2">
                                            {ikan.nama_lokal}
                                        </h4>
                                        <p className="text-[10px] font-semibold text-slate-500 mt-1 truncate">
                                            {ikan.nama_lain || "Tuna"}
                                        </p>
                                        <p className="text-[9px] font-medium italic text-slate-400 truncate mt-0.5">
                                            {ikan.nama_ilmiah}
                                        </p>
                                    </div>

                                    {/* 3. Probabilitas di Ujung Bawah */}
                                    <div className="mt-auto flex items-end justify-between">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-1">
                                            Peluang
                                        </span>
                                        <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx={center} cy={center} r={radius} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-white/60" />
                                                <circle 
                                                    cx={center} cy={center} r={radius} 
                                                    stroke="currentColor" 
                                                    strokeWidth="3.5" fill="transparent" 
                                                    strokeDasharray={circumference} 
                                                    strokeDashoffset={strokeDashoffset} 
                                                    className="text-blue-500" 
                                                    strokeLinecap="round" 
                                                />
                                            </svg>
                                            <span className="absolute text-[10px] font-black text-slate-800">{percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </motion.div>
    );
}