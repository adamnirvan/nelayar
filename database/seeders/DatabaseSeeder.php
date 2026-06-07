<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Pembuatan Akun Testing 

        
        $this->call([
            FishProfileSeeder::class,
            LandBoundarySeeder::class, 
        ]);
    }
}