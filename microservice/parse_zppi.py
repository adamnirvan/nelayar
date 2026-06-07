import json
import argparse
import os
import sys
import numpy as np
import matplotlib.pyplot as plt


# ─────────────────────────────────────────────
# HELPER: Log diagnostik ke stderr (stdout KHUSUS JSON)
# ─────────────────────────────────────────────
def log(msg):
    print(msg, file=sys.stderr, flush=True)

# ─────────────────────────────────────────────
# HELPER: Simpan PNG heatmap overlay
# ─────────────────────────────────────────────
def save_image_overlay(date, name, lats, lons, values,
                       cmap='turbo', vmin=None, vmax=None, smooth=False):
    dir_path = f"storage/app/public/grids/{date}"
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, f"{name}.png")

    cmap_obj = plt.get_cmap(cmap).copy()
    cmap_obj.set_bad(color='white', alpha=0.0)
    img_data = np.flipud(values)

    if smooth:
        from scipy.ndimage import gaussian_filter
        img_data = gaussian_filter(img_data, sigma=2.0)

    plt.imsave(file_path, img_data, cmap=cmap_obj, vmin=vmin, vmax=vmax, format='png')
    return f"storage/grids/{date}/{name}.png"

# ─────────────────────────────────────────────
# HELPER: Ekstrak variabel dari dataset xarray
# ─────────────────────────────────────────────
def safe_extract_variable(ds, possible_names):
    for name in possible_names:
        if name in ds.variables:
            data = ds[name]
            if 'depth' in data.dims:       data = data.isel(depth=0)
            elif 'elevation' in data.dims: data = data.isel(elevation=0)
            if 'time' in data.dims:        data = data.mean(dim='time')
            return data.values
    raise ValueError(f"Tidak menemukan variabel: {possible_names}")

# ─────────────────────────────────────────────
# HELPER: Confidence dinamis per ikan per piksel
# ─────────────────────────────────────────────
def compute_confidence_map(master_sst, master_chl, profile):
    sst_min  = profile['sst_min']
    sst_max  = profile['sst_max']
    chl_min  = profile.get('chl_min')
    chl_max  = profile.get('chl_max')

    sst_mask = (master_sst >= sst_min) & (master_sst <= sst_max)

    sst_mid  = (sst_min + sst_max) / 2
    sst_half = (sst_max - sst_min) / 2 or 1e-6  # hindari div/0

    sst_conf = np.where(
        sst_mask,
        1.0 - (np.abs(master_sst - sst_mid) / sst_half) * 0.5,
        0.0
    )

    use_chl = (
        chl_min is not None and chl_max is not None
        and chl_min > 0 and chl_max > 0
        and master_chl is not None
    )

    if not use_chl:
        return sst_conf, sst_mask

    chl_mask  = (master_chl >= chl_min) & (master_chl <= chl_max)
    full_mask = sst_mask & chl_mask

    chl_mid  = (chl_min + chl_max) / 2
    chl_half = (chl_max - chl_min) / 2 or 1e-6

    chl_conf = np.where(
        chl_mask,
        1.0 - (np.abs(master_chl - chl_mid) / chl_half) * 0.5,
        0.0
    )

    combined = np.where(full_mask, (sst_conf + chl_conf) / 2, 0.0)
    return combined, full_mask

