<?php

use App\Http\Controllers\MapController;
use App\Http\Controllers\PricesController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\Teams\TeamInvitationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('Auth/Login'))->name('login');
    Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register');
});

// Invitation accept (needs auth but not team membership check)
Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])
        ->name('invitations.accept');
});

// Protected app routes
Route::middleware(['auth'])->group(function () {
    Route::redirect('/', '/map')->name('home');

    Route::get('/map',          [MapController::class, 'index'])->name('map.index');
    Route::get('/map/forecast', [MapController::class, 'forecast'])->name('map.forecast');
    Route::get('/weather',      [WeatherController::class, 'index'])->name('weather.index');
    Route::get('/prices',       [PricesController::class, 'index'])->name('prices.index');
});

require __DIR__.'/settings.php';
