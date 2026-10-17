import Link from 'next/link'
import Image from 'next/image'
import { DIGITAL_PROFILE_PATH } from '@/lib/digitalProfile'

/**
 * Chrome for a Digital Profile opened from its shared link (/p/[token]).
 *
 * Deliberately not the site's MithilaHeader/MobileBottomNav: a recipient who
 * opens a WhatsApp link should land on one standalone page, not the full
 * Mithila Jodi site. Just a compact mark up top and a one-line footer —
 * no search, no hamburger, no member nav.
 */
export function SharedProfileShell({
  children,
  showJoinCta = true,
}: {
  children: React.ReactNode
  /** Off for the owner viewing their own link — they already have a profile. */
  showJoinCta?: boolean
}) {
  return (
    <>
      <header className="bg-cream">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1.5 px-4 pt-5 pb-3">
          <Link href="/" className="flex items-center gap-2" aria-label="Mithila Jodi — home">
            <Image
              src="/logo-mark.png"
              alt=""
              width={30}
              height={28}
              priority
              className="h-7 w-auto object-contain"
            />
            <span className="font-serif font-bold text-[16px] leading-none text-maroon">Mithila Jodi</span>
          </Link>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-soft">Digital Profile</p>
          <div className="ornament-line mt-1.5 w-12" />
        </div>
      </header>

      {children}

      <footer className="border-t border-gold/20 bg-cream px-4 py-4 text-center">
        <p className="text-[12.5px] text-ink-soft">
          Made with <span aria-hidden="true">♥</span> on{' '}
          <Link href="/" className="font-semibold text-maroon">Mithila Jodi</Link>
        </p>
        {showJoinCta && (
          <Link
            href={DIGITAL_PROFILE_PATH}
            className="mt-1.5 inline-block text-[12px] text-maroon underline-offset-2 hover:underline"
          >
            Create Your Digital Profile
          </Link>
        )}
      </footer>
    </>
  )
}
