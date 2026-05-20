# Nelayar GIS — Backend Developer TODO

> **Context:**
> - Stack: Laravel 11 + Inertia.js + React (TypeScript)
> - Auth: Laravel Breeze already installed (use as-is, extend where needed)
> - Environment: Local (Herd/Valet/XAMPP)
> - Python microservice lives at `microservice/` in project root
> - Frontend dev handles everything in `resources/js/` — your job is to pass correct props via `Inertia::render()`

---

## Architecture Reminder

```
React page (Inertia)
    ↑ props
Laravel Controller
    ↑ query / eloquent
PostgreSQL + PostGIS
    ↑ insert
Laravel Scheduler (every 12h)
    ↑ Process::run()
Python microservice (microservice/)
    ↑ download
CMEMS / BMKG / Open-Meteo / KKP scraper
```

---

## Environment Setup Checklist

- [ ] Enable PostgreSQL + PostGIS on local machine
  - Herd: use DBngin for PostgreSQL, enable PostGIS via `CREATE EXTENSION postgis;`
  - XAMPP: switch DB to PostgreSQL or run PostgreSQL separately
- [ ] Set `.env` database driver to `pgsql`
- [ ] Install Python 3.11+ locally, create venv in `microservice/`
  ```bash
  cd microservice
  python -m venv .venv
  source .venv/bin/activate   # Windows: .venv\Scripts\activate
  pip install copernicusmarine xarray numpy shapely requests beautifulsoup4
  ```
- [ ] Register CMEMS account at marine.copernicus.eu (free, may take 1–2 days to verify)
- [ ] Store CMEMS credentials in `.env`:
  ```
  CMEMS_USERNAME=your_username
  CMEMS_PASSWORD=your_password
  PYTHON_PATH=/absolute/path/to/microservice/.venv/bin/python
  ```
- [ ] Install Redis locally (for weather cache)
  - Mac: `brew install redis && brew services start redis`
  - Windows: use Memurai or WSL
- [ ] Set `.env` cache driver: `CACHE_DRIVER=redis`
- [ ] Run `php artisan migrate` to verify DB connection

---

## Database Setup

### Step 1 — Enable PostGIS

Add this to a new migration or run manually:

```php
// database/migrations/xxxx_enable_postgis.php
public function up(): void
{
    DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
}
```

### Step 2 — Migrations (run in this order)

Create migrations with `php artisan make:migration`:

**`create_ocean_data_table`**
```php
Schema::create('ocean_data', function (Blueprint $table) {
    $table->id();
    $table->date('data_date')->index();
    $table->float('lat_min');
    $table->float('lat_max');
    $table->float('lon_min');
    $table->float('lon_max');
    $table->json('sst_grid');
    $table->json('chl_grid');
    $table->string('source')->default('CMEMS');
    $table->timestamp('fetched_at')->nullable();
    $table->timestamps();
});
```

**`create_zppi_zones_table`**
```php
Schema::create('zppi_zones', function (Blueprint $table) {
    $table->id();
    $table->foreignId('ocean_data_id')->constrained()->cascadeOnDelete();
    $table->date('zone_date')->index();
    $table->float('sst_min');
    $table->float('sst_max');
    $table->float('chl_threshold');
    $table->float('confidence');
    $table->timestamps();
});
// geometry column via raw (Eloquent doesn't support GEOMETRY natively)
DB::statement('ALTER TABLE zppi_zones ADD COLUMN geom geometry(MultiPolygon, 4326)');
DB::statement('CREATE INDEX zppi_zones_geom_idx ON zppi_zones USING GIST(geom)');
```

**`create_zppi_forecast_table`**
```php
Schema::create('zppi_forecast', function (Blueprint $table) {
    $table->id();
    $table->foreignId('ocean_data_id')->constrained()->cascadeOnDelete();
    $table->date('forecast_date')->index();
    $table->integer('day_offset'); // 1..10
    $table->float('confidence');
    $table->timestamps();
});
DB::statement('ALTER TABLE zppi_forecast ADD COLUMN geom geometry(MultiPolygon, 4326)');
DB::statement('CREATE INDEX zppi_forecast_geom_idx ON zppi_forecast USING GIST(geom)');
```

