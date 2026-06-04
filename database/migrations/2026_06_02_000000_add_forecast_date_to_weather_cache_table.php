<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weather_cache', function (Blueprint $table) {
            // Which forecast day the cached payload is for (null = legacy "today" rows).
            // Cache is now keyed by (latitude, longitude, forecast_date).
            $table->date('forecast_date')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('weather_cache', function (Blueprint $table) {
            $table->dropColumn('forecast_date');
        });
    }
};
