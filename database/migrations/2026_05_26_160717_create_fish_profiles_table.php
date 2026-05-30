<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fish_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('nama_lokal')->unique(); // ex: Cakalang
            $table->string('nama_lain')->nullable(); // ex: Skipjack Tuna
            $table->string('nama_ilmiah')->unique(); // ex: Katsuwonus pelamis
            
            // Suhu (Wajib)
            $table->float('sst_min');
            $table->float('sst_max');
            
            // Klorofil (Nullable, karena tidak semua ikan butuh data ini)
            $table->float('chl_min')->nullable();
            $table->float('chl_max')->nullable();
            $table->boolean('chl_required')->default(false);
            
            // Aset Frontend
            $table->string('image_path')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fish_profiles');
    }
};