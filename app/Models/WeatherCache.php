<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherCache extends Model
{
    protected $table = 'weather_cache';

    protected $fillable = [
        'latitude',
        'longitude',
        'forecast_date',
        'bmkg_data',
        'openmeteo_data',
        'active_source',
        'fetched_at',
        'expires_at',
    ];

    protected $casts = [
        'forecast_date' => 'date:Y-m-d',
        'bmkg_data' => 'array',
        'openmeteo_data' => 'array',
        'fetched_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
