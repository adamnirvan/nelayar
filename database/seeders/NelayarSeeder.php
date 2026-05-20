<?php

namespace Database\Seeders;

use App\Models\FishPrice;
use App\Models\OceanData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NelayarSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedZppiZone();
        $this->seedForecast();
        $this->seedFishPrices();
    }

    private function seedZppiZone(): void
    {
        $today = now()->toDateString();

        $oceanData = OceanData::create([
            'data_date'  => $today,
            'lat_min'    => -11.0,
            'lat_max'    => 6.0,
            'lon_min'    => 95.0,
            'lon_max'    => 141.0,
            'source'     => 'CMEMS-seed',
            'fetched_at' => now(),
        ]);

        // Banda Sea + Java Sea demo zones (simplified boxes)
        $multipolygon = json_encode([
            'type' => 'MultiPolygon',
            'coordinates' => [
                // Banda Sea zone
                [[[124.0, -6.0], [128.0, -6.0], [128.0, -3.0], [124.0, -3.0], [124.0, -6.0]]],
                // Java Sea zone
                [[[107.0, -6.5], [112.0, -6.5], [112.0, -4.0], [107.0, -4.0], [107.0, -6.5]]],
                // Flores Sea zone
                [[[118.0, -9.0], [123.0, -9.0], [123.0, -6.5], [118.0, -6.5], [118.0, -9.0]]],
            ],
        ]);

        DB::statement("
            INSERT INTO zppi_zones
                (ocean_data_id, zone_date, sst_min, sst_max, chl_threshold, confidence, geom, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromGeoJSON(?), now(), now())
        ", [$oceanData->id, $today, 26.0, 30.0, 0.2, 0.72, $multipolygon]);
    }

    private function seedForecast(): void
    {
        $today = now()->toDateString();

        $oceanData = OceanData::create([
            'data_date'  => $today,
            'lat_min'    => -11.0,
            'lat_max'    => 6.0,
            'lon_min'    => 95.0,
            'lon_max'    => 141.0,
            'source'     => 'CMEMS-forecast-seed',
            'fetched_at' => now(),
        ]);

        // Slightly shift the zone each day to simulate movement
        for ($offset = 1; $offset <= 10; $offset++) {
            $forecastDate = now()->addDays($offset)->toDateString();
            $shift        = $offset * 0.3; // degrees east per day
            $confidence   = round(max(0.3, 0.72 - $offset * 0.04), 2);

            $multipolygon = json_encode([
                'type' => 'MultiPolygon',
                'coordinates' => [
                    [[
                        [124.0 + $shift, -6.0],
                        [128.0 + $shift, -6.0],
                        [128.0 + $shift, -3.0],
                        [124.0 + $shift, -3.0],
                        [124.0 + $shift, -6.0],
                    ]],
                ],
            ]);

            DB::statement("
                INSERT INTO zppi_forecast
                    (ocean_data_id, forecast_date, day_offset, confidence, geom, created_at, updated_at)
                VALUES (?, ?, ?, ?, ST_GeomFromGeoJSON(?), now(), now())
            ", [$oceanData->id, $forecastDate, $offset, $confidence, $multipolygon]);
        }
    }

    private function seedFishPrices(): void
    {
        $today = now()->toDateString();

        $rows = [
            // Ikan Tongkol
            ['Ikan Tongkol', 'Jawa Timur',    'Surabaya',    'Jawa',      38000,  2.1],
            ['Ikan Tongkol', 'Jawa Tengah',   'Semarang',    'Jawa',      36500, -0.5],
            ['Ikan Tongkol', 'DKI Jakarta',   null,          'Jawa',      42000,  1.8],
            ['Ikan Tongkol', 'Sulawesi Sel.', 'Makassar',    'Sulawesi',  34000,  0.0],
            ['Ikan Tongkol', 'Kalimantan Sel.','Banjarmasin', 'Kalimantan',37000,  3.2],
            // Ikan Kembung
            ['Ikan Kembung', 'Jawa Timur',    'Gresik',      'Jawa',      32000,  1.5],
            ['Ikan Kembung', 'Jawa Barat',    'Indramayu',   'Jawa',      30000, -1.0],
            ['Ikan Kembung', 'DKI Jakarta',   null,          'Jawa',      35000,  2.0],
            ['Ikan Kembung', 'Sulawesi Sel.', 'Makassar',    'Sulawesi',  28000,  0.5],
            ['Ikan Kembung', 'Maluku',        'Ambon',       'Timur',     27500,  0.0],
            // Ikan Bandeng
            ['Ikan Bandeng', 'Jawa Tengah',   'Pati',        'Jawa',      28000,  0.8],
            ['Ikan Bandeng', 'Jawa Timur',    'Sidoarjo',    'Jawa',      29500,  1.2],
            ['Ikan Bandeng', 'Sulawesi Sel.', 'Pangkep',     'Sulawesi',  25000, -0.3],
            ['Ikan Bandeng', 'Kalimantan Sel.','Banjarmasin', 'Kalimantan',27000,  0.0],
            // Ikan Teri
            ['Ikan Teri',    'Jawa Tengah',   'Rembang',     'Jawa',      45000,  3.5],
            ['Ikan Teri',    'Jawa Timur',    'Lamongan',    'Jawa',      43000,  2.0],
            ['Ikan Teri',    'Sulawesi Sel.', 'Makassar',    'Sulawesi',  40000,  1.0],
            ['Ikan Teri',    'Maluku',        'Ambon',       'Timur',     38000, -0.5],
            // Udang Basah
            ['Udang Basah',  'Jawa Timur',    'Banyuwangi',  'Jawa',      65000,  4.2],
            ['Udang Basah',  'Sulawesi Sel.', 'Makassar',    'Sulawesi',  60000,  2.8],
            ['Udang Basah',  'Kalimantan Sel.','Kotabaru',    'Kalimantan',62000,  1.5],
            ['Udang Basah',  'Maluku',        'Ambon',       'Timur',     58000,  0.0],
        ];

        foreach ($rows as [$commodity, $province, $regency, $regionGroup, $price, $changePct]) {
            FishPrice::updateOrCreate(
                [
                    'commodity'  => $commodity,
                    'province'   => $province,
                    'regency'    => $regency,
                    'price_date' => $today,
                ],
                [
                    'region_group'    => $regionGroup,
                    'price'           => $price,
                    'price_change_pct'=> $changePct,
                    'period'          => now()->format('M Y'),
                    'source'          => 'mi.kkp.go.id',
                    'scraped_at'      => now(),
                ]
            );
        }
    }
}
