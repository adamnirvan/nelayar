#!/usr/bin/env bash
#
# Build the offline vector basemap: public/tiles/id.pmtiles
#
# Used by the map for route navigation at sea with no internet (see
# resources/js/components/Map/BasemapLayer.tsx). Extracts ONLY the Indonesian
# waters bbox at zoom 0–10 from the Protomaps public daily build over HTTP range
# requests — it does NOT download the whole planet. Output is ~30–60 MB, plenty
# for steering by coastline + ports; high zoom is intentionally omitted.
#
# Requires the `pmtiles` CLI (Go): https://github.com/protomaps/go-pmtiles/releases
#
# Usage:
#   DATE=20260101 ./scripts/build-basemap.sh
#   (find the latest build date at https://build.protomaps.com)
#
set -euo pipefail

# Latest build date from https://build.protomaps.com — override with DATE=YYYYMMDD.
DATE="${DATE:?Set DATE=YYYYMMDD to a build listed at https://build.protomaps.com}"
SRC="https://build.protomaps.com/${DATE}.pmtiles"
OUT="public/tiles/id.pmtiles"
BBOX="95,-11,141,6"          # lon_min,lat_min,lon_max,lat_max — matches MapContainerLeaflet
MAXZOOM="${MAXZOOM:-10}"     # route-level detail; raise only if you need closer inspection

if ! command -v pmtiles >/dev/null 2>&1; then
    echo "pmtiles CLI not found. Install from https://github.com/protomaps/go-pmtiles/releases" >&2
    exit 1
fi

mkdir -p "$(dirname "$OUT")"
echo "Extracting bbox $BBOX (z0–$MAXZOOM) from $SRC"
pmtiles extract "$SRC" "$OUT" --bbox="$BBOX" --maxzoom="$MAXZOOM"
echo "Done → $OUT ($(du -h "$OUT" | cut -f1))"
