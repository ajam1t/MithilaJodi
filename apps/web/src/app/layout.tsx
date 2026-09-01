import type { Metadata, Viewport } from 'next'
import { Marcellus, Mukta, Kalam } from 'next/font/google'
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
    images: [
      {
        url: '/hero-couple.jpg',
        width: 1536,
        height: 1024,
        alt: 'A Mithila bride and groom exchanging wedding garlands, surrounded by family',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-couple.jpg'],
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
      className={`${marcellus.variable} ${mukta.variable} ${kalam.variable}`}
    >
      <body>
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
