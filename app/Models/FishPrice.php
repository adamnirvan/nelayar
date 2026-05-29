<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FishPrice extends Model
{
    protected $fillable = [
        'commodity',
        'province',
        'regency',
        'region_group',
        'price',
        'price_change_pct',
        'price_date',
        'period',
        'source',
        'scraped_at',
    ];

    protected $casts = [
        'price_date' => 'date',
        'scraped_at' => 'datetime',
    ];
}