**`create_weather_cache_table`**
```php
Schema::create('weather_cache', function (Blueprint $table) {
    $table->id();
    $table->float('latitude');
    $table->float('longitude');
    $table->json('bmkg_data')->nullable();
    $table->json('openmeteo_data')->nullable();
    $table->string('active_source')->default('bmkg'); // 'bmkg' | 'openmeteo'
    $table->timestamp('fetched_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});
```

**`create_fish_prices_table`**
```php
Schema::create('fish_prices', function (Blueprint $table) {
    $table->id();
    $table->string('commodity');
    $table->string('province');
    $table->string('regency')->nullable();
    $table->string('region_group')->nullable();
    $table->integer('price');
    $table->float('price_change_pct')->nullable();
    $table->date('price_date');
    $table->string('period')->nullable();
    $table->string('source')->default('mi.kkp.go.id');
    $table->timestamp('scraped_at')->nullable();
    $table->timestamps();
});
```

### Step 3 — Add role column to users table

```php
// add to users migration or create new migration
$table->enum('role', ['nelayan', 'pembeli'])->default('nelayan')->after('email');
```

---

## Models

Create with `php artisan make:model`:

- `OceanData` — `fillable`: `data_date`, `lat_min`, `lat_max`, `lon_min`, `lon_max`, `sst_grid`, `chl_grid`, `source`, `fetched_at`. Cast `sst_grid` and `chl_grid` as `array`.
- `ZppiZone` — `fillable`: `ocean_data_id`, `zone_date`, `sst_min`, `sst_max`, `chl_threshold`, `confidence`. BelongsTo `OceanData`.
- `ZppiForecast` — `fillable`: `ocean_data_id`, `forecast_date`, `day_offset`, `confidence`. BelongsTo `OceanData`.
- `WeatherCache` — `fillable`: all columns. Cast `bmkg_data`, `openmeteo_data` as `array`.
- `FishPrice` — `fillable`: all columns.

---

## Python Microservice Scripts

All scripts live in `microservice/`. Each script reads args from CLI and outputs JSON to stdout. Laravel reads stdout via `Process::run()`.

### `microservice/parse_zppi.py`

```python
# Usage: python parse_zppi.py --date YYYY-MM-DD --lat-min -11 --lat-max 6 --lon-min 95 --lon-max 141
# Output: JSON { geojson: FeatureCollection, sst_min, sst_max, chl_threshold, confidence }

import sys, json, argparse
import copernicusmarine
import xarray as xr
import numpy as np
from shapely.geometry import mapping, MultiPolygon
from shapely.ops import unary_union
from shapely.geometry import box

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', required=True)
    parser.add_argument('--lat-min', type=float, default=-11)
    parser.add_argument('--lat-max', type=float, default=6)
    parser.add_argument('--lon-min', type=float, default=95)
    parser.add_argument('--lon-max', type=float, default=141)
    args = parser.parse_args()

    # Download SST + Chlorophyll from CMEMS
    # Product: GLOBAL_ANALYSISFORECAST_PHY_001_024 (SST)
    #          GLOBAL_ANALYSISFORECAST_BGC_001_028 (Chl-a)
    # Implementation here after CMEMS account is verified

    # Threshold criteria for pelagic fish (Indonesia):
    SST_MIN, SST_MAX = 26.0, 30.0
    CHL_MIN = 0.2  # mg/m³

    # TODO: implement after CMEMS access confirmed
    # mask = (sst >= SST_MIN) & (sst <= SST_MAX) & (chl >= CHL_MIN)
    # polygons = [box(lon, lat, lon+res, lat+res) for ... if mask]
    # multipolygon = unary_union(polygons)

    result = {
        "geojson": {"type": "FeatureCollection", "features": []},
        "sst_min": SST_MIN,
        "sst_max": SST_MAX,
        "chl_threshold": CHL_MIN,
        "confidence": 0.0
    }
    print(json.dumps(result))

if __name__ == '__main__':
    main()
```

### `microservice/parse_forecast.py`

Same structure as `parse_zppi.py` but loops over `day_offset` 1–10 and outputs array of 10 GeoJSON objects.

### `microservice/scrape_kkp.py`

