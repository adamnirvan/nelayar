"""
Usage: python scrape_kkp.py
Output: JSON array of price records matching the fish_prices table schema.

Data source: mi.kkp.go.id internal dashboard API (api_harga_dashboard.php).

Downloads every series the dashboard exposes:
  1. Current snapshot  — get_prov_summary + get_kab_summary
     province- and regency-level prices for the latest published period.
     Stamped with the API's real `meta.periode` date (not today).
  2. Monthly history   — get_region_trend (per commodity x province)
     ~12 months of province-level averages, which gives the dashboard a real
     month-over-month baseline. The month matching the current snapshot is
     skipped so the two sources don't double-count the same period.

Each request: 5 commodities x ~34 provinces x 2 calls (kab + trend) ~= 340 calls,
so a retrying session is used and per-request failures are warned-and-skipped.
"""

import json
import sys
from datetime import date

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

COMMODITIES = ['Ikan Tongkol', 'Ikan Kembung', 'Ikan Bandeng', 'Ikan Teri', 'Udang Basah']

BASE_URL = 'https://mi.kkp.go.id'
API_URL = f'{BASE_URL}/api_harga_dashboard.php'
HEADERS = {
    'Accept': 'application/json',
    'Referer': f'{BASE_URL}/harga',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
}

# The trend endpoints label months with Indonesian abbreviations, e.g. "Mei 26".
ID_MONTHS = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'Mei': 5, 'Jun': 6,
    'Jul': 7, 'Agt': 8, 'Sep': 9, 'Okt': 10, 'Nov': 11, 'Des': 12,
}


def make_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=(500, 502, 503, 504),
        allowed_methods=('GET',),
    )
    session.mount('https://', HTTPAdapter(max_retries=retry))
    session.headers.update(HEADERS)
    return session


def fetch(session: requests.Session, action: str, params: dict | None = None) -> dict:
    """Returns the full decoded response so callers can read both `data` and `meta`."""
    resp = session.get(
        API_URL,
        params={'action': action, **(params or {})},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict) and data.get('status') == 'error':
        raise ValueError(f"API error for {action}: {data.get('message', data)}")
    return data if isinstance(data, dict) else {'data': data, 'meta': None}


def parse_price(value) -> int:
    if isinstance(value, (int, float)):
        return int(value)
    # Strip Indonesian thousand separators ("45.000" or "45,000")
    cleaned = str(value).replace('.', '').replace(',', '')
    digits = ''.join(filter(str.isdigit, cleaned))
    return int(digits) if digits else 0


def month_label_to_date(label: str) -> str | None:
    """"Mei 26" -> "2026-05-01" (first of month). Returns None if unparseable."""
    parts = label.split()
    if len(parts) != 2 or parts[0] not in ID_MONTHS:
        return None
    month = ID_MONTHS[parts[0]]
    try:
        year = 2000 + int(parts[1])
    except ValueError:
        return None
    return date(year, month, 1).isoformat()


def scrape():
    session = make_session()
    results = []
    today = date.today().isoformat()

    for commodity in COMMODITIES:
        try:
            resp = fetch(session, 'get_prov_summary', {'komoditas': commodity})
        except Exception as e:
            print(f'Warning: get_prov_summary failed for {commodity}: {e}', file=sys.stderr)
            continue

        provinces = resp.get('data', []) or []
        # The API reports the true data date in meta.periode (e.g. "2026-05-29");
        # the old scraper stamped today's date, which broke month-over-month stats.
        periode = (resp.get('meta') or {}).get('periode') or today
        snapshot_month = periode[:7]

        for prov in provinces:
            prov_id = prov.get('id')
            prov_name = prov.get('name', '')

            # 1a. Current province-level snapshot.
            results.append({
                'commodity': commodity,
                'province': prov_name,
                'regency': None,
                'region_group': None,
                'price': parse_price(prov.get('price', 0)),
                'price_change_pct': None,
                'price_date': periode,
                'period': periode,
                'source': 'mi.kkp.go.id',
            })

            # 1b. Current regency-level detail (only available for the latest period).
            try:
                regencies = fetch(session, 'get_kab_summary', {'prov_id': prov_id, 'komoditas': commodity})
                for kab in regencies.get('data', []) or []:
                    results.append({
                        'commodity': commodity,
                        'province': prov_name,
                        'regency': kab.get('name'),
                        'region_group': None,
                        'price': parse_price(kab.get('price', 0)),
                        'price_change_pct': None,
                        'price_date': periode,
                        'period': periode,
                        'source': 'mi.kkp.go.id',
                    })
            except Exception as e:
                print(f'Warning: get_kab_summary failed for {commodity}/{prov_name}: {e}', file=sys.stderr)

            # 2. Province-level monthly history. Skip the current snapshot month so
            #    the monthly average doesn't double-count the snapshot above.
            try:
                trend = fetch(session, 'get_region_trend', {'prov_id': prov_id, 'komoditas': commodity})
                for point in trend.get('data', []) or []:
                    month_date = month_label_to_date(point.get('month', ''))
                    if month_date is None or month_date[:7] == snapshot_month:
                        continue
                    results.append({
                        'commodity': commodity,
                        'province': prov_name,
                        'regency': None,
                        'region_group': None,
                        'price': parse_price(point.get('price', 0)),
                        'price_change_pct': None,
                        'price_date': month_date,
                        'period': point.get('month'),
                        'source': 'mi.kkp.go.id',
                    })
            except Exception as e:
                print(f'Warning: get_region_trend failed for {commodity}/{prov_name}: {e}', file=sys.stderr)

    print(json.dumps(results, ensure_ascii=False))


if __name__ == '__main__':
    scrape()
