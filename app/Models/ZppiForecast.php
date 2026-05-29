<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZppiForecast extends Model
{
    protected $table = 'zppi_forecast';

    protected $fillable = [
        'ocean_data_id',
        'forecast_date',
        'day_offset',
        'confidence',
    ];

    protected $casts = [
        'forecast_date' => 'date',
    ];

    public function oceanData(): BelongsTo
    {
        return $this->belongsTo(OceanData::class);
    }
}