```python
# Usage: python scrape_kkp.py
# Output: JSON array of price records

import requests, json
from bs4 import BeautifulSoup

# KKP MI does not expose a public API.
# Inspect Network tab at mi.kkp.go.id/harga for internal endpoints.
# Likely endpoint pattern: /api/harga?komoditas=Ikan+Tongkol
# Implement after endpoint is identified via browser DevTools.

COMMODITIES = ['Ikan Tongkol', 'Ikan Kembung', 'Ikan Bandeng', 'Ikan Teri', 'Udang Basah']

def scrape():
    results = []
    # TODO: implement after internal endpoint is identified
    print(json.dumps(results))

if __name__ == '__main__':
    scrape()
```

---

## Services

Create manually in `app/Services/`:

### `OceanService.php`

```php
// app/Services/OceanService.php
class OceanService
{
    public function fetchAndStore(string $date): void
    {
        $pythonPath = env('PYTHON_PATH', 'python3');
        $scriptPath = base_path('microservice/parse_zppi.py');

        $result = Process::run(
            "{$pythonPath} {$scriptPath} --date {$date}"
        );

        if ($result->failed()) {
            Log::error('ZPPI parse failed', ['error' => $result->errorOutput()]);
            return;
        }

        $data = json_decode($result->output(), true);

        $oceanData = OceanData::create([
            'data_date' => $date,
            'source'    => 'CMEMS',
            'fetched_at' => now(),
            // sst_grid, chl_grid populated after full Python impl
        ]);

        // Insert geom via raw query
        DB::statement("
            INSERT INTO zppi_zones
                (ocean_data_id, zone_date, sst_min, sst_max, chl_threshold, confidence, geom, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromGeoJSON(?), now(), now())
        ", [
            $oceanData->id,
            $date,
            $data['sst_min'],
            $data['sst_max'],
            $data['chl_threshold'],
            $data['confidence'],
            json_encode($data['geojson']['features'][0]['geometry'] ?? null),
        ]);
    }

    public function getTodayGeoJson(): array
    {
        $row = DB::selectOne("
            SELECT ST_AsGeoJSON(geom) as geojson, confidence, zone_date
            FROM zppi_zones
            WHERE zone_date = CURRENT_DATE
            ORDER BY created_at DESC
            LIMIT 1
        ");

        if (!$row) return ['type' => 'FeatureCollection', 'features' => []];

        return [
            'type' => 'FeatureCollection',
            'features' => [[
                'type' => 'Feature',
                'geometry' => json_decode($row->geojson, true),
                'properties' => [
                    'confidence' => $row->confidence,
                    'zone_date'  => $row->zone_date,
                ],
            ]],
        ];
    }

    public function getForecastGeoJson(string $date): array
    {
        $row = DB::selectOne("
            SELECT ST_AsGeoJSON(geom) as geojson, confidence, forecast_date, day_offset
            FROM zppi_forecast
            WHERE forecast_date = ?
            ORDER BY created_at DESC
            LIMIT 1
        ", [$date]);

        if (!$row) return ['type' => 'FeatureCollection', 'features' => []];

        return [
            'type' => 'FeatureCollection',
            'features' => [[
                'type' => 'Feature',
                'geometry' => json_decode($row->geojson, true),
                'properties' => [
                    'confidence'    => $row->confidence,
                    'forecast_date' => $row->forecast_date,
                    'day_offset'    => $row->day_offset,
                ],
            ]],
        ];
    }
}
```

### `WeatherService.php`

