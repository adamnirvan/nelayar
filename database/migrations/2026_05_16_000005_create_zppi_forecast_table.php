<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zppi_forecast', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ocean_data_id')->constrained('ocean_data')->cascadeOnDelete();
            $table->date('forecast_date')->index();
            $table->integer('day_offset');
            $table->float('confidence');
            $table->timestamps();
        });

        DB::statement('ALTER TABLE zppi_forecast ADD COLUMN geom geometry(MultiPolygon, 4326)');
        DB::statement('CREATE INDEX zppi_forecast_geom_idx ON zppi_forecast USING GIST(geom)');
    }

    public function down(): void
    {
        Schema::dropIfExists('zppi_forecast');
    }
};
