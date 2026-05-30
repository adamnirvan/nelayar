<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('zppi_zones', function (Blueprint $table) {
            // Kita tambahkan kolom murni untuk menyimpan data cuaca laut aktual per poligon
            $table->float('sst_rata')->nullable();
            $table->float('chl_rata')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('zppi_zones', function (Blueprint $table) {
            $table->dropColumn(['sst_rata', 'chl_rata']);
        });
    }
};