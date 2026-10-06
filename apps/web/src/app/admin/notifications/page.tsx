'use client'

import { useEffect, useState } from 'react'

type Campaign = {
  id: string
  title: string
  message: string
  cta_label: string | null
  cta_url: string | null
  audience: string
  is_active: boolean
  expires_at: string | null
  delivered_count: number
  created_at: string
}

type Option = { value: string; label: string }

const AUDIENCE_LABEL: Record<string, string> = {
  all: 'All members',
  male: 'Male members',
  female: 'Female members',
  incomplete: 'Members with incomplete profiles',
  condition: 'Members matching a condition',
  specific: 'Specific member(s)',
}

const EMPTY = {
  title: '', message: '', cta_label: '', cta_url: '', audience: 'all', expires_at: '',
  profile_ids: '', gender: '', caste: '', marital_status: '', joined_within_days: '', complete_below: '',
}

/**
 * Admin announcements. Each one lands in members' Notifications as an
 * "Announcement". Preview the audience size before sending; turning one off
 * removes it from everyone's list at once.
 */
export default function AdminNotificationsPage() {
  const [form, setForm] = useState(EMPTY)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [castes, setCastes] = useState<Option[]>([])
  const [statuses, setStatuses] = useState<Option[]>([])
  const [audienceSize, setAudienceSize] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    const j = await fetch('/api/admin/notifications').then(r => r.json()).catch(() => null)
    if (j?.ok) setCampaigns(j.campaigns)
  }

  useEffect(() => {
    void load()
    fetch('/api/options?types=caste,marital_status').then(r => r.json()).then(j => {
      if (j?.ok) { setCastes(j.options.caste ?? []); setStatuses(j.options.marital_status ?? []) }
    }).catch(() => null)
  }, [])

  const set = (k: keyof typeof EMPTY, v: string) => { setForm(f => ({ ...f, [k]: v })); setAudienceSize(null) }

  function payload(preview: boolean) {
    return {
      preview,
      title: form.title, message: form.message,
      cta_label: form.cta_label || null, cta_url: form.cta_url || null,
      audience: form.audience,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      profile_ids: form.profile_ids,
      condition: {
        gender: form.gender || undefined, caste: form.caste || undefined, marital_status: form.marital_status || undefined,
        joined_within_days: form.joined_within_days || undefined, complete_below: form.complete_below || undefined,
      },
    }
  }

  async function submit(preview: boolean) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(preview)),
      })
      const j = await res.json()
      if (!j.ok) { setMsg({ ok: false, text: j.message ?? 'Something went wrong.' }); return }
      if (preview) { setAudienceSize(j.audience_size); return }
      setMsg({ ok: true, text: `Sent to ${j.delivered} member${j.delivered === 1 ? '' : 's'}.` })
      setForm(EMPTY)
      setAudienceSize(null)
      void load()
    } finally {
      setBusy(false)
    }
  }

  async function toggle(c: Campaign) {
    await fetch(`/api/admin/notifications/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    void load()
  }

  const input = 'input py-2 text-sm'
  const ready = form.title.trim() && form.message.trim()

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-ink-soft">Send an announcement to members&rsquo; Notifications. Admins only.</p>
      </div>

      <section className="card space-y-4 p-5">
        <div>
          <label className="field-label">Title</label>
          <input className={input} maxLength={120} value={form.title} onChange={e => set('title', e.target.value)} placeholder="New members are joining Mithila Jodi ❤️" />
        </div>
        <div>
          <label className="field-label">Message</label>
          <textarea className={`${input} min-h-[80px]`} maxLength={500} value={form.message} onChange={e => set('message', e.target.value)}
            placeholder="Discover new profiles and find someone who shares your values and Mithila roots." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Button label (optional)</label>
            <input className={input} maxLength={40} value={form.cta_label} onChange={e => set('cta_label', e.target.value)} placeholder="Explore Profiles" />
          </div>
          <div>
            <label className="field-label">Button destination</label>
            <input className={input} value={form.cta_url} onChange={e => set('cta_url', e.target.value)} placeholder="/search" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Audience</label>
            <select className="select py-2 text-sm" value={form.audience} onChange={e => set('audience', e.target.value)}>
              {Object.entries(AUDIENCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Expires (optional)</label>
            <input type="datetime-local" className={input} value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
          </div>
        </div>

        {form.audience === 'specific' && (
          <div>
            <label className="field-label">Profile IDs</label>
            <textarea className={`${input} min-h-[64px] font-mono text-xs`} value={form.profile_ids} onChange={e => set('profile_ids', e.target.value)}
              placeholder="Profile IDs (from Admin → Profiles), separated by commas or new lines" />
          </div>
        )}

        {form.audience === 'condition' && (
          <div className="grid gap-3 rounded-mj-sm border border-gold/30 bg-paper p-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Gender</label>
              <select className="select py-2 text-sm" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Any</option><option value="male">Male</option><option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="field-label">Community</label>
              <select className="select py-2 text-sm" value={form.caste} onChange={e => set('caste', e.target.value)}>
                <option value="">Any</option>
                {castes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Marital status</label>
              <select className="select py-2 text-sm" value={form.marital_status} onChange={e => set('marital_status', e.target.value)}>
                <option value="">Any</option>
                {statuses.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Joined within (days)</label>
              <input type="number" min={1} className={input} value={form.joined_within_days} onChange={e => set('joined_within_days', e.target.value)} placeholder="e.g. 30" />
            </div>
            <div>
              <label className="field-label">Profile completeness below (%)</label>
              <input type="number" min={1} max={100} className={input} value={form.complete_below} onChange={e => set('complete_below', e.target.value)} placeholder="e.g. 80" />
            </div>
          </div>
        )}

        {msg && <p className={`text-sm ${msg.ok ? 'text-green' : 'text-error-fg'}`}>{msg.text}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy || !ready} onClick={() => submit(true)} className="btn-ghost px-4 py-2 text-sm disabled:opacity-50">
            Preview audience
          </button>
          {audienceSize !== null && (
            <span className="text-sm text-ink">Reaches <strong>{audienceSize}</strong> member{audienceSize === 1 ? '' : 's'}</span>
          )}
          <button
            type="button"
            disabled={busy || !ready || !audienceSize}
            onClick={() => submit(false)}
            className="btn-primary ml-auto px-5 py-2 text-sm disabled:opacity-50"
            title={audienceSize ? undefined : 'Preview the audience first'}
          >
            Send announcement
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg text-ink">Sent announcements</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-ink-soft">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map(c => (
              <li key={c.id} className="card flex items-start gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{c.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{c.message}</p>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    {AUDIENCE_LABEL[c.audience] ?? c.audience} · {c.delivered_count} delivered · {new Date(c.created_at).toLocaleString('en-IN')}
                    {c.cta_label && <> · Button: {c.cta_label} → {c.cta_url}</>}
                    {c.expires_at && <> · Expires {new Date(c.expires_at).toLocaleString('en-IN')}</>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(c)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${c.is_active ? 'border-green/30 text-green' : 'border-ink/20 text-ink-soft'}`}
                >
                  {c.is_active ? 'Active — turn off' : 'Off — turn on'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
