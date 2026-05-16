<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;

class WeatherController extends Controller
{
    public function index(Request $request): Response
    {
        // Implemented in Phase 5 — wired to WeatherService
        return inertia('Weather/Index', [
            'weather' => null,
        ]);
    }
}
