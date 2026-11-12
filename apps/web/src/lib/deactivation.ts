/** Reasons a member gives for deactivating. Shared by the settings form, the API and the admin view. */
export const DEACTIVATION_REASONS = [
  { value: 'found_partner', en: 'Found a suitable life partner', hi: 'उपयुक्त जीवनसाथी मिल गया' },
  { value: 'getting_married', en: 'Getting married', hi: 'शादी होने वाली है' },
  { value: 'no_relevant_matches', en: 'Not receiving relevant matches', hi: 'उपयुक्त मैच नहीं मिल रहे' },
  { value: 'not_satisfied', en: 'Not satisfied with Mithila Jodi', hi: 'Mithila Jodi से संतुष्ट नहीं' },
  { value: 'privacy', en: 'Privacy concerns', hi: 'गोपनीयता की चिंता' },
  { value: 'too_many_notifications', en: 'Too many notifications', hi: 'बहुत ज़्यादा सूचनाएँ' },
  { value: 'temporary_break', en: 'Taking a temporary break', hi: 'कुछ समय का विराम' },
  { value: 'other', en: 'Other', hi: 'अन्य' },
] as const
export type DeactivationReason = (typeof DEACTIVATION_REASONS)[number]['value']
export const isDeactivationReason = (v: unknown): v is DeactivationReason => DEACTIVATION_REASONS.some(r => r.value === v)
