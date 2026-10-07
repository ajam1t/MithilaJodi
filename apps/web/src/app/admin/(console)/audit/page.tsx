'use client'

import { useState, useEffect, useCallback } from 'react'

type LogEntry = {
  id: number
  action: string
  target_type: string | null
  target_id: string | null
  payload: Record<string, unknown> | null
  created_at: string
  actor_mobile: string | null
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback((p: number) => {
    setLoading(true)
    fetch(`/api/admin/audit?page=${p}`)
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          setLogs(prev => p === 0 ? j.logs : [...prev, ...j.logs])
          setHasMore(j.logs.length === 30)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(0) }, [load])

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="font-serif text-2xl text-ink mb-6">Audit Log</h1>

      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="card px-4 py-3 flex items-start gap-4 text-sm">
            <div className="text-xs text-ink-soft shrink-0 w-32">
              {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-ink">{log.action.replace(/_/g, ' ')}</span>
              {log.target_type && (
                <span className="text-ink-soft ml-2 text-xs">
                  on {log.target_type}
                  {log.target_id && ` ${log.target_id.slice(0, 8)}…`}
                </span>
              )}
              {log.payload && Object.keys(log.payload).length > 0 && (
                <p className="text-xs text-ink-soft mt-0.5 truncate">
                  {JSON.stringify(log.payload).slice(0, 120)}
                </p>
              )}
            </div>
            <div className="text-xs text-ink-soft shrink-0">{log.actor_mobile ?? '—'}</div>
          </div>
        ))}

        {loading && (
          <div className="text-center py-4 text-ink-soft text-sm animate-pulse">Loading…</div>
        )}

        {!loading && hasMore && (
          <div className="text-center py-4">
            <button
              type="button"
              onClick={() => { const next = page + 1; setPage(next); load(next) }}
              className="btn-ghost text-sm py-2 px-4"
            >
              Load more
            </button>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="card p-8 text-center text-ink-soft text-sm">No audit log entries.</div>
        )}
      </div>
    </div>
  )
}
