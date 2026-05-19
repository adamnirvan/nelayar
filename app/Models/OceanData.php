<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OceanData extends Model
{
    protected $fillable = [
        'data_date',
        'lat_min',
        'lat_max',
        'lon_min',
        'lon_max',
        'sst_grid',
        'chl_grid',
        'source',
        'fetched_at',
    ];

    protected $casts = [
        'sst_grid'   => 'array',
        'chl_grid'   => 'array',
        'fetched_at' => 'datetime',
        'data_date'  => 'date',
    ];

    public function zppiZones(): HasMany
    {
        return $this->hasMany(ZppiZone::class);
    }

    public function zppiForecasts(): HasMany
    {
        return $this->hasMany(ZppiForecast::class);
    }
}
