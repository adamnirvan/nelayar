<?php

namespace App\Console\Commands;

use App\Services\OceanService;
use Illuminate\Console\Command;

class FetchForecast extends Command
{
    protected $signature = 'nelayar:fetch-forecast {--date= : Base date in YYYY-MM-DD format (defaults to today)}';

    protected $description = 'Fetch 10-day ZPPI forecast from CMEMS and store in database';

    public function handle(OceanService $ocean): int
    {
        $date = $this->option('date') ?? now()->toDateString();

        $this->info("Fetching 10-day forecast from base date {$date}...");

        $ocean->fetchAndStoreForecast($date);

        $this->info('Done.');

        return Command::SUCCESS;
    }
}
