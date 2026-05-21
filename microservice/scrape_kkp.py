"""
Usage: python scrape_kkp.py
Output: JSON array of price records matching the fish_prices table schema.

Data source: mi.kkp.go.id internal dashboard API (api_harga_dashboard.php).
Fetches province-level summaries first, then drills into each province for
regency-level detail — 5 commodities × ~34 provinces = ~170 extra requests.
"""

import json
import sys
from datetime import date

import requests

COMMODITIES = ['Ikan Tongkol', 'Ikan Kembung', 'Ikan Bandeng', 'Ikan Teri', 'Udang Basah']

BASE_URL = 'https://mi.kkp.go.id'
API_URL = f'{BASE_URL}/api_harga_dashboard.php'
HEADERS = {
    'Accept': 'application/json',
    'Referer': f'{BASE_URL}/harga',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
}


def fetch(action: str, params: dict | None = None) -> list | dict:
    resp = requests.get(
        API_URL,
        params={'action': action, **(params or {})},
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict) and data.get('status') == 'error':
        raise ValueError(f"API error for {action}: {data}")
    return data.get('data', []) if isinstance(data, dict) else data


def parse_price(value) -> int:
    if isinstance(value, (int, float)):
        return int(value)
    # Strip Indonesian thousand separators ("45.000" or "45,000")
    cleaned = str(value).replace('.', '').replace(',', '')
    digits = ''.join(filter(str.isdigit, cleaned))
    return int(digits) if digits else 0


def scrape():
    results = []
    today = date.today().isoformat()

    for commodity in COMMODITIES:
        try:
            provinces = fetch('get_prov_summary', {'komoditas': commodity})
        except Exception as e:
            print(f'Warning: get_prov_summary failed for {commodity}: {e}', file=sys.stderr)
            continue

        for prov in provinces:
            prov_id = prov.get('id')
            prov_name = prov.get('name', '')

            results.append({
                'commodity': commodity,
                'province': prov_name,
                'regency': None,
                'region_group': None,
                'price': parse_price(prov.get('price', 0)),
                'price_change_pct': None,
                'price_date': today,
                'period': None,
                'source': 'mi.kkp.go.id',
            })

            try:
                regencies = fetch('get_kab_summary', {'prov_id': prov_id, 'komoditas': commodity})
                for kab in regencies:
                    results.append({
                        'commodity': commodity,
                        'province': prov_name,
                        'regency': kab.get('name'),
                        'region_group': None,
                        'price': parse_price(kab.get('price', 0)),
                        'price_change_pct': None,
                        'price_date': today,
                        'period': None,
                        'source': 'mi.kkp.go.id',
                    })
            except Exception as e:
                print(f'Warning: get_kab_summary failed for {commodity}/{prov_name}: {e}', file=sys.stderr)

    print(json.dumps(results, ensure_ascii=False))


if __name__ == '__main__':
    scrape()
