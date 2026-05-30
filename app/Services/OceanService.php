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
        $pythonPath = base_path(env('PYTHON_PATH', 'python3'));
        $scriptPath = base_path('microservice/parse_zppi.py');
     
        $fishProfiles = DB::table('fish_profiles')
        ->orderBy('id')
        ->get([
            'nama_lokal',
            'nama_lain',
            'nama_ilmiah',
            'sst_min',
            'sst_max',
            'chl_min',   
            'chl_max',   
            'image_path',
        ])
        ->toArray();
        $fishJson = escapeshellarg(json_encode($fishProfiles));
     
        $result = Process::timeout(600)->run("{$pythonPath} {$scriptPath} --date {$date} --fish-profiles {$fishJson}");
     
        if ($result->failed()) {
            Log::error('ZPPI parse failed', ['date' => $date, 'error' => $result->errorOutput()]);
            return;
        }
     
        $data = json_decode($result->output(), true);
     
        if (json_last_error() !== JSON_ERROR_NONE || !empty($data['error'])) {
            Log::error('ZPPI Python error', ['error' => $data['error'] ?? 'Invalid JSON']);
            return;
        }
     
        DB::beginTransaction();
        try {
            $oceanData = OceanData::updateOrCreate(
                ['data_date' => $date],
                [
                    'source' => 'CMEMS', 'lat_min' => -11.0, 'lat_max' => 6.0,
                    'lon_min' => 95.0,  'lon_max' => 141.0,
                    'sst_file_path' => $data['sst_file_path'] ?? null,
                    'chl_file_path' => $data['chl_file_path'] ?? null,
                    'fetched_at' => now(),
                ]
            );
     
            DB::table('zppi_zones')->where('ocean_data_id', $oceanData->id)->delete();
     
            $features = $data['geojson']['features'] ?? [];
     
            foreach ($features as $feature) {
                $geom  = $feature['geometry'] ?? null;
                $props = $feature['properties'] ?? [];
                if (!$geom) continue;

                // INSERT MURNI KE KOLOM MASING-MASING
                DB::statement("
                    INSERT INTO zppi_zones
                        (ocean_data_id, zone_date, ikan_cocok, sst_rata, chl_rata, confidence, geom, created_at, updated_at)
                    VALUES (?, ?, ?::jsonb, ?, ?, ?, ST_Multi(ST_GeomFromGeoJSON(?)), now(), now())
                ", [
                    $oceanData->id,
                    $date,
                    json_encode($props['ikan_cocok'] ?? []),
                    $props['sst_rata'] ?? null,
                    $props['chl_rata'] ?? null,
                    $data['confidence'] ?? 1.0,
                    json_encode($geom),
                ]);
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ZPPI DB Error', ['error' => $e->getMessage()]);
        }
    }

    public function getGeoJsonByDate(string $date): array
    {
        ini_set('memory_limit', '512M');
        $oceanData = DB::table('ocean_data')->where('data_date', $date)->first();

        // SELECT KOLOM MURNI
        $rows = DB::select("
            SELECT ST_AsGeoJSON(geom) as geojson, confidence, ikan_cocok, sst_rata, chl_rata, zone_date::text
            FROM zppi_zones
            WHERE zone_date = ? 
            ORDER BY created_at DESC
        ", [$date]);

        if (empty($rows)) {
            return ['type' => 'FeatureCollection', 'features' => [], 'sst_file_path' => null, 'chl_file_path' => null];
        }

        $features = array_map(function($row) {
            return [
                'type'       => 'Feature',
                'geometry'   => $row->geojson, 
                'properties' => [
                    'confidence' => $row->confidence,
                    'zone_date'  => $row->zone_date,
                    'ikan_cocok' => json_decode($row->ikan_cocok, true) ?? [], 
                    'sst_rata'   => $row->sst_rata, // Langsung mapping dari DB
                    'chl_rata'   => $row->chl_rata, // Langsung mapping dari DB
                ],
            ];
        }, $rows);

        return [
            'type'          => 'FeatureCollection', 
            'features'      => $features,
            'sst_file_path' => $oceanData?->sst_file_path ? asset($oceanData->sst_file_path) : null,
            'chl_file_path' => $oceanData?->chl_file_path ? asset($oceanData->chl_file_path) : null
        ];
    }
}