import type { Feature } from 'geojson';
import L from 'leaflet';
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

    // Apakah blok navigasi ini menggambarkan rute menuju zona yang sedang dibuka?
    const isThisZone =
        !!center &&
        !!nav.destination &&
        Math.abs(nav.destination.lat - center.lat) < 1e-6 &&
        Math.abs(nav.destination.lng - center.lng) < 1e-6;

    const handleNavigate = () => {
        if (center) {
            nav.planRoute(center);
        }
    };

    return (
        <div
            className="glass-panel absolute top-0 left-0 z-[1000] h-full w-[350px] overflow-y-auto p-6"
            // Mencegah klik/scroll tembus ke peta di belakangnya
            ref={(ref) => {
                if (ref) {
                    L.DomEvent.disableClickPropagation(ref);
                    L.DomEvent.disableScrollPropagation(ref);
                }
            }}
        >
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                    Zona Potensi Ikan
                </h2>
                <button
                    onClick={onClose}
                    className="text-2xl font-bold text-gray-400 transition-colors hover:text-red-500"
                >
                    &times;
                </button>
            </div>

            {/* Info Oseanografi (Data Real dari Python) */}
            <div className="glass-inset mb-6 rounded-xl p-4 shadow-inner">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Parameter Area
                </h3>
                <ul className="space-y-2 text-sm text-gray-800">
                    <li className="flex justify-between">
                        <span>Suhu Permukaan</span>
                        <span className="font-bold">{props?.sst_rata}°C</span>
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
                        <span className="font-bold">{props?.zone_date}</span>
                    </li>
                </ul>
            </div>

            {/* Daftar Probabilitas Ikan */}
            <div>
                <h3 className="text-md mb-4 font-bold text-gray-800">
                    Target Spesies Potensial
                </h3>
                <div className="space-y-4">
                    {props?.ikan_cocok?.map((ikan: any, idx: number) => {
                        // Mencocokkan gambar ikan statis berdasarkan nama
                        const imgPath = ikan.image_path
                            ? `/${ikan.image_path}` // Ini akan menjadi /storage/images/fishes/cakalang.png
                            : '/fish/default.png';

                        return (
                            <div
                                key={idx}
                                className="glass-inset flex items-center rounded-xl p-3"
                            >
                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/40 p-1">
                                    <img
                                        src={imgPath}
                                        alt={ikan.nama_lokal}
                                        className="max-h-full max-w-full object-contain drop-shadow-sm"
                                    />
                                </div>
                                <div className="ml-4 flex-grow">
                                    {/* Menampilkan Nama Lokal dan Nama Lain (jika ada) */}
                                    <h4 className="text-sm font-bold text-gray-800">
                                        {ikan.nama_lokal}
                                        {ikan.nama_lain && (
                                            <span className="font-normal text-gray-500">
                                                {' '}
                                                / {ikan.nama_lain}
                                            </span>
                                        )}
                                    </h4>

                                    {/* Menampilkan Nama Ilmiah dengan gaya cetak miring (italic) */}
                                    <p className="mb-1 text-xs text-slate-600 italic">
                                        {ikan.nama_ilmiah}
                                    </p>

                                    <div className="mt-1 flex items-center">
                                        <div className="mr-2 h-1.5 w-full rounded-full bg-white/40">
                                            <div
                                                className="h-1.5 rounded-full bg-slate-700"
                                                style={{
                                                    width: `${ikan.confidence * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600">
                                            {Math.round(ikan.confidence * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Blok Navigasi: rencana rute → konfirmasi keberangkatan → perjalanan berlangsung */}
            <div className="mt-8 mb-4">
                {/* Ringkasan rute (jarak & ETA) saat rute untuk zona ini sudah dihitung */}
                {isThisZone &&
                    (nav.status === 'planned' || nav.status === 'active') && (
                        <div className="glass-inset mb-3 rounded-xl p-4 shadow-inner">
                            <div className="flex justify-between text-sm text-gray-800">
                                <span>Jarak Tempuh</span>
                                <span className="font-bold">
                                    {nav.distanceKm != null
                                        ? `${nav.distanceKm.toFixed(1)} km`
                                        : '—'}
                                </span>
                            </div>
                            <div className="mt-2 flex justify-between text-sm text-gray-800">
                                <span>Estimasi Waktu</span>
                                <span className="font-bold">
                                    {formatEta(nav.etaHours)}
                                </span>
                            </div>

                            {/* Estimasi biaya BBM pulang-pergi (pilih jenis) */}
                            <div className="mt-3 border-t border-white/40 pt-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm text-gray-800">
                                        Estimasi BBM (PP)
                                    </span>
                                    <div className="flex overflow-hidden rounded-lg border border-white/50 text-[11px] font-semibold">
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
                                                        ? 'bg-slate-700 text-white'
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
                                        <span className="text-xs text-gray-600">
                                            ±{nav.fuelEstimate.liters.toFixed(1)}{' '}
                                            L
                                        </span>
                                    )}
                                </div>

                                {nav.fuelEstimate?.pricePerLiter != null ? (
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        {formatRupiah(
                                            nav.fuelEstimate.pricePerLiter,
                                        )}
                                        /L
                                        {nav.fuelPrices &&
                                            ` • ${nav.fuelPrices.province}`}
                                        {nav.fuelPrices?.source === 'national' &&
                                            ' (rata-rata)'}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-[11px] text-amber-700">
                                        Harga{' '}
                                        {nav.fuelType === 'solar'
                                            ? 'Solar'
                                            : 'Pertalite'}{' '}
                                        tidak tersedia untuk wilayah ini.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                {/* Pesan error perhitungan rute */}
                {isThisZone && nav.status === 'error' && nav.error && (
                    <div className="glass-inset mb-3 rounded-xl bg-red-500/20 p-3 text-xs font-semibold text-red-900">
                        {nav.error}
                    </div>
                )}

                {/* TAHAP 1 & error: tombol hitung rute */}
                {(!isThisZone ||
                    nav.status === 'idle' ||
                    nav.status === 'error') && (
                    <button
                        onClick={handleNavigate}
                        disabled={!center || nav.status === 'planning'}
                        className="glass-inset flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-gray-900 shadow-lg transition-colors hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            ></path>
                        </svg>
                        Mulai Navigasi
                    </button>
                )}

                {/* TAHAP 2: sedang menghitung rute */}
                {isThisZone && nav.status === 'planning' && (
                    <button
                        disabled
                        className="glass-inset flex w-full cursor-wait items-center justify-center gap-2 rounded-xl py-3 font-bold text-gray-700 shadow-lg"
                    >
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
                        Menghitung rute laut…
                    </button>
                )}

                {/* TAHAP 3: rute siap → konfirmasi keberangkatan */}
                {isThisZone && nav.status === 'planned' && (
                    <div className="space-y-2">
                        <button
                            onClick={nav.confirmDeparture}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white shadow-lg transition-colors hover:bg-green-700"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            Konfirmasi Keberangkatan
                        </button>
                        <button
                            onClick={nav.cancelNavigation}
                            className="w-full rounded-xl py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-white/30"
                        >
                            Batalkan
                        </button>
                    </div>
                )}

                {/* TAHAP 4: perjalanan berlangsung (PWA on-going) */}
                {isThisZone && nav.status === 'active' && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 py-2 font-bold text-green-700">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                            </span>
                            Perjalanan Berlangsung
                        </div>
                        <button
                            onClick={nav.cancelNavigation}
                            className="glass-inset w-full rounded-xl py-3 font-bold text-red-700 shadow-lg transition-colors hover:bg-red-500/20"
                        >
                            Akhiri Navigasi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
