# Kundli engine — reference validation (methodology v1.0.0)

Run 2026-10-04. Reproduce with `apps/web/scripts/astrology-reference/` (needs `pip install skyfield`).

## 1. Planetary longitudes vs NASA JPL DE421

Reference: Skyfield + DE421, apparent geocentric longitude on the ecliptic of date, IAU 2000A nutation
removed (same frame the engine subtracts the ayanamsha from). 40 instants spread 1900–2045.

| Body | Worst difference |
|---|---|
| Sun | 1.9″ |
| Moon | 19.6″ |
| Mercury | 7.4″ |
| Venus | 10.8″ |
| Mars | 7.8″ |
| Jupiter | 6.7″ |
| Saturn | 12.7″ |

Pass mark 60″ (D3). A pada is 12 000″ wide; 20″ of Moon is ~40 s of birth time.
Two of these instants are also locked into `engine.test.ts` as regression checks.
Retrograde flags spot-checked against DE421 (Mercury direct, Saturn retrograde, 21 Aug 1992).

## 2. Other checks in the test suite (`npm run test:astrology`, 49 tests)

- Mean node equals Meeus *Astronomical Algorithms* example 47.a (274.400656°) to 1e-5°.
- Lahiri at J2000 = 23.85705° (Swiss Ephemeris SE_SIDM_LAHIRI: 23.8571°).
- Lagna: for 15 place/time combinations the computed ascendant lies on the horizon (|alt| < 1e-6°) on the eastern side.
- Time zones: India IST, India war time (+06:30, 1942–45), pre-1906 Madras time, New York / London / Sydney DST gaps and repeats, Arizona (no DST).
- All 12 rashis, 27 nakshatras, 108 pada boundaries; slugs equal `community_masters`.
- Every koota, including all 12 Bhakoot positions, the Yoni matrix symmetry and enemy pairs, and a full-36 pair.

## 3. Ayanamsha convention vs Drik Panchang

Published Sankranti moments (drikpanchang.com) compared with the engine's sidereal Sun ingress:

| Event | Drik | Engine later by |
|---|---|---|
| Makar 2000 | 14 Jan 23:14 | −14.7 min |
| Makar 2010 | 14 Jan 12:40 | −2.1 min |
| Makar 2020 | 15 Jan 02:22 | −14.0 min |
| Makar 2023–2026 | … | −12.0, −10.4, −7.7, −6.0 min |
| Mesha 2000 / 2020 / 2024 / 2025 | … | −15.8, −15.7, −10.5, −8.5 min |

Least-squares fit of (engine − Drik) sidereal Sun: **22.65″ − 0.988·Δψ**, RMS residual 1.2″ (within
Drik's 1-minute rounding). So Drik subtracts an ayanamsha ~23″ larger from longitudes that still
contain nutation; this engine follows the Swiss Ephemeris convention (true longitude − true
ayanamsha, nutation cancels). The code was **not** tuned to match.

Effect: 5″–41″ over the 18.6-year nutation cycle — at most ~80 s of Moon motion. Rashi, nakshatra
and Guna can differ from Drik only for a birth within about a minute of a boundary; the result page
already warns when the Moon is within 45 minutes of a boundary.

## 4. Not yet done

- Side-by-side Ashtakoota totals against Drik Panchang / AstroSage for real pairs (their matchers are
  form/JS driven; needs a manual or browser-driven check). Koota tables follow the common North
  Indian published tables and are unit-tested, but Vashya and Gana tables vary between sources.
- Sign-off of the tables by a Maithil pandit (methodology `review` note).
