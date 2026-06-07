<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('land_boundaries', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Indonesia');
            // Membuat kolom MultiPolygon dengan standar kordinat bumi (SRID 4326)
            $table->geometry('geom', 'MultiPolygon', 4326); 
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('land_boundaries');
    }
};