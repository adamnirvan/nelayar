<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('zppi_zones', function (Blueprint $table) {
            // Hapus sistem lama
            $table->dropColumn(['probabilitas_label', 'probabilitas_skor']);
            
            // Tambah kolom JSON untuk menampung array ikan_cocok dari Python
            $table->json('ikan_cocok')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('zppi_zones', function (Blueprint $table) {
            $table->string('probabilitas_label')->nullable();
            $table->integer('probabilitas_skor')->nullable();
            $table->dropColumn('ikan_cocok');
        });
    }
};