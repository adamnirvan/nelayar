<?php

namespace Database\Seeders;

use App\Models\FishPrice;
use Illuminate\Database\Seeder;

class NelayarSeeder extends Seeder
{
    public function run(): void
    {
        // Fungsi seedZppiZone() dan seedForecast() dummy milik Brian dibuang
        // karena sistem parsing GeoJSON dari microservice Python sudah bekerja sempurna.
        
        $this->seedFishPrices();
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