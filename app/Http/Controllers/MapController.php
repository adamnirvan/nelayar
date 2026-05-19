<?php

namespace App\Http\Controllers;

use App\Models\ZppiForecast;
use App\Services\OceanService;
use Illuminate\Http\Request;
use Inertia\Response;

class MapController extends Controller
{
    public function index(OceanService $ocean): Response
    {
        return inertia('Map/Index', [
            'zppiGeoJson' => $ocean->getTodayGeoJson(),
        ]);
    }

    public function forecast(Request $request, OceanService $ocean): Response
    {
        $date = $request->query('date', now()->addDay()->toDateString());

        $dates = ZppiForecast::select('forecast_date')
            ->distinct()
            ->orderBy('forecast_date')
            ->pluck('forecast_date')
            ->map(fn($d) => $d->toDateString())
            ->toArray();

        return inertia('Map/Forecast', [
            'forecastDates' => $dates,
            'selectedDate'  => $date,
            'zppiGeoJson'   => $ocean->getForecastGeoJson($date),
        ]);
    }
}
