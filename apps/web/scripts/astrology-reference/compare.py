"""
Independent reference check of the Kundli engine's planetary longitudes.

Reference: NASA JPL DE421 numerical ephemeris via Skyfield (MIT), apparent
geocentric positions on the ecliptic of date, with IAU 2000A nutation removed
so both sides are referred to the mean equinox of date — the frame the engine
subtracts the Lahiri ayanamsha from.

Dev-only tooling; nothing here ships with the site.

    pip install skyfield
    node scripts/astrology-reference/dump-engine.cjs > engine.json
    python scripts/astrology-reference/compare.py engine.json
"""
import json
import math
import sys
from datetime import datetime, timezone

from skyfield.api import load
from skyfield.framelib import ecliptic_frame
from skyfield.nutationlib import iau2000a_radians

ts = load.timescale()
eph = load('de421.bsp')
earth = eph['earth']
TARGET = {
    'sun': eph['sun'], 'moon': eph['moon'], 'mercury': eph['mercury'], 'venus': eph['venus'],
    'mars': eph['mars'], 'jupiter': eph['jupiter barycenter'], 'saturn': eph['saturn barycenter'],
}

# Rashi/nakshatra/pada boundaries are hours apart for every body except the Moon,
# where 1 arcminute is ~2 minutes of time. One arcminute is the pass mark.
TOLERANCE_ARCSEC = 60.0


def wrap(d):
    return (d + 180.0) % 360.0 - 180.0


def main(path):
    rows = json.load(open(path, encoding='utf-8'))
    worst = {b: 0.0 for b in TARGET}
    failures = 0
    for row in rows:
        dt = datetime.fromisoformat(row['iso'].replace('Z', '+00:00')).astimezone(timezone.utc)
        t = ts.from_datetime(dt)
        dpsi, _ = iau2000a_radians(t)
        for body, target in TARGET.items():
            _, lon, _ = earth.at(t).observe(target).apparent().frame_latlon(ecliptic_frame)
            ref_mean = (lon.degrees - math.degrees(dpsi)) % 360.0
            diff = abs(wrap(row['lon'][body] - ref_mean)) * 3600.0
            worst[body] = max(worst[body], diff)
            if diff > TOLERANCE_ARCSEC:
                failures += 1
                print(f"FAIL {row['iso']} {body}: engine {row['lon'][body]:.5f} ref {ref_mean:.5f} diff {diff:.1f}\"")
    print(f'{len(rows)} instants, 1900-2045. Worst difference vs JPL DE421 (arcseconds):')
    for body, w in worst.items():
        print(f'  {body:8s} {w:7.2f}"')
    print('PASS' if failures == 0 else f'{failures} FAILURES (tolerance {TOLERANCE_ARCSEC}")')
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'engine.json')
