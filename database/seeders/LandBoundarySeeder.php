<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LandBoundarySeeder extends Seeder
{
    public function run()
    {
        $geojsonPath = storage_path('app/public/indonesia_land.geojson');
        $geojsonContent = file_get_contents($geojsonPath);
        
        // Ubah menjadi array PHP
        $features = json_decode($geojsonContent, true)['features'];

        // Looping untuk memasukkan SEMUA potongan daratan
        foreach ($features as $feature) {
            if (empty($feature['geometry'])) continue;

            $geometryJson = json_encode($feature['geometry']);

            DB::statement("
                INSERT INTO land_boundaries (name, geom) 
                VALUES ('Indonesia', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)))
            ", [$geometryJson]);
        }
    }
}