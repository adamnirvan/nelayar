<?php

namespace App\Console\Commands;

use App\Services\OceanService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class IngestOceanForecast extends Command
{
    /**
     * Serap hasil ZPPI yang SUDAH dihitung di luar server.
     *
     * Pasangan ringan dari ocean:sync-forecast. Komputasi berat (CMEMS +
     * numpy/scipy/matplotlib) dijalankan worker GitHub Actions, yang lalu
     * me-rsync hasilnya (satu {YYYY-MM-DD}.json per tanggal + PNG raster ke
     * storage/app/public/grids) dan memicu perintah ini via SSH. Perintah ini
     * TIDAK memanggil Python — hanya melakukan sliding-window cleanup + INSERT
     * PostGIS, sehingga muat di server berspesifikasi rendah.
     *
     * @var string
     */
    protected $signature = 'ocean:ingest {--dir= : Direktori berisi {YYYY-MM-DD}.json (default: storage/app/ocean-ingest)} {--keep : Jangan hapus file JSON setelah diserap}';

    protected $description = 'Serap hasil ZPPI pra-komputasi (dari worker CI) ke zppi_zones tanpa menjalankan Python';

    public function handle(OceanService $ocean): int
    {
        $dir = $this->option('dir') ?: storage_path('app/ocean-ingest');
        $dir = rtrim($dir, '/');
        $today = Carbon::today()->format('Y-m-d');

        $this->info('=== MENYERAP HASIL ZPPI PRA-KOMPUTASI ===');
        $this->info("Baseline Hari Ini: {$today}");
        $this->line("Direktori sumber : {$dir}\n");

        // =========================================================
        // FASE 1: ELIMINASI DATA KEMARIN (sliding window)
        // =========================================================
        $this->comment('1. Membersihkan data usang (zone_date < hari ini)...');

        $expiredDates = DB::table('zppi_zones')
            ->where('zone_date', '<', $today)
            ->distinct()
            ->pluck('zone_date');

        if ($expiredDates->isEmpty()) {
            $this->line('   - Tidak ada data masa lalu yang perlu dibersihkan.');
        } else {
            foreach ($expiredDates as $oldDate) {
                $folderPath = "grids/{$oldDate}";
                if (Storage::disk('public')->exists($folderPath)) {
                    Storage::disk('public')->deleteDirectory($folderPath);
                    $this->line("   ✓ Folder raster usang dihapus: public/storage/{$folderPath}");
                }
            }
            $deletedRows = DB::table('zppi_zones')->where('zone_date', '<', $today)->delete();
            $this->info("   ✓ Menghapus {$deletedRows} baris lama dari database.");
        }

        // =========================================================
        // FASE 2: SERAP FILE HASIL KOMPUTASI (H+0..H+9)
        // =========================================================
        $this->comment("\n2. Menyerap hasil komputasi (10 hari)...");

        $failures = [];

        for ($i = 0; $i <= 9; $i++) {
            $targetDate = Carbon::today()->addDays($i)->format('Y-m-d');
            $file = "{$dir}/{$targetDate}.json";

            if (! is_file($file)) {
                $this->warn("   - [{$targetDate}] file hasil tidak ditemukan ({$file}). Skip.");
                $failures[] = $targetDate;

                continue;
            }

            $data = json_decode((string) file_get_contents($file), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error("   ✗ [{$targetDate}] JSON rusak: ".json_last_error_msg());
                $failures[] = $targetDate;

                continue;
            }

            if (! empty($data['error'])) {
                $this->error("   ✗ [{$targetDate}] worker melaporkan error: {$data['error']}");
                $failures[] = $targetDate;

                continue;
            }

            try {
                $zoneCount = $ocean->storeFeatures($targetDate, $data);

                if ($zoneCount === 0) {
                    $this->warn("     ⚠ [{$targetDate}] diserap tetapi 0 zona. Cek ambang fish_profiles / SST-Chl.");
                    $failures[] = $targetDate;
                } else {
                    $this->info("     ✓ [{$targetDate}] {$zoneCount} zona tersimpan.");
                    if (! $this->option('keep')) {
                        @unlink($file);
                    }
                }
            } catch (\Exception $e) {
                $this->error("     ✗ [{$targetDate}] gagal disimpan: ".$e->getMessage());
                $failures[] = $targetDate;
            }
        }

        if (! empty($failures)) {
            $this->newLine();
            $this->error('=== SELESAI DENGAN PERINGATAN ===');
            $this->error('Tanggal bermasalah: '.implode(', ', $failures));

            return self::FAILURE;
        }

        $this->info("\n=== PENYERAPAN SELESAI DENGAN SUKSES ===");

        return self::SUCCESS;
    }
}
