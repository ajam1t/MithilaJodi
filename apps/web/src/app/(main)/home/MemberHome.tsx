import Link from 'next/link'
import { DEFAULT_SHARE_MESSAGE } from '@/lib/digitalProfile'
import type { HomeSummary } from '@/lib/memberActivity'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'
import { RecommendedForYou } from './RecommendedForYou'

/*
 * The signed-in member's Home: what has happened, who might fit, and the one
 * thing worth doing today (sharing their Digital Profile). Not the marketing
 * homepage — that stays at / for everyone. Every number is a live count.
 */
function greeting(): string {
  const h = new Date(Date.now() + 5.5 * 3600e3).getUTCHours() // India time
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const ICONS: Record<string, string> = {
  spark: 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Zm6.5 11 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  chat: 'M21 14.5a2 2 0 0 1-2 2H8l-4.5 4V5.5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2z',
}

export function MemberHome({ summary, siteUrl }: { summary: HomeSummary; siteUrl: string }) {
  const link = summary.share ? `${siteUrl}/p/${summary.share.token}` : null
  const waText = link ? DEFAULT_SHARE_MESSAGE.replace('{link}', link) : null

  const tiles = [
    { label: 'New Matches', value: summary.newMatches, href: '/search', icon: 'spark', hint: 'this week' },
    { label: 'New Interests', value: summary.newInterests, href: '/inbox?tab=interests', icon: 'heart', hint: 'waiting for you' },
    { label: 'Profile Views', value: summary.profileViews, href: '/notifications', icon: 'eye', hint: 'last 30 days' },
    { label: 'Unread Messages', value: summary.unreadMessages, href: '/inbox', icon: 'chat', hint: 'in your inbox' },
  ]

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <h1 className="font-serif text-[28px] leading-tight text-maroon sm:text-[32px]">
          {greeting()}{summary.firstName ? `, ${summary.firstName}` : ''} <span aria-hidden="true">❤️</span>
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">Here&rsquo;s what&rsquo;s happening on Mithila Jodi.</p>

        {/* Activity */}
        <section aria-label="Your activity" className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {tiles.map(t => (
            <Link
              key={t.label}
              href={t.href}
              className="group rounded-mj border border-gold/30 bg-cream p-3.5 shadow-mj-xs transition-colors hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40"
            >
              <span className="flex items-center justify-between">
                <span className="font-serif text-[28px] leading-none text-maroon">{t.value}</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICONS[t.icon]} />
                </svg>
              </span>
              <span className="mt-2 block text-[13px] font-semibold leading-tight text-ink">{t.label}</span>
              <span className="block text-[11.5px] text-ink-soft">{t.hint}</span>
            </Link>
          ))}
        </section>

        {/* Recommended */}
        <section aria-labelledby="home-recommended" className="mt-7">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="home-recommended" className="font-serif text-[20px] text-maroon">Recommended for you</h2>
            <Link href="/search" className="text-[13px] font-semibold text-maroon hover:underline">See all →</Link>
          </div>
          <RecommendedForYou />
        </section>

        {/* Digital Profile — a prompt, not the dashboard. */}
        <section aria-label="Share your Digital Profile" className="mt-7 flex flex-col gap-3 rounded-mj border border-gold/40 bg-[#FFF8EC] p-4 shadow-mj-xs sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6516]">Your Digital Profile</p>
            <p className="mt-1 font-serif text-[17px] leading-snug text-maroon">Share your Mithila Jodi profile with family and friends.</p>
          </div>
          {waText ? (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-green px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-green-2"
            >
              <WhatsAppIcon size={18} /> Share on WhatsApp →
            </a>
          ) : (
            <Link href="/digital-profile" className="btn-primary shrink-0 justify-center px-5 py-2.5 text-[14px]">Open Digital Profile →</Link>
          )}
        </section>
      </div>
    </main>
  )
}
