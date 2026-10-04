/**
 * Compatibility — the Kundli Match result (unchanged, same engine) plus the
 * classical two-chart factors from rules/compatibility.ts. No combined score.
 * Server-only by convention.
 */
import { computeKundliMatch } from './engine'
import { compareCharts } from './rules/compatibility'
import type { CompatibilityResponse, CompatibilityResult, KundliMatchRequest, MatchResult } from './types'

const withComparison = (match: MatchResult): CompatibilityResult => ({
  methodologyVersion: match.methodologyVersion,
  computedAt: match.computedAt,
  match,
  comparison: compareCharts(match.bride, match.groom),
})

export function computeCompatibility(request: KundliMatchRequest, now: Date): CompatibilityResponse {
  const r = computeKundliMatch(request, now)
  if (r.kind === 'needs_moon_choice') return r
  if (r.kind === 'result') return { kind: 'result', result: withComparison(r.result) }
  return { kind: 'scenarios', scenarios: r.scenarios.map(s => ({ ...s, result: withComparison(s.result) })) }
}
