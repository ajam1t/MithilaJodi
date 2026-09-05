import type { Metadata, Viewport } from 'next'
import { Marcellus, Mukta, Kalam, Rozha_One } from 'next/font/google'
import { SITE_URL } from '@/lib/constants'
import { ToastProvider } from '@/components/ui'
import { MusicPlayerProvider } from '@/components/music/MusicPlayerContext'
import { PersistentPlayer } from '@/components/music/PersistentPlayer'
import '@/styles/globals.css'

const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
})

const mukta = Mukta({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'devanagari'],
  variable: '--font-mukta',
  display: 'swap',
})

/**
 * Rozha One — the Devanagari display face behind `.font-deva` and `font-display`.
 *
 * It was declared in tailwind.config.ts and in globals.css but never actually
 * loaded, so every Devanagari line on the site — including the brand tagline
 * "जहाँ परम्परा मिले, प्रेम से" in the header, hero and footer — was silently
 * falling back to a generic serif. Loading it here is what makes those
 * declarations real. It is above the fold, so it IS preloaded.
 *
 * Rozha One ships a single weight (400) and covers latin + devanagari.
 */
const rozhaOne = Rozha_One({
  weight: '400',
  subsets: ['latin', 'devanagari'],
  variable: '--font-rozha',
  display: 'swap',
})

const kalam = Kalam({
  weight: ['400', '700'],
  subsets: ['latin', 'devanagari'],
  variable: '--font-kalam',
  display: 'swap',
  // Decorative accent font — not used above the fold, so don't preload it
  // (removes ~4 unnecessary <link rel=preload> tags; the font still loads
  // on demand via @font-face when a .font-hand element renders).
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mithila Jodi — जहाँ परम्परा मिले, प्रेम से',
    template: '%s | Mithila Jodi',
  },
  description:
    'Mithila Jodi — जहाँ परम्परा मिले, प्रेम से | Where tradition meets love. A trusted matrimonial platform for the Mithila community. Create a marriage biodata in English, Hindi, Maithili & Sanskrit, connect families, and discover matches rooted in Mithila heritage.',
  keywords: [
    'Mithila matrimonial',
    'Mithila matrimony',
    'Maithil matrimonial',
    'Maithili marriage',
    'Mithila marriage',
    'Mithila biodata',
    'Maithili biodata',
    'Bihar matrimony',
  ],
  applicationName: 'Mithila Jodi',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Mithila Jodi',
    locale: 'en_IN',
    url: SITE_URL,
    title: 'Mithila Jodi — जहाँ परम्परा मिले, प्रेम से',
    description: 'Where tradition meets love. A trusted matrimonial platform for the Mithila community of India.',
    // 1200x630 brand card, 105 KB. Replaces /hero-couple.jpg, which at 605 KB was
    // large enough for WhatsApp to skip generating a link preview — and WhatsApp
    // is how biodata actually gets shared here. Authored with next/og and saved
    // as a static file rather than rendered per request, because a page that
    // defines its own `openGraph` block does not inherit the file-based image.
    images: [
      {
        url: '/og-card.png',
        width: 1200,
        height: 630,
        alt: 'Mithila Jodi — a matrimonial platform for the Mithila community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-card.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#7A1220',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${marcellus.variable} ${mukta.variable} ${rozhaOne.variable} ${kalam.variable}`}
    >
      <body>
        {/* First focusable element on every page, so a keyboard user can
            bypass the header navigation. Targets the #main-content id that
            each page puts on its <main id="main-content">. */}
        <a href="#main-content" className="mj-skip-link">Skip to main content</a>
        <ToastProvider>
          {/* Global music state + the persistent player live above the page
              tree, so playback survives client-side navigation. */}
          <MusicPlayerProvider>
            {children}
            <PersistentPlayer />
          </MusicPlayerProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