```php
// app/Services/WeatherService.php
class WeatherService
{
    const TTL_MINUTES = 60;

    public function get(float $lat, float $lon): array
    {
        // Check cache first
        $cached = WeatherCache::where('latitude', $lat)
            ->where('longitude', $lon)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            return $cached->active_source === 'bmkg'
                ? $cached->bmkg_data
                : $cached->openmeteo_data;
        }

        // Try BMKG
        try {
            $data = $this->fetchBmkg($lat, $lon);
            $source = 'bmkg';
        } catch (\Exception $e) {
            // Fallback to Open-Meteo
            $data = $this->fetchOpenMeteo($lat, $lon);
            $source = 'openmeteo';
        }

        // Store to cache
        WeatherCache::updateOrCreate(
            ['latitude' => $lat, 'longitude' => $lon],
            [
                "{$source}_data" => $data,
                'active_source'  => $source,
                'fetched_at'     => now(),
                'expires_at'     => now()->addMinutes(self::TTL_MINUTES),
            ]
        );

        return $data;
    }

    private function fetchBmkg(float $lat, float $lon): array
    {
        $response = Http::timeout(10)->get(
            "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={$lat},{$lon}"
        );
        if (!$response->ok()) throw new \Exception('BMKG unavailable');

        // Normalize response shape to match page props contract
        return [
            'source'         => 'bmkg',
            'wind_speed'     => data_get($response->json(), 'data.0.cuaca.0.0.ws_knot', 0),
            'wind_direction' => data_get($response->json(), 'data.0.cuaca.0.0.wd', '-'),
            'wave_height'    => 0, // BMKG does not always provide wave height
            'temperature'    => data_get($response->json(), 'data.0.cuaca.0.0.t', 0),
            'fetched_at'     => now()->toISOString(),
        ];
    }

    private function fetchOpenMeteo(float $lat, float $lon): array
    {
        $response = Http::timeout(10)->get('https://api.open-meteo.com/v1/forecast', [
            'latitude'       => $lat,
            'longitude'      => $lon,
            'hourly'         => 'temperature_2m,windspeed_10m,winddirection_10m,wave_height',
            'forecast_days'  => 1,
        ]);

        $json = $response->json();
        return [
            'source'         => 'openmeteo',
            'wind_speed'     => data_get($json, 'hourly.windspeed_10m.0', 0),
            'wind_direction' => data_get($json, 'hourly.winddirection_10m.0', 0) . '°',
            'wave_height'    => data_get($json, 'hourly.wave_height.0', 0),
            'temperature'    => data_get($json, 'hourly.temperature_2m.0', 0),
            'fetched_at'     => now()->toISOString(),
        ];
    }
}
```

### `FishPriceService.php`

```php
// app/Services/FishPriceService.php
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

        foreach ($prices as $price) {
            FishPrice::updateOrCreate(
                [
                    'commodity'  => $price['commodity'],
                    'province'   => $price['province'],
                    'regency'    => $price['regency'],
                    'price_date' => $price['price_date'],
                ],
                array_merge($price, ['scraped_at' => now()])
            );
        }
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
```

---

## Artisan Commands

Create with `php artisan make:command`:

```
app/Console/Commands/
├── FetchOceanData.php      ← runs OceanService::fetchAndStore()
├── FetchForecast.php       ← runs forecast Python script
└── ScrapeKkpPrices.php     ← runs FishPriceService::scrapeAndStore()
```

Each command signature:
- `nelayar:fetch-ocean` — calls `OceanService::fetchAndStore(today())`
- `nelayar:fetch-forecast` — calls forecast script for D+1..D+10
- `nelayar:scrape-kkp` — calls `FishPriceService::scrapeAndStore()`

Test manually before wiring to scheduler:
```bash
php artisan nelayar:fetch-ocean
php artisan nelayar:scrape-kkp
```

---

## Scheduler

Wire commands in `routes/console.php` (Laravel 11 style — no `Kernel.php`):

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('nelayar:fetch-ocean')->twiceDaily(6, 18);
Schedule::command('nelayar:fetch-forecast')->twiceDaily(6, 18);
Schedule::command('nelayar:scrape-kkp')->weekly();
```

Run locally for testing:
```bash
php artisan schedule:work
```

---

## Controllers + Routes

Create with `php artisan make:controller`:

### `MapController.php`
```php
public function index(OceanService $ocean): Response
{
    return Inertia::render('Map/Index', [
        'zppiGeoJson' => $ocean->getTodayGeoJson(),
    ]);
}

