<?php

namespace App\Http\Controllers;

use App\Services\OceanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Inertia\Response;

class MapController extends Controller
{
    /**
     * Satu-satunya gerbang utama untuk menampilkan Peta Operasional & Prediksi (H+0 s/d H+9)
     */
    public function index(Request $request, OceanService $ocean): Response
    {
        // 1. Tangkap parameter tanggal. Jika kosong, default ke hari ini.
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));

        // 2. Cek keberadaan file gambar raster secara deterministik di storage public
        $sstPath = "grids/{$date}/sst_raster.png";
        $chlPath = "grids/{$date}/chl_raster.png";

        // Generator URL otomatis jika file fisik hasil olahan Python tersedia
        $sstUrl = Storage::disk('public')->exists($sstPath) 
            ? asset("storage/{$sstPath}") 
            : null;

        $chlUrl = Storage::disk('public')->exists($chlPath) 
            ? asset("storage/{$chlPath}") 
            : null;

        // 3. Kirim data tunggal ke kanvas React via Inertia
        return inertia('Map/Index', [
            'selectedDate' => $date,
            'zppiGeoJson'  => $ocean->getGeoJsonByDate($date), // Pastikan method ini mengambil dari tabel zppi_zones berdasarkan tanggal
            'sstFileUrl'   => $sstUrl,
            'chlFileUrl'   => $chlUrl,
        ]);
    }
}