import { WHATSAPP_COMMUNITY_URL } from '@/lib/constants'

/**
 * Joining the official Mithila Jodi WhatsApp community.
 *
 * Three presentations of one link, so the four places it appears stay
 * consistent instead of drifting into four separate designs:
 *
 *   JoinCommunityButton — the link itself, used on its own in the footer and
 *                         inside the two blocks below.
 *   JoinCommunityBand   — a full homepage section.
 *   JoinCommunityCard   — a compact card for the profile area and the
 *                         post-registration success panel.
 *
 * Styling reuses what the codebase already uses for WhatsApp actions —
 * `bg-green` / `hover:bg-green-2`, `rounded-mj-sm`, the same glyph as the
 * "Send on WhatsApp" share button — rather than inventing a new treatment.
 *
 * Behaviour is a plain anchor, which is what makes this work everywhere: on
 * iOS and Android the WhatsApp app claims chat.whatsapp.com links and opens
 * directly, and on desktop `target="_blank"` opens the invite page in a new tab
 * without disturbing the page the member was on. There is no interstitial and
 * no scripted redirect, so nothing to break in an in-app browser.
 *
 * WhatsApp itself shows the group preview and the Join button, so a member
 * always confirms for themselves — nothing here joins anyone automatically.
 */

/** The WhatsApp glyph. Shared so the three call sites cannot drift apart. */
export function WhatsAppIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.44-.72-2.9-1.15-4.7-4.15-4.84-4.34-.14-.2-1.13-1.5-1.13-2.87 0-1.36.71-2.03.97-2.31.24-.27.53-.34.7-.34.17 0 .34 0 .49.01.16.01.37-.06.58.44.2.5.7 1.72.76 1.84.06.12.1.27.02.44-.09.17-.17.27-.34.46-.17.19-.26.29-.38.48-.12.19-.26.4-.11.68.14.29.63 1.16 1.35 1.88.93.93 1.71 1.22 1.99 1.36.27.14.44.12.6-.07.17-.19.7-.82.89-1.1.19-.29.38-.24.63-.14.25.09 1.6.76 1.87.9.27.14.46.2.53.32.06.12.06.68-.18 1.36z" />
    </svg>
  )
}

/** Attributes every link to the invite shares. */
const EXTERNAL = {
  href: WHATSAPP_COMMUNITY_URL,
  target: '_blank',
  // noopener/noreferrer: the new tab must not reach back via window.opener.
  // nofollow: an invite link is an external destination, not something to pass
  // ranking signals to.
  rel: 'noopener noreferrer nofollow',
  // The visible text is short; screen readers get the full purpose.
  'aria-label': 'Join Mithila Jodi WhatsApp Community',
} as const

export function JoinCommunityButton({
  label = 'Join WhatsApp Community',
  className = '',
  size = 'md',
}: {
  label?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-4 py-2 text-[13px]' : 'px-5 py-2.5 text-sm'
  return (
    <a
      {...EXTERNAL}
      className={`inline-flex items-center justify-center gap-2 rounded-mj-sm bg-green font-semibold
                  text-white transition-colors hover:bg-green-2
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-2
                  focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${pad} ${className}`}
    >
      <WhatsAppIcon size={size === 'sm' ? 15 : 17} />
      {label}
    </a>
  )
}

/**
 * Homepage section. Sits after the community stories, where the page is already
 * talking about the community, rather than next to the closing call to action
 * where it would compete with "create your profile".
 */
export function JoinCommunityBand() {
  return (
    <section className="bg-cream py-9 sm:py-12" aria-labelledby="whatsapp-community-heading">
      <div className="wrap max-w-2xl text-center">
        <p className="eyebrow mb-1.5">Stay Connected</p>
        <h2 id="whatsapp-community-heading" className="section-heading">
          Join the Mithila Jodi Community
        </h2>
        <div className="ornament-line mx-auto mt-2 w-16" />
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
          Stay connected with the Mithila Jodi community and receive important updates,
          announcements and community news.
        </p>
        <div className="mt-5 flex justify-center">
          <JoinCommunityButton />
        </div>
        <p className="mt-3 text-[12px] text-ink-soft">
          Opens WhatsApp — you choose whether to join.
        </p>
      </div>
    </section>
  )
}

/**
 * Compact card for the signed-in profile area and the post-registration
 * success panel. Deliberately quiet: it must never compete with the profile
 * completion checklist or the primary action next to it.
 */
export function JoinCommunityCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-mj border border-green/30 bg-green/[0.06] px-4 py-3.5 ${className}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-green" aria-hidden="true">
          <WhatsAppIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink">Join WhatsApp Community</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">
            Stay connected with Mithila Jodi.
          </p>
        </div>
        <JoinCommunityButton label="Join Now" size="sm" className="shrink-0 self-center" />
      </div>
    </div>
  )
}
