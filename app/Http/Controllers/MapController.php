<?php

namespace App\Http\Controllers;

use App\Services\FuelPriceService;
use App\Services\OceanService;
use App\Services\RouteService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'zppiGeoJson' => $ocean->getGeoJsonByDate($date), // Pastikan method ini mengambil dari tabel zppi_zones berdasarkan tanggal
            'sstFileUrl' => $sstUrl,
            'chlFileUrl' => $chlUrl,
        ]);
    }

    /**
     * Hitung rute pelayaran (menghindari daratan) dari posisi nelayan ke titik zona.
     * Dikonsumsi oleh tombol "Mulai Navigasi" di sidebar peta via axios.
     */
    public function getRoute(Request $request, RouteService $router, FuelPriceService $fuel): JsonResponse
    {
        $validated = $request->validate([
            'start_lat' => 'required|numeric|between:-90,90',
            'start_lng' => 'required|numeric|between:-180,180',
            'end_lat' => 'required|numeric|between:-90,90',
            'end_lng' => 'required|numeric|between:-180,180',
        ]);

        $route = $router->findRoute(
            (float) $validated['start_lat'],
            (float) $validated['start_lng'],
            (float) $validated['end_lat'],
            (float) $validated['end_lng'],
        );

        if (empty($route['error'])) {
            // Lampirkan harga BBM (provinsi asal nelayan) agar frontend bisa
            // mengestimasi biaya bahan bakar perjalanan pulang-pergi.
            $route['fuel'] = $fuel->getPricesForCoordinate(
                (float) $validated['start_lat'],
                (float) $validated['start_lng'],
            );
        }

        $status = empty($route['error']) ? 200 : 422;

        return response()->json($route, $status);
    }
}
