export type SectionIconName = 'person' | 'diya' | 'career' | 'location' | 'heart' | 'family' | 'sun' | 'phone'

/** Small line icons for section headings; inherit `color`. */
export function SectionIcon({ name, size = 14 }: { name: SectionIconName; size?: number }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
  }
  switch (name) {
    case 'person':
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
    case 'diya':
      return <svg {...common}><path d="M12 3c2 2.6 2 4.8 0 6.8-2-2-2-4.2 0-6.8z" fill="currentColor" /><path d="M3 12.5h18c0 4.4-4 7-9 7s-9-2.6-9-7z" /></svg>
    case 'career':
      return <svg {...common}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></svg>
    case 'location':
      return <svg {...common}><path d="M12 21s-7-6.1-7-11.2a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" /><circle cx="12" cy="10" r="2.5" /></svg>
    case 'heart':
      return <svg {...common}><path d="M12 20s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.4C20 15.1 12 20 12 20z" /></svg>
    case 'family':
      return <svg {...common}><circle cx="8" cy="7" r="3" /><circle cx="16.5" cy="8.5" r="2.5" /><path d="M2.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" /><path d="M13.5 15.2c.9-.8 1.9-1.2 3-1.2 2.6 0 4.5 2 4.5 5" /></svg>
    case 'sun':
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
    case 'phone':
      return <svg {...common}><path d="M5 3h3.5l2 5-2.5 1.6a11 11 0 0 0 5.4 5.4L15 12.5l5 2V18a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" /></svg>
  }
}
