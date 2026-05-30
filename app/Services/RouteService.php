<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class RouteService
{
    /**
     * Hitung rute pelayaran (menghindari daratan) antara dua titik via searoute-py.
     *
     * @return array{ok?:bool, route?:array, distance?:float, units?:string, error?:string}
     */
    public function findRoute(float $startLat, float $startLng, float $endLat, float $endLng): array
    {
        // Rute laut bersifat statis untuk pasangan koordinat yang sama: cache di Redis
        // berdasarkan koordinat yang dibulatkan (~100 m) agar tidak men-spawn Python berulang.
        $cacheKey = sprintf('sea_route:%.3f,%.3f:%.3f,%.3f', $startLat, $startLng, $endLat, $endLng);

        if ($cached = Cache::get($cacheKey)) {
            return $cached;
        }

        // PYTHON_PATH bisa absolut (/usr/bin/python3) atau relatif terhadap root proyek
        // (microservice/.venv/bin/python). Tangani keduanya — hindari bug base_path()+absolut.
        $python = env('PYTHON_PATH', 'python3');
        $pythonPath = str_starts_with($python, '/') ? $python : base_path($python);
        $scriptPath = base_path('microservice/route_sea.py');

        $start = escapeshellarg("{$startLat},{$startLng}");
        $end = escapeshellarg("{$endLat},{$endLng}");

        $result = Process::timeout(60)->run("{$pythonPath} {$scriptPath} --start {$start} --end {$end}");

        if ($result->failed()) {
            Log::error('Sea route failed', ['error' => $result->errorOutput()]);

            return ['error' => 'Gagal menghitung rute pelayaran.'];
        }

        $data = json_decode($result->output(), true);

        if (json_last_error() !== JSON_ERROR_NONE || ! empty($data['error'])) {
            Log::error('Sea route Python error', [
                'error' => $data['error'] ?? 'Invalid JSON',
                'raw' => $result->output(),
            ]);

            return ['error' => $data['error'] ?? 'Respons rute tidak valid.'];
        }

        // Hanya cache hasil sukses (jangan cache kegagalan).
        Cache::put($cacheKey, $data, now()->addDay());

        return $data;
    }
}
