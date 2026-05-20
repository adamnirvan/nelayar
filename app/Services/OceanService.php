<?php

namespace App\Services;

use App\Models\OceanData;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class OceanService
{
    public function fetchAndStore(string $date): void
    {
        $pythonPath = env('PYTHON_PATH', 'python3');
        $scriptPath = base_path('microservice/parse_zppi.py');

        $result = Process::run(
            "{$pythonPath} {$scriptPath} --date {$date}"
        );

        if ($result->failed()) {
            Log::error('ZPPI parse failed', [
                'date'  => $date,
                'error' => $result->errorOutput(),
            ]);
            return;
        }

        $data = json_decode($result->output(), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('ZPPI parse returned invalid JSON', [
                'date'   => $date,
                'output' => $result->output(),
            ]);
            return;
        }

        if (isset($data['error'])) {
            Log::warning('ZPPI parse completed with error', [
                'date'  => $date,
                'error' => $data['error'],
            ]);
        }

        $oceanData = OceanData::create([
            'data_date'  => $date,
            'source'     => 'CMEMS',
            'fetched_at' => now(),
        ]);

        $features = $data['geojson']['features'] ?? [];

        if (empty($features)) {
            Log::info('ZPPI parse returned no features for date', ['date' => $date]);
            return;
        }

        foreach ($features as $feature) {
            $geom = $feature['geometry'] ?? null;
            if (! $geom) {
                continue;
            }

            DB::statement("
                INSERT INTO zppi_zones
                    (ocean_data_id, zone_date, sst_min, sst_max, chl_threshold, confidence, geom, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromGeoJSON(?), now(), now())
            ", [
                $oceanData->id,
                $date,
                $data['sst_min'],
                $data['sst_max'],
                $data['chl_threshold'],
                $data['confidence'],
                json_encode($geom),
            ]);
        }
    }

    public function fetchAndStoreForecast(string $baseDate): void
    {
        $pythonPath = env('PYTHON_PATH', 'python3');
        $scriptPath = base_path('microservice/parse_forecast.py');

        $result = Process::run(
            "{$pythonPath} {$scriptPath} --date {$baseDate}"
        );

        if ($result->failed()) {
            Log::error('Forecast parse failed', [
                'date'  => $baseDate,
                'error' => $result->errorOutput(),
            ]);
            return;
        }

        $entries = json_decode($result->output(), true);

        if (json_last_error() !== JSON_ERROR_NONE || ! is_array($entries)) {
            Log::error('Forecast parse returned invalid JSON', [
                'date'   => $baseDate,
                'output' => $result->output(),
            ]);
            return;
        }

        // One OceanData record anchors the entire 10-day run
        $oceanData = OceanData::create([
            'data_date'  => $baseDate,
            'source'     => 'CMEMS-forecast',
            'fetched_at' => now(),
        ]);

        foreach ($entries as $entry) {
            if (isset($entry['error'])) {
                Log::warning('Forecast entry error', [
                    'day_offset'    => $entry['day_offset'],
                    'forecast_date' => $entry['forecast_date'],
                    'error'         => $entry['error'],
                ]);
            }

            $features = $entry['geojson']['features'] ?? [];

            if (empty($features)) {
                continue;
            }

            foreach ($features as $feature) {
                $geom = $feature['geometry'] ?? null;
                if (! $geom) {
                    continue;
                }

                DB::statement("
                    INSERT INTO zppi_forecast
                        (ocean_data_id, forecast_date, day_offset, confidence, geom, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ST_GeomFromGeoJSON(?), now(), now())
                ", [
                    $oceanData->id,
                    $entry['forecast_date'],
                    $entry['day_offset'],
                    $entry['confidence'],
                    json_encode($geom),
                ]);
            }
        }
    }

    public function getTodayGeoJson(): array
    {
        $rows = DB::select("
            SELECT ST_AsGeoJSON(geom) as geojson, confidence, zone_date::text
            FROM zppi_zones
            WHERE zone_date = CURRENT_DATE
            ORDER BY created_at DESC
        ");

        if (empty($rows)) {
            return ['type' => 'FeatureCollection', 'features' => []];
        }

        $features = array_map(fn($row) => [
            'type'       => 'Feature',
            'geometry'   => json_decode($row->geojson, true),
            'properties' => [
                'confidence' => $row->confidence,
                'zone_date'  => $row->zone_date,
            ],
        ], $rows);

        return ['type' => 'FeatureCollection', 'features' => $features];
    }

    public function getForecastGeoJson(string $date): array
    {
        $rows = DB::select("
            SELECT ST_AsGeoJSON(geom) as geojson, confidence, forecast_date::text, day_offset
            FROM zppi_forecast
            WHERE forecast_date = ?
            ORDER BY created_at DESC
        ", [$date]);

        if (empty($rows)) {
            return ['type' => 'FeatureCollection', 'features' => []];
        }

        $features = array_map(fn($row) => [
            'type'       => 'Feature',
            'geometry'   => json_decode($row->geojson, true),
            'properties' => [
                'confidence'    => $row->confidence,
                'forecast_date' => $row->forecast_date,
                'day_offset'    => $row->day_offset,
            ],
        ], $rows);

        return ['type' => 'FeatureCollection', 'features' => $features];
    }
}
