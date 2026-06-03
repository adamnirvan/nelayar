<?php

namespace App\Console\Commands;

use App\Services\OceanService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SyncOceanForecast extends Command
{
    /**
     * Nama perintah yang akan diketik di terminal.
     *
     * @var string
     */
    protected $signature = 'ocean:sync-forecast';

    /**
     * Deskripsi singkat perintah saat melihat daftar php artisan.
     *
     * @var string
     */
    protected $description = 'Menghapus data ZPPI kemarin dan menambal data forecast hingga 10 hari ke depan (Sliding Window)';

    /**
     * Eksekusi utama perintah.
     */
    public function handle()
    {
        // Set baseline tanggal hari ini (Y-m-d)
        $today = Carbon::today()->format('Y-m-d');
        $this->info('=== MEMULAI SINKRONISASI OSEANOGRAFI ===');
        $this->info("Baseline Hari Ini: {$today}\n");

        // =========================================================
        // FASE 1: ELIMINASI DATA KEMARIN (Sesuai Diagram)
        // =========================================================
        $this->comment('1. Menjalankan Fase Eliminasi Data Usang...');

        // Ambil semua tanggal lama yang bernilai kurang dari hari ini
        $expiredDates = DB::table('zppi_zones')
            ->where('zone_date', '<', $today)
            ->distinct()
            ->pluck('zone_date');

        if ($expiredDates->isEmpty()) {
            $this->line('   - Tidak ada data masa lalu yang perlu dibersihkan.');
        } else {
            foreach ($expiredDates as $oldDate) {
                // Hapus folder penyimpanan gambar raster lama (grids/YYYY-MM-DD)
                $folderPath = "grids/{$oldDate}";
                if (Storage::disk('public')->exists($folderPath)) {
                    Storage::disk('public')->deleteDirectory($folderPath);
                    $this->line("   ✓ Folder gambar usang berhasil dihapus: public/storage/{$folderPath}");
                }
            }

            // Hapus baris data koordinat spasial di database yang sudah lewat
            $deletedRows = DB::table('zppi_zones')->where('zone_date', '<', $today)->delete();
            $this->info("   ✓ Berhasil menghapus {$deletedRows} baris koordinat lama dari database.");
        }

        // =========================================================
        // FASE 2: PENAMBALAN FORECAST DATA (Hari ini sampai H+9)
        // =========================================================
        $this->comment("\n2. Menjalankan Fase Penambalan Data Forecast (10 Hari)...");
        $service = app(OceanService::class);

        // Tanggal yang gagal diproses atau menghasilkan 0 zona.
        $failures = [];

        // Melakukan perulangan sebanyak 10 kali (0 = Hari ini, 9 = H+9)
        for ($i = 0; $i <= 9; $i++) {
            $targetDate = Carbon::today()->addDays($i)->format('Y-m-d');

            // Cek apakah data untuk tanggal target sudah tersedia di DB
            $isDataExist = DB::table('zppi_zones')->where('zone_date', $targetDate)->exists();

            if ($isDataExist) {
                // Jika sudah ada (berkat cron job hari sebelumnya), jangan download ulang!
                $this->line("   - Data untuk tanggal [{$targetDate}] sudah lengkap. Skip.");
            } else {
                // Jika kosong (seperti kotak kuning +8 di diagram), panggil microservice Python
                $this->warn("   - Data [{$targetDate}] KOSONG. Memanggil parser Python...");

                try {
                    // Memicu skrip Python parse_zppi.py dengan argumen --date dinamis.
                    // Log diagnostik (stderr) di-stream langsung ke konsol secara real-time.
                    $zoneCount = $service->fetchAndStore(
                        $targetDate,
                        fn (string $line) => $this->line("       <fg=gray>{$line}</>")
                    );

                    if ($zoneCount === 0) {
                        $this->warn("     ⚠ Tanggal {$targetDate} berhasil diproses tetapi 0 zona tersimpan. Cek tabel fish_profiles (jalankan db:seed) atau ambang batas SST/Chl.");
                        $failures[] = $targetDate;
                    } else {
                        $this->info("     ✓ Sukses: {$zoneCount} zona tersimpan untuk tanggal {$targetDate}");
                    }
                } catch (\Exception $e) {
                    $this->error("     ✗ Gagal memproses tanggal {$targetDate}: ".$e->getMessage());
                    $failures[] = $targetDate;
                }
            }
        }

        if (! empty($failures)) {
            $this->newLine();
            $this->error('=== SINKRONISASI SELESAI DENGAN PERINGATAN ===');
            $this->error('Tanggal bermasalah (gagal / 0 zona): '.implode(', ', $failures));

            return self::FAILURE;
        }

        $this->info("\n=== SINKRONISASI SELESAI DENGAN SUKSES ===");

        return self::SUCCESS;
    }
}
