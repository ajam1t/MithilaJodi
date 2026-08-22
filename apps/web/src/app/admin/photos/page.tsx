'use client'

import { useState, useEffect, useCallback } from 'react'

type StatusFilter = 'pending_moderation' | 'approved' | 'rejected'

type Photo = {
  id: string
  profile_id: string
  profile_name: string | null
  profile_mobile: string | null
  is_primary: boolean
  photo_url: string | null
  created_at: string
  status: string
  moderation_note: string | null
}

const TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Pending',  value: 'pending_moderation' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function AdminPhotosPage() {
  const [filter, setFilter] = useState<StatusFilter>('pending_moderation')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [reason, setReason] = useState<Record<string, string>>({})

  const load = useCallback((status: StatusFilter) => {
    setLoading(true)
    fetch(`/api/admin/photos?status=${status}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setPhotos(j.photos) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  async function act(photoId: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !reason[photoId]?.trim()) return
    setBusy(photoId)
    const res = await fetch(`/api/admin/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: reason[photoId] }),
    })
    const json = await res.json()
    if (json.ok) {
      setPhotos(p => p.filter(x => x.id !== photoId))
    }
    setBusy(null)
  }

  async function deletePhoto(photoId: string) {
    if (!window.confirm('Permanently delete this photo?')) return
    setBusy(photoId)
    const res = await fetch(`/api/admin/photos/${photoId}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) setPhotos(p => p.filter(x => x.id !== photoId))
    setBusy(null)
  }

  const isPending = filter === 'pending_moderation'

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-serif text-2xl text-ink mb-6">Photo Moderation</h1>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-paper-3">
        {TABS.map(tab => (
          <button key={tab.value} type="button"
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${filter === tab.value
                ? 'border-maroon text-maroon'
                : 'border-transparent text-ink-soft hover:text-ink'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : photos.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">
          No {filter === 'pending_moderation' ? 'pending' : filter} photos.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {photos.map(photo => (
            <div key={photo.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-ink">{photo.profile_name ?? '—'}</p>
                  <p className="text-xs text-ink-soft font-mono">{photo.profile_mobile ?? ''}</p>
                  <p className="text-xs text-ink-soft">
                    {photo.is_primary ? 'Primary · ' : ''}
                    {new Date(photo.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${photo.status === 'approved' ? 'bg-green-100 text-green-700' :
                    photo.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'}`}>
                  {photo.status === 'pending_moderation' ? 'Pending' :
                   photo.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              </div>

              {photo.photo_url ? (
                <div className="w-full aspect-[4/5] overflow-hidden rounded-mj-sm bg-paper-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.photo_url} alt="Pending photo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-[4/5] bg-paper-3 rounded-mj-sm flex items-center justify-center text-ink-soft text-xs">
                  URL expired — reload to view
                </div>
              )}

              {photo.moderation_note && !isPending && (
                <p className="text-xs text-ink-soft bg-paper-3 rounded px-2 py-1.5 italic">
                  Note: {photo.moderation_note}
                </p>
              )}

              {isPending && (
                <>
                  <input
                    type="text"
                    placeholder="Rejection reason (required if rejecting)"
                    value={reason[photo.id] ?? ''}
                    onChange={e => setReason(r => ({ ...r, [photo.id]: e.target.value }))}
                    className="w-full text-xs border border-paper-3 rounded-mj-sm px-3 py-2 focus:outline-none focus:border-maroon/50"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => act(photo.id, 'approve')}
                      disabled={busy === photo.id}
                      className="btn-primary text-xs py-1.5 px-3 flex-1 justify-center disabled:opacity-60">
                      Approve
                    </button>
                    <button type="button" onClick={() => act(photo.id, 'reject')}
                      disabled={busy === photo.id || !reason[photo.id]?.trim()}
                      className="btn-ghost text-xs py-1.5 px-3 flex-1 justify-center disabled:opacity-60 text-red-600 border-red-200 hover:bg-red-50">
                      Reject
                    </button>
                  </div>
                </>
              )}

              <button type="button" onClick={() => deletePhoto(photo.id)}
                disabled={busy === photo.id}
                className="w-full text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60">
                Delete photo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
