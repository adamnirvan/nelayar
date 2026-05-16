<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fish_prices', function (Blueprint $table) {
            $table->id();
            $table->string('commodity');
            $table->string('province');
            $table->string('regency')->nullable();
            $table->string('region_group')->nullable();
            $table->integer('price');
            $table->float('price_change_pct')->nullable();
            $table->date('price_date');
            $table->string('period')->nullable();
            $table->string('source')->default('mi.kkp.go.id');
            $table->timestamp('scraped_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fish_prices');
    }
};
