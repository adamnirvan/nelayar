<?php

namespace App\Console\Commands;

use App\Services\OceanService;
use Illuminate\Console\Command;

class ExportFishProfiles extends Command
{
    /**
     * Cetak profil ikan (envelope SST/Chl) sebagai JSON ke stdout.
     *
     * Dipakai oleh worker GitHub Actions: ia menjalankan perintah ini via SSH
     * untuk mengambil profil terbaru dari database (sumber kebenaran), lalu
     * menyuntikkannya ke parse_zppi.py saat menghitung ZPPI di luar server.
     * Hanya JSON yang ditulis ke stdout agar mudah ditangkap (`> profiles.json`).
     *
     * @var string
     */
    protected $signature = 'ocean:export-profiles';

    protected $description = 'Cetak fish_profiles sebagai JSON (dikonsumsi worker CI untuk komputasi ZPPI di luar server)';

    public function handle(OceanService $ocean): int
    {
        $this->output->writeln(
            json_encode($ocean->fishProfilesPayload(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        return self::SUCCESS;
    }
}
