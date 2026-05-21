<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Baca file JSON hasil tembakan satelitmu
        $jsonPath = resource_path('js/data/sample_zppi.json');

        if (!File::exists($jsonPath)) {
            $this->command->error("File JSON tidak ditemukan di: {$jsonPath}");
            return;
        }

        $jsonContent = json_decode(File::get($jsonPath), true);
        
        // Cek struktur JSON (bisa langsung array features atau di dalam properti geojson)
        $features = $jsonContent['features'] ?? ($jsonContent['geojson']['features'] ?? []);

        if (empty($features)) {
            $this->command->error("Data fitur GeoJSON kosong!");
            return;
        }

        // 2. Buat data parent di ocean_data agar Foreign Key constraint tidak error
        // (Pastikan tabel ocean_data tidak punya kolom 'NOT NULL' lain selain ID. Jika ada, tambahkan di array ini)
        // 2. Buat data parent di ocean_data agar Foreign Key constraint tidak error
        // 2. Buat data parent di ocean_data menyesuaikan struktur tabel asli
        $oceanDataId = DB::table('ocean_data')->insertGetId([
            'data_date'  => Carbon::today()->toDateString(),
            'lat_min'    => -11.0, // Batas bawah koordinat (dummy Indonesia)
            'lat_max'    => 6.0,   // Batas atas
            'lon_min'    => 95.0,  // Batas kiri
            'lon_max'    => 141.0, // Batas kanan
            'sst_grid'   => json_encode([]), // Kosongkan grid sementara
            'chl_grid'   => json_encode([]), 
            'source'     => 'Copernicus CMEMS',
            'fetched_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 3. Looping data satelit dan konversi ke PostGIS Geometry
        foreach ($features as $feature) {
            $props = $feature['properties'] ?? [];
            $geomJson = json_encode($feature['geometry']);

            DB::table('zppi_zones')->insert([
                'ocean_data_id' => $oceanDataId,
                'zone_date' => Carbon::today()->toDateString(),
                'sst_min'       => $props['sst_min'] ?? 28.5,
                'sst_max'       => $props['sst_max'] ?? 30.5,
                'chl_threshold' => $props['chl_threshold'] ?? 0.2,
                'confidence'    => $props['confidence'] ?? 0.85,
                
                // ST_GeomFromGeoJSON: Mengubah string JSON ke format spasial PostGIS
                // ST_SetSRID: Mengunci sistem koordinat ke standar bumi/GPS (4326)
                // ST_Multi: Memaksa poligon menjadi MultiPolygon sesuai aturan struktur migrasi
                'geom'          => DB::raw("ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('{$geomJson}'), 4326))"),
                
                'created_at'    => Carbon::now(),
                'updated_at'    => Carbon::now(),
            ]);
        }

        $this->command->info('Data ZPPI dari satelit Copernicus berhasil disuntikkan secara organik!');
    }
}