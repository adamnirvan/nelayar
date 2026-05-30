<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// --- JADWAL OTOMATIS NELAYAR ---
// 1. Menarik data spasial ZPPI & memproses Fuzzy Logic setiap jam 02:00 dini hari
Schedule::command('ocean:sync-forecast')->dailyAt('02:00');

// 2. Mengambil data harga pasar ikan mingguan dari situs KKP
Schedule::command('nelayar:scrape-kkp')->weekly();
