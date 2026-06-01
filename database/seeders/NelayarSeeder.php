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

    /**
     * Contoh komposisi ikan per zona. Mengikuti bentuk payload yang
     * dihasilkan microservice/parse_zppi.py (kolom JSON 'ikan_cocok').
     *
     * @return list<array<string, mixed>>
     */
    private function sampleIkanCocok(): array
    {
        return [
            [
                'nama_lokal'  => 'Cakalang',
                'nama_lain'   => 'Skipjack Tuna',
                'nama_ilmiah' => 'Katsuwonus pelamis',
                'confidence'  => 0.82,
                'image_path'  => 'fish/cakalang.png',
            ],
            [
                'nama_lokal'  => 'Tongkol',
                'nama_lain'   => 'Mackerel Tuna',
                'nama_ilmiah' => 'Euthynnus affinis',
                'confidence'  => 0.71,
                'image_path'  => 'fish/tongkol.png',
            ],
        ];
    }

    /**
     * Seed zona ZPPI hari ini langsung ke tabel zppi_zones dengan skema terbaru
     * (ikan_cocok JSON + sst_rata/chl_rata), bukan kolom lama sst_min dkk.
     */
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

        // Banda Sea + Java Sea + Flores Sea demo zones (simplified boxes)
        $zones = [
            // [geometry coordinates, sst_rata, chl_rata, confidence]
            [[[[124.0, -6.0], [128.0, -6.0], [128.0, -3.0], [124.0, -3.0], [124.0, -6.0]]], 28.4, 0.31, 0.72],
            [[[[107.0, -6.5], [112.0, -6.5], [112.0, -4.0], [107.0, -4.0], [107.0, -6.5]]], 29.1, 0.24, 0.68],
            [[[[118.0, -9.0], [123.0, -9.0], [123.0, -6.5], [118.0, -6.5], [118.0, -9.0]]], 27.6, 0.28, 0.65],
        ];

        foreach ($zones as [$coordinates, $sstRata, $chlRata, $confidence]) {
            $multipolygon = json_encode([
                'type'        => 'MultiPolygon',
                'coordinates' => [$coordinates],
            ]);

            DB::statement("
                INSERT INTO zppi_zones
                    (ocean_data_id, zone_date, ikan_cocok, sst_rata, chl_rata, confidence, geom, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromGeoJSON(?), now(), now())
            ", [
                $oceanData->id,
                $today,
                json_encode($this->sampleIkanCocok()),
                $sstRata,
                $chlRata,
                $confidence,
                $multipolygon,
            ]);
        }
    }

    /**
     * Seed data forecast H+1 sampai H+9. Arsitektur baru menyimpan forecast
     * sebagai baris zppi_zones bertanggal masa depan (zone_date), bukan di
     * tabel zppi_forecast lama yang sudah dihapus. Lihat SyncOceanForecast.
     */
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
        for ($offset = 1; $offset <= 9; $offset++) {
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
                INSERT INTO zppi_zones
                    (ocean_data_id, zone_date, ikan_cocok, sst_rata, chl_rata, confidence, geom, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromGeoJSON(?), now(), now())
            ", [
                $oceanData->id,
                $forecastDate,
                json_encode($this->sampleIkanCocok()),
                28.4,
                0.31,
                $confidence,
                $multipolygon,
            ]);
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
