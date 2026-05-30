<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Pembuatan Akun Testing 
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        
        $this->call([
            FishProfileSeeder::class, 
            NelayarSeeder::class,     
        ]);

        /* CATATAN ENGINEER:
         * Kode lama yang membaca file 'sample_zppi.json' telah dihapus.
         * Skema database zppi_zones sudah berevolusi (kolom sst_min dkk sudah hilang
         * diganti dengan kolom JSON 'ikan_cocok').
         * Pengisian data poligon spasial tidak lagi dilakukan lewat Seeder statis,
         * melainkan disuntikkan secara dinamis menggunakan:
         * php artisan tinker -> app(\App\Services\OceanService::class)->fetchAndStore('YYYY-MM-DD');
         */
    }
}