<?php

namespace App\Services;

use App\Models\WeatherCache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherService
{
    const TTL_MINUTES = 60;

    public function get(float $lat, float $lon): array
    {
        $cached = WeatherCache::where('latitude', $lat)
            ->where('longitude', $lon)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            return $cached->active_source === 'bmkg'
                ? $cached->bmkg_data
                : $cached->openmeteo_data;
        }

        try {
            $data   = $this->fetchBmkg($lat, $lon);
            $source = 'bmkg';
        } catch (\Exception $e) {
            Log::warning('BMKG fetch failed, falling back to Open-Meteo', [
                'lat'   => $lat,
                'lon'   => $lon,
                'error' => $e->getMessage(),
            ]);
            $data   = $this->fetchOpenMeteo($lat, $lon);
            $source = 'openmeteo';
        }

        WeatherCache::updateOrCreate(
            ['latitude' => $lat, 'longitude' => $lon],
            [
                "{$source}_data" => $data,
                'active_source'  => $source,
                'fetched_at'     => now(),
                'expires_at'     => now()->addMinutes(self::TTL_MINUTES),
            ]
        );

        return $data;
    }

    private function fetchBmkg(float $lat, float $lon): array
    {
        // BMKG prakiraan-cuaca endpoint; adm4 accepts coordinate pair for nearest station lookup
        $response = Http::timeout(10)->get(
            "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={$lat},{$lon}"
        );

        if (! $response->ok()) {
            throw new \Exception("BMKG returned HTTP {$response->status()}");
        }

        $json = $response->json();

        // BMKG response shape: data[0].cuaca[0][0] holds the nearest forecast slot
        $slot = data_get($json, 'data.0.cuaca.0.0', []);

        if (empty($slot)) {
            throw new \Exception('BMKG response contained no forecast slot');
        }

        return [
            'source'         => 'bmkg',
            'wind_speed'     => data_get($slot, 'ws_knot', 0),
            'wind_direction' => data_get($slot, 'wd', '-'),
            'wave_height'    => 0, // BMKG prakiraan-cuaca does not expose wave height
            'temperature'    => data_get($slot, 't', 0),
            'humidity'       => data_get($slot, 'hu', null),
            'weather_desc'   => data_get($slot, 'weather_desc', null),
            'fetched_at'     => now()->toISOString(),
        ];
    }

    private function fetchOpenMeteo(float $lat, float $lon): array
    {
        // Standard forecast for atmospheric variables
        $forecast = Http::timeout(10)->get('https://api.open-meteo.com/v1/forecast', [
            'latitude'      => $lat,
            'longitude'     => $lon,
            'hourly'        => 'temperature_2m,windspeed_10m,winddirection_10m,relativehumidity_2m',
            'forecast_days' => 1,
            'timezone'      => 'Asia/Jakarta',
        ]);

        if (! $forecast->ok()) {
            throw new \Exception("Open-Meteo forecast returned HTTP {$forecast->status()}");
        }

        // Marine API for wave height (separate endpoint)
        $waveHeight = 0;
        try {
            $marine = Http::timeout(10)->get('https://marine-api.open-meteo.com/v1/marine', [
                'latitude'      => $lat,
                'longitude'     => $lon,
                'hourly'        => 'wave_height',
                'forecast_days' => 1,
            ]);

            if ($marine->ok()) {
                $waveHeight = data_get($marine->json(), 'hourly.wave_height.0', 0);
            }
        } catch (\Exception) {
            // Wave height is optional — proceed without it
        }

        $json = $forecast->json();

        return [
            'source'         => 'openmeteo',
            'wind_speed'     => data_get($json, 'hourly.windspeed_10m.0', 0),
            'wind_direction' => data_get($json, 'hourly.winddirection_10m.0', 0) . '°',
            'wave_height'    => $waveHeight,
            'temperature'    => data_get($json, 'hourly.temperature_2m.0', 0),
            'humidity'       => data_get($json, 'hourly.relativehumidity_2m.0', null),
            'weather_desc'   => null,
            'fetched_at'     => now()->toISOString(),
        ];
    }
}
