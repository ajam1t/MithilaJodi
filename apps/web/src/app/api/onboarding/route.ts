import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { isFreeAccessMode } from '@/lib/membership'
import { syncDiscoverability } from '@/lib/discoverability'
import { refreshPublicShowcase } from '@/lib/showcaseCache'
import { COMPLETION_SELECT, computeCompletion } from '@/lib/profileCompletion'
import { minAgeError, yearsAgo } from '@/lib/ageRules'
import { oppositeGender } from '@/lib/matchEligibility'

/*
 * Saves one /welcome step. Unlike PUT /api/profile — which writes the whole
 * profile and would blank every field it is not sent — this touches only the
 * columns of the step being saved, so a member who already filled in their
 * education, family and so on can come back through onboarding without losing
 * any of it.
 *
 *   about   → name, who the profile is for, gender, date of birth, marital
 *             status, and "looking for" (profile_preferences.pref_gender,
 *             always the opposite gender).
 *             Creates the profile row the first time.
 *   mithila → current city, community, gotra, and the optional Mithila details.
 *
 * The profile is created hidden (discoverable = false); syncDiscoverability
 * turns it on only once every onboarding requirement — photo included — is met.
 */

const text = (max: number) => z.string().trim().max(max)
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

// "Looking for" is not asked: matching is bride ↔ groom only (lib/matchEligibility),
// so it is always the opposite of `gender` and is derived below.
const AboutSchema = z.object({
  step: z.literal('about'),
  profile_for: z.enum(['self', 'son', 'daughter', 'sibling', 'other']),
  first_name: text(100).min(1, 'Please enter a first name.'),
  last_name: text(100).min(1, 'Please enter a surname.'),
  gender: z.enum(['male', 'female'], { message: 'Please choose bride or groom.' }),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a date of birth.'),
  marital_status: text(40).min(1, 'Please choose a marital status.'),
})

const MithilaSchema = z.object({
  step: z.literal('mithila'),
  current_loc_id: z.number().int().positive({ message: 'Please choose your current city from the list.' }),
  caste: text(100).min(1, 'Please choose your community.'),
  self_gotra: text(100).min(1, 'Please choose your gotra — “Not listed / Other” is fine if unsure.'),
  // Optional: `undefined` leaves the stored value alone; null or '' clears it.
  sub_caste: optionalText(100),
  mool: optionalText(100),
  maternal_gotra: optionalText(100),
  gram: optionalText(100),
})

const Body = z.discriminatedUnion('step', [AboutSchema, MithilaSchema])

const MARITAL = new Set(['never_married', 'divorced', 'widowed', 'awaiting_divorce'])

/** Null when the date of birth is acceptable; otherwise the message. */
function dobError(dob: string, gender: string): string | null {
  if (Number.isNaN(new Date(dob + 'T00:00:00Z').getTime())) return 'Please enter a valid date of birth.'
  if (dob < yearsAgo(80)) return 'Please check the year of birth.'
  return minAgeError(dob, gender)
}

const bad = (message: string) => NextResponse.json({ ok: false, message }, { status: 400 })

export async function PATCH(request: NextRequest) {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false, message: 'Please sign in again.' }, { status: 401 })

  let raw: unknown
  try { raw = await request.json() } catch { return bad('Invalid request.') }
  const parsed = Body.safeParse(raw)
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Please check the highlighted fields.')
  const data = parsed.data

  const admin = await createAdminClient()
  const findProfile = () => admin
    .from('profiles')
    .select('id')
    .eq('account_id', account.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const { data: existing } = await findProfile()
  let profileId: string | null = existing?.id ?? null

  if (data.step === 'about') {
    const ageProblem = dobError(data.dob, data.gender)
    if (ageProblem) return bad(ageProblem)
    if (!MARITAL.has(data.marital_status)) return bad('Please choose a marital status.')

    const fields = {
      profile_for: data.profile_for,
      first_name: data.first_name,
      last_name: data.last_name || null,
      gender: data.gender,
      dob: data.dob,
      marital_status: data.marital_status,
    }

    if (profileId) {
      const { error } = await admin.from('profiles').update({ ...fields, search_needs_rebuild: true }).eq('id', profileId)
      if (error) { console.error('[onboarding about] update:', error.message); return NextResponse.json({ ok: false, message: 'Could not save. Please try again.' }, { status: 500 }) }
    } else {
      const freeMode = isFreeAccessMode()
      const { data: created, error } = await admin
        .from('profiles')
        .insert({
          account_id: account.id,
          ...fields,
          religion: 'Hindu',
          // Members-only by default, and hidden until onboarding is complete.
          visibility: freeMode ? 'members' : 'private',
          discoverable: false,
          profile_status: freeMode ? 'active' : 'draft',
        })
        .select('id')
        .single()
      if (error?.code === '23505') {
        // A second tap raced the first: one profile per account (unique index),
        // so update the row the other request created.
        const { data: again } = await findProfile()
        if (!again) return NextResponse.json({ ok: false, message: 'Could not save. Please try again.' }, { status: 500 })
        profileId = again.id
        await admin.from('profiles').update(fields).eq('id', again.id)
      } else if (error || !created) {
        console.error('[onboarding about] insert:', error?.message)
        return NextResponse.json({ ok: false, message: 'Could not save. Please try again.' }, { status: 500 })
      } else {
        profileId = created.id
      }
    }

    // Only pref_gender is written — any other partner preferences stay as they are.
    const { error: prefError } = await admin
      .from('profile_preferences')
      .upsert({ profile_id: profileId, pref_gender: oppositeGender(data.gender), updated_at: new Date().toISOString() }, { onConflict: 'profile_id' })
    if (prefError) {
      console.error('[onboarding about] preferences:', prefError.message)
      return NextResponse.json({ ok: false, message: 'Saved, but “looking for” could not be stored. Please try again.' }, { status: 500 })
    }
  } else {
    if (!profileId) return bad('Please complete “About you” first.')
    const { data: loc } = await admin.from('india_locations').select('id').eq('id', data.current_loc_id).maybeSingle()
    if (!loc) return bad('Please choose your current city from the suggestions list.')

    const patch: Record<string, unknown> = {
      current_loc_id: data.current_loc_id,
      caste: data.caste,
      self_gotra: data.self_gotra,
      search_needs_rebuild: true,
    }
    for (const k of ['sub_caste', 'mool', 'maternal_gotra', 'gram'] as const) {
      if (data[k] !== undefined) patch[k] = data[k] || null
    }
    const { error } = await admin.from('profiles').update(patch).eq('id', profileId)
    if (error) { console.error('[onboarding mithila] update:', error.message); return NextResponse.json({ ok: false, message: 'Could not save. Please try again.' }, { status: 500 }) }
  }

  // Keep the stored completion score in step with what is now on the row.
  const { data: row } = await admin.from('profiles').select(COMPLETION_SELECT).eq('id', profileId).maybeSingle()
  const strength = row ? computeCompletion(row as unknown as Record<string, unknown>) : 0
  if (row) await admin.from('profiles').update({ profile_complete: strength }).eq('id', profileId)

  const state = await syncDiscoverability(admin, account.id)
  if (state.complete) refreshPublicShowcase()
  return NextResponse.json({ ok: true, missing: state.missing, complete: state.complete, strength, completionMissing: state.completionMissing })
}
