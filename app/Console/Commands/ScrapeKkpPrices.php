<?php

namespace App\Console\Commands;

use App\Services\FishPriceService;
use Illuminate\Console\Command;

class ScrapeKkpPrices extends Command
{
    protected $signature = 'nelayar:scrape-kkp';

    protected $description = 'Scrape fish prices from mi.kkp.go.id and store in database';

    public function handle(FishPriceService $prices): int
    {
        $this->info('Scraping KKP fish prices...');

        $prices->scrapeAndStore();

        $this->info('Done.');

        return Command::SUCCESS;
    }
}
