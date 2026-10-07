'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

async function save(key: string, value: Record<string, unknown>) {
  const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.ok) throw new Error(json.message ?? 'Could not save. Nothing was changed.')
}

const input = 'mt-1 block w-full rounded-lg border border-[#DDD3C2] bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-maroon disabled:bg-[#FAF7F2]'
const primary = 'rounded-lg bg-maroon px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50'
const secondary = 'rounded-lg border border-[#DDD3C2] bg-white px-4 py-2 text-[13.5px] font-medium text-ink hover:border-[#BFAF95]'

function Note({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null
  return <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-[13px] ${msg.ok ? 'bg-[#E7F0E9] text-[#1B4A2E]' : 'bg-[#FBEFEF] text-[#8A1C1C]'}`}>{msg.text}</p>
}

export function WhatsAppForm({ url, enabled, canEdit }: { url: string; enabled: boolean; canEdit: boolean }) {
  const router = useRouter()
  const [value, setValue] = useState(url)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(next: { url: string; enabled: boolean }, done: string) {
    setBusy(true); setMsg(null)
    try { await save('whatsapp_community', next); setMsg({ ok: true, text: done }); setEditing(false); router.refresh() }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }) }
    finally { setBusy(false) }
  }

  return (
    <div>
      <label htmlFor="wa-url" className="text-[13px] font-medium text-ink">Community invite link</label>
      <input id="wa-url" value={value} onChange={e => setValue(e.target.value)} disabled={!editing} className={input} spellCheck={false} />
      <div className="mt-3 flex flex-wrap gap-2">
        {!editing ? (
          <button type="button" className={secondary} disabled={!canEdit} onClick={() => setEditing(true)}>Edit</button>
        ) : (
          <>
            <button type="button" className={primary} disabled={busy} onClick={() => submit({ url: value, enabled }, 'Saved. The website now sends people to the new link — no deployment needed.')}>Save</button>
            <button type="button" className={secondary} onClick={() => { setValue(url); setEditing(false) }}>Cancel</button>
          </>
        )}
        <a href={value} target="_blank" rel="noopener noreferrer" className={secondary}>Test link ↗</a>
        <button type="button" className={secondary} disabled={!canEdit || busy}
          onClick={() => submit({ url, enabled: !enabled }, enabled ? 'Disabled. Join buttons now open the Contact page.' : 'Enabled. Join buttons open the community again.')}>
          {enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
      {!canEdit && <p className="mt-2 text-[12px] text-ink-soft">Your role can view but not change this link.</p>}
      <Note msg={msg} />
    </div>
  )
}

export function SocialLinksForm({ links, canEdit }: { links: { instagram: string; youtube: string }; canEdit: boolean }) {
  const router = useRouter()
  const [v, setV] = useState(links)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form onSubmit={async e => {
      e.preventDefault(); setBusy(true); setMsg(null)
      try { await save('social_links', v); setMsg({ ok: true, text: 'Saved. Footer and menu links use the new addresses now.' }); router.refresh() }
      catch (err) { setMsg({ ok: false, text: (err as Error).message }) }
      finally { setBusy(false) }
    }}>
      {(['instagram', 'youtube'] as const).map(k => (
        <div key={k} className="mb-3">
          <label htmlFor={`s-${k}`} className="text-[13px] font-medium capitalize text-ink">{k === 'youtube' ? 'YouTube' : 'Instagram'}</label>
          <div className="flex gap-2">
            <input id={`s-${k}`} value={v[k]} onChange={e => setV({ ...v, [k]: e.target.value })} disabled={!canEdit} className={input} spellCheck={false} />
            <a href={v[k]} target="_blank" rel="noopener noreferrer" className={`${secondary} mt-1 shrink-0`}>Test ↗</a>
          </div>
        </div>
      ))}
      <button type="submit" className={primary} disabled={!canEdit || busy}>{busy ? 'Saving…' : 'Save social links'}</button>
      <Note msg={msg} />
    </form>
  )
}

export function LimitsForm({ limits, canEdit }: { limits: { db_gb: number | null; storage_gb: number | null; plan: string | null }; canEdit: boolean }) {
  const router = useRouter()
  const [v, setV] = useState({ plan: limits.plan ?? '', db_gb: limits.db_gb?.toString() ?? '', storage_gb: limits.storage_gb?.toString() ?? '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form onSubmit={async e => {
      e.preventDefault(); setBusy(true); setMsg(null)
      try { await save('platform_limits', v); setMsg({ ok: true, text: 'Saved. Remaining capacity now appears on the Supabase page.' }); router.refresh() }
      catch (err) { setMsg({ ok: false, text: (err as Error).message }) }
      finally { setBusy(false) }
    }} className="grid gap-3 sm:grid-cols-3">
      <div><label htmlFor="l-plan" className="text-[13px] font-medium">Plan name</label><input id="l-plan" value={v.plan} onChange={e => setV({ ...v, plan: e.target.value })} disabled={!canEdit} placeholder="e.g. Free, Pro" className={input} /></div>
      <div><label htmlFor="l-db" className="text-[13px] font-medium">Database limit (GB)</label><input id="l-db" inputMode="decimal" value={v.db_gb} onChange={e => setV({ ...v, db_gb: e.target.value })} disabled={!canEdit} className={input} /></div>
      <div><label htmlFor="l-st" className="text-[13px] font-medium">File storage limit (GB)</label><input id="l-st" inputMode="decimal" value={v.storage_gb} onChange={e => setV({ ...v, storage_gb: e.target.value })} disabled={!canEdit} className={input} /></div>
      <div className="sm:col-span-3"><button type="submit" className={primary} disabled={!canEdit || busy}>{busy ? 'Saving…' : 'Save limits'}</button><Note msg={msg} /></div>
    </form>
  )
}
