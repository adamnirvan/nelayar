import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { useNavigation } from './NavigationContext';

// Ikon kustom untuk posisi pengguna (Hijau Berdenyut) — beda warna dari marker ZPPI.
const createUserIcon = () => {
    return L.divIcon({
        className: 'user-location-wrapper',
        html: '<div class="user-location-marker"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
    });
};

export default function LocateControl() {
    const map = useMap();
    const { userPosition, setUserPosition } = useNavigation();
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const autoRequested = useRef<boolean>(false);

    // Meminta lokasi pengguna ke browser.
    // - `fly`   : terbangkan kamera ke posisi (dipakai saat tombol ditekan manual).
    // - `silent`: jangan tampilkan pesan error (dipakai saat permintaan otomatis).
    const locate = ({ fly = true, silent = false } = {}) => {
        if (!('geolocation' in navigator)) {
            if (!silent) {
                setError('Perangkat tidak mendukung geolokasi.');
            }

            return;
        }

        setIsLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [
                    pos.coords.latitude,
                    pos.coords.longitude,
                ];
                setPosition(coords);
                setUserPosition({ lat: coords[0], lng: coords[1] });
                setIsLocating(false);

                // Animasi terbang ke posisi pengguna
                if (fly) {
                    map.flyTo(coords, 11, { duration: 1.5 });
                }
            },
            (err) => {
                setIsLocating(false);

                if (!silent) {
                    setError(
                        err.code === err.PERMISSION_DENIED
                            ? 'Izin lokasi ditolak.'
                            : 'Gagal mendapatkan lokasi.',
                    );
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    };

    // Begitu peta dimuat, minta lokasi pengguna bila belum diketahui — sehingga
    // browser langsung menanyakan izin dan rute siap dihitung tanpa klik manual.
    // Tanpa fly agar tampilan awal peta tidak tergeser; error disembunyikan agar
    // penolakan izin tidak memunculkan pesan merah saat halaman baru terbuka.
    useEffect(() => {
        if (autoRequested.current || userPosition) {
            return;
        }

        autoRequested.current = true;
        locate({ fly: false, silent: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLocate = () => locate({ fly: true });

    return (
        <>
            {/* Tombol Floating Pin Lokasi (kanan-bawah, di atas kontrol zoom) */}
            <div className="pointer-events-auto absolute right-2.5 bottom-24 z-[1000] flex flex-col items-end">
                <button
                    type="button"
                    onClick={handleLocate}
                    disabled={isLocating}
                    title="Tampilkan lokasi saya"
                    className="group glass-panel flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-all hover:bg-white/30 active:scale-95 disabled:cursor-wait disabled:opacity-60"
                >
                    {isLocating ? (
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
                    ) : (
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                            <circle cx="12" cy="12" r="8" />
                        </svg>
                    )}
                </button>
                {error && (
                    <div className="glass-panel mt-2 max-w-[12rem] rounded-lg bg-red-500/40 px-3 py-1.5 text-[11px] font-semibold text-red-900 shadow-lg">
                        {error}
                    </div>
                )}
            </div>

            {/* Marker posisi pengguna */}
            {position && (
                <Marker position={position} icon={createUserIcon()}>
                    <Popup>Lokasi Anda saat ini</Popup>
                </Marker>
            )}
        </>
    );
}
