import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { useNavigation } from './NavigationContext';

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
    const nav = useNavigation();
    const { userPosition, setUserPosition } = nav;
    
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const autoRequested = useRef<boolean>(false);

    useEffect(() => {
        if (map.zoomControl) map.removeControl(map.zoomControl);
    }, [map]);

    const locate = ({ fly = true, silent = false } = {}) => {
        if (!('geolocation' in navigator)) {
            if (!silent) setError('Perangkat tidak mendukung geolokasi.');
            return;
        }

        setIsLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setPosition(coords);
                setUserPosition({ lat: coords[0], lng: coords[1] });
                setIsLocating(false);
                if (fly) map.flyTo(coords, 14, { duration: 1.5 });
            },
            (err) => {
                setIsLocating(false);
                console.warn('GPS gagal, menggunakan fallback.', err.message);
                const fallbackCoords: [number, number] = [-7.2000, 112.7500];
                setPosition(fallbackCoords);
                setUserPosition({ lat: fallbackCoords[0], lng: fallbackCoords[1] });

                if (!silent) {
                    setError(err.code === err.PERMISSION_DENIED ? 'Izin ditolak.' : 'GPS lemah. Memakai fallback.');
                    setTimeout(() => setError(null), 4000); 
                }
                if (fly) map.flyTo(fallbackCoords, 14, { duration: 1.5 });
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
    };

    useEffect(() => {
        if (autoRequested.current || userPosition) return;
        autoRequested.current = true;
        locate({ fly: false, silent: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userPosition]);

    const handleLocate = () => locate({ fly: true });

    // STATUS NAVIGASI
    const isPlanned = nav.status === 'planned';
    const isActive = nav.status === 'active';

    return (
        <>
            <div className={`
                pointer-events-auto absolute right-4 z-[950] flex flex-col gap-2 items-end transition-all duration-500 ease-in-out
                
                /* 1. HILANG TOTAL SAAT NAVIGASI AKTIF ("Mulai" ditekan) */
                ${isActive ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}
                
                /* 2. POSISI DINAMIS SAAT NORMAL & PLANNED */
                ${isPlanned ? 'bottom-10' : 'bottom-52 md:bottom-10'}
            `}>
                
                <button
                    type="button"
                    onClick={handleLocate}
                    disabled={isLocating}
                    title="Tampilkan lokasi saya"
                    className="group glass-panel flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 shadow-md transition-all hover:bg-white/60 active:scale-95 disabled:cursor-wait disabled:opacity-60 border border-white/40 backdrop-blur-md"
                >
                    {isLocating ? (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
                    ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></svg>
                    )}
                </button>

                <div className="hidden md:flex glass-panel flex-col items-center justify-center rounded-xl overflow-hidden shadow-md border border-white/40 backdrop-blur-md">
                    <button type="button" onClick={(e) => { e.preventDefault(); map.zoomIn(); }} className="flex h-10 w-10 items-center justify-center bg-white/40 hover:bg-white/70 active:bg-slate-200 text-slate-700 text-xl font-bold transition-colors border-b border-slate-300/50">+</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); map.zoomOut(); }} className="flex h-10 w-10 items-center justify-center bg-white/40 hover:bg-white/70 active:bg-slate-200 text-slate-700 text-2xl font-bold transition-colors">−</button>
                </div>

                {error && (
                    <div className="glass-panel mt-2 max-w-[12rem] rounded-lg bg-amber-100/90 border border-amber-300 px-3 py-1.5 text-[11px] font-semibold text-amber-900 shadow-lg backdrop-blur-md">
                        {error}
                    </div>
                )}
            </div>

            {position && (
                <Marker position={position} icon={createUserIcon()}>
                    <Popup>Lokasi Anda saat ini</Popup>
                </Marker>
            )}
        </>
    );
}