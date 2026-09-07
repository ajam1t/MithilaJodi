import 'server-only'

/**
 * Display labels for community master values.
 *
 * Profiles store the option *key* — 'maithil_brahmin', 'shandilya',
 * 'sarisab_sarisav' — which is what makes matching and gotra rules reliable.
 * They previously stored the display label instead, and every read path simply
 * printed whatever was in the column, so the switch to keys made cards read
 * "maithil_brahmin" and "Gotra: shandilya".
 *
 * This resolves keys back to their labels for display only. Nothing here is
 * used for matching.
 *
 * The table is small (a few hundred rows), immutable in normal operation, and
 * read by nearly every profile projection, so it is cached for the life of the
 * server process. A new option added by an admin appears after the next deploy
 * or process recycle, which is an acceptable trade for not querying it on every
 * card render.
 */

type LabelMap = Record<string, Record<string, string>>

let cache: LabelMap | null = null
let inflight: Promise<LabelMap> | null = null

/** Title-cases a key so an unknown value still reads as words, not a slug. */
export function humanizeKey(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCommunityLabels(admin: any): Promise<LabelMap> {
  if (cache) return cache
  if (inflight) return inflight

  inflight = (async () => {
    const { data, error } = await admin
      .from('community_masters')
      .select('type, value, label_en')

    if (error) {
      console.error('[communityLabels] load failed:', error.message)
      // Do not cache a failure — the next request should try again. Callers
      // fall back to humanising the key, so display degrades rather than breaks.
      inflight = null
      return {}
    }

    const map: LabelMap = {}
    for (const row of (data ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any
      ;(map[r.type as string] ??= {})[r.value as string] = r.label_en as string
    }
    cache = map
    inflight = null
    return map
  })()

  return inflight
}

/**
 * One value → its label.
 *
 * Falls back to title-casing the key, so a value an admin has deactivated (or
 * legacy free text a member typed years ago) still reads sensibly instead of
 * disappearing.
 */
export function labelFor(
  labels: LabelMap,
  type: string,
  value: string | null | undefined,
): string | null {
  if (!value) return null
  const hit = labels[type]?.[value]
  if (hit) return hit
  return humanizeKey(value)
}

/** Convenience for the several projections that need the same five fields. */
export function communityLabelSet(
  labels: LabelMap,
  row: {
    religion?: string | null
    caste?: string | null
    sub_caste?: string | null
    self_gotra?: string | null
    maternal_gotra?: string | null
    mool?: string | null
    mother_tongue?: string | null
    marital_status?: string | null
    diet?: string | null
  },
) {
  return {
    religion:       labelFor(labels, 'religion', row.religion),
    caste:          labelFor(labels, 'caste', row.caste),
    sub_caste:      labelFor(labels, 'sub_caste', row.sub_caste),
    self_gotra:     labelFor(labels, 'gotra', row.self_gotra),
    maternal_gotra: labelFor(labels, 'gotra', row.maternal_gotra),
    mool:           labelFor(labels, 'mool', row.mool),
    mother_tongue:  labelFor(labels, 'mother_tongue', row.mother_tongue),
    marital_status: labelFor(labels, 'marital_status', row.marital_status),
    diet:           labelFor(labels, 'diet', row.diet),
  }
}
