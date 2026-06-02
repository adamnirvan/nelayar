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
        $commodity = $request->query('commodity');
        $province = $request->query('province');

        return inertia('Prices/Index', [
            'prices' => $prices->get($commodity, $province),
            'stats' => $prices->getStats($commodity, $province),
            'commodities' => FishPrice::distinct()->orderBy('commodity')->pluck('commodity'),
            'provinces' => FishPrice::distinct()->orderBy('province')->pluck('province'),
            'filters' => ['commodity' => $commodity, 'province' => $province],
        ]);
    }
}
