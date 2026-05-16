<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ocean_data', function (Blueprint $table) {
            $table->id();
            $table->date('data_date')->index();
            $table->float('lat_min')->nullable();
            $table->float('lat_max')->nullable();
            $table->float('lon_min')->nullable();
            $table->float('lon_max')->nullable();
            $table->json('sst_grid')->nullable();
            $table->json('chl_grid')->nullable();
            $table->string('source')->default('CMEMS');
            $table->timestamp('fetched_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ocean_data');
    }
};
