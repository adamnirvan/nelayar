<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;

class PricesController extends Controller
{
    public function index(Request $request): Response
    {
        // Implemented in Phase 6 — wired to FishPriceService
        return inertia('Prices/Index', [
            'prices'      => [],
            'commodities' => [],
            'provinces'   => [],
        ]);
    }
}
