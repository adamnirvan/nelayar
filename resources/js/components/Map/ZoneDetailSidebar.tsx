import { motion } from 'framer-motion';
import type { Feature } from 'geojson';
import L from 'leaflet';
import { useEffect, useState } from 'react';
// PERUBAHAN MERGE: Menggabungkan import milikmu dan temanmu (formatRupiah, FuelType)
import WeatherCard from '@/components/Map/WeatherCard';
import { formatEta, formatRupiah, useNavigation } from './NavigationContext';
import type { FuelType, LatLng } from './NavigationContext';

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
            setIsExpanded(false); // [TAMBAHAN]: Paksa sidebar langsung turun ke mode intip (peek)
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

    return (
        <motion.div
            drag={isMobile ? 'y' : false}
            dragConstraints={isMobile ? { top: 0, bottom: 0 } : undefined}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
                if (!isMobile) {
                    return;
                }

                const swipeUp = info.offset.y < -40 || info.velocity.y < -400;
                const swipeDown = info.offset.y > 40 || info.velocity.y > 400;

                if (isExpanded && swipeDown) {
                    setIsExpanded(false);
                } else if (!isExpanded && swipeUp) {
                    setIsExpanded(true);
                } else if (!isExpanded && swipeDown) {
                    onClose();
                }
            }}
            initial="hidden"
            animate={isMobile ? (isExpanded ? 'expanded' : 'peek') : 'expanded'}
            exit="hidden"
            variants={isMobile ? mobileVariants : desktopVariants}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass-panel fixed bottom-0 left-0 z-[1000] flex h-[85vh] w-full flex-col overflow-hidden rounded-t-[2rem] rounded-b-none p-5 pb-8 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.3)] md:absolute md:top-0 md:bottom-auto md:h-full md:max-h-none md:w-[380px] md:rounded-none md:p-6 md:shadow-2xl"
            ref={(ref) => {
                if (ref) {
                    L.DomEvent.disableClickPropagation(ref);

                    if (!isMobile) {
                        L.DomEvent.disableScrollPropagation(ref);
                    }
                }
            }}
        >
            {/* Indikator Swipe */}
            <div
                className="mx-auto mb-4 h-1.5 w-12 shrink-0 cursor-pointer rounded-full bg-slate-400/50 md:hidden"
                onClick={() => setIsExpanded(!isExpanded)}
            />

            {/* HEADER ACTIONS (Pusat Kendali Navigasi Atas - Milikmu Dipertahankan) */}
            <div className="pointer-events-auto mb-5 flex shrink-0 items-center justify-between gap-2">
                <h2 className="text-lg font-bold tracking-tight text-gray-800 md:text-xl">
                    Zona Potensi Ikan
                </h2>

                <div className="flex items-center gap-2">
                    {/* STATE A: Tombol Siap Navigasi (Mencari Rute) */}
                    {(!isThisZone ||
                        nav.status === 'idle' ||
                        nav.status === 'error') && (
                        <button
                            type="button"
                            onClick={handleNavigate}
                            disabled={!center || nav.status === 'planning'}
                            className="glass-panel flex items-center gap-1.5 rounded-full border border-white/50 px-3 py-1.5 text-xs font-bold text-gray-900 shadow-sm transition-all hover:bg-white/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <svg
                                className="h-3.5 w-3.5 text-slate-700"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                ></path>
                            </svg>
                            Navigasi
                        </button>
                    )}

                    {/* STATE B: Sedang Menghitung Lintasan Laut */}
                    {isThisZone && nav.status === 'planning' && (
                        <button
                            disabled
                            className="glass-panel flex animate-pulse cursor-wait items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm"
                        >
                            <svg
                                className="h-3.5 w-3.5 animate-spin text-blue-600"
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
                            Mencari...
                        </button>
                    )}

                    {/* STATE C: Rute Ditemukan, Siap Berangkat (Tombol "Mulai") */}
                    {isThisZone && nav.status === 'planned' && (
                        <button
                            type="button"
                            onClick={nav.confirmDeparture}
                            className="flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-green-700 active:scale-95"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            Mulai
                        </button>
                    )}

                    {/* STATE D: Pelayaran Sedang Aktif (Tombol "Akhiri") */}
                    {isThisZone && nav.status === 'active' && (
                        <button
                            type="button"
                            onClick={nav.cancelNavigation}
                            className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm transition-all hover:bg-red-100 active:scale-95"
                        >
                            Akhiri
                        </button>
                    )}

                    {/* TOMBOL BATALKAN PURE (Menggunakan tombol X bawaan) */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-1 text-2xl font-bold text-gray-400 transition-colors hover:text-red-500"
                        title="Tutup dan Batalkan"
                    >
                        &times;
                    </button>
                </div>
            </div>

            {/* Container Scrollable */}
            <div
                className="custom-scrollbar flex-grow overflow-y-auto pr-1"
                onPointerDown={(e) => {
                    if (isMobile && isExpanded) {
                        e.stopPropagation();
                    }
                }}
            >
                {/* INFO OSEANOGRAFI (PARAMETER AREA - Desain Milikmu Dipertahankan) */}
                <div className="glass-inset mb-4 rounded-xl p-4 shadow-inner">
                    <h3 className="mb-2.5 text-sm font-semibold text-gray-900">
                        Parameter Area
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-800">
                        <li className="flex justify-between">
                            <span>Suhu Permukaan</span>
                            <span className="font-bold">
                                {props?.sst_rata}°C
                            </span>
                        </li>
                        <li className="flex justify-between">
                            <span>Klorofil-a</span>
                            <span className="font-bold">
                                {props?.chl_rata !== 'N/A'
                                    ? `${props?.chl_rata} mg/m³`
                                    : 'N/A'}
                            </span>
                        </li>
                        <li className="flex justify-between">
                            <span>Tanggal Data</span>
                            <span className="font-bold">
                                {props?.zone_date}
                            </span>
                        </li>
                    </ul>
                </div>

                {/* KARTU CUACA (Pindahan dari Index.tsx ke dalam Sidebar) */}
                {center && (
                    <div className="mb-4">
                        <WeatherCard
                            date={props?.zone_date}
                            dateLabel="Cuaca di Zona Ini"
                            // Ubah lat dan lng menjadi satu properti objek koordinat.
                            // Sesuaikan namanya dengan yang dibuat temanmu (misal: koordinat, coordinate, atau location)
                            koordinat={center}
                        />
                    </div>
                )}

                {/* INDIKATOR JARAK, ETA & ESTIMASI BBM (GABUNGAN KODE TEMAN & DESAINMU) */}
                {isThisZone &&
                    (nav.status === 'planned' || nav.status === 'active') && (
                        <div className="glass-inset mb-4 rounded-xl border border-blue-100/50 bg-blue-50/10 p-4 shadow-inner">
                            {/* Jarak & ETA */}
                            <div className="flex justify-between text-sm text-gray-800">
                                <span>📏 Jarak Tempuh</span>
                                <span className="font-bold text-blue-800">
                                    {nav.distanceKm != null
                                        ? `${nav.distanceKm.toFixed(1)} km`
                                        : '—'}
                                </span>
                            </div>
                            <div className="mt-2 flex justify-between text-sm text-gray-800">
                                <span>⏱️ Estimasi Waktu</span>
                                <span className="font-bold text-blue-800">
                                    {formatEta(nav.etaHours)}
                                </span>
                            </div>

                            {/* Rute perkiraan (garis lurus) saat titik jauh dari jaringan / luring */}
                            {nav.approximate && (
                                <p className="mt-2 rounded-lg bg-amber-50/70 px-2 py-1 text-[11px] font-medium text-amber-700">
                                    ⚠️ Rute perkiraan (garis lurus) — periksa
                                    daratan secara manual.
                                </p>
                            )}

                            {/* FITUR TEMAN: ESTIMASI BBM (Dirombak menyesuaikan desain Glassmorphism-mu) */}
                            <div className="mt-3 border-t border-blue-200/50 pt-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm text-gray-800">
                                        Estimasi BBM (PP)
                                    </span>
                                    <div className="flex overflow-hidden rounded-lg border border-blue-200 text-[11px] font-semibold">
                                        {(
                                            ['solar', 'pertalite'] as FuelType[]
                                        ).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() =>
                                                    nav.setFuelType(type)
                                                }
                                                className={`px-2.5 py-1 capitalize transition-colors ${
                                                    nav.fuelType === type
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white/40 text-gray-700 hover:bg-white/60'
                                                }`}
                                            >
                                                {type === 'solar'
                                                    ? 'Solar'
                                                    : 'Pertalite'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-baseline justify-between">
                                    <span className="text-lg font-bold text-gray-900">
                                        {formatRupiah(
                                            nav.fuelEstimate?.cost ?? null,
                                        )}
                                    </span>
                                    {nav.fuelEstimate && (
                                        <span className="text-xs font-bold text-slate-600">
                                            ±
                                            {nav.fuelEstimate.liters.toFixed(1)}{' '}
                                            L
                                        </span>
                                    )}
                                </div>

                                {nav.fuelEstimate?.pricePerLiter != null ? (
                                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                                        {formatRupiah(
                                            nav.fuelEstimate.pricePerLiter,
                                        )}
                                        /L
                                        {nav.fuelPrices &&
                                            ` • ${nav.fuelPrices.province}`}
                                        {nav.fuelPrices?.source ===
                                            'national' && ' (rata-rata)'}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-[10px] font-medium text-amber-600">
                                        ⚠️ Harga{' '}
                                        {nav.fuelType === 'solar'
                                            ? 'Solar'
                                            : 'Pertalite'}{' '}
                                        tidak tersedia di wilayah ini.
                                    </p>
                                )}
                            </div>

                            {/* Indikator Status Perjalanan Aktif */}
                            {nav.status === 'active' && (
                                <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-dashed border-blue-200 pt-2.5 text-xs font-bold text-green-700">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                    </span>
                                    Perjalanan Berlangsung
                                </div>
                            )}
                        </div>
                    )}

                {/* NOTIFIKASI ERROR JALUR */}
                {isThisZone && nav.status === 'error' && nav.error && (
                    <div className="glass-inset mb-4 rounded-xl border border-red-200 bg-red-500/10 p-3 text-xs font-semibold text-red-900">
                        ⚠️ {nav.error}
                    </div>
                )}

                {/* TARGET SPESIES POTENSIAL (Desain Milikmu Dipertahankan) */}
                <div className="mt-2">
                    <h3 className="mb-3 text-sm font-bold text-gray-800">
                        Target Spesies Potensial
                    </h3>
                    <div className="space-y-3">
                        {props?.ikan_cocok?.map((ikan: any, idx: number) => {
                            const imgPath = ikan.image_path
                                ? `/${ikan.image_path}`
                                : '/fish/default.png';

                            return (
                                <div
                                    key={idx}
                                    className="glass-inset flex items-center rounded-xl p-3"
                                >
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/40 p-1">
                                        <img
                                            src={imgPath}
                                            alt={ikan.nama_lokal}
                                            className="max-h-full max-w-full object-contain drop-shadow-sm"
                                        />
                                    </div>
                                    <div className="ml-3 min-w-0 flex-grow">
                                        <h4 className="truncate text-xs font-bold text-gray-800">
                                            {ikan.nama_lokal}
                                            {ikan.nama_lain && (
                                                <span className="font-normal text-gray-400">
                                                    {' '}
                                                    / {ikan.nama_lain}
                                                </span>
                                            )}
                                        </h4>
                                        <p className="truncate text-[11px] text-slate-500 italic">
                                            {ikan.nama_ilmiah}
                                        </p>
                                        <div className="mt-1 flex items-center">
                                            <div className="mr-2 h-1.5 w-full rounded-full bg-white/40">
                                                <div
                                                    className="h-1.5 rounded-full bg-slate-600"
                                                    style={{
                                                        width: `${ikan.confidence * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500">
                                                {Math.round(
                                                    ikan.confidence * 100,
                                                )}
                                                %
                                            </span>
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
