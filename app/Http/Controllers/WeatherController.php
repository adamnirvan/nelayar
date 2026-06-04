<?php

namespace App\Http\Controllers;

use App\Services\WeatherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class WeatherController extends Controller
{
    public function index(Request $request, WeatherService $weather): Response
    {
        $lat = (float) $request->query('lat', -2.5);
        $lon = (float) $request->query('lon', 118.0);
        $date = $request->query('date');

        return inertia('Weather/Index', [
            'weather' => $weather->get($lat, $lon, $date),
        ]);
    }

    // JSON endpoint for the map's floating weather card (queried with the
    // user's live geolocation). The optional `date` selects the forecast day
    // (H+0..H+9), mirroring the map's date slider. Same payload shape as index().
    public function data(Request $request, WeatherService $weather): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return response()->json(
            $weather->get(
                (float) $validated['lat'],
                (float) $validated['lon'],
                $validated['date'] ?? null
            )
        );
    }
}
