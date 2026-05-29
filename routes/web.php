<?php

use App\Http\Controllers\MapController;
use App\Http\Controllers\PricesController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\Teams\TeamInvitationController;
use Illuminate\Support\Facades\Route;

// 1. RUTE SEMENTARA: Langsung arahkan ke halaman Login karena Landing Page belum siap
Route::redirect('/', '/login')->name('home');

// Rute Undangan Tim (Bawaan starter kit)
Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])
        ->name('invitations.accept');
});

// 2. RUTE UTAMA NELAYAR (Area Dasbor & Peta, hanya untuk pengguna yang sudah login)
Route::middleware(['auth'])->group(function () {
    // Rute Kanvas UI React
    Route::get('/map', [MapController::class, 'index'])->name('map.index');

    // Rute Suplai Data API untuk komponen React di dalam /map
    Route::get('/api/map/forecast', [MapController::class, 'forecast'])->name('api.map.forecast');
    Route::get('/api/map/zppi',     [MapController::class, 'getZppi'])->name('api.map.zppi');
    Route::get('/api/weather',      [WeatherController::class, 'index'])->name('api.weather.index');
    Route::get('/api/prices',       [PricesController::class, 'index'])->name('api.prices.index');
});

require __DIR__.'/settings.php';