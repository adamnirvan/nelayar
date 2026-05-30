<?php

use App\Http\Controllers\MapController;
use App\Http\Controllers\PricesController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\WeatherController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Landing'))->name('landing');

Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('Auth/Login'))->name('login');
    Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register');
    Route::get('/forgot-password', fn () => Inertia::render('Auth/ForgotPassword'))->name('password.request');
    Route::get('/reset-password', fn () => Inertia::render('Auth/ResetPassword'))->name('password.reset');
});

// Rute Undangan Tim (Bawaan starter kit)
Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])
        ->name('invitations.accept');
});

// 2. RUTE UTAMA NELAYAR (Area Dasbor & Peta, hanya untuk pengguna yang sudah login)
Route::middleware(['auth'])->group(function () {
    // Rute Kanvas UI React
    Route::get('/map', [MapController::class, 'index'])->name('map.index');
    Route::get('/weather', [WeatherController::class, 'index'])->name('weather.view');
    Route::get('/prices', [PricesController::class, 'index'])->name('prices.view');

    // Rute Suplai Data API untuk komponen React
    Route::get('/api/map/forecast', [MapController::class, 'forecast'])->name('api.map.forecast');
    Route::get('/api/map/zppi', [MapController::class, 'getZppi'])->name('api.map.zppi');
    Route::get('/api/map/route', [MapController::class, 'getRoute'])->name('api.map.route');
});

require __DIR__.'/settings.php';
