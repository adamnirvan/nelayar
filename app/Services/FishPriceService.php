<?php

namespace App\Services;

use App\Models\FishPrice;
use Illuminate\Support\Facades\Process;
use Illuminate\Console\Command;

class FishPriceService
{
    public function scrapeAndStore(Command $command): void
    {
        $pythonPath = env('PYTHON_PATH', 'python3');
        $scriptPath = base_path('microservice/scrape_kkp.py');

        $result = Process::forever()->run("{$pythonPath} {$scriptPath}");

        if ($result->failed()) {
            $command->error('KKP scrape failed');
            $command->error($result->errorOutput());
            return;
        }

        $prices = json_decode($result->output(), true);

        if (json_last_error() !== JSON_ERROR_NONE || ! is_array($prices)) {
            $command->error('KKP scrape returned invalid JSON: ' . $result->output());
            return;
        }

        if (empty($prices)) {
            $command->warn('KKP scrape returned zero price records');
            return;
        }

        foreach ($prices as $price) {
            FishPrice::updateOrCreate(
                [
                    'commodity'  => $price['commodity'],
                    'province'   => $price['province'],
                    'regency'    => $price['regency'] ?? null,
                    'price_date' => $price['price_date'],
                ],
                array_merge($price, ['scraped_at' => now()])
            );
        }

        $command->info('KKP scrape complete: ' . count($prices) . ' records');
    }

    public function get(?string $commodity = null, ?string $province = null): array
    {
        return FishPrice::query()
            ->when($commodity, fn($q) => $q->where('commodity', $commodity))
            ->when($province,  fn($q) => $q->where('province', $province))
            ->orderByDesc('price_date')
            ->get()
            ->toArray();
    }

    /** Aggregate stats for `get_stats` action. Province is a name string, not a numeric ID. */
    public function getStats(?string $commodity = null, ?string $province = null): array
    {
        // Province drill-down uses regency-level rows; national view uses province-level rows (regency IS NULL).
        $scope = fn($q) => $q
            ->when($commodity, fn($q) => $q->where('commodity', $commodity))
            ->when($province, fn($q) => $q->where('province', $province))
            ->when($province, fn($q) => $q->whereNotNull('regency'), fn($q) => $q->whereNull('regency'));

        $latestDate = $scope(FishPrice::query())->max('price_date');

        if (! $latestDate) {
            return ['avg' => 0, 'max' => 0, 'min' => 0, 'coverage' => 0, 'change' => null, 'period' => '-', 'max_loc' => '-', 'min_loc' => '-'];
        }

        $currentMonth = substr((string) $latestDate, 0, 7);
        $prevMonth = date('Y-m', strtotime($currentMonth . '-01 -1 month'));

        $coverageExpr = $province ? "COUNT(DISTINCT regency)" : "COUNT(DISTINCT province)";

        $current = $scope(FishPrice::query())
            ->whereRaw("TO_CHAR(price_date, 'YYYY-MM') = ?", [$currentMonth])
            ->selectRaw("AVG(price) as avg, MAX(price) as max, MIN(price) as min, {$coverageExpr} as coverage")
            ->first();

        $maxLoc = $scope(FishPrice::query())
            ->whereRaw("TO_CHAR(price_date, 'YYYY-MM') = ?", [$currentMonth])
            ->orderByDesc('price')
            ->value($province ? 'regency' : 'province');

        $minLoc = $scope(FishPrice::query())
            ->whereRaw("TO_CHAR(price_date, 'YYYY-MM') = ?", [$currentMonth])
            ->orderBy('price')
            ->value($province ? 'regency' : 'province');

        $prevAvg = $scope(FishPrice::query())
            ->whereRaw("TO_CHAR(price_date, 'YYYY-MM') = ?", [$prevMonth])
            ->avg('price');

        // Null (not 0) when there is no previous-month baseline to compare against —
        // 0 is a real "no change" reading and must stay distinguishable from "no data".
        $change = ($prevAvg && $current?->avg)
            ? round((($current->avg - $prevAvg) / $prevAvg) * 100, 1)
            : null;

        return [
            'avg'      => (int) round($current->avg ?? 0),
            'max'      => (int) round($current->max ?? 0),
            'min'      => (int) round($current->min ?? 0),
            'coverage' => (int) ($current->coverage ?? 0),
            'max_loc'  => $maxLoc ?? '-',
            'min_loc'  => $minLoc ?? '-',
            'period'   => date('M Y', strtotime($currentMonth . '-01')),
            'change'   => $change,
        ];
    }

