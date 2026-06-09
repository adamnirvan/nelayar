<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// --- JADWAL OTOMATIS NELAYAR ---
// 1. Sinkronisasi ZPPI 10 hari.
//    Komputasi berat (CMEMS + numpy/scipy/matplotlib) DIPINDAH ke GitHub
//    Actions agar tidak membebani server (lihat .github/workflows/ocean-sync.yml);
//    worker CI yang memicu `php artisan ocean:ingest` via SSH setiap 02:00 WIB.
//    `ocean:sync-forecast` tetap ada sebagai fallback manual untuk mesin penuh.
// Schedule::command('ocean:sync-forecast')->dailyAt('02:00');

// 2. Mengambil data harga pasar ikan mingguan dari situs KKP
Schedule::command('nelayar:scrape-kkp')->weekly();
