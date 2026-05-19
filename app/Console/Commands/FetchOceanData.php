<?php

namespace App\Console\Commands;

use App\Services\OceanService;
use Illuminate\Console\Command;

class FetchOceanData extends Command
{
    protected $signature = 'nelayar:fetch-ocean {--date= : Date in YYYY-MM-DD format (defaults to today)}';

    protected $description = 'Fetch ZPPI ocean data from CMEMS and store in database';

    public function handle(OceanService $ocean): int
    {
        $date = $this->option('date') ?? now()->toDateString();

        $this->info("Fetching ocean data for {$date}...");

        $ocean->fetchAndStore($date);

        $this->info('Done.');

        return Command::SUCCESS;
    }
}
