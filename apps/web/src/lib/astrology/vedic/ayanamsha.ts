import { METHODOLOGY } from '../methodology'

const J2000_JD = 2451545.0

/** IAU 2006 general precession in longitude, p_A, in arcseconds (T in Julian centuries TT from J2000). */
export function generalPrecessionArcsec(T: number): number {
  return (
    5028.796195 * T +
    1.1054348 * T ** 2 +
    0.00007964 * T ** 3 -
    0.000023857 * T ** 4 -
    0.0000000383 * T ** 5
  )
}

/**
 * Mean Lahiri ayanamsha in degrees for a moment given as days of TT since J2000.
 *
 * The 1956 Calendar Reform Committee anchor value, carried forward or back by
 * the accumulated precession of the equinox between the anchor and the date.
 */
export function lahiriAyanamsha(ttDaysSinceJ2000: number): number {
  const { epochJdTT, valueAtEpochDeg } = METHODOLOGY.ayanamsha
  const T = ttDaysSinceJ2000 / 36525
  const T0 = (epochJdTT - J2000_JD) / 36525
  return valueAtEpochDeg + (generalPrecessionArcsec(T) - generalPrecessionArcsec(T0)) / 3600
}