    /** All commodities with latest avg price and MoM % change, for `get_ticker` action. */
    public function getTicker(): array
    {
        $commodities = FishPrice::distinct()->pluck('commodity');
        $result = [];

        foreach ($commodities as $commodity) {
            $latestDate = FishPrice::where('commodity', $commodity)->max('price_date');
            if (! $latestDate) {
                continue;
            }

            $currentMonth = substr((string) $latestDate, 0, 7);
            $prevMonth = date('Y-m', strtotime($currentMonth . '-01 -1 month'));

            $currentAvg = FishPrice::where('commodity', $commodity)
                ->whereNull('regency')
                ->whereRaw("TO_CHAR(price_date, 'YYYY-MM') = ?", [$currentMonth])
                ->avg('price');

            $prevAvg = FishPrice::where('commodity', $commodity)
                ->whereNull('regency')
                ->whereRaw("TO_CHAR(price_date, 'YYYY-MM') = ?", [$prevMonth])
                ->avg('price');

            $change = ($prevAvg && $currentAvg)
                ? round((($currentAvg - $prevAvg) / $prevAvg) * 100, 1)
                : 0;

            $result[] = [
                'name'   => $commodity,
                'price'  => (int) round($currentAvg ?? 0),
                'change' => $change,
            ];
        }

        return $result;
    }

    /** Monthly avg prices for the most recent 12 months (chronological) for the trend chart. */
    public function getWeeklyTrend(string $commodity): array
    {
        return FishPrice::where('commodity', $commodity)
            ->whereNull('regency')
            ->selectRaw("TO_CHAR(DATE_TRUNC('month', price_date), 'Mon YY') as label, DATE_TRUNC('month', price_date) as sort_date, AVG(price) as price")
            ->groupByRaw("DATE_TRUNC('month', price_date)")
            ->orderByDesc('sort_date')
            ->limit(12)
            ->get()
            ->reverse()
            ->values()
            ->map(fn($row) => ['label' => $row->label, 'price' => (int) round($row->price)])
            ->toArray();
    }

    /** Province-level avg price summary for `get_prov_summary` action. Uses province name as id. */
    public function getProvSummary(string $commodity): array
    {
        return FishPrice::where('commodity', $commodity)
            ->whereNull('regency')
            ->selectRaw('province, AVG(price) as price, COUNT(*) as count')
            ->groupBy('province')
            ->orderByDesc('price')
            ->get()
            ->map(fn($row) => [
                'id'    => $row->province,
                'name'  => $row->province,
                'price' => (int) round($row->price),
                'count' => (int) $row->count,
            ])
            ->toArray();
    }

    /** Regency-level avg price for a province for `get_kab_summary` action. */
    public function getKabSummary(string $province, string $commodity): array
    {
        return FishPrice::where('commodity', $commodity)
            ->where('province', $province)
            ->whereNotNull('regency')
            ->selectRaw('regency, AVG(price) as price')
            ->groupBy('regency')
            ->orderByDesc('price')
            ->get()
            ->map(fn($row) => [
                'id'    => $row->regency,
                'name'  => $row->regency,
                'price' => (int) round($row->price),
            ])
            ->toArray();
    }

    /** Monthly avg price trend for a province for `get_region_trend` action. */
    public function getRegionTrend(string $province, string $commodity): array
    {
        return FishPrice::where('commodity', $commodity)
            ->where('province', $province)
            ->selectRaw("TO_CHAR(DATE_TRUNC('month', price_date), 'Mon YYYY') as month, DATE_TRUNC('month', price_date) as sort_date, AVG(price) as price")
            ->groupByRaw("DATE_TRUNC('month', price_date)")
            ->orderBy('sort_date')
            ->limit(12)
            ->get()
            ->map(fn($row) => ['month' => $row->month, 'price' => (int) round($row->price)])
            ->toArray();
    }
}
