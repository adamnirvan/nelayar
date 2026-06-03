import { formatEta, useNavigation } from './NavigationContext';

// Banner mengambang yang menandakan perjalanan sedang berlangsung (mode PWA on-going).
// Tetap tampil walau sidebar zona ditutup, sehingga nelayan selalu melihat status navigasi.
export default function NavigationBanner() {
    const { status, distanceKm, etaHours, cancelNavigation } = useNavigation();

    if (status !== 'active') {
        return null;
    }

    return (
        // PERUBAHAN: top-20 diubah menjadi top-6 agar posisi card lebih naik ke atas 
        // memanfaatkan ruang kosong setelah Header menghilang.
        <div className="pointer-events-auto absolute top-6 md:top-8 left-1/2 z-[1100] w-[90%] max-w-md -translate-x-1/2 transition-all duration-500 ease-in-out">
            <div className="glass-panel flex items-center gap-4 rounded-2xl p-4 shadow-xl border border-white/40 backdrop-blur-md">
                <span className="relative flex h-3 w-3 flex-shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                </span>

                <div className="flex-grow">
                    <span className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        Navigasi Berlangsung
                    </span>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-800">
                        <span>
                            {distanceKm != null
                                ? `${distanceKm.toFixed(1)} km`
                                : '—'}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>ETA {formatEta(etaHours)}</span>
                    </div>
                </div>

                <button
                    onClick={cancelNavigation}
                    className="glass-inset flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-500/20 active:scale-95"
                >
                    Akhiri
                </button>
            </div>
        </div>
    );
}