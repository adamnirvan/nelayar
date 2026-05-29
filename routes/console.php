<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// --- JADWAL OTOMATIS NELAYAR ---
// Menarik data ZPPI harian setiap jam 02:00 dini hari
Schedule::command('ocean:sync-forecast')->dailyAt('02:00');