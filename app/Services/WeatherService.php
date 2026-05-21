<?php

namespace App\Services;

use App\Models\WeatherCache;
use Carbon\Carbon;
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
        $station  = $this->nearestStation($lat, $lon);
        $response = Http::timeout(15)->get(
            'https://api.bmkg.go.id/publik/prakiraan-cuaca',
            ['adm4' => $station['adm4']]
        );

        if (! $response->ok()) {
            throw new \Exception("BMKG returned HTTP {$response->status()} for adm4 {$station['adm4']}");
        }

        $cuaca = data_get($response->json(), 'data.0.cuaca', []);
        if (empty($cuaca)) {
            throw new \Exception("BMKG returned no forecast data for adm4 {$station['adm4']}");
        }

        $slot = $this->currentSlot($cuaca);

        return [
            'source'         => 'bmkg',
            'wind_speed'     => (float) data_get($slot, 'ws', 0),
            'wind_direction' => data_get($slot, 'wd', '-'),
            'wave_height'    => 0,
            'temperature'    => (float) data_get($slot, 't', 0),
            'humidity'       => data_get($slot, 'hu'),
            'weather_desc'   => data_get($slot, 'weather_desc'),
            'fetched_at'     => now()->toISOString(),
        ];
    }

    // Flatten all forecast slots and return the one closest to the current UTC time.
    private function currentSlot(array $cuaca): array
    {
        $now  = now()->utc();
        $best = null;
        $min  = PHP_INT_MAX;

        foreach ($cuaca as $day) {
            foreach ($day as $slot) {
                $dt   = Carbon::parse(data_get($slot, 'utc_datetime', ''), 'UTC');
                $diff = abs($now->diffInSeconds($dt));
                if ($diff < $min) {
                    $min  = $diff;
                    $best = $slot;
                }
            }
        }

        return $best ?? data_get($cuaca, '0.0', []);
    }

    private function nearestStation(float $lat, float $lon): array
    {
        $best     = self::STATIONS[0];
        $bestDist = PHP_FLOAT_MAX;

        foreach (self::STATIONS as $s) {
            $d = ($s['lat'] - $lat) ** 2 + ($s['lon'] - $lon) ** 2;
            if ($d < $bestDist) {
                $bestDist = $d;
                $best     = $s;
            }
        }

        return $best;
    }

    // adm4 codes from Keputusan Mendagri No. 100.1.1-6117/2022.
    // Coordinates are the actual kelurahan centroid returned by the BMKG API.
    // Nearest-neighbor selection: any lat/lon is matched to the closest entry.
    const STATIONS = [
        ['adm4' => '11.71.06.2001', 'lat' =>   5.561, 'lon' =>  95.315], // Banda Aceh
        ['adm4' => '12.71.01.1001', 'lat' =>   3.584, 'lon' =>  98.685], // Medan
        ['adm4' => '13.71.01.1001', 'lat' =>  -0.950, 'lon' => 100.350], // Padang
        ['adm4' => '14.71.01.1001', 'lat' =>   0.507, 'lon' => 101.448], // Pekanbaru
        ['adm4' => '15.71.01.1001', 'lat' =>  -1.610, 'lon' => 103.614], // Jambi
        ['adm4' => '16.71.01.1001', 'lat' =>  -2.990, 'lon' => 104.756], // Palembang
        ['adm4' => '17.71.01.1001', 'lat' =>  -3.800, 'lon' => 102.266], // Bengkulu
        ['adm4' => '18.71.01.1001', 'lat' =>  -5.422, 'lon' => 105.260], // Bandar Lampung
        ['adm4' => '19.71.01.1001', 'lat' =>  -2.130, 'lon' => 106.120], // Pangkal Pinang
        ['adm4' => '21.75.01.1001', 'lat' =>   1.140, 'lon' => 104.030], // Batam (Kepri)
        ['adm4' => '31.71.01.1001', 'lat' =>  -6.176, 'lon' => 106.827], // Jakarta Pusat
        ['adm4' => '32.73.06.1001', 'lat' =>  -6.920, 'lon' => 107.610], // Bandung
        ['adm4' => '33.74.01.1001', 'lat' =>  -6.984, 'lon' => 110.419], // Semarang
        ['adm4' => '34.71.01.1001', 'lat' =>  -7.800, 'lon' => 110.370], // Yogyakarta
        ['adm4' => '35.78.01.1001', 'lat' =>  -7.250, 'lon' => 112.750], // Surabaya
        ['adm4' => '36.71.01.1001', 'lat' =>  -6.173, 'lon' => 106.632], // Tangerang (Banten)
        ['adm4' => '51.71.01.1001', 'lat' =>  -8.736, 'lon' => 115.232], // Denpasar
        ['adm4' => '52.72.01.1001', 'lat' =>  -8.580, 'lon' => 116.120], // Mataram
        ['adm4' => '53.71.01.1001', 'lat' => -10.176, 'lon' => 123.553], // Kupang
        ['adm4' => '61.75.01.1001', 'lat' =>  -0.030, 'lon' => 109.330], // Pontianak
        ['adm4' => '62.71.01.1001', 'lat' =>  -2.200, 'lon' => 113.950], // Palangkaraya
        ['adm4' => '63.71.01.1001', 'lat' =>  -3.356, 'lon' => 114.547], // Banjarmasin
        ['adm4' => '64.72.01.1001', 'lat' =>  -0.572, 'lon' => 117.177], // Samarinda
        ['adm4' => '65.03.01.2001', 'lat' =>   2.840, 'lon' => 117.380], // Tanjung Selor (Kaltara)
        ['adm4' => '71.71.01.1001', 'lat' =>   1.544, 'lon' => 124.842], // Manado
        ['adm4' => '72.71.01.1001', 'lat' =>  -0.900, 'lon' => 119.870], // Palu
        ['adm4' => '73.71.01.1001', 'lat' =>  -5.162, 'lon' => 119.404], // Makassar
        ['adm4' => '74.71.01.1001', 'lat' =>  -3.980, 'lon' => 122.520], // Kendari
        ['adm4' => '75.71.01.1001', 'lat' =>   0.547, 'lon' => 123.005], // Gorontalo
        ['adm4' => '81.71.03.1001', 'lat' =>  -3.690, 'lon' => 128.180], // Ambon
        ['adm4' => '82.72.01.1001', 'lat' =>   0.656, 'lon' => 127.439], // Tidore (Maluku Utara)
        ['adm4' => '91.03.01.2001', 'lat' =>  -0.860, 'lon' => 134.070], // Manokwari (Papua Barat)
        ['adm4' => '91.71.01.1001', 'lat' =>  -2.526, 'lon' => 140.657], // Jayapura
    ];

    private function fetchOpenMeteo(float $lat, float $lon): array
    {
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
