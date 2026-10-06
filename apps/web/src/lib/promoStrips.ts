/**
 * Messages for ContextualPromoStrip, one set per page. The shell is shared and
 * identical everywhere; only these change. Wording and order are the owner's
 * (2026-10-07) — keep labels short so the strip stays one line.
 */

export type PromoMessage = {
  icon: string
  label: string
  cta: string
  href: string
  /** Opens in a new tab (the live sample profile, at the owner's request). */
  newTab?: boolean
}

export type PromoSet = 'home' | 'digitalProfile' | 'join' | 'search' | 'astrology'

/** The owner's own live profile, used as the public example of a Digital Profile. */
const SAMPLE_PROFILE_URL = 'https://mithilajodi.com/p/kxzsSnfFidVRJmFedtxAdg'

const INVITATION = '/marriage-invitation'
const BIODATA = '/marriage-biodata'
const JOIN = '/register'
const DIGITAL_PROFILE = '/digital-profile'

export const PROMO_SETS: Record<PromoSet, PromoMessage[]> = {
  home: [
    { icon: '💍', label: 'Mithila Wedding Invitation', cta: 'Create yours', href: INVITATION },
    { icon: '👤', label: 'Mithila Digital Profile', cta: 'View sample profile', href: SAMPLE_PROFILE_URL, newTab: true },
    { icon: '❤️', label: 'Ready to find your Jodi?', cta: 'Join / Login', href: JOIN },
    { icon: '✨', label: 'Mithila Astrology Tools', cta: 'Explore Tools', href: '/astrology' },
  ],
  digitalProfile: [
    { icon: '👤', label: 'Mithila Digital Profile', cta: 'View sample profile', href: SAMPLE_PROFILE_URL, newTab: true },
    { icon: '📜', label: 'Still sharing your biodata as a PDF?', cta: 'Create Biodata', href: BIODATA },
    { icon: '💍', label: 'Your wedding deserves a beautiful invitation', cta: 'Create yours', href: INVITATION },
  ],
  join: [
    // First on purpose: cost is the biggest hesitation before joining.
    { icon: '✨', label: 'Mithila Jodi is currently free for all members', cta: 'Join Free', href: '/register?start=1' },
    { icon: '❤️', label: 'Ready to find your Jodi?', cta: 'Join / Login', href: JOIN },
    { icon: '👤', label: 'Create your Mithila Digital Profile', cta: 'Create Profile', href: DIGITAL_PROFILE },
  ],
  // The visitor's Search page (/explore). Never promotes search, nor astrology.
  search: [
    { icon: '❤️', label: 'Found someone interesting?', cta: 'Join / Login', href: JOIN },
    { icon: '👤', label: 'Want your own Mithila profile?', cta: 'Create Profile', href: DIGITAL_PROFILE },
    { icon: '📜', label: 'Need a biodata to share with family?', cta: 'Create Biodata', href: BIODATA },
    { icon: '💍', label: 'Getting married?', cta: 'Create Invitation', href: INVITATION },
  ],
  // Question-led, one per tool, all eight.
  astrology: [
    { icon: '❤️', label: 'How many Gun matched?', cta: 'Check Kundli Match', href: '/astrology/kundli-match' },
    { icon: '🔥', label: 'Are you Manglik?', cta: 'Check Now', href: '/astrology/manglik' },
    { icon: '🌙', label: "What's your Nakshatra?", cta: 'Find Yours', href: '/astrology/nakshatra' },
    { icon: '♈', label: "What's your Rashi?", cta: 'Check Rashi', href: '/astrology/rashi' },
    { icon: '💑', label: 'Are you truly compatible?', cta: 'Check Compatibility', href: '/astrology/compatibility' },
    { icon: '📜', label: 'Want to see your Janam Kundli?', cta: 'Generate Kundli', href: '/astrology/janam-kundli' },
    { icon: '💍', label: 'Found your Jodi?', cta: 'Find Vivah Muhurat', href: '/astrology/vivah-muhurat' },
    { icon: '👶', label: 'Looking for a meaningful baby name?', cta: 'Explore Names', href: '/astrology/baby-names' },
  ],
}
