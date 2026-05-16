interface Weather {
    source: 'bmkg' | 'openmeteo';
    wind_speed: number;
    wind_direction: string;
    wave_height: number;
    temperature: number;
    fetched_at: string;
}

interface Props {
    weather: Weather;
}

export default function WeatherPanel({ weather }: Props) {
    return (
        <table>
            <tbody>
                <tr>
                    <th>Sumber</th>
                    <td>{weather.source === 'bmkg' ? 'BMKG' : 'Open-Meteo'}</td>
                </tr>
                <tr>
                    <th>Kecepatan Angin</th>
                    <td>{weather.wind_speed} km/h</td>
                </tr>
                <tr>
                    <th>Arah Angin</th>
                    <td>{weather.wind_direction}</td>
                </tr>
                <tr>
                    <th>Tinggi Gelombang</th>
                    <td>{weather.wave_height} m</td>
                </tr>
                <tr>
                    <th>Suhu</th>
                    <td>{weather.temperature} °C</td>
                </tr>
                <tr>
                    <th>Diperbarui</th>
                    <td>{new Date(weather.fetched_at).toLocaleString('id-ID')}</td>
                </tr>
            </tbody>
        </table>
    );
}
