<?php

namespace App\Http\Controllers;

use App\Models\FishPrice;
use App\Services\FishPriceService;
use Illuminate\Http\Request;
use Inertia\Response;

class PricesController extends Controller
{
    public function index(Request $request, FishPriceService $prices): Response
    {
        $commodities = FishPrice::distinct()->orderBy('commodity')->pluck('commodity');

        // The dashboard is a per-commodity deep-dive: default to the first commodity
        // so the charts/map always have a subject even before the user picks one.
        $commodity = $request->query('commodity') ?: $commodities->first();
        $province = $request->query('province');

        return inertia('Prices/Index', [
            'prices' => $prices->get($commodity, $province),
            'stats' => $prices->getStats($commodity, $province),
            'trend' => $commodity ? $prices->getWeeklyTrend($commodity) : [],
            'provSummary' => $commodity ? $prices->getProvSummary($commodity) : [],
            'kabSummary' => ($commodity && $province) ? $prices->getKabSummary($province, $commodity) : [],
            'regionTrend' => ($commodity && $province) ? $prices->getRegionTrend($province, $commodity) : [],
            'commodities' => $commodities,
            'filters' => ['commodity' => $commodity, 'province' => $province],
        ]);
    }
}
