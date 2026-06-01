<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FishProfileSeeder extends Seeder
{
    public function run(): void
    {
        $fishes = [
            [
                'nama_lokal' => 'Cakalang', 'nama_lain' => 'Skipjack Tuna', 'nama_ilmiah' => 'Katsuwonus pelamis',
                'sst_min' => 29.5, 'sst_max' => 31.5, 'chl_min' => 0.15, 'chl_max' => 0.20,
                'chl_required' => true, 'image_path' => 'fish/cakalang.png'
            ],
            [
                'nama_lokal' => 'Tongkol', 'nama_lain' => 'Mackerel Tuna', 'nama_ilmiah' => 'Euthynnus affinis',
                'sst_min' => 28.5, 'sst_max' => 31.0, 'chl_min' => 0.13, 'chl_max' => 0.35,
                'chl_required' => true, 'image_path' => 'fish/tongkol.png'
            ],
            [
                'nama_lokal' => 'Tuna Sirip Kuning', 'nama_lain' => 'Yellowfin Tuna', 'nama_ilmiah' => 'Thunnus albacares',
                'sst_min' => 28.0, 'sst_max' => 31.0, 'chl_min' => 0.01, 'chl_max' => 0.30,
                'chl_required' => true, 'image_path' => 'fish/yellowfin_tuna.png'
            ],
            [
                'nama_lokal' => 'Tuna Mata Besar', 'nama_lain' => 'Bigeye Tuna', 'nama_ilmiah' => 'Thunnus obesus',
                'sst_min' => 25.0, 'sst_max' => 30.0, 'chl_min' => 0.01, 'chl_max' => 0.30,
                'chl_required' => true, 'image_path' => 'fish/bigeye_tuna.png'
            ],
            [
                'nama_lokal' => 'Tuna Albakora', 'nama_lain' => 'Albacore Tuna', 'nama_ilmiah' => 'Thunnus alalunga',
                'sst_min' => 22.0, 'sst_max' => 31.0, 'chl_min' => 0.10, 'chl_max' => 0.50,
                'chl_required' => true, 'image_path' => 'fish/albacore.png'
            ],
            [
                'nama_lokal' => 'Tuna Kecil', 'nama_lain' => 'Bullet Tuna', 'nama_ilmiah' => 'Auxis rochei',
                'sst_min' => 29.0, 'sst_max' => 31.5, 'chl_min' => 0.30, 'chl_max' => 1.10,
                'chl_required' => true, 'image_path' => 'fish/small_tuna.png'
            ],
            [
                'nama_lokal' => 'Sardin', 'nama_lain' => 'Sardine / Lemuru', 'nama_ilmiah' => 'Sardinella lemuru',
                'sst_min' => 27.0, 'sst_max' => 31.0, 'chl_min' => 0.10, 'chl_max' => 1.20,
                'chl_required' => true, 'image_path' => 'fish/sardine.png'
            ],
        ];

        // Bersihkan tabel dulu jika di-seed ulang agar tidak error duplikat
        DB::table('fish_profiles')->truncate();
        DB::table('fish_profiles')->insert($fishes);
    }
}