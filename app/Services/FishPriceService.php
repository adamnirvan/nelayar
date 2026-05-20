<?php

namespace App\Services;

use App\Models\FishPrice;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class FishPriceService
{
    public function scrapeAndStore(): void
    {
        $pythonPath = env('PYTHON_PATH', 'python3');
        $scriptPath = base_path('microservice/scrape_kkp.py');

        $result = Process::run("{$pythonPath} {$scriptPath}");

        if ($result->failed()) {
            Log::error('KKP scrape failed', ['error' => $result->errorOutput()]);
            return;
        }

        $prices = json_decode($result->output(), true);

        if (json_last_error() !== JSON_ERROR_NONE || ! is_array($prices)) {
            Log::error('KKP scrape returned invalid JSON', ['output' => $result->output()]);
            return;
        }

        if (empty($prices)) {
            Log::warning('KKP scrape returned zero price records');
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

        Log::info('KKP scrape complete', ['records' => count($prices)]);
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
}
