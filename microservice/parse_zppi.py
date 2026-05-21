import sys
import json
import argparse
import numpy as np

SST_MIN, SST_MAX = 26.0, 30.0
CHL_MIN = 0.2  # mg/m³

def build_multipolygon_geojson(mask, lats, lons, res):
    """Convert a boolean mask grid into a GeoJSON MultiPolygon."""
    from shapely.geometry import box, mapping
    from shapely.ops import unary_union

    polygons = []
    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            if mask[i, j]:
                polygons.append(box(lon, lat, lon + res, lat + res))

    if not polygons:
        return None

    merged = unary_union(polygons)
    if merged.geom_type == 'Polygon':
        from shapely.geometry import MultiPolygon
        merged = MultiPolygon([merged])

    return mapping(merged)

def fetch_cmems(date, lat_min, lat_max, lon_min, lon_max):
    import copernicusmarine
    import os

    username = os.environ.get('CMEMS_USERNAME')
    password = os.environ.get('CMEMS_PASSWORD')

    # 1. TARIK DATA SST (Suhu Permukaan Laut)
    sst_ds = copernicusmarine.open_dataset(
        dataset_id='cmems_mod_glo_phy-thetao_anfc_0.083deg_PT6H-i',
        variables=['thetao'],
        minimum_latitude=lat_min,
        maximum_latitude=lat_max,
        minimum_longitude=lon_min,
        maximum_longitude=lon_max,
        start_datetime=f'{date}T00:00:00',
        end_datetime=f'{date}T23:59:59',
        username=username,
        password=password,
    )
    sst = sst_ds['thetao'].isel(depth=0).mean(dim='time').values
    lats = sst_ds['latitude'].values
    lons = sst_ds['longitude'].values
    res = float(lons[1] - lons[0]) if len(lons) > 1 else 0.083

    # 2. TARIK DATA BGC (Cek ketersediaan Klorofil)
    chl = None
    try:
        chl_ds = copernicusmarine.open_dataset(
            dataset_id='cmems_mod_glo_bgc-bio_anfc_0.25deg_P1D-m',
            minimum_latitude=lat_min,
            maximum_latitude=lat_max,
            minimum_longitude=lon_min,
            maximum_longitude=lon_max,
            start_datetime=f'{date}T00:00:00',
            end_datetime=f'{date}T23:59:59',
            username=username,
            password=password,
        )
        
        # Pengecekan dinamis: Apakah 'chl' benar-benar ada?
        if 'chl' in chl_ds.variables:
            chl = chl_ds['chl'].isel(depth=0).mean(dim='time').values
        else:
            print("INFO: Kolom 'chl' tidak tersedia di satelit. Mengaktifkan Mode ZPPI (SST Only).", file=sys.stderr)
            
    except Exception as e:
        print(f"INFO: Gagal mengunduh dataset BGC. Mengaktifkan Mode ZPPI (SST Only). Detail: {e}", file=sys.stderr)

    return sst, chl, lats, lons, res

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', required=True)
    parser.add_argument('--lat-min', type=float, default=-11)
    parser.add_argument('--lat-max', type=float, default=6)
    parser.add_argument('--lon-min', type=float, default=95)
    parser.add_argument('--lon-max', type=float, default=141)
    args = parser.parse_args()

    try:
        sst, chl, lats, lons, res = fetch_cmems(
            args.date, args.lat_min, args.lat_max, args.lon_min, args.lon_max
        )

        # 3. LOGIKA GRACEFUL DEGRADATION
        if chl is not None:
            # Mode Normal: Interpolasi dan gabungkan SST & Klorofil
            if chl.shape != sst.shape:
                from scipy.interpolate import RegularGridInterpolator
                chl_lats = np.linspace(args.lat_min, args.lat_max, chl.shape[0])
                chl_lons = np.linspace(args.lon_min, args.lon_max, chl.shape[1])
                interp = RegularGridInterpolator((chl_lats, chl_lons), chl, bounds_error=False, fill_value=0)
                grid_lats, grid_lons = np.meshgrid(lats, lons, indexing='ij')
                chl = interp((grid_lats, grid_lons))

            mask = (sst >= SST_MIN) & (sst <= SST_MAX) & (chl >= CHL_MIN)
            data_mode = "SST + Klorofil-a"
        else:
            # Mode Darurat: Hitung area potensial HANYA berdasarkan suhu (SST)
            mask = (sst >= SST_MIN) & (sst <= SST_MAX)
            data_mode = "SST Only (Klorofil Tidak Tersedia)"

        confidence = float(np.sum(mask) / mask.size) if mask.size > 0 else 0.0

        geom = build_multipolygon_geojson(mask, lats, lons, res)
        features = []
        if geom:
            features.append({
                'type': 'Feature',
                'geometry': geom,
                'properties': {
                    'confidence': confidence,
                    'zone_date': args.date,
                    'data_source': data_mode # Penanda jujur untuk Frontend
                },
            })

        result = {
            'geojson': {'type': 'FeatureCollection', 'features': features},
            'sst_min': SST_MIN,
            'sst_max': SST_MAX,
            'chl_threshold': CHL_MIN if chl is not None else None,
            'confidence': confidence,
            'mode': data_mode
        }

    except Exception as e:
        result = {
            'geojson': {'type': 'FeatureCollection', 'features': []},
            'sst_min': SST_MIN,
            'sst_max': SST_MAX,
            'chl_threshold': CHL_MIN,
            'confidence': 0.0,
            'error': str(e),
        }

    print(json.dumps(result))

if __name__ == '__main__':
    main()