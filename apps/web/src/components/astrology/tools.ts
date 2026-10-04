/** The astrology tools, in hub order — one source for the hub, heroes and cross-links. */
export type ToolSlug =
  | 'kundli-match' | 'compatibility' | 'janam-kundli' | 'nakshatra' | 'rashi' | 'manglik' | 'vivah-muhurat' | 'baby-names'

export type ToolInfo = {
  slug: ToolSlug
  href: string
  label: string
  hi: string
  tagline: string
  description: string
  cta: string
  /** Jewel tone of the emblem: [light, deep]. */
  tone: [string, string]
  read?: { href: string; label: string }
}

export const TOOLS: ToolInfo[] = [
  {
    slug: 'kundli-match', href: '/astrology/kundli-match', label: 'Kundli Match', hi: 'कुण्डली मिलान',
    tagline: '36 Guna · Ashtakoota',
    description: 'All eight kootas scored and explained, the Manglik check for both, and both birth charts — with a PDF and a private share link.',
    cta: 'Match two kundlis', tone: ['#9B2233', '#5A0E19'],
    read: { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How kundli matching works' },
  },
  {
    slug: 'compatibility', href: '/astrology/compatibility', label: 'Compatibility', hi: 'मेलापक विचार',
    tagline: 'Beyond the 36 Guna',
    description: 'The Guna score, then what a pandit reads next — Lagna, the 7th house, Navamsa and how each chart touches the other.',
    cta: 'Compare two charts', tone: ['#7B3260', '#4A1838'],
  },
  {
    slug: 'janam-kundli', href: '/astrology/janam-kundli', label: 'Janam Kundli', hi: 'जन्म कुण्डली',
    tagline: 'Your Vedic birth chart',
    description: 'Lagna, Chandra and Navamsa charts, all nine grahas, the Vimshottari dasha and the panchang of your birth.',
    cta: 'Make my kundli', tone: ['#2E7048', '#1B4A2E'],
  },
  {
    slug: 'nakshatra', href: '/astrology/nakshatra', label: 'Nakshatra', hi: 'नक्षत्र',
    tagline: 'Your Janma Nakshatra',
    description: 'Your birth star and pada, its deity, lord and symbol, the name syllable and your nine taras.',
    cta: 'Find my nakshatra', tone: ['#3F4C8A', '#232C5C'],
    read: { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra?' },
  },
  {
    slug: 'rashi', href: '/astrology/rashi', label: 'Rashi', hi: 'राशि',
    tagline: 'Your Moon sign',
    description: 'Your Janma Rashi from the Moon at birth, its lord and element, and which Moon signs suit it.',
    cta: 'Find my rashi', tone: ['#24706E', '#164846'],
    read: { href: '/blogs/horoscope-marriage/what-is-rashi', label: 'What is Rashi?' },
  },
  {
    slug: 'manglik', href: '/astrology/manglik', label: 'Manglik Check', hi: 'मांगलिक विचार',
    tagline: 'Mars from Lagna and Moon',
    description: 'Where Mars sits counted from both the Lagna and the Moon, Anshik or full Manglik, and the traditional exceptions.',
    cta: 'Check Manglik', tone: ['#C4562F', '#8A2F14'],
    read: { href: '/blogs/horoscope-marriage/what-is-manglik', label: 'What is Manglik dosha?' },
  },
  {
    slug: 'vivah-muhurat', href: '/astrology/vivah-muhurat', label: 'Vivah Muhurat', hi: 'विवाह मुहूर्त',
    tagline: 'Shubh wedding dates',
    description: 'Every auspicious wedding window in the coming months with exact times for your city, and Guru bal for the couple.',
    cta: 'See wedding dates', tone: ['#B7791F', '#7A4E0E'],
  },
  {
    slug: 'baby-names', href: '/astrology/baby-names', label: 'Baby Names', hi: 'नामाक्षर',
    tagline: 'Name syllables by nakshatra',
    description: 'The traditional first syllable from your baby’s nakshatra pada, the rashi letters, and a check for any name you like.',
    cta: 'Find name letters', tone: ['#B0476E', '#7A2546'],
  },
]

export const toolInfo = (slug: ToolSlug) => TOOLS.find(t => t.slug === slug)!
