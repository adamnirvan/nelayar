<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zppi_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ocean_data_id')->constrained('ocean_data')->cascadeOnDelete();
            $table->date('zone_date')->index();
            $table->float('sst_min');
            $table->float('sst_max');
            $table->float('chl_threshold');
            $table->float('confidence');
            $table->timestamps();
        });

        DB::statement('ALTER TABLE zppi_zones ADD COLUMN geom geometry(MultiPolygon, 4326)');
        DB::statement('CREATE INDEX zppi_zones_geom_idx ON zppi_zones USING GIST(geom)');
    }

    public function down(): void
    {
        Schema::dropIfExists('zppi_zones');
    }
};
