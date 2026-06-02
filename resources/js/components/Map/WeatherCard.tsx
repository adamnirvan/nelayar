import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigation } from './NavigationContext';

interface Weather {
    source: 'openmeteo';
    date: string;
    temp_max: number;
    temp_min: number;
    wind_speed: number;
    wind_direction: string;
    wave_height: number;
    weather_desc: string | null;
    fetched_at: string;
}

// Memilih ikon berdasarkan deskripsi cuaca (Bahasa Indonesia) dari Open-Meteo.
function weatherIcon(desc: string | null): string {
    const d = (desc ?? '').toLowerCase();

    if (d.includes('hujan') && d.includes('petir')) {
        return '⛈️';
    }

    if (d.includes('hujan')) {
        return '🌧️';
    }

    if (d.includes('gerimis')) {
        return '🌦️';
    }

    if (d.includes('petir')) {
        return '🌩️';
    }

    if (d.includes('salju')) {
        return '❄️';
    }

    if (d.includes('kabut') || d.includes('asap')) {
        return '🌫️';
    }

    if (d.includes('cerah berawan')) {
        return '⛅';
    }

    if (d.includes('berawan') || d.includes('mendung')) {
        return '☁️';
    }

    if (d.includes('cerah')) {
        return '☀️';
    }

    return '⛅';
}

interface Props {
    // Tanggal prakiraan terpilih (Y-M-D) — mengikuti slider tanggal peta.
    date: string;
    // Label tanggal singkat untuk badge kartu (mis. "Hari Ini" / "H+3").
    dateLabel: string;
    // Disembunyikan saat sidebar detail zona terbuka (menutupi sudut kiri-atas).
    hidden?: boolean;
}

// Kartu cuaca mengambang yang menampilkan prakiraan di lokasi pengguna untuk
// tanggal terpilih. Muncul setelah izin lokasi diberikan (userPosition terisi
// dari LocateControl) dan ikut berubah saat slider tanggal peta digeser.
export default function WeatherCard({ date, dateLabel, hidden = false }: Props) {
    const { userPosition } = useNavigation();
    const [weather, setWeather] = useState<Weather | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!userPosition) {
            return;
        }

        let cancelled = false;
        // Tandai sedang memuat saat koordinat/tanggal baru diminta.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        setError(false);

        axios
            .get<Weather>('/api/map/weather', {
                params: { lat: userPosition.lat, lon: userPosition.lng, date },
            })
            .then((res) => {
                if (!cancelled) {
                    setWeather(res.data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(true);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // Ambil ulang saat koordinat (lokasi baru) atau tanggal berubah.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userPosition?.lat, userPosition?.lng, date]);

    // Belum ada lokasi atau sidebar zona menutupi area — jangan tampilkan apa pun.
    if (!userPosition || hidden) {
        return null;
    }
    return (
        <div className="pointer-events-auto absolute bottom-48 left-4 z-[1000] w-56 md:bottom-10">
            <div className="glass-panel rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        Cuaca Lokasi Anda
                    </span>
                    <span className="glass-inset rounded-full px-2 py-0.5 text-[9px] font-bold whitespace-nowrap text-gray-700 uppercase">
                        {dateLabel}
                    </span>
                </div>

                {loading && !weather && (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-600">
                        <svg
                            className="h-4 w-4 animate-spin"
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
                        Memuat cuaca…
                    </div>
                )}

                {error && !weather && (
                    <p className="py-2 text-sm text-gray-600">
                        Gagal memuat cuaca.
                    </p>
                )}

                {weather && (
                    <>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl leading-none">
                                {weatherIcon(weather.weather_desc)}
                            </span>
                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {Math.round(weather.temp_max)}°
                                    </span>
                                    <span className="text-base font-semibold text-gray-500">
                                        {Math.round(weather.temp_min)}°
                                    </span>
                                </div>
                                {weather.weather_desc && (
                                    <div className="text-xs font-semibold text-gray-600">
                                        {weather.weather_desc}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-gray-700">
                            <div className="glass-inset rounded-lg px-2 py-1.5">
                                <span className="block text-[9px] tracking-wide text-gray-500 uppercase">
                                    Angin
                                </span>
                                {weather.wind_speed} km/j{' '}
                                {weather.wind_direction}
                            </div>
                            <div className="glass-inset rounded-lg px-2 py-1.5">
                                <span className="block text-[9px] tracking-wide text-gray-500 uppercase">
                                    Gelombang
                                </span>
                                {weather.wave_height} m
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
