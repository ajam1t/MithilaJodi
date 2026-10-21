import 'server-only'
import { getCommunityLabels, labelFor } from '@/lib/communityLabels'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A member's contact projection — the number, whose number it is, an email,
 * and how the family would like to be contacted. One definition for the two
 * places it is ever shown: a Digital Profile link that shares contact
 * (lib/profileShare) and an approved contact request between two matched
 * members (/api/contact-requests/contact). The address is never part of it;
 * a share link adds that itself.
 *
 * Callers decide who may see it. Nothing here checks access.
 */

export type ContactDetails = { mobile: string | null; relation: string | null; email: string | null }

export type ContactPrefs = {
  via: 'call' | 'whatsapp' | 'either' | null
  days: string[]
  timeFrom: string | null
  timeTo: string | null
  rules: Array<'age' | 'location' | 'community' | 'interest_first'>
  note: string | null
}

/** profile_private columns behind ContactPrefs (migration 20261021000001). */
export const CONTACT_PREF_COLUMNS = 'contact_via, contact_days, contact_time_from, contact_time_to, contact_rules, contact_note'

/**
 * The registered mobile is the fallback only when the member has not given a
 * separate contact number.
 *
 * `relation` says whose number it is. In a Maithil match the number given is
 * very often the father's or a brother's, and a bare "Mobile" left the
 * recipient to guess who would answer. It is only meaningful for a number the
 * member actually entered: when we fall back to the registered mobile that is
 * the member's own line, so the relation is dropped rather than mislabelled.
 */
export function contactFromRow(
  priv: { contact_mobile?: string | null; contact_relation?: string | null; contact_email?: string | null } | null,
  accountMobile: string | null,
  labels: Awaited<ReturnType<typeof getCommunityLabels>>,
): ContactDetails {
  return {
    mobile: priv?.contact_mobile ?? accountMobile ?? null,
    relation: priv?.contact_mobile ? labelFor(labels, 'contact_relation', priv.contact_relation ?? null) : null,
    email: priv?.contact_email ?? null,
  }
}

/** Null when the member stated no preference at all. */
export function contactPrefsFromRow(howTo: any): ContactPrefs | null {
  if (!howTo) return null
  if (!(howTo.contact_via || howTo.contact_days?.length || howTo.contact_time_from || howTo.contact_rules?.length || howTo.contact_note)) return null
  return {
    via: howTo.contact_via ?? null,
    days: howTo.contact_days ?? [],
    timeFrom: howTo.contact_time_from ?? null,
    timeTo: howTo.contact_time_to ?? null,
    rules: howTo.contact_rules ?? [],
    note: howTo.contact_note ?? null,
  }
}

/**
 * Load a member's contact projection by profile id. Null when the profile or
 * its account cannot be read. Preferences are read separately so a database
 * without their columns still returns the number.
 */
export async function loadContactProjection(
  admin: any, profileId: string,
): Promise<{ contact: ContactDetails; prefs: ContactPrefs | null } | null> {
  const { data: p, error: pError } = await admin
    .from('profiles')
    .select('account_id')
    .eq('id', profileId)
    .maybeSingle()
  if (pError || !p) return null

  const [{ data: account, error: aError }, { data: priv, error: privError }, { data: howTo, error: howError }, labels] = await Promise.all([
    admin.from('accounts').select('mobile').eq('id', p.account_id).maybeSingle(),
    admin.from('profile_private').select('contact_mobile, contact_relation, contact_email').eq('profile_id', profileId).maybeSingle(),
    admin.from('profile_private').select(CONTACT_PREF_COLUMNS).eq('profile_id', profileId).maybeSingle(),
    getCommunityLabels(admin),
  ])
  if (aError || privError || !account) return null

  return {
    contact: contactFromRow(priv ?? null, account.mobile ?? null, labels),
    prefs: howError ? null : contactPrefsFromRow(howTo),
  }
}
