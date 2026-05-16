"""
Usage: python scrape_kkp.py
Output: JSON array of price records matching the fish_prices table schema.

Endpoint discovered via browser DevTools on mi.kkp.go.id/harga.
Inspect Network tab → filter XHR → look for requests to internal API returning JSON price data.
Update BASE_URL and ENDPOINT below once the internal endpoint is identified.
"""

import json
import sys
from datetime import date

import requests
from bs4 import BeautifulSoup

COMMODITIES = ['Ikan Tongkol', 'Ikan Kembung', 'Ikan Bandeng', 'Ikan Teri', 'Udang Basah']

# Update these after identifying the real endpoint via DevTools:
BASE_URL = 'https://mi.kkp.go.id'
HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; nelayar-gis/1.0)',
}


def scrape_via_api():
    """
    Attempt to fetch prices from the internal JSON endpoint.
    Inspect mi.kkp.go.id/harga in DevTools to find the real path and params.
    """
    results = []
    today = date.today().isoformat()

    for commodity in COMMODITIES:
        try:
            resp = requests.get(
                f'{BASE_URL}/harga',
                params={'komoditas': commodity},
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()

            # Try JSON first (internal API)
            try:
                payload = resp.json()
                rows = payload.get('data', payload) if isinstance(payload, dict) else payload
                for row in rows:
                    results.append({
                        'commodity': commodity,
                        'province': row.get('provinsi', row.get('province', '')),
                        'regency': row.get('kabupaten', row.get('regency')),
                        'region_group': row.get('wilayah', row.get('region_group')),
                        'price': int(row.get('harga', row.get('price', 0))),
                        'price_change_pct': row.get('perubahan', row.get('price_change_pct')),
                        'price_date': row.get('tanggal', today),
                        'period': row.get('periode', row.get('period')),
                        'source': 'mi.kkp.go.id',
                    })
            except (ValueError, KeyError):
                # Fallback: parse HTML table
                soup = BeautifulSoup(resp.text, 'html.parser')
                table = soup.find('table')
                if not table:
                    continue
                headers_row = [th.get_text(strip=True) for th in table.find_all('th')]
                for tr in table.find_all('tr')[1:]:
                    cells = [td.get_text(strip=True) for td in tr.find_all('td')]
                    if not cells:
                        continue
                    row_data = dict(zip(headers_row, cells))
                    results.append({
                        'commodity': commodity,
                        'province': row_data.get('Provinsi', ''),
                        'regency': row_data.get('Kabupaten'),
                        'region_group': row_data.get('Wilayah'),
                        'price': int(''.join(filter(str.isdigit, row_data.get('Harga', '0'))) or 0),
                        'price_change_pct': None,
                        'price_date': today,
                        'period': None,
                        'source': 'mi.kkp.go.id',
                    })

        except requests.RequestException as e:
            print(f'Warning: failed to fetch {commodity}: {e}', file=sys.stderr)

    return results


def scrape():
    results = scrape_via_api()
    print(json.dumps(results, ensure_ascii=False))


if __name__ == '__main__':
    scrape()
