"""
route_sea.py — Menghitung rute pelayaran (menghindari daratan) antara dua titik.

Memakai pustaka `searoute` yang sudah membawa graf jaringan laut global, sehingga
garis rute membelok mengelilingi pulau/daratan alih-alih menembusnya.

Dipanggil oleh Laravel (RouteService) via Process::run dengan CWD = root proyek:
    python route_sea.py --start "lat,lon" --end "lat,lon"

Mengikuti konvensi microservice lain: selalu mencetak JSON ke stdout; error
dikembalikan sebagai {"error": "..."} agar PHP bisa log & lanjut dengan anggun.
"""

import json
import argparse

try:
    import searoute as sr
except ImportError:
    sr = None


def parse_coord(raw):
    """Ubah string "lat,lon" menjadi tuple (lat, lon) float."""
    lat_str, lon_str = raw.split(',')
    return float(lat_str.strip()), float(lon_str.strip())


def main():
    parser = argparse.ArgumentParser(description='Rute pelayaran antar dua titik via searoute-py')
    parser.add_argument('--start', required=True, help='Titik asal sebagai "lat,lon"')
    parser.add_argument('--end', required=True, help='Titik tujuan sebagai "lat,lon"')
    parser.add_argument('--units', default='km', help='Satuan jarak: km | naut | miles')
    args = parser.parse_args()

    if sr is None:
        print(json.dumps({"error": "Pustaka 'searoute' belum terpasang (pip install searoute)"}))
        return

    try:
        start_lat, start_lon = parse_coord(args.start)
        end_lat, end_lon = parse_coord(args.end)

        # PENTING: searoute memakai urutan [lon, lat], bukan [lat, lon].
        origin = [start_lon, start_lat]
        destination = [end_lon, end_lat]

        # append_orig_dest=True menyambungkan titik asal/tujuan asli ke jalur jaringan,
        # sehingga garis terhubung ke posisi GPS nelayan & zona, bukan hanya simpul graf terdekat.
        route = sr.searoute(
            origin,
            destination,
            units=args.units,
            append_orig_dest=True,
        )

        length = route.get('properties', {}).get('length')

        print(json.dumps({
            "ok": True,
            "route": route,          # GeoJSON Feature (LineString), koordinat [lon, lat]
            "distance": length,
            "units": args.units,
        }))
    except Exception as exc:  # noqa: BLE001 — bungkus semua error sebagai envelope JSON
        print(json.dumps({"error": str(exc)}))


if __name__ == '__main__':
    main()
