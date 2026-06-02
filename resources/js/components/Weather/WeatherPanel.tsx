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

interface Props {
    weather: Weather;
}

export default function WeatherPanel({ weather }: Props) {
    return (
        <table>
            <tbody>
                <tr>
                    <th>Sumber</th>
                    <td>Open-Meteo</td>
                </tr>
                <tr>
                    <th>Tanggal</th>
                    <td>{weather.date}</td>
                </tr>
                <tr>
                    <th>Kondisi</th>
                    <td>{weather.weather_desc ?? '-'}</td>
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
                    <th>Suhu Maks / Min</th>
                    <td>
                        {weather.temp_max} °C / {weather.temp_min} °C
                    </td>
                </tr>
                <tr>
                    <th>Diperbarui</th>
                    <td>{new Date(weather.fetched_at).toLocaleString('id-ID')}</td>
                </tr>
            </tbody>
        </table>
    );
}
