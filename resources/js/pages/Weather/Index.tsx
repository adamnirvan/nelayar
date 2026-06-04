import WeatherPanel from '@/components/Weather/WeatherPanel';

interface Props {
    weather: {
        source: 'openmeteo';
        date: string;
        temp_max: number;
        temp_min: number;
        wind_speed: number;
        wind_direction: string;
        wave_height: number;
        weather_desc: string | null;
        fetched_at: string;
    };
}

export default function WeatherIndex({ weather }: Props) {
    return <WeatherPanel weather={weather} />;
}
