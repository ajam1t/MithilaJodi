'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { refreshPendingCounts } from '@/lib/hooks/usePendingCounts'

type Item = {
  id: string
  type: string
  title: string
  message: string
  icon: string
  cta_label: string | null
  cta_url: string | null
  read: boolean
  created_at: string
  announcement: boolean
}

// ─── Icons (one 24px grid, one weight) ───────────────────────────────────────

const PATHS: Record<string, string> = {
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z',
  spark: 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Zm6.5 11 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z',
  pin: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Zm12-3a5 5 0 0 1 0 8m2.5-10.5a8.5 8.5 0 0 1 0 13',
  check: 'M5 12.5 9.5 17 19 7.5',
  bell: 'M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5M10.3 20.5a1.9 1.9 0 0 0 3.4 0',
}

function Glyph({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d={PATHS[name] ?? PATHS.bell} />
    </svg>
  )
}

// ─── Time ────────────────────────────────────────────────────────────────────

function isToday(iso: string): boolean {
  const d = new Date(iso), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function timeLabel(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (isToday(iso)) return `${Math.round(mins / 60)}h ago`
  const days = Math.floor(mins / 1440)
  if (days <= 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({ n, onOpen }: { n: Item; onOpen: (n: Item) => void }) {
  const body = (
    <>
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
          n.announcement ? 'bg-gold/15 text-[#8A6516]' : n.read ? 'bg-paper-2 text-ink-soft' : 'bg-maroon text-cream'
        }`}
      >
        <Glyph name={n.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={`flex-1 text-[14.5px] leading-snug ${n.read ? 'font-medium text-ink/80' : 'font-semibold text-ink'}`}>
            {n.title}
          </span>
          <span className="shrink-0 pt-0.5 text-[11.5px] text-ink-soft">{timeLabel(n.created_at)}</span>
        </span>
        {n.announcement && (
          <span className="mt-1 inline-block rounded-full border border-gold/40 px-2 py-px text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6516]">
            Announcement
          </span>
        )}
        <span className={`mt-0.5 block text-[13.5px] leading-snug ${n.read ? 'text-ink-soft/90' : 'text-ink-soft'}`}>{n.message}</span>
        {n.cta_label && n.cta_url && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-maroon">
            {n.cta_label}<span aria-hidden="true">→</span>
          </span>
        )}
      </span>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-maroon" aria-hidden="true" />}
    </>
  )

  const cls = `flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-maroon/40 ${
    n.read ? 'bg-cream/60 hover:bg-cream' : 'bg-[#FFF4E2] hover:bg-[#FCEED6]'
  }`

  return (
    <li>
      {/* One button either way: it opens the CTA when there is one, and always
          marks the notification read. */}
      <button type="button" onClick={() => onOpen(n)} className={cls}>
        {body}
        {!n.read && <span className="sr-only"> (unread)</span>}
      </button>
    </li>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NotificationsContent() {
  const router = useRouter()
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState('')
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' })
      const j = await r.json()
      if (j.ok) setItems(j.notifications)
      else setError(j.message ?? 'Could not load notifications.')
    } catch {
      setError('Could not load notifications.')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function markRead(ids?: string[]) {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids ? { ids } : {}),
    }).catch(() => null)
    refreshPendingCounts()
  }

  async function markAll() {
    setMarking(true)
    setItems(list => list?.map(n => ({ ...n, read: true })) ?? null)
    await markRead()
    setMarking(false)
  }

  function open(n: Item) {
    if (!n.read) {
      setItems(list => list?.map(x => (x.id === n.id ? { ...x, read: true } : x)) ?? null)
      void markRead([n.id])
    }
    if (n.cta_url) router.push(n.cta_url)
  }

  const unread = items?.filter(n => !n.read).length ?? 0
  const today = items?.filter(n => isToday(n.created_at)) ?? []
  const earlier = items?.filter(n => !isToday(n.created_at)) ?? []

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[28px] leading-tight text-maroon sm:text-[32px]">Notifications</h1>
            <p className="mt-1 text-[13.5px] text-ink-soft">Updates about your profile, matches and activity.</p>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              disabled={marking}
              className="shrink-0 rounded-full border border-maroon/30 px-3.5 py-2 text-[13px] font-semibold text-maroon transition-colors hover:bg-cream disabled:opacity-60"
            >
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-mj-sm border border-error/30 bg-error-soft px-4 py-3 text-sm text-error-fg">{error}</div>
        )}

        {!items && !error && (
          <div className="mt-6 space-y-2" aria-busy="true">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex animate-pulse gap-3 rounded-mj-sm bg-cream p-4">
                <div className="h-10 w-10 rounded-full bg-paper-3" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-2/3 rounded bg-paper-3" />
                  <div className="h-3 w-1/2 rounded bg-paper-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {items && items.length === 0 && (
          <div className="mt-8 rounded-mj border border-gold/30 bg-cream px-6 py-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-2 text-maroon"><Glyph name="bell" /></span>
            <p className="mt-3 font-serif text-[18px] text-maroon">You&rsquo;re all caught up</p>
            <p className="mt-1 text-[13.5px] text-ink-soft">New interests, matches and messages will appear here.</p>
            <Link href="/search" className="btn-primary mt-5 inline-flex px-5 py-2.5 text-[14px]">Explore Profiles</Link>
          </div>
        )}

        {[{ label: 'Today', list: today }, { label: 'Earlier', list: earlier }].map(g => g.list.length > 0 && (
          <section key={g.label} className="mt-6" aria-label={g.label}>
            <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6516]">{g.label}</h2>
            <ul className="divide-y divide-gold/15 overflow-hidden rounded-mj border border-gold/25 shadow-mj-xs">
              {g.list.map(n => <Row key={n.id} n={n} onOpen={open} />)}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
