import WeatherPanel from '@/components/Weather/WeatherPanel';

interface Props {
    weather: {
        source: 'bmkg' | 'openmeteo';
        wind_speed: number;
        wind_direction: string;
        wave_height: number;
        temperature: number;
        fetched_at: string;
    };
}

export default function WeatherIndex({ weather }: Props) {
    return <WeatherPanel weather={weather} />;
}
