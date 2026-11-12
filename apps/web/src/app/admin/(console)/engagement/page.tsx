'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

/* eslint-disable @typescript-eslint/no-explicit-any */

const when = (s?: string | null) => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '—'
const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Member Engagement Manager: the 30-day welcome journey sent from the official
 * Mithila Jodi profile into members' Inboxes. Everything here is data — no
 * deployment needed to change a message, its link, the order or the send time.
 */
export default function EngagementPage() {
  const [d, setD] = useState<any>(null)
  const [err, setErr] = useState('')
  const [edit, setEdit] = useState<any>(null)
  const [preview, setPreview] = useState('')
  const [msg, setMsg] = useState('')
  const [member, setMember] = useState<any>(null)

  const load = useCallback(() => {
    fetch('/api/admin/engagement').then(r => r.json()).then(j => { if (j.ok) setD(j); else setErr(j.message ?? 'Could not load') })
  }, [])
  useEffect(() => { load() }, [load])

  async function post(body: any) {
    const r = await fetch('/api/admin/engagement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return r.json().catch(() => ({ ok: false, message: 'Failed' }))
  }
  async function save() {
    const j = await post({ op: 'save_message', ...edit, day: Number(edit.day), sort_order: Number(edit.sort_order) })
    setMsg(j.ok ? 'Saved.' : j.message); if (j.ok) { setEdit(null); setPreview(''); load() }
  }
  async function toggle(m: any) { const j = await post({ op: 'save_message', ...m, enabled: !m.enabled }); if (j.ok) load(); else setMsg(j.message) }
  async function settings(patch: any) { const j = await post({ op: 'settings', ...patch }); setMsg(j.ok ? 'Settings saved.' : j.message); if (j.ok) load() }
  async function showPreview(m: any) { const j = await post({ op: 'preview', body: m.body, feature_url: m.feature_url }); setPreview(j.text ?? '') }
  async function openMember(id: string) { const j = await fetch(`/api/admin/engagement?member=${id}`).then(r => r.json()); setMember({ id, ...j }) }
  async function retry(id: string) { const j = await post({ op: 'retry', accountId: id }); setMsg(`Retry: ${j.result?.status ?? j.message}${j.result?.detail ? ' — ' + j.result.detail : ''}`); openMember(id); load() }
  async function runNow() { const j = await post({ op: 'run' }); setMsg(j.ok ? `Run: ${JSON.stringify(j.result)}` : j.message); load() }

  if (err) return <div className="max-w-3xl"><h1 className="font-serif text-2xl text-ink mb-3">Member Engagement Manager</h1><p className="card p-4 text-sm text-error">{err}</p></div>
  if (!d) return <p className="text-sm text-ink-soft">Loading…</p>
  const s = d.stats, a = d.automation

  return (
    <div className="max-w-6xl">
      <h1 className="font-serif text-2xl text-ink mb-1">Member Engagement Manager</h1>
      <p className="text-sm text-ink-soft mb-5">Approved members get one message a day from the official Mithila Jodi profile, in their Inbox — Day 1 the moment they are approved, then daily at the send time below (India time). Automated messages are marked in the database and carry a short note at the end.</p>
      {msg && <p className="mb-4 rounded-mj border border-gold/40 bg-cream p-3 text-sm">{msg}</p>}

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {[['Enrolled', s.enrolled], ['In journey', s.active], ['Scheduled', s.scheduled], ['Sent', s.sent], ['Read', s.delivered], ['Failed', s.failed], ['Completed', s.completed]].map(([k, v]) => (
          <div key={k as string} className="card p-3"><p className="font-serif text-2xl text-maroon">{v as number}</p><p className="text-[12.5px] text-ink-soft">{k as string}</p></div>
        ))}
      </div>

      <section className="card mb-5 flex flex-wrap items-center gap-3 p-4">
        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${a.paused ? 'bg-error-soft text-error-fg' : 'bg-green/10 text-green'}`}>{a.paused ? 'Paused' : 'Running'}</span>
        <button type="button" onClick={() => settings({ paused: !a.paused })} className="rounded-mj-sm border border-gold/50 px-3 py-1.5 text-sm">{a.paused ? 'Resume' : 'Pause'} automation</button>
        <label className="text-sm">Daily send time (IST)
          <input type="time" defaultValue={`${pad(a.send_hour)}:${pad(a.send_minute)}`} onBlur={e => { const [h, m] = e.target.value.split(':').map(Number); if (h !== a.send_hour || m !== a.send_minute) settings({ send_hour: h, send_minute: m }) }} className="input ml-2 w-28 text-sm" />
        </label>
        <button type="button" onClick={runNow} className="rounded-mj-sm border border-gold/50 px-3 py-1.5 text-sm">Send due messages now</button>
        <span className="text-[13px] text-ink-soft">Instagram in messages: {d.instagram ?? '—'} · <Link href="/admin/community#social" className="text-maroon hover:underline">edit social links</Link></span>
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Messages ({d.messages.length})</h2>
          <button type="button" onClick={() => { setEdit({ day: Math.max(0, ...d.messages.map((m: any) => m.day)) + 1, sort_order: Math.max(0, ...d.messages.map((m: any) => m.sort_order)) + 1, title: '', body: 'नमस्कार {name} जी!\n\n\n\n👉 {link}\n\nMithila Jodi ❤️', feature_url: '/home', enabled: true }); setPreview('') }} className="rounded-mj-sm bg-maroon px-3 py-1.5 text-sm text-cream">Add message</button>
        </div>
        <p className="mb-2 text-[12.5px] text-ink-soft">Placeholders: {'{name}'} member’s first name · {'{link}'} the message’s link · {'{instagram_handle}'} · {'{instagram_url}'}. Order = the “order” number; disabled messages are skipped.</p>
        {edit && (
          <div className="card mb-3 space-y-2 border-2 border-gold/50 p-4">
            <div className="flex flex-wrap gap-2">
              <label className="text-sm">Day <input type="number" min={1} value={edit.day} onChange={e => setEdit({ ...edit, day: e.target.value })} className="input ml-1 w-20 text-sm" /></label>
              <label className="text-sm">Order <input type="number" value={edit.sort_order} onChange={e => setEdit({ ...edit, sort_order: e.target.value })} className="input ml-1 w-20 text-sm" /></label>
              <label className="text-sm"><input type="checkbox" checked={edit.enabled} onChange={e => setEdit({ ...edit, enabled: e.target.checked })} className="mr-1 accent-maroon" />Enabled</label>
            </div>
            <input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} placeholder="Title" maxLength={140} className="input w-full text-sm" />
            <input value={edit.feature_url ?? ''} onChange={e => setEdit({ ...edit, feature_url: e.target.value })} placeholder="/digital-profile or https://…" className="input w-full text-sm" />
            <textarea value={edit.body} onChange={e => setEdit({ ...edit, body: e.target.value })} rows={12} maxLength={3500} className="input w-full font-deva text-sm" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={save} className="rounded-mj-sm bg-maroon px-4 py-2 text-sm text-cream">Save</button>
              <button type="button" onClick={() => showPreview(edit)} className="rounded-mj-sm border border-gold/50 px-4 py-2 text-sm">Preview</button>
              <button type="button" onClick={() => { setEdit(null); setPreview('') }} className="px-4 py-2 text-sm text-ink-soft">Cancel</button>
            </div>
            {preview && <pre className="whitespace-pre-wrap rounded-mj bg-paper p-3 font-deva text-[13.5px]">{preview}</pre>}
          </div>
        )}
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-paper-3 text-left text-ink-soft"><th className="p-2">Day</th><th className="p-2">Order</th><th className="p-2">Title</th><th className="p-2">Link</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
            <tbody>
              {d.messages.map((m: any) => (
                <tr key={m.id} className={`border-b border-paper-3 ${m.enabled ? '' : 'opacity-50'}`}>
                  <td className="p-2">{m.day}</td><td className="p-2">{m.sort_order}</td>
                  <td className="p-2 font-deva">{m.title}</td>
                  <td className="p-2"><a href={m.feature_url ?? '#'} target="_blank" rel="noreferrer" className="text-maroon hover:underline">{m.feature_url}</a></td>
                  <td className="p-2">{m.enabled ? 'On' : 'Off'}</td>
                  <td className="p-2 whitespace-nowrap">
                    <button type="button" onClick={() => { setEdit({ ...m }); setPreview('') }} className="mr-2 text-maroon hover:underline">Edit</button>
                    <button type="button" onClick={() => showPreview(m)} className="mr-2 text-maroon hover:underline">Preview</button>
                    <button type="button" onClick={() => toggle(m)} className="text-ink-soft hover:underline">{m.enabled ? 'Disable' : 'Enable'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview && !edit && <pre className="card mt-3 whitespace-pre-wrap p-4 font-deva text-[13.5px]">{preview}</pre>}
      </section>

      <section>
        <h2 className="mb-2 font-serif text-lg text-ink">Members in the journey (latest 50)</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-paper-3 text-left text-ink-soft"><th className="p-2">Member</th><th className="p-2">Started</th><th className="p-2">Sent</th><th className="p-2">Next</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
            <tbody>
              {d.members.length === 0 && <tr><td colSpan={6} className="p-3 text-ink-soft">No one yet — members join when you approve them.</td></tr>}
              {d.members.map((m: any) => (
                <tr key={m.account_id} className="border-b border-paper-3">
                  <td className="p-2">{m.name}</td><td className="p-2">{when(m.sequence_started_at)}</td><td className="p-2">{m.current_day}</td>
                  <td className="p-2">{when(m.next_scheduled_at)}</td><td className="p-2">{m.status}{m.stop_reason ? ` (${m.stop_reason})` : ''}</td>
                  <td className="p-2 whitespace-nowrap"><button type="button" onClick={() => openMember(m.account_id)} className="mr-2 text-maroon hover:underline">History</button><button type="button" onClick={() => retry(m.account_id)} className="text-maroon hover:underline">Send next / retry</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {member && (
          <div className="card mt-3 p-4">
            <div className="mb-2 flex justify-between"><h3 className="font-semibold">Delivery history</h3><button type="button" onClick={() => setMember(null)} className="text-sm text-ink-soft">Close</button></div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink-soft"><th className="p-1">Day</th><th className="p-1">Status</th><th className="p-1">Sent</th><th className="p-1">Read</th><th className="p-1">Attempts</th><th className="p-1">Error</th></tr></thead>
              <tbody>{(member.log ?? []).map((l: any) => <tr key={l.message_day}><td className="p-1">{l.message_day}</td><td className="p-1">{l.delivery_status}</td><td className="p-1">{when(l.sent_at)}</td><td className="p-1">{when(l.read_at)}</td><td className="p-1">{l.attempts}</td><td className="p-1 text-error">{l.error_details ?? ''}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
