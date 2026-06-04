<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\WeatherController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('api.login');
    Route::post('register', [AuthController::class, 'register'])->name('api.register');
    Route::post('forgot-password', [PasswordResetController::class, 'sendLink'])->name('api.password.email');
    Route::post('reset-password', [PasswordResetController::class, 'reset'])->name('api.password.reset');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('api.logout');
        Route::get('user', [AuthController::class, 'user'])->name('api.user');
    });
});

// Rute Suplai Data untuk komponen React (token Sanctum atau sesi web stateful)
Route::middleware('auth:sanctum')->prefix('map')->group(function () {
    Route::get('route', [MapController::class, 'getRoute'])->name('api.map.route');
    Route::get('weather', [WeatherController::class, 'data'])->name('api.map.weather');
});
