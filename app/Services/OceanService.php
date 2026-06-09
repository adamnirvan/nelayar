<?php

namespace App\Services;

use App\Models\OceanData;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class OceanService
{
    /**
     * Fetch CMEMS data for $date, store rasters + ZPPI zones.
     *
     * @param  string  $date  Tanggal target (Y-m-d).
     * @param  callable|null  $onProgress  Dipanggil per-baris log diagnostik dari parse_zppi.py (stderr).
     * @return int Jumlah zona (features) yang berhasil disimpan ke zppi_zones.
     *
     * @throws \RuntimeException Jika parser Python gagal atau mengembalikan error.
     */
    public function fetchAndStore(string $date, ?callable $onProgress = null): int
    {
        $data = $this->computeFeatures($date, $onProgress);

        return $this->storeFeatures($date, $data);
    }

    /**
     * Profil ikan (envelope SST/Chl) yang dikirim ke parse_zppi.py.
     * Diekstrak agar bisa dipakai ulang oleh perintah ocean:export-profiles
     * (worker CI mengambil profil ini via SSH lalu menghitung di luar server).
     */
    public function fishProfilesPayload(): array
    {
        return DB::table('fish_profiles')
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
    }

    /**
     * Jalankan parse_zppi.py untuk $date dan kembalikan payload terdekode
     * (geojson + path raster + confidence). Bagian BERAT (download CMEMS,
     * numpy/scipy/matplotlib). Dipisah dari storeFeatures() agar mesin ringan
     * (server produksi) bisa hanya menjalankan ingest, sementara komputasi
     * dijalankan di GitHub Actions. Lihat .github/workflows/ocean-sync.yml.
     *
     * @return array{geojson: array, sst_file_path: ?string, chl_file_path: ?string, confidence: float}
     *
     * @throws \RuntimeException
     */
    public function computeFeatures(string $date, ?callable $onProgress = null): array
    {
        $pythonPath = base_path(env('PYTHON_PATH', 'python3'));
        $scriptPath = base_path('microservice/parse_zppi.py');

        $fishJson = escapeshellarg(json_encode($this->fishProfilesPayload()));

        $result = Process::forever()->run(
            "{$pythonPath} {$scriptPath} --date {$date} --fish-profiles {$fishJson}",
            function (string $type, string $buffer) use ($onProgress) {
                // parse_zppi.py menulis diagnostik ke stderr; stdout dikhususkan untuk JSON.
                if ($onProgress === null || $type !== 'err') {
                    return;
                }
                foreach (preg_split('/\r\n|\r|\n/', $buffer) as $line) {
                    if (trim($line) !== '') {
                        $onProgress(rtrim($line));
                    }
                }
            }
        );

        if ($result->failed()) {
            Log::error('ZPPI parse failed', ['date' => $date, 'error' => $result->errorOutput()]);
            throw new \RuntimeException("Parser Python gagal untuk {$date}: ".$result->errorOutput());
        }

        $data = json_decode($result->output(), true);

        if (json_last_error() !== JSON_ERROR_NONE || ! empty($data['error'])) {
            $msg = $data['error'] ?? 'Invalid JSON';
            Log::error('ZPPI Python error', ['date' => $date, 'error' => $msg]);
            throw new \RuntimeException("Parser Python error untuk {$date}: {$msg}");
        }

        return $data;
    }

    /**
     * Simpan payload hasil parse_zppi.py (geojson + path raster) ke
     * ocean_data + zppi_zones. Bagian RINGAN: hanya INSERT PostGIS dengan
     * clipping daratan (ST_Difference) — tanpa Python. Dipanggil oleh
     * fetchAndStore() (mesin penuh) maupun ocean:ingest (server produksi yang
     * menerima hasil komputasi dari CI).
     *
     * @param  array{geojson?: array, sst_file_path?: ?string, chl_file_path?: ?string, confidence?: float}  $data
     * @return int Jumlah zona tersimpan.
     *
     * @throws \RuntimeException
     */
    public function storeFeatures(string $date, array $data): int
    {
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
            $inserted = 0;

            foreach ($features as $feature) {
                $geom = $feature['geometry'] ?? null;
                $props = $feature['properties'] ?? [];
                if (! $geom) {
                    continue;
                }

                // Buat variabel ini dulu di atas DB::statement
                $rawGeom = json_encode($geom);

                // INSERT MURNI KE KOLOM MASING-MASING DENGAN CLIPPING SUPER AKURAT
                DB::statement('
                    INSERT INTO zppi_zones
                        (ocean_data_id, zone_date, ikan_cocok, sst_rata, chl_rata, confidence, geom, created_at, updated_at)
                    VALUES (?, ?, ?::jsonb, ?, ?, ?, 
                        ST_Multi(
                            ST_Difference(
                                ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)),
                                COALESCE(
                                    (SELECT ST_Union(ST_MakeValid(lb.geom)) 
                                     FROM land_boundaries lb 
                                     WHERE ST_Intersects(lb.geom, ST_SetSRID(ST_GeomFromGeoJSON(?), 4326))),
                                    ST_GeomFromText(\'GEOMETRYCOLLECTION EMPTY\', 4326)
                                )
                            )
                        ), 
                    now(), now())
                ', [
                    $oceanData->id,
                    $date,
                    json_encode($props['ikan_cocok'] ?? []),
                    $props['sst_rata'] ?? null,
                    $props['chl_rata'] ?? null,
                    $data['confidence'] ?? 1.0,
                    $rawGeom, // Placeholder ke-7: Untuk target yang mau dipotong
                    $rawGeom,  // Placeholder ke-8: Untuk mencari pulau yang tertabrak
                ]);
                $inserted++;
            }
            DB::commit();

            if ($inserted === 0) {
                Log::warning('ZPPI: 0 zona tersimpan', [
                    'date' => $date,
                    'fish_profiles' => DB::table('fish_profiles')->count(),
                ]);
            }

            return $inserted;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ZPPI DB Error', ['date' => $date, 'error' => $e->getMessage()]);
            throw new \RuntimeException("Gagal menyimpan zona untuk {$date}: ".$e->getMessage(), 0, $e);
        }
    }

    public function getGeoJsonByDate(string $date): array
    {
        $oceanData = DB::table('ocean_data')->where('data_date', $date)->first();

        // Peta hanya menampilkan MARKER di titik pusat tiap zona; poligon penuh
        // baru dibutuhkan saat satu zona diklik (lihat getZoneById). Maka di sini
        // kita kirim centroid (ST_PointOnSurface, dijamin berada di dalam zona)
        // + propertinya saja. Ini memangkas payload awal dari ~1 MB poligon
        // menjadi ratusan KB titik, sehingga FCP/LCP & parsing klien jauh lebih ringan.
        $rows = DB::select('
            SELECT id, ST_X(pt) AS lng, ST_Y(pt) AS lat, confidence, ikan_cocok, sst_rata, chl_rata, zone_date::text
            FROM (
                SELECT id, ST_PointOnSurface(geom) AS pt, confidence, ikan_cocok, sst_rata, chl_rata, zone_date, created_at
                FROM zppi_zones
                WHERE zone_date = ?
            ) s
            ORDER BY created_at DESC
        ', [$date]);

        if (empty($rows)) {
            return ['type' => 'FeatureCollection', 'features' => [], 'sst_file_path' => null, 'chl_file_path' => null];
        }

        $features = array_map(function ($row) {
            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [(float) $row->lng, (float) $row->lat],
                ],
                'properties' => [
                    'id' => $row->id, // dipakai frontend untuk mengambil poligon penuh saat diklik
                    'confidence' => $row->confidence,
                    'zone_date' => $row->zone_date,
                    'ikan_cocok' => json_decode($row->ikan_cocok, true) ?? [],
                    'sst_rata' => $row->sst_rata, // Langsung mapping dari DB
                    'chl_rata' => $row->chl_rata, // Langsung mapping dari DB
                ],
            ];
        }, $rows);

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
            'sst_file_path' => $oceanData?->sst_file_path ? asset($oceanData->sst_file_path) : null,
            'chl_file_path' => $oceanData?->chl_file_path ? asset($oceanData->chl_file_path) : null,
        ];
    }

    /**
     * Ambil SEMUA zona untuk satu tanggal lengkap dengan poligon penuhnya,
     * dalam satu respons. Dipakai oleh sinkronisasi offline (Phase 2): klien
     * mengunduh seluruh poligon H+0..H+9 sekali saat masih ada sinyal di darat,
     * lalu menyimpannya di IndexedDB agar peta tetap bisa digambar di laut.
     *
     * Berbeda dengan getGeoJsonByDate (centroid saja, untuk muatan awal yang
     * ringan): di sini geometri berat memang sengaja dikirim. Tiap feature juga
     * membawa properti `centroid` ([lng, lat] via ST_PointOnSurface) supaya klien
     * bisa membangun ulang lapisan marker tanpa menghitung sendiri.
     */
    public function getAllZonesByDate(string $date): array
    {
        $rows = DB::select('
            SELECT id, ST_AsGeoJSON(geom) AS geojson,
                   ST_X(ST_PointOnSurface(geom)) AS lng,
                   ST_Y(ST_PointOnSurface(geom)) AS lat,
                   confidence, ikan_cocok, sst_rata, chl_rata, zone_date::text AS zone_date
            FROM zppi_zones
            WHERE zone_date = ?
            ORDER BY created_at DESC
        ', [$date]);

        $features = array_map(function ($row) {
            return [
                'type' => 'Feature',
                'geometry' => json_decode($row->geojson, true),
                'properties' => [
                    'id' => (int) $row->id,
                    'confidence' => $row->confidence,
                    'zone_date' => $row->zone_date,
                    'ikan_cocok' => json_decode($row->ikan_cocok, true) ?? [],
                    'sst_rata' => $row->sst_rata,
                    'chl_rata' => $row->chl_rata,
                    'centroid' => [(float) $row->lng, (float) $row->lat],
                ],
            ];
        }, $rows);

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];
    }

    /**
     * Ambil satu zona lengkap dengan geometri poligonnya (GeoJSON Feature).
     * Dipanggil lazy oleh frontend saat sebuah marker zona diklik, sehingga
     * geometri berat tidak ikut dikirim pada muatan awal peta.
     */
    public function getZoneById(int $id): ?array
    {
        $row = DB::selectOne('
            SELECT ST_AsGeoJSON(geom) AS geojson, confidence, ikan_cocok, sst_rata, chl_rata, zone_date::text
            FROM zppi_zones
            WHERE id = ?
        ', [$id]);

        if (! $row) {
            return null;
        }

        return [
            'type' => 'Feature',
            'geometry' => json_decode($row->geojson, true),
            'properties' => [
                'id' => $id,
                'confidence' => $row->confidence,
                'zone_date' => $row->zone_date,
                'ikan_cocok' => json_decode($row->ikan_cocok, true) ?? [],
                'sst_rata' => $row->sst_rata,
                'chl_rata' => $row->chl_rata,
            ],
        ];
    }
}
