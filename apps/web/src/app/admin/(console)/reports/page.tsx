'use client'

import { useState, useEffect } from 'react'

type Report = {
  id: string
  reason: string
  notes: string | null
  status: string
  review_notes: string | null
  created_at: string
  reporter: { id: string; name: string }
  reported: { id: string; name: string }
}

const STATUS_TABS = ['open', 'under_review', 'actioned', 'dismissed'] as const

export default function AdminReportsPage() {
  const [tab, setTab] = useState<typeof STATUS_TABS[number]>('open')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports?status=${tab}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setReports(j.reports) })
      .finally(() => setLoading(false))
  }, [tab])

  async function update(reportId: string, status: string) {
    setBusy(reportId)
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, review_notes: notes[reportId] }),
    })
    const json = await res.json()
    if (json.ok) setReports(r => r.filter(x => x.id !== reportId))
    setBusy(null)
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="font-serif text-2xl text-ink mb-5">Reports</h1>

      <div className="flex border-b border-paper-3 mb-5">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${
              tab === s ? 'border-maroon text-maroon' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No {tab.replace('_', ' ')} reports.</div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs bg-maroon/10 text-maroon px-2 py-0.5 rounded-full capitalize font-medium">
                    {r.reason.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-ink mt-1">
                    <span className="font-medium">{r.reporter.name}</span>
                    <span className="text-ink-soft"> reported </span>
                    <span className="font-medium">{r.reported.name}</span>
                  </p>
                  {r.notes && <p className="text-xs text-ink-soft mt-1">{r.notes}</p>}
                  <p className="text-xs text-ink-soft mt-1">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {tab === 'open' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Review notes"
                    value={notes[r.id] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                    className="w-full text-xs border border-paper-3 rounded-mj-sm px-3 py-1.5 focus:outline-none focus:border-maroon/50"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => update(r.id, 'under_review')}
                      disabled={busy === r.id}
                      className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-60"
                    >
                      Mark Under Review
                    </button>
                    <button
                      type="button"
                      onClick={() => update(r.id, 'actioned')}
                      disabled={busy === r.id}
                      className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
                    >
                      Action
                    </button>
                    <button
                      type="button"
                      onClick={() => update(r.id, 'dismissed')}
                      disabled={busy === r.id}
                      className="text-xs py-1.5 px-3 text-ink-soft hover:text-ink disabled:opacity-60"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {tab === 'under_review' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => update(r.id, 'actioned')} disabled={busy === r.id} className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60">Action</button>
                  <button type="button" onClick={() => update(r.id, 'dismissed')} disabled={busy === r.id} className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-60">Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