public function forecast(Request $request, OceanService $ocean): Response
{
    $date = $request->query('date', now()->addDay()->toDateString());
    $dates = ZppiForecast::select('forecast_date')
        ->distinct()
        ->orderBy('forecast_date')
        ->pluck('forecast_date')
        ->toArray();

    return Inertia::render('Map/Forecast', [
        'forecastDates' => $dates,
        'selectedDate'  => $date,
        'zppiGeoJson'   => $ocean->getForecastGeoJson($date),
    ]);
}
```

### `WeatherController.php`
```php
public function index(Request $request, WeatherService $weather): Response
{
    $lat = $request->query('lat', -2.5);
    $lon = $request->query('lon', 118.0);

    return Inertia::render('Weather/Index', [
        'weather' => $weather->get((float)$lat, (float)$lon),
    ]);
}
```

### `PricesController.php`
```php
public function index(Request $request, FishPriceService $prices): Response
{
    return Inertia::render('Prices/Index', [
        'prices'      => $prices->get(
            $request->query('commodity'),
            $request->query('province')
        ),
        'commodities' => FishPrice::distinct()->pluck('commodity'),
        'provinces'   => FishPrice::distinct()->pluck('province'),
    ]);
}
```

### `routes/web.php`

```php
// Public
Route::get('/login', [AuthController::class, 'create'])->name('login');
Route::post('/login', [AuthController::class, 'store']);
Route::get('/register', [RegisterController::class, 'create'])->name('register');
Route::post('/register', [RegisterController::class, 'store']);

