<?php

use App\Http\Controllers\MapController;
use App\Http\Controllers\PricesController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\Teams\TeamInvitationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Landing'))->name('landing');

Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('Auth/Login'))->name('login');
    Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register');
    Route::get('/forgot-password', fn () => Inertia::render('Auth/ForgotPassword'))->name('password.request');
    Route::get('/reset-password', fn () => Inertia::render('Auth/ResetPassword'))->name('password.reset');
});

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
        Route::get('/weather', [WeatherController::class, 'view'])->name('weather.view');
        Route::get('/prices', [PricesController::class, 'view'])->name('prices.view');

        // Rute Suplai Data API untuk komponen React
        Route::get('/api/map/forecast', [MapController::class, 'forecast'])->name('api.map.forecast');
        Route::get('/api/map/zppi', [MapController::class, 'getZppi'])->name('api.map.zppi');
        Route::get('/api/weather', [WeatherController::class, 'index'])->name('api.weather.index');
        Route::get('/api/prices', [PricesController::class, 'index'])->name('api.prices.index');
});

require __DIR__.'/settings.php';