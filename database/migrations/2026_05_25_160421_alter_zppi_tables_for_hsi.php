<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Modifikasi Tabel Zppi Zones (Data Aktual)
        Schema::table('zppi_zones', function (Blueprint $table) {
            // Tambah kolom baru untuk HSI
            $table->string('probabilitas_label')->nullable();
            $table->integer('probabilitas_skor')->nullable();

            // Hapus kolom lama yang sudah tidak relevan dengan HSI biner
            $table->dropColumn(['sst_min', 'sst_max', 'chl_threshold']);
        });

        // 2. Modifikasi Tabel Zppi Forecast (Data Ramalan)
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('zppi_zones', function (Blueprint $table) {
            $table->dropColumn(['probabilitas_label', 'probabilitas_skor']);
            
            // Kembalikan kolom lama jika rollback
            $table->float('sst_min')->nullable();
            $table->float('sst_max')->nullable();
            $table->float('chl_threshold')->nullable();
        });

       
    }
};