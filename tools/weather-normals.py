#!/usr/bin/env python3
"""Compute typical weather at the lodge for the wedding dates and write
assets/js/weather.js. The site shows these until a live forecast exists.

    python3 tools/weather-normals.py

Uses Open-Meteo's historical archive (free, no key): the same four calendar
dates over the last ten years, at the lodge's coordinates.
"""
import json, os, statistics, urllib.request

ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT   = os.path.join(ROOT, "assets", "js", "weather.js")
LAT, LON = 35.76478, -83.47526          # 119 Timothy Wy, Sevierville (Google's pin)
DATES = ["12-11", "12-12", "12-13", "12-14"]
EVENT_YEAR = 2026
YEARS = list(range(EVENT_YEAR - 10, EVENT_YEAR))
VARS  = ["temperature_2m_max", "temperature_2m_min", "apparent_temperature_max",
         "apparent_temperature_min", "precipitation_sum", "snowfall_sum", "weather_code"]

def year(y):
    url = ("https://archive-api.open-meteo.com/v1/archive?latitude=%s&longitude=%s"
           "&start_date=%d-12-11&end_date=%d-12-14&daily=%s&timezone=America%%2FNew_York"
           % (LAT, LON, y, y, ",".join(VARS)))
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)

rows = {d: [] for d in DATES}
elevation = None
for y in YEARS:
    data = year(y); elevation = data.get("elevation", elevation)
    daily = data["daily"]
    for k, t in enumerate(daily["time"]):
        rows[t[5:]].append({v: daily[v][k] for v in VARS})

def avg(xs): xs = [x for x in xs if x is not None]; return round(statistics.mean(xs), 1) if xs else None
normals = {}
for d in DATES:
    r = rows[d]
    wet  = sum(1 for x in r if (x["precipitation_sum"] or 0) >= 1.0)    # ≥ 1 mm counts as a wet day
    snow = sum(1 for x in r if (x["snowfall_sum"] or 0) >= 0.5)         # ≥ 0.5 cm of snow
    normals["%d-%s" % (EVENT_YEAR, d)] = {
        "hi": avg(x["temperature_2m_max"] for x in r), "lo": avg(x["temperature_2m_min"] for x in r),
        "feelsHi": avg(x["apparent_temperature_max"] for x in r), "feelsLo": avg(x["apparent_temperature_min"] for x in r),
        "wetPct": round(100 * wet / len(r)), "snowPct": round(100 * snow / len(r)),
        "precipMm": avg(x["precipitation_sum"] for x in r), "years": len(r),
    }

payload = {"lat": LAT, "lon": LON, "elevation": elevation,
           "span": "%d–%d" % (YEARS[0], YEARS[-1]), "normals": normals}
open(OUT, "w", encoding="utf-8").write(
"""/* Typical weather at the lodge for each wedding day — written by
   tools/weather-normals.py from ten years of Open-Meteo history. The page
   shows these until a live forecast for the dates exists (about 16 days
   out), then switches to the forecast automatically. Temperatures in °C. */
window.WEATHER = %s;
""" % json.dumps(payload, indent=2, ensure_ascii=False))
print("elevation %sm, %s" % (elevation, payload["span"]))
for d, n in normals.items():
    f = lambda c: round(c * 9 / 5 + 32)
    print("  %s  high %d°F / low %d°F  feels %d°/%d°  wet %d%%  snow %d%%  (%d yrs)" %
          (d, f(n["hi"]), f(n["lo"]), f(n["feelsHi"]), f(n["feelsLo"]), n["wetPct"], n["snowPct"], n["years"]))
