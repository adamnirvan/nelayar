<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FishProfileSeeder extends Seeder
{
    public function run(): void
    {
        $fishes = [

            //KELOMPOK IKAN PELAGIS KECIL (PESISIR)

            [
                'nama_lokal' => 'Kembung', 'nama_lain' => 'Indian Mackerel', 'nama_ilmiah' => 'Rastrelliger kanagurta',
                'sst_min' => 27.0, 'sst_max' => 31.0, 'chl_min' => 0.25, 'chl_max' => 1.50,
                'chl_required' => true, 'image_path' => 'fish/kembung.png',
            ],
            [
                'nama_lokal' => 'Layang', 'nama_lain' => 'Round Scad', 'nama_ilmiah' => 'Decapterus macarellus',
                'sst_min' => 27.5, 'sst_max' => 30.5, 'chl_min' => 0.20, 'chl_max' => 1.20,
                'chl_required' => true, 'image_path' => 'fish/layang.png',
            ],
            [
                'nama_lokal' => 'Lemuru', 'nama_lain' => 'Bali Sardinella', 'nama_ilmiah' => 'Sardinella lemuru',
                'sst_min' => 26.0, 'sst_max' => 29.0, 'chl_min' => 0.50, 'chl_max' => 2.50,
                'chl_required' => true, 'image_path' => 'fish/lemuru.png',
            ],
            [
                'nama_lokal' => 'Selar', 'nama_lain' => 'Yellowstripe Scad', 'nama_ilmiah' => 'Selaroides leptolepis',
                'sst_min' => 27.0, 'sst_max' => 30.5, 'chl_min' => 0.20, 'chl_max' => 1.20,
                'chl_required' => true, 'image_path' => 'fish/selar.png',
            ],
            [
                'nama_lokal' => 'Julung-Julung', 'nama_lain' => 'Garfish', 'nama_ilmiah' => 'Hemiramphus robustus',
                'sst_min' => 28.0, 'sst_max' => 31.0, 'chl_min' => 0.10, 'chl_max' => 0.80,
                'chl_required' => true, 'image_path' => 'fish/needlefish.png', // Atau sesuaikan jika nama gambarnya 'julung_julung.png'
            ],

            //KELOMPOK IKAN PELAGIS SEDANG (PERAIRAN TRANSISI)
            [
                'nama_lokal' => 'Tenggiri', 'nama_lain' => 'Spanish Mackerel', 'nama_ilmiah' => 'Scomberomorus commerson',
                'sst_min' => 27.0, 'sst_max' => 31.0, 'chl_min' => 0.15, 'chl_max' => 0.80,
                'chl_required' => true, 'image_path' => 'fish/tenggiri.png',
            ],
            [
                'nama_lokal' => 'Kuwe', 'nama_lain' => 'Giant Trevally', 'nama_ilmiah' => 'Caranx ignobilis',
                'sst_min' => 26.5, 'sst_max' => 30.5, 'chl_min' => 0.15, 'chl_max' => 1.00,
                'chl_required' => true, 'image_path' => 'fish/kuwe.png',
            ],
            [
                'nama_lokal' => 'Lemadang', 'nama_lain' => 'Mahi-Mahi', 'nama_ilmiah' => 'Coryphaena hippurus',
                'sst_min' => 27.0, 'sst_max' => 31.0, 'chl_min' => 0.05, 'chl_max' => 0.40,
                'chl_required' => true, 'image_path' => 'fish/lemadang.png',
            ],
            [
                'nama_lokal' => 'Barakuda', 'nama_lain' => 'Great Barracuda', 'nama_ilmiah' => 'Sphyraena barracuda',
                'sst_min' => 26.5, 'sst_max' => 30.5, 'chl_min' => 0.10, 'chl_max' => 0.60,
                'chl_required' => true, 'image_path' => 'fish/barakuda.png',
            ],
            [
                'nama_lokal' => 'Sunglir', 'nama_lain' => 'Rainbow Runner', 'nama_ilmiah' => 'Elagatis bipinnulata',
                'sst_min' => 27.0, 'sst_max' => 30.0, 'chl_min' => 0.10, 'chl_max' => 0.50,
                'chl_required' => true, 'image_path' => 'fish/sunglir.png',
            ],


            //KELOMPOK IKAN PELAGIS BESAR (OSEANIK/SAMUDRA)

            [
                'nama_lokal' => 'Cakalang', 'nama_lain' => 'Skipjack Tuna', 'nama_ilmiah' => 'Katsuwonus pelamis',
                'sst_min' => 29.5, 'sst_max' => 31.5, 'chl_min' => 0.15, 'chl_max' => 0.20,
                'chl_required' => true, 'image_path' => 'fish/cakalang.png',
            ],
            [
                'nama_lokal' => 'Tongkol', 'nama_lain' => 'Mackerel Tuna', 'nama_ilmiah' => 'Euthynnus affinis',
                'sst_min' => 29.0, 'sst_max' => 31.0, 'chl_min' => 0.15, 'chl_max' => 0.30,
                'chl_required' => true, 'image_path' => 'fish/tongkol.png',
            ],
            [
                'nama_lokal' => 'Tuna Sirip Kuning', 'nama_lain' => 'Yellowfin Tuna', 'nama_ilmiah' => 'Thunnus albacares',
                'sst_min' => 28.5, 'sst_max' => 30.5, 'chl_min' => 0.08, 'chl_max' => 0.20,
                'chl_required' => true, 'image_path' => 'fish/yellowfin_tuna.png',
            ],
            [
                'nama_lokal' => 'Tuna Mata Besar', 'nama_lain' => 'Bigeye Tuna', 'nama_ilmiah' => 'Thunnus obesus',
                'sst_min' => 27.0, 'sst_max' => 29.5, 'chl_min' => 0.08, 'chl_max' => 0.20,
                'chl_required' => true, 'image_path' => 'fish/bigeye_tuna.png',
            ],
            [
                'nama_lokal' => 'Tuna Albakora', 'nama_lain' => 'Albacore Tuna', 'nama_ilmiah' => 'Thunnus alalunga',
                'sst_min' => 27.0, 'sst_max' => 30.0, 'chl_min' => 0.10, 'chl_max' => 0.30,
                'chl_required' => true, 'image_path' => 'fish/albacore.png',
            ],
            [
                'nama_lokal' => 'Tuna Kecil', 'nama_lain' => 'Bullet Tuna', 'nama_ilmiah' => 'Auxis rochei',
                'sst_min' => 29.0, 'sst_max' => 31.5, 'chl_min' => 0.30, 'chl_max' => 1.10,
                'chl_required' => true, 'image_path' => 'fish/small_tuna.png',
            ],
            [
                'nama_lokal' => 'Marlin Hitam', 'nama_lain' => 'Black Marlin', 'nama_ilmiah' => 'Istiompax indica',
                'sst_min' => 26.0, 'sst_max' => 30.0, 'chl_min' => 0.05, 'chl_max' => 0.25,
                'chl_required' => true, 'image_path' => 'fish/black_marlin.png',
            ],
            [
                'nama_lokal' => 'Layaran', 'nama_lain' => 'Sailfish', 'nama_ilmiah' => 'Istiophorus platypterus',
                'sst_min' => 26.5, 'sst_max' => 30.5, 'chl_min' => 0.05, 'chl_max' => 0.30,
                'chl_required' => true, 'image_path' => 'fish/sailfish.png',
            ],
            [
                'nama_lokal' => 'Tuna Sirip Biru', 'nama_lain' => 'Southern Bluefin Tuna', 'nama_ilmiah' => 'Thunnus maccoyii',
                'sst_min' => 18.0, 'sst_max' => 26.0, 'chl_min' => 0.10, 'chl_max' => 0.50,
                'chl_required' => true, 'image_path' => 'fish/bluefin_tuna.png',
            ],
            [
                'nama_lokal' => 'Setuhuk Pedang', 'nama_lain' => 'Swordfish', 'nama_ilmiah' => 'Xiphias gladius',
                'sst_min' => 22.0, 'sst_max' => 28.0, 'chl_min' => 0.05, 'chl_max' => 0.30,
                'chl_required' => true, 'image_path' => 'fish/swordfish.png',
            ],
        ];

        // Bersihkan tabel dulu jika di-seed ulang agar tidak error duplikat
        DB::table('fish_profiles')->truncate();
        DB::table('fish_profiles')->insert($fishes);
    }
}
