<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZppiZone extends Model
{
    protected $fillable = [
        'ocean_data_id',
        'zone_date',
        'sst_min',
        'sst_max',
        'chl_threshold',
        'confidence',
    ];

    protected $casts = [
        'zone_date' => 'date',
    ];

    public function oceanData(): BelongsTo
    {
        return $this->belongsTo(OceanData::class);
    }
}
