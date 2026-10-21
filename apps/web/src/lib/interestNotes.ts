/*
 * The optional note that goes with an interest. Shared by the send sheet and
 * POST /api/interests, which trims and caps it again whatever the form allows.
 *
 * Templates are starting points with blanks, never filled in for the member:
 * nothing about their family is assumed or invented.
 */

export const INTEREST_NOTE_MAX = 300

export const INTEREST_NOTE_TEMPLATES: Array<{ label: string; text: string }> = [
  {
    label: 'Family introduction',
    text: 'Namaste. We are the ___ family from ___. We liked your profile and would like to connect.',
  },
  {
    label: 'From a parent',
    text: 'Pranam. I am writing on behalf of my ___. Our family is from ___ and we would be glad to talk with your family.',
  },
  {
    label: 'Shared roots',
    text: 'Namaste. We noticed we share roots in ___. We would be happy to know more about your family.',
  },
  {
    label: 'In my own words',
    text: 'Namaste. I am ___ and I work as ___. I liked your profile and would like to get to know you and your family.',
  },
]

export type SendInterestResult =
  | { ok: true; matched: boolean; interestId: string | null; conversationId: string | null }
  | { ok: false; status: number; message: string }

/** POST /api/interests from the browser, with the same error copy everywhere. */
export async function sendInterest(toProfileId: string, note?: string | null): Promise<SendInterestResult> {
  try {
    const res = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_profile_id: toProfileId, message: note?.trim() || undefined }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.ok) {
      return {
        ok: true,
        matched: json.matched === true,
        interestId: json.interest_id ?? null,
        conversationId: json.conversation_id ?? null,
      }
    }
    return { ok: false, status: res.status, message: json.message ?? 'Could not send interest. Please try again.' }
  } catch {
    return { ok: false, status: 0, message: 'Could not send interest. Please try again.' }
  }
}
