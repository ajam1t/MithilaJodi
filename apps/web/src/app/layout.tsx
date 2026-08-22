import type { Metadata, Viewport } from 'next'
import { Marcellus, Mukta, Kalam } from 'next/font/google'
import '@/styles/globals.css'

const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
})

const mukta = Mukta({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'devanagari'],
  variable: '--font-mukta',
  display: 'swap',
})

const kalam = Kalam({
  weight: ['400', '700'],
  subsets: ['latin', 'devanagari'],
  variable: '--font-kalam',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mithilajodi.com'
  ),
  title: {
    default: 'Mithila Jodi — जहाँ परम्परा मिले, प्रेम से',
    template: '%s | Mithila Jodi',
  },
  description:
    'Mithila Jodi — जहाँ परम्परा मिले, प्रेम से | Where tradition meets love. A trusted matrimonial platform for the Mithila community. Create a marriage biodata in English, Hindi, Maithili & Sanskrit, connect families, and discover matches rooted in Mithila heritage.',
  keywords: [
    'Mithila matrimony',
    'Maithil matrimonial',
    'Bihar matrimony',
    'Mithila marriage',
    'marriage biodata',
    'Maithili biodata',
  ],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Mithila Jodi',
    title: 'Mithila Jodi — जहाँ परम्परा मिले, प्रेम से',
    description: 'Where tradition meets love. A trusted matrimonial platform for the Mithila community of India.',
  },
  twitter: {
    card: 'summary_large_image',
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
      <body>{children}</body>
    </html>
  )
}
