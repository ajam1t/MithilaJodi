import Link from 'next/link'
import type { ReactNode } from 'react'

/*
 * Admin console primitives (styles in styles/admin-console.css): ivory glass
 * cards with gold hairlines, monospace labels, ink text, maroon only for the
 * one thing that needs attention. Every number on screen comes from a query —
 * when there is no data, these components say so instead of showing a zero
 * that looks like a measurement.
 */

export const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'd7', label: '7 days' },
  { key: 'mtd', label: 'MTD' },
  { key: 'd30', label: '30 days' },
  { key: 'd90', label: '90 days' },
  { key: 'd365', label: '365 days' },
  { key: 'all_time', label: 'All time' },
] as const
export type PeriodKey = (typeof PERIODS)[number]['key']
export type PeriodValues = Partial<Record<PeriodKey, number | null>>

export function fmt(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function compact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (Math.abs(n) < 10_000) return fmt(n)
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function bytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toLocaleString('en-IN', { maximumFractionDigits: v < 10 && i > 0 ? 1 : 0 })} ${u[i]}`
}

export function ist(iso: string | null | undefined, withTime = true): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return 'never'
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`
  return ist(iso, false)
}

export function PageHeader({ title, description, eyebrow, actions }: {
  title: string; description?: ReactNode; eyebrow?: string; actions?: ReactNode
}) {
  return (
    <div className="acx-in mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="acx-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="acx-h1">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Section({ title, description, actions, children, id, className = '' }: {
  title?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; id?: string; className?: string
}) {
  return (
    <section id={id} className={`acx-card scroll-mt-24 ${className}`}>
      {(title || actions) && (
        <div className="acx-card-h">
          <div className="min-w-0">
            {title && <h2 className="acx-card-t">{title}</h2>}
            {description && <p className="mt-0.5 pl-4 text-[12.5px] leading-relaxed text-ink-soft">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="px-4 py-4 sm:px-[18px]">{children}</div>
    </section>
  )
}

/** A tiny server-rendered trend line (no axes) — the shape, not the reading. */
export function Sparkline({ points, label }: { points: number[]; label?: string }) {
  if (points.length < 2) return null
  const max = Math.max(...points, 1)
  const w = 120, h = 34
  const xy = points.map((n, i) => [(i / (points.length - 1)) * w, h - 3 - (n / max) * (h - 8)] as const)
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const id = `sp${Math.abs(points.reduce((a, n, i) => a * 31 + n * (i + 7), 7) % 1e9)}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="acx-spark" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B3424F" stopOpacity=".22" /><stop offset="1" stopColor="#B3424F" stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w} ${h} L0 ${h}Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="#B3424F" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="2.6" fill="#7A1220" />
    </svg>
  )
}

/**
 * A KPI. `note` says what the number means; `href` drills down; `spark` is a
 * daily series drawn under the value; `delta` compares today with yesterday.
 */
export function StatTile({ label, value, sub, note, href, tone, spark, delta }: {
  label: string; value: string; sub?: ReactNode; note?: string; href?: string; tone?: 'attention'
  spark?: number[]; delta?: { now: number | null | undefined; then: number | null | undefined }
}) {
  const d = delta && delta.now != null && delta.then != null ? delta.now - delta.then : null
  const body = (
    <>
      <p className="acx-tile-k">{label}</p>
      <p className="acx-tile-v">
        {value}
        {d != null && (
          <span className="acx-delta" data-dir={d > 0 ? 'up' : d < 0 ? 'down' : 'flat'} title="Compared with yesterday">
            {d > 0 ? '▲' : d < 0 ? '▼' : '='}{d !== 0 && <> {fmt(Math.abs(d))}</>}
          </span>
        )}
      </p>
      {sub && <p className="mt-1.5 text-[12px] text-ink-soft">{sub}</p>}
      {note && <p className="mt-1 text-[11.5px] leading-snug text-ink-soft/80">{note}</p>}
      {spark && <Sparkline points={spark} />}
    </>
  )
  return href
    ? <Link href={href} className="acx-tile" data-tone={tone}>{body}</Link>
    : <div className="acx-tile" data-tone={tone}>{body}</div>
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{children}</div>
}

/** Metric × period table. Rows with no source say "Not tracked". */
export function PeriodTable({ rows, periods = PERIODS, firstCol = 'Metric' }: {
  rows: Array<{ label: ReactNode; values: PeriodValues | null; hint?: string; href?: string }>
  periods?: ReadonlyArray<{ key: PeriodKey; label: string }>
  firstCol?: string
}) {
  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-[#EFE9DF] text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
            <th className="sticky left-0 bg-[#FFFDF8] px-4 py-2 font-semibold sm:px-5">{firstCol}</th>
            {periods.map(p => <th key={p.key} className="px-3 py-2 text-right font-semibold">{p.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[#F3EEE6] last:border-0">
              <td className="sticky left-0 bg-[#FFFDF8] px-4 py-2.5 sm:px-5">
                {r.href ? <Link href={r.href} className="font-medium text-ink hover:text-maroon">{r.label}</Link> : <span className="font-medium text-ink">{r.label}</span>}
                {r.hint && <span className="mt-0.5 block text-[11.5px] text-ink-soft">{r.hint}</span>}
              </td>
              {r.values
                ? periods.map(p => <td key={p.key} className="px-3 py-2.5 text-right tabular-nums text-ink">{fmt(r.values![p.key] ?? null)}</td>)
                : <td colSpan={periods.length} className="px-3 py-2.5 text-right text-[12.5px] text-ink-soft">Not tracked</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'good' | 'warn' | 'bad' | 'neutral' | 'info'; children: ReactNode }) {
  const t = {
    good: 'bg-[#E7F0E9] text-[#1B4A2E] border-[#C9DECF]',
    warn: 'bg-[#FBF1DC] text-[#7A5410] border-[#EBD7A8]',
    bad: 'bg-[#F8E5E5] text-[#8A1C1C] border-[#EDC4C4]',
    info: 'bg-[#E8ECF5] text-[#2E3A6E] border-[#CDD5EA]',
    neutral: 'bg-[#F3EFE8] text-ink-soft border-[#E5DDCF]',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${t}`}>{children}</span>
}

/** Health status with an icon and a word — never colour alone. */
export function Status({ state }: { state: 'healthy' | 'warning' | 'critical' | 'unknown' }) {
  const m = {
    healthy: { tone: 'good' as const, icon: '●', label: 'Healthy' },
    warning: { tone: 'warn' as const, icon: '▲', label: 'Warning' },
    critical: { tone: 'bad' as const, icon: '■', label: 'Critical' },
    unknown: { tone: 'neutral' as const, icon: '○', label: 'Not monitored' },
  }[state]
  return <Badge tone={m.tone}><span aria-hidden="true">{m.icon}</span>{m.label}</Badge>
}

export function Unavailable({ title = 'Data unavailable', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DDC9A2] bg-[#FCF7EC] px-4 py-5 text-center">
      <p className="text-[13.5px] font-medium text-ink">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-soft">{children}</p>}
    </div>
  )
}

export function DataNote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">{children}</p>
}

/** Ranked list with proportional bars (server-rendered, no JS). */
export function RankBars({ rows, unit = '', empty = 'No data yet.' }: {
  rows: Array<{ label: ReactNode; value: number; sub?: string; href?: string }>; unit?: string; empty?: string
}) {
  if (rows.length === 0) return <Unavailable title={empty} />
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <ol className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-ink">{r.href ? <Link href={r.href} className="hover:text-maroon">{r.label}</Link> : r.label}</span>
            <span className="shrink-0 tabular-nums text-ink">{fmt(r.value)}{unit}{r.sub && <span className="ml-1.5 text-[11.5px] text-ink-soft">{r.sub}</span>}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#F1ECE3]" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7A1220] via-[#B3424F] to-[#D9A84C]" style={{ width: `${Math.max((r.value / max) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Btn({ children, href, variant = 'secondary', ...rest }: {
  children: ReactNode; href?: string; variant?: 'primary' | 'secondary' | 'danger'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = {
    primary: 'bg-gradient-to-br from-[#8A1414] to-[#6B0A0A] text-[#FFF6E2] border-[#6B0A0A] shadow-[inset_0_0_0_1px_rgba(233,201,119,0.5)] hover:from-[#9B2233]',
    secondary: 'bg-[#FFFDF8] text-ink border-[#E2D2B2] hover:border-[#B98A2E]',
    danger: 'bg-white text-[#8A1C1C] border-[#EDC4C4] hover:bg-[#FBEFEF]',
  }[variant]
  const base = `inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border px-3.5 text-[13.5px] font-medium transition-colors disabled:opacity-50 ${cls}`
  return href ? <Link href={href} className={base}>{children}</Link> : <button type="button" className={base} {...rest}>{children}</button>
}

export function AccountBadge({ status }: { status: string }) {
  const tone = status === 'active' ? 'good' : status === 'suspended' || status === 'pending_verification' ? 'warn' : status === 'banned' || status === 'deleted' ? 'bad' : 'neutral'
  return <Badge tone={tone}>{status.replace(/_/g, ' ')}</Badge>
}

/** Range switcher for charts: server-rendered links, ?days=… */
export function RangeTabs({ base, days, options = [7, 30, 90, 365] }: { base: string; days: number; options?: number[] }) {
  return (
    <div className="inline-flex rounded-xl border border-[#E6D7B8] bg-[#FBF5E8] p-1 text-[12.5px]" role="tablist" aria-label="Range">
      {options.map(d => (
        <Link key={d} href={`${base}?days=${d}`} role="tab" aria-selected={d === days}
          className={`rounded-lg px-2.5 py-1 font-semibold ${d === days ? 'bg-[#FFFDF8] text-[#6B0A0A] shadow-[0_0_0_1px_rgba(185,138,46,0.4)]' : 'text-ink-soft hover:text-ink'}`}>
          {d === 365 ? '1 year' : `${d} days`}
        </Link>
      ))}
    </div>
  )
}

export function parseDays(v: string | undefined, fallback = 30): number {
  const n = Number(v)
  return [7, 30, 90, 365].includes(n) ? n : fallback
}
