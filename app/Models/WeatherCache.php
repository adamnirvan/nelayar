<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherCache extends Model
{
    protected $fillable = [
        'latitude',
        'longitude',
        'bmkg_data',
        'openmeteo_data',
        'active_source',
        'fetched_at',
        'expires_at',
    ];

    protected $casts = [
        'bmkg_data'      => 'array',
        'openmeteo_data' => 'array',
        'fetched_at'     => 'datetime',
        'expires_at'     => 'datetime',
    ];
}