// Protected
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');
    Route::get('/map',          [MapController::class, 'index'])->name('map.index');
    Route::get('/map/forecast', [MapController::class, 'forecast'])->name('map.forecast');
    Route::get('/weather',      [WeatherController::class, 'index'])->name('weather.index');
    Route::get('/prices',       [PricesController::class, 'index'])->name('prices.index');

    // Redirect root to map
    Route::redirect('/', '/map');
});
```

> **Note to frontend dev:** Route names above are the canonical references. Use `route('map.index')` in Inertia `<Link>` components.

---

## TODO Checklist

### Phase 1 — Environment & DB ✅
- [x] Enable PostGIS extension via migration (`2026_05_16_000001_enable_postgis.php`)
- [x] Run all migrations in order (confirmed clean on 2026-05-16)
- [x] Add `role` column to users table (`2026_05_16_000002_add_role_to_users_table.php`)
- [x] Confirm `php artisan migrate` runs clean
- [x] Create Python microservice scripts: `parse_zppi.py`, `parse_forecast.py`, `scrape_kkp.py`
- [x] `.env` updated: `DB_CONNECTION=pgsql`, `CACHE_STORE=redis`, CMEMS + `PYTHON_PATH` placeholders added
- [ ] Setup Python venv and install dependencies in `microservice/` — **do manually**
- [ ] Verify Python script runs manually: `python microservice/parse_zppi.py --date 2026-05-16` — **do manually**
- [ ] Register CMEMS account (do this on day 1 — verification takes 1–2 days) — **do manually**
- [ ] Add real CMEMS credentials + `PYTHON_PATH` to `.env` — **do manually**
- [ ] Install + start Redis locally — **do manually**

> **Note:** `foreignId('ocean_data_id')->constrained()` was fixed to `->constrained('ocean_data')` — Laravel pluralised the table name incorrectly.

### Phase 2 — Auth ✅
- [x] Add `role` field to registration — validated (`in:nelayan,pembeli`) in `CreateNewUser`, saved on `User::create()`
- [x] Register view updated to `Auth/Register` (capital A) with `roles` prop passed
- [x] Login view updated to `Auth/Login` (capital A)
- [x] Login/register/2FA all redirect to `/map` (`LoginResponse`, `RegisterResponse`, `TwoFactorLoginResponse`)
- [x] Auth middleware protects all app routes — `routes/web.php` rewritten; `/` → `/map` redirect inside `auth` group
- [x] Stub controllers created: `MapController`, `WeatherController`, `PricesController` (return empty props, filled in later phases)

> **Note for frontend dev:** Register page now receives `roles: ['nelayan', 'pembeli']` prop — add a select/radio for it.

### Phase 3 — ZPPI core (most critical) ✅
- [x] Create `OceanService` with `fetchAndStore()` and `getTodayGeoJson()` (`app/Services/OceanService.php`)
- [x] Create `FetchOceanData` Artisan command (`app/Console/Commands/FetchOceanData.php`, sig: `nelayar:fetch-ocean`)
- [ ] Test command manually: `php artisan nelayar:fetch-ocean` — **do manually after CMEMS creds + Python venv are set**
- [x] Wire `MapController::index()` to `OceanService::getTodayGeoJson()`
- [ ] Verify GeoJSON returned is valid (paste into geojson.io to check) — **do manually**
- [ ] **Checkpoint:** `/map` loads and passes non-empty GeoJSON to frontend — **do manually**

> **Note:** `OceanData`, `ZppiZone`, `ZppiForecast` models also created. `OceanService::getForecastGeoJson()` implemented early (used by Phase 4). `MapController::forecast()` also wired to `OceanService` ahead of Phase 4.

### Phase 4 — Forecast ✅
- [x] Create `FetchForecast` Artisan command (`app/Console/Commands/FetchForecast.php`, sig: `nelayar:fetch-forecast`)
- [x] Extend `OceanService` with `fetchAndStoreForecast(string $baseDate)` — runs `parse_forecast.py`, stores D+1..D+10 rows in `zppi_forecast`
- [x] `OceanService::getForecastGeoJson()` — implemented in Phase 3
- [x] Wire `MapController::forecast()` to `OceanService::getForecastGeoJson()` — done in Phase 3
- [ ] **Checkpoint:** `GET /map/forecast?date=2026-05-21` returns correct GeoJSON — **do manually after CMEMS creds + Python venv**

### Phase 5 — Weather ✅
- [x] Create `WeatherCache` model (`app/Models/WeatherCache.php`)
- [x] Create `WeatherService` with BMKG fetch + Open-Meteo fallback (`app/Services/WeatherService.php`)
- [x] Normalize BMKG response to page props contract (`source`, `wind_speed`, `wind_direction`, `wave_height`, `temperature`, `humidity`, `weather_desc`, `fetched_at`)
- [x] Open-Meteo uses marine API (`marine-api.open-meteo.com`) for wave height — gracefully skipped if unavailable
- [x] Wire `WeatherController::index()` to `WeatherService`
- [ ] Inspect live BMKG response shape and adjust `data_get()` paths if needed — **do manually**
- [ ] Test fallback: temporarily break BMKG URL, confirm Open-Meteo kicks in — **do manually**
- [ ] **Checkpoint:** `/weather` returns valid weather props to frontend — **do manually**

### Phase 6 — Fish prices
- [ ] Inspect `mi.kkp.go.id/harga` Network tab — identify internal JSON endpoint
- [ ] Implement `scrape_kkp.py` using identified endpoint
- [ ] Create `FishPriceService` with `scrapeAndStore()` and `get()`
- [ ] Create `ScrapeKkpPrices` Artisan command
- [ ] Test: `php artisan nelayar:scrape-kkp` → verify rows in `fish_prices` table
- [ ] Wire `PricesController::index()` to `FishPriceService`
- [ ] **Checkpoint:** `/prices` returns non-empty prices array to frontend

### Phase 7 — Scheduler + polish
- [ ] Wire all commands in `routes/console.php`
- [ ] Test scheduler locally: `php artisan schedule:work`
- [x] Add error logging to all service methods — done in Phases 3–5 (`Log::error`, `Log::warning`, `Log::info` present in `OceanService` and `WeatherService`; will carry through to `FishPriceService` in Phase 6)
- [ ] Add seed data for demo: `php artisan db:seed`
  - At least 1 ZPPI zone for today
  - At least 10 forecast entries (D+1..D+10)
  - At least 20 fish price rows across multiple provinces
- [ ] Verify all 5 pages load without 500 errors

---

## Coordinate with Frontend Dev On

- [ ] Confirm GeoJSON feature properties shape: `confidence` (float), `zone_date` (string)
- [ ] Confirm `forecastDates` is array of `YYYY-MM-DD` strings
- [ ] Confirm weather props shape: `source`, `wind_speed`, `wind_direction`, `wave_height`, `temperature`, `humidity`, `weather_desc`, `fetched_at` — note `humidity` and `weather_desc` were added vs original spec
- [ ] Confirm filter query param names: `commodity`, `province` (for prices page)
- [ ] Share route names so frontend can use `route()` helper in Inertia `<Link>`

---

## Do NOT do (yet)

- Do not implement WebSocket or real-time bidding
- Do not implement payment gateway
- Do not build API-only endpoints (no `/api` prefix needed — Inertia uses web routes)
- Do not add file upload / product listing (e-commerce removed from scope)