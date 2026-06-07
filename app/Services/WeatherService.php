<?php

namespace App\Services;

use App\Models\WeatherCache;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class WeatherService
{
    const TTL_MINUTES = 60;

    // How many days ahead Open-Meteo's daily forecast is requested for (H+0..H+9),
    // matching the map's 10-day forecast window.
    const MAX_FORECAST_DAYS = 9;

    // Returns the daily weather forecast for a single date (defaults to today).
    // $date is a Y-m-d string; out-of-window dates are clamped to [today, H+9].
    public function get(float $lat, float $lon, ?string $date = null): array
    {
        $date = $this->normalizeDate($date);

        $cached = WeatherCache::where('latitude', $lat)
            ->where('longitude', $lon)
            ->where('forecast_date', $date)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached && $cached->openmeteo_data) {
            return $cached->openmeteo_data;
        }

        try {
            // Berusaha mengambil data asli dari satelit Open-Meteo
            $data = $this->fetchOpenMeteo($lat, $lon, $date);
        } catch (\Exception $e) {
            // Jika server down, timeout, atau error, gunakan Data Dummy
            $data = [
                'source' => 'mock_data', // Penanda bahwa ini data cadangan
                'date' => $date,
                'temp_max' => 31.5,
                'temp_min' => 25.0,
                'wind_speed' => 12.5,
                'wind_direction' => 'TL', // Timur Laut (Sesuai format array compass)
                'wave_height' => 1.2,
                'weather_desc' => 'Cerah Berawan',
                'fetched_at' => now()->toISOString(),
            ];
        }
        // =========================================================

        WeatherCache::updateOrCreate(
            ['latitude' => $lat, 'longitude' => $lon, 'forecast_date' => $date],
            [
                'openmeteo_data' => $data,
                // [REVISI KECIL]: Ubah hardcode 'openmeteo' menjadi dinamis 
                // agar database mencatat apakah ini data asli atau mock_data
                'active_source' => $data['source'], 
                'fetched_at' => now(),
                'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            ]
        );

        return $data;
    }

    // Clamp an incoming date to the supported forecast window [today, H+MAX].
    private function normalizeDate(?string $date): string
    {
        $today = Carbon::today('Asia/Jakarta');

        if (! $date) {
            return $today->toDateString();
        }

        try {
            $parsed = Carbon::parse($date, 'Asia/Jakarta')->startOfDay();
        } catch (\Exception) {
            return $today->toDateString();
        }

        $max = $today->copy()->addDays(self::MAX_FORECAST_DAYS);

        if ($parsed->lt($today)) {
            return $today->toDateString();
        }

        if ($parsed->gt($max)) {
            return $max->toDateString();
        }

        return $parsed->toDateString();
    }

    private function fetchOpenMeteo(float $lat, float $lon, string $date): array
    {
        $forecast = Http::timeout(10)->get('https://api.open-meteo.com/v1/forecast', [
            'latitude' => $lat,
            'longitude' => $lon,
            'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant',
            'timezone' => 'Asia/Jakarta',
            'start_date' => $date,
            'end_date' => $date,
        ]);

        if (! $forecast->ok()) {
            throw new \Exception("Open-Meteo forecast returned HTTP {$forecast->status()}");
        }

        $daily = data_get($forecast->json(), 'daily', []);
        $code = (int) data_get($daily, 'weather_code.0', 0);

        return [
            'source' => 'openmeteo',
            'date' => $date,
            'temp_max' => (float) data_get($daily, 'temperature_2m_max.0', 0),
            'temp_min' => (float) data_get($daily, 'temperature_2m_min.0', 0),
            'wind_speed' => (float) data_get($daily, 'wind_speed_10m_max.0', 0),
            'wind_direction' => $this->compass((float) data_get($daily, 'wind_direction_10m_dominant.0', 0)),
            'wave_height' => $this->fetchWaveHeight($lat, $lon, $date),
            'weather_desc' => $this->describeCode($code),
            'fetched_at' => now()->toISOString(),
        ];
    }

    // Wave height comes from the separate Open-Meteo Marine API and is optional —
    // it is unavailable for inland coordinates, so failures fall back to 0.
    private function fetchWaveHeight(float $lat, float $lon, string $date): float
    {
        try {
            $marine = Http::timeout(10)->get('https://marine-api.open-meteo.com/v1/marine', [
                'latitude' => $lat,
                'longitude' => $lon,
                'daily' => 'wave_height_max',
                'timezone' => 'Asia/Jakarta',
                'start_date' => $date,
                'end_date' => $date,
            ]);

            if ($marine->ok()) {
                return (float) data_get($marine->json(), 'daily.wave_height_max.0', 0);
            }
        } catch (\Exception) {
            // Wave height is optional — proceed without it.
        }

        return 0;
    }

    // Convert a wind bearing (degrees) to an 8-point Indonesian compass label.
    private function compass(float $degrees): string
    {
        $points = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];

        return $points[(int) round($degrees / 45) % 8];
    }

    // Map a WMO weather code to an Indonesian description. The wording reuses the
    // keywords (cerah, berawan, hujan, …) the frontend icon picker matches on.
    private function describeCode(int $code): string
    {
        return match (true) {
            $code === 0 => 'Cerah',
            $code === 1 => 'Cerah Berawan',
            $code === 2 => 'Berawan Sebagian',
            $code === 3 => 'Berawan',
            in_array($code, [45, 48]) => 'Kabut',
            in_array($code, [51, 53, 55, 56, 57]) => 'Gerimis',
            in_array($code, [61, 63, 66, 80, 81]) => 'Hujan',
            in_array($code, [65, 82]) => 'Hujan Lebat',
            in_array($code, [67]) => 'Hujan Beku',
            in_array($code, [71, 73, 75, 77, 85, 86]) => 'Salju',
            $code === 95 => 'Hujan Petir',
            in_array($code, [96, 99]) => 'Hujan Petir Lebat',
            default => 'Berawan',
        };
    }
}
