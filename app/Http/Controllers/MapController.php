<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;

class MapController extends Controller
{
    public function index(): Response
    {
        // Implemented in Phase 3 — wired to OceanService
        return inertia('Map/Index', [
            'zppiGeoJson' => ['type' => 'FeatureCollection', 'features' => []],
        ]);
    }

    public function forecast(Request $request): Response
    {
        // Implemented in Phase 4 — wired to OceanService::getForecastGeoJson()
        return inertia('Map/Forecast', [
            'forecastDates' => [],
            'selectedDate'  => $request->query('date', now()->addDay()->toDateString()),
            'zppiGeoJson'   => ['type' => 'FeatureCollection', 'features' => []],
        ]);
    }
}
