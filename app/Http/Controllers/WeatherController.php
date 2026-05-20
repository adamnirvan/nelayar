<?php

namespace App\Http\Controllers;

use App\Services\WeatherService;
use Illuminate\Http\Request;
use Inertia\Response;

class WeatherController extends Controller
{
    public function index(Request $request, WeatherService $weather): Response
    {
        $lat = (float) $request->query('lat', -2.5);
        $lon = (float) $request->query('lon', 118.0);

        return inertia('Weather/Index', [
            'weather' => $weather->get($lat, $lon),
        ]);
    }
}
