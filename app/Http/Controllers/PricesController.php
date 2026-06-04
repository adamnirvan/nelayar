<?php

namespace App\Http\Controllers;

use App\Models\FishPrice;
use App\Services\FishPriceService;
use Illuminate\Http\JsonResponse;
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

    /**
     * Paginated, filterable listing of fish prices (JSON API).
     *
     * Filters (all optional): `commodity`, `province`, `regency`, `search`
     * (matches any of those three), and a `date_from`/`date_to` range.
     * Sorting via `sort` (whitelisted column) + `direction` (asc|desc).
     * Paging via `page` and `per_page` (max 100). Omit everything to get
     * the full catalogue, newest first.
     */
    public function data(Request $request, FishPriceService $prices): JsonResponse
    {
        $validated = $request->validate([
            'commodity' => ['nullable', 'string'],
            'province' => ['nullable', 'string'],
            'regency' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort' => ['nullable', 'string', 'in:'.implode(',', FishPriceService::SORTABLE)],
            'direction' => ['nullable', 'string', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 25);

        $page = $prices->query($validated)->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
            'filters' => $request->only([
                'commodity', 'province', 'regency', 'search',
                'date_from', 'date_to', 'sort', 'direction',
            ]),
        ]);
    }
}
