/**
 * Dumps the engine's tropical (mean equinox of date) longitudes for each
 * instant in instants.json, for comparison with JPL DE421 in compare.py.
 *
 * Run after compiling the engine:  npm run test:astrology  (or tsc -p tsconfig.astrology-test.json)
 *   node scripts/astrology-reference/dump-engine.cjs > engine.json
 */
const path = require('path')
const instants = require('./instants.json')
const dist = path.join(__dirname, '..', '..', '.astrology-test')
const { astroMoment, tropicalLongitude } = require(path.join(dist, 'ephemeris', 'positions.js'))
const { lahiriAyanamsha } = require(path.join(dist, 'vedic', 'ayanamsha.js'))

const bodies = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']
const out = instants.map(iso => {
  const m = astroMoment(Date.parse(iso))
  const lon = {}
  for (const b of bodies) lon[b] = tropicalLongitude(b, m)
  return { iso, ayanamsha: lahiriAyanamsha(m.ttDays), lon }
})
process.stdout.write(JSON.stringify(out, null, 1))