# ─────────────────────────────────────────────
# FETCH: Ambil SST & CHL dari CMEMS
# ─────────────────────────────────────────────
def fetch_cmems(date, lat_min, lat_max, lon_min, lon_max):
    import copernicusmarine
    username = os.environ.get('CMEMS_USERNAME')
    password = os.environ.get('CMEMS_PASSWORD')

    sst_ds = copernicusmarine.open_dataset(
        dataset_id='cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m',
        minimum_latitude=lat_min,  maximum_latitude=lat_max,
        minimum_longitude=lon_min, maximum_longitude=lon_max,
        start_datetime=f'{date}T00:00:00',
        end_datetime=f'{date}T23:59:59',
        username=username, password=password,
    )
    sst      = safe_extract_variable(sst_ds, ['thetao', 'sst'])
    sst_lats = sst_ds['latitude'].values
    sst_lons = sst_ds['longitude'].values

    try:
        chl_ds = copernicusmarine.open_dataset(
            dataset_id='cmems_mod_glo_bgc-pft_anfc_0.25deg_P1D-m',
            minimum_latitude=lat_min,  maximum_latitude=lat_max,
            minimum_longitude=lon_min, maximum_longitude=lon_max,
            start_datetime=f'{date}T00:00:00',
            end_datetime=f'{date}T23:59:59',
            username=username, password=password,
        )
        chl      = safe_extract_variable(chl_ds, ['chl', 'CHL'])
        chl_lats = chl_ds['latitude'].values
        chl_lons = chl_ds['longitude'].values
    except Exception:
        chl = None; chl_lats = None; chl_lons = None

    return sst, sst_lats, sst_lons, chl, chl_lats, chl_lons

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date',          required=True)
    parser.add_argument('--lat-min',       type=float, default=-11.0)
    parser.add_argument('--lat-max',       type=float, default=6.0)
    parser.add_argument('--lon-min',       type=float, default=95.0)
    parser.add_argument('--lon-max',       type=float, default=141.0)
    parser.add_argument('--fish-profiles', required=True,
                        help='JSON array fish profiles dari tabel fish_profiles')
    args = parser.parse_args()

    try:
        fish_profiles = json.loads(args.fish_profiles)

        log(f"[{args.date}] ▶ Mulai: {len(fish_profiles)} profil ikan | "
            f"bbox lat[{args.lat_min}..{args.lat_max}] lon[{args.lon_min}..{args.lon_max}]")

        dtype = np.uint32
        for i, p in enumerate(fish_profiles):
            p['bit'] = 1 << i

        log(f"[{args.date}] … Mengunduh SST & CHL dari CMEMS…")
        sst, sst_lats, sst_lons, chl, chl_lats, chl_lons = fetch_cmems(
            args.date, args.lat_min, args.lat_max, args.lon_min, args.lon_max
        )

        log(f"[{args.date}] ✓ SST: shape={sst.shape} "
            f"range={np.nanmin(sst):.2f}..{np.nanmax(sst):.2f} mean={np.nanmean(sst):.2f} "
            f"(harap °C ~26..32; jika ~270..305 berarti Kelvin)")
        if chl is not None:
            log(f"[{args.date}] ✓ CHL: shape={chl.shape} "
                f"range={np.nanmin(chl):.3f}..{np.nanmax(chl):.3f} mean={np.nanmean(chl):.3f}")
        else:
            log(f"[{args.date}] ⚠ CHL tidak tersedia → pencocokan SST-only")

        res         = 0.027
        master_lats = np.arange(args.lat_min, args.lat_max, res)
        master_lons = np.arange(args.lon_min, args.lon_max, res)
        grid_lats, grid_lons = np.meshgrid(master_lats, master_lons, indexing='ij')

        from scipy.interpolate import RegularGridInterpolator

        interp_sst = RegularGridInterpolator(
            (sst_lats, sst_lons), sst,
            method='linear', bounds_error=False, fill_value=None
        )
        master_sst = interp_sst((grid_lats, grid_lons))

        sst_file = save_image_overlay(
            args.date, "sst_raster",
            master_lats, master_lons, master_sst,
            cmap='jet', vmin=26.0, vmax=32.0
        )

        master_chl = None
        chl_file   = None

        if chl is not None:
            interp_chl = RegularGridInterpolator(
                (chl_lats, chl_lons), chl,
                method='nearest', bounds_error=False, fill_value=None
            )
            master_chl = interp_chl((grid_lats, grid_lons))

            chl_file = save_image_overlay(
                args.date, "chl_raster",
                master_lats, master_lons, master_chl,
                cmap='YlGn', vmin=0.0, vmax=1.0, smooth=True
            )

        composition_grid = np.zeros_like(master_sst, dtype=dtype)
        confidence_maps = {}

        for p in fish_profiles:
            conf_map, fish_mask = compute_confidence_map(master_sst, master_chl, p)
            # Perhatikan: Diambil dari nama_lokal
            confidence_maps[p['nama_lokal']] = conf_map
            composition_grid[fish_mask] |= p['bit']
            log(f"[{args.date}]   • {p['nama_lokal']}: {int(fish_mask.sum())} piksel cocok "
                f"(SST {p['sst_min']}..{p['sst_max']}"
                + (f", CHL {p.get('chl_min')}..{p.get('chl_max')}" if master_chl is not None else "")
                + ")")

        import rasterio
        from rasterio.features import shapes, rasterize
        from rasterio.transform import from_bounds
        from scipy import ndimage
        from shapely.geometry import shape, MultiPolygon, mapping
        from shapely.ops import unary_union

        transform = from_bounds(
            west=float(master_lons[0]),
            south=float(master_lats[0]),
            east=float(master_lons[-1] + res),
            north=float(master_lats[-1] + res),
            width=composition_grid.shape[1],
            height=composition_grid.shape[0],
        )

        data     = np.flipud(composition_grid)
        features = []
        MIN_AREA = res * res * 5

        matched_px = int((composition_grid > 0).sum())
        log(f"[{args.date}] ✓ Piksel ZPPI (gabungan): {matched_px}/{composition_grid.size} "
            f"({100 * matched_px / composition_grid.size:.2f}%) → vektorisasi poligon…")

        # ── FASE 1: Kumpulkan poligon kandidat (vektorisasi + filter area) ──
        poly_records = []  # list of (val, merged_geometry)
        for geom_dict, val in shapes(data, transform=transform, connectivity=8):
            val = int(val)
            if val == 0:
                continue

            geom_shape = shape(geom_dict)
            if geom_shape.area < MIN_AREA:
                continue

            merged = unary_union([geom_shape])
            if merged.is_empty:
                continue
            if merged.geom_type == 'Polygon':
                merged = MultiPolygon([merged])
            elif merged.geom_type not in ('MultiPolygon', 'GeometryCollection'):
                continue

            poly_records.append((val, merged))

        log(f"[{args.date}] ✓ {len(poly_records)} poligon kandidat (≥ MIN_AREA) → statistik per-zona…")

        # ── FASE 2: Statistik per-zona dalam SATU lintasan (rasterize + ndimage) ──
        # Hindari geometry_mask per-poligon (O(poligon × grid)) yang membuat proses macet
        # saat cakupan tinggi. Semua poligon dirasterisasi sekali menjadi peta label, lalu
        # rata-rata per label (SST/CHL/confidence) dihitung sekaligus oleh scipy.ndimage.
        if poly_records:
            ids = np.arange(1, len(poly_records) + 1)
            label_arr = rasterize(
                ((geom, i) for i, (_, geom) in zip(ids, poly_records)),
                out_shape=data.shape, transform=transform, fill=0, dtype='uint32',
            )
            labels = np.flipud(label_arr)  # samakan orientasi dgn master_sst/conf maps

            sst_means = ndimage.mean(master_sst, labels=labels, index=ids)
            chl_means = (ndimage.mean(master_chl, labels=labels, index=ids)
                         if master_chl is not None else None)
            fish_means = {
                p['nama_lokal']: ndimage.mean(confidence_maps[p['nama_lokal']], labels=labels, index=ids)
                for p in fish_profiles
            }

            for idx, (val, merged) in enumerate(poly_records):
                ikan_cocok = []
                for p in fish_profiles:
                    if not (val & p['bit']):
                        continue
                    avg_conf = float(fish_means[p['nama_lokal']][idx])
                    if not np.isfinite(avg_conf):
                        avg_conf = 0.5
                    ikan_cocok.append({
                        'nama_lokal':  p['nama_lokal'],
                        'nama_lain':   p.get('nama_lain', ''),
                        'nama_ilmiah': p.get('nama_ilmiah', ''),
                        'confidence':  round(avg_conf, 3),
                        'image_path':  p.get('image_path', ''),
                    })

                ikan_cocok.sort(key=lambda x: x['confidence'], reverse=True)
                if not ikan_cocok:
                    continue

                sst_val  = sst_means[idx]
                sst_rata = round(float(sst_val), 2) if np.isfinite(sst_val) else None
                chl_rata = (round(float(chl_means[idx]), 3)
                            if (chl_means is not None and np.isfinite(chl_means[idx])) else None)

                features.append({
                    'type':     'Feature',
                    'geometry': mapping(merged),
                    'properties': {
                        'zone_date':  args.date,
                        'sst_rata':   sst_rata,
                        'chl_rata':   chl_rata,
                        'ikan_cocok': ikan_cocok,
                        'ikan_utama': ikan_cocok[0]['nama_lokal'] if ikan_cocok else None,
                    }
                })

        log(f"[{args.date}] ✓ SELESAI: {len(features)} zona final "
            f"(filter area < {MIN_AREA:.4f}). "
            + ("⚠ 0 ZONA — cek range SST/CHL & ambang fish_profiles di atas."
               if len(features) == 0 else "→ disimpan ke zppi_zones."))

        result = {
            'geojson':       {'type': 'FeatureCollection', 'features': features},
            'confidence':    float((composition_grid > 0).sum() / composition_grid.size),
            'sst_file_path': sst_file,
            'chl_file_path': chl_file,
            'error':         None,
        }

    except Exception as e:
        import traceback
        log(f"[{args.date}] ✘ ERROR: {e}")
        result = {
            'geojson':       {'type': 'FeatureCollection', 'features': []},
            'confidence':    0.0,
            'sst_file_path': None,
            'chl_file_path': None,
            'error':         str(e) + '\n' + traceback.format_exc(),
        }

    print(json.dumps(result))

if __name__ == '__main__':
    main()