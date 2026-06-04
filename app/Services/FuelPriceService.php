<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Mengambil harga BBM (Pertalite & Biosolar bersubsidi) dari bensin-api
 * (https://github.com/nasgunawann/bensin-api) untuk mengestimasi biaya bahan
 * bakar satu perjalanan navigasi.
 *
 * Harga Pertamina hanya berubah harian, jadi seluruh hasil di-cache di Redis.
 * Provinsi dideteksi dari koordinat nelayan via reverse-geocode Nominatim;
 * jika gagal (mis. titik di tengah laut), jatuh ke rata-rata nasional.
 */
class FuelPriceService
{
    private const BASE_URL = 'https://nasgunawann.github.io/bensin-api/v1';

    // Harga provinsi & rata-rata nasional: cukup segar 6 jam.
    private const PRICE_TTL_MINUTES = 360;

    // Batas provinsi praktis tak berubah → cache hasil geocode lebih lama.
    private const GEOCODE_TTL_DAYS = 30;

    /**
     * Harga Pertalite & Solar untuk sebuah koordinat (deteksi provinsi otomatis).
     *
     * @return array{province:string, province_slug:?string, source:string, pertalite:?int, solar:?int, updated_at:?string}
     */
    public function getPricesForCoordinate(float $lat, float $lng): array
    {
        $slug = $this->detectProvinceSlug($lat, $lng);

        if ($slug !== null) {
            $province = $this->fetchProvincePrices($slug);

            if ($province !== null) {
                return $province;
            }
        }

        return $this->nationalAverage();
    }

    /**
     * Deteksi slug provinsi bensin-api dari lat/lng via Nominatim (OpenStreetMap).
     * Dibulatkan ~10 km untuk cache key agar tidak menembak ulang per meter.
     */
    private function detectProvinceSlug(float $lat, float $lng): ?string
    {
        $cacheKey = sprintf('fuel_geocode:%.2f,%.2f', $lat, $lng);

        return Cache::remember($cacheKey, now()->addDays(self::GEOCODE_TTL_DAYS), function () use ($lat, $lng) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'nelayar-gis/1.0 (fuel-estimate)'])
                    ->get('https://nominatim.openstreetmap.org/reverse', [
                        'format' => 'jsonv2',
                        'lat' => $lat,
                        'lon' => $lng,
                        'zoom' => 8, // tingkat provinsi/kabupaten
                        'addressdetails' => 1,
                        'accept-language' => 'id',
                    ]);

                $state = $response->json('address.state');

                if (! is_string($state) || $state === '') {
                    return null;
                }

                return $this->matchProvinceSlug($state);
            } catch (\Throwable $e) {
                Log::warning('Reverse-geocode harga BBM gagal', ['error' => $e->getMessage()]);

                return null;
            }
        });
    }

    /**
     * Cocokkan nama provinsi hasil geocode (mis. "Daerah Khusus Ibukota Jakarta")
     * dengan slug katalog bensin-api (mis. "dki-jakarta"), toleran prefiks resmi.
     */
    private function matchProvinceSlug(string $stateName): ?string
    {
        $catalog = $this->fetchIndex();

        if ($catalog === null) {
            return null;
        }

        $target = $this->normalizeProvinceName($stateName);

        foreach ($catalog as $slug => $meta) {
            $name = $this->normalizeProvinceName($meta['name'] ?? $slug);

            if ($name === $target || str_contains($name, $target) || str_contains($target, $name)) {
                return $slug;
            }
        }

        return null;
    }

    /**
     * Buang prefiks administratif ("Prov.", "DKI", "DI", "Daerah Khusus
     * Ibukota", "Daerah Istimewa") agar inti nama bisa dibandingkan.
     */
    private function normalizeProvinceName(string $name): string
    {
        $name = Str::lower($name);

        $prefixes = [
            'daerah khusus ibukota',
            'daerah istimewa',
            'provinsi',
            'prov.',
            'prov',
            'dki',
            'di ',
        ];

        foreach ($prefixes as $prefix) {
            if (str_starts_with($name, $prefix)) {
                $name = trim(substr($name, strlen($prefix)));
            }
        }

        // Sisakan huruf & spasi, rapikan spasi ganda.
        $name = preg_replace('/[^a-z\s]/', '', $name) ?? $name;

        return trim(preg_replace('/\s+/', ' ', $name) ?? $name);
    }

    /** Katalog provinsi (slug → meta) dari index.json, di-cache. */
    private function fetchIndex(): ?array
    {
        return Cache::remember('fuel_index', now()->addMinutes(self::PRICE_TTL_MINUTES), function () {
            try {
                $response = Http::timeout(10)->get(self::BASE_URL.'/index.json');
                $provinces = $response->json('provinsi');

                return is_array($provinces) ? $provinces : null;
            } catch (\Throwable $e) {
                Log::warning('Gagal memuat index harga BBM', ['error' => $e->getMessage()]);

                return null;
            }
        });
    }

    /**
     * Harga Pertalite & Solar untuk satu provinsi.
     *
     * @return array{province:string, province_slug:?string, source:string, pertalite:?int, solar:?int, updated_at:?string}|null
     */
    private function fetchProvincePrices(string $slug): ?array
    {
        return Cache::remember("fuel_province:{$slug}", now()->addMinutes(self::PRICE_TTL_MINUTES), function () use ($slug) {
            try {
                $response = Http::timeout(10)->get(self::BASE_URL."/provinsi/{$slug}.json");
                $data = $response->json();

                if (! is_array($data) || empty($data['products'])) {
                    return null;
                }

                return [
                    'province' => $data['province'] ?? $slug,
                    'province_slug' => $slug,
                    'source' => 'province',
                    'pertalite' => $this->extractPrice($data['products'], 'pertalite'),
                    'solar' => $this->extractPrice($data['products'], 'solar'),
                    'updated_at' => $data['pertamina_updated_at'] ?? null,
                ];
            } catch (\Throwable $e) {
                Log::warning('Gagal memuat harga BBM provinsi', ['slug' => $slug, 'error' => $e->getMessage()]);

                return null;
            }
        });
    }

    /**
     * Rata-rata nasional sebagai cadangan saat provinsi tak terdeteksi.
     *
     * @return array{province:string, province_slug:?string, source:string, pertalite:?int, solar:?int, updated_at:?string}
     */
    private function nationalAverage(): array
    {
        $fallback = [
            'province' => 'Rata-rata Nasional',
            'province_slug' => null,
            'source' => 'national',
            'pertalite' => null,
            'solar' => null,
            'updated_at' => null,
        ];

        return Cache::remember('fuel_national', now()->addMinutes(self::PRICE_TTL_MINUTES), function () use ($fallback) {
            try {
                $response = Http::timeout(15)->get(self::BASE_URL.'/nasional.json');
                $provinces = $response->json('provinces');

                if (! is_array($provinces) || $provinces === []) {
                    return $fallback;
                }

                $pertalite = [];
                $solar = [];

                foreach ($provinces as $prov) {
                    $products = $prov['products'] ?? [];

                    if ($p = $this->extractPrice($products, 'pertalite')) {
                        $pertalite[] = $p;
                    }

                    if ($s = $this->extractPrice($products, 'solar')) {
                        $solar[] = $s;
                    }
                }

                return [
                    'province' => 'Rata-rata Nasional',
                    'province_slug' => null,
                    'source' => 'national',
                    'pertalite' => $pertalite !== [] ? (int) round(array_sum($pertalite) / count($pertalite)) : null,
                    'solar' => $solar !== [] ? (int) round(array_sum($solar) / count($solar)) : null,
                    'updated_at' => $response->json('pertamina_updated_at'),
                ];
            } catch (\Throwable $e) {
                Log::warning('Gagal memuat rata-rata harga BBM nasional', ['error' => $e->getMessage()]);

                return $fallback;
            }
        });
    }

    /**
     * Ambil harga sebuah jenis BBM dari daftar produk Pertamina.
     * 'pertalite' → produk "PERTALITE"; 'solar' → Biosolar bersubsidi
     * (yang dipakai nelayan), dengan cadangan varian Biosolar lain.
     */
    private function extractPrice(array $products, string $type): ?int
    {
        $candidates = $type === 'solar'
            ? ['PERTAMINA BIOSOLAR SUBSIDI', 'BIOSOLAR', 'PERTAMINA BIOSOLAR NON SUBSIDI']
            : ['PERTALITE'];

        foreach ($candidates as $name) {
            foreach ($products as $product) {
                if (($product['product'] ?? null) === $name && is_numeric($product['price_rupiah'] ?? null)) {
                    return (int) $product['price_rupiah'];
                }
            }
        }

        return null;
    }
}
