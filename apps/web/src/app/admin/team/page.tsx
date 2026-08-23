'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

type Member = {
  id: string
  display_name: string
  role: string
  bio: string | null
  responsibilities: string[]
  photo_storage_path: string | null
  display_order: number
  is_enabled: boolean
}

type EditDraft = {
  display_name: string
  role: string
  bio: string
  responsibilities: string
}

const BLANK: EditDraft = { display_name: '', role: '', bio: '', responsibilities: '' }

function photoUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !base) return null
  return `${base}/storage/v1/object/public/team-photos/${path}`
}

function initials(name: string): string {
  const caps = name.split(/\s+/).filter(w => /^[A-Z]/.test(w))
  if (caps.length >= 2) return (caps[0][0] + caps[1][0]).toUpperCase()
  if (caps.length === 1) return caps[0][0].toUpperCase()
  return name[0]?.toUpperCase() ?? '?'
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState<EditDraft>(BLANK)

  // Edit state: memberId → draft
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft>(BLANK)
  const [saving, setSaving] = useState(false)

  // Photo upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(j => {
        if (j.ok) setMembers(j.members as Member[])
        else setError('Failed to load team members.')
      })
      .catch(() => setError('Failed to load team members.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // ── Create ──────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: createDraft.display_name,
          role: createDraft.role,
          bio: createDraft.bio || null,
          responsibilities: createDraft.responsibilities
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean),
          display_order: members.length + 1,
        }),
      })
      const j = await res.json()
      if (j.ok) {
        setCreateDraft(BLANK)
        setShowCreate(false)
        load()
      } else {
        setError(j.message ?? 'Failed to create member.')
      }
    } catch {
      setError('Failed to create member.')
    } finally {
      setCreating(false)
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────
  function startEdit(m: Member) {
    setEditId(m.id)
    setEditDraft({
      display_name: m.display_name,
      role: m.role,
      bio: m.bio ?? '',
      responsibilities: m.responsibilities.join('\n'),
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editDraft.display_name,
          role: editDraft.role,
          bio: editDraft.bio || null,
          responsibilities: editDraft.responsibilities
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean),
        }),
      })
      const j = await res.json()
      if (j.ok) { setEditId(null); load() }
      else setError(j.message ?? 'Save failed.')
    } catch {
      setError('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle enable/disable ────────────────────────────────────────────────
  async function toggleEnabled(m: Member) {
    setBusy(m.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/team/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !m.is_enabled }),
      })
      const j = await res.json()
      if (j.ok) setMembers(ms => ms.map(x => x.id === m.id ? { ...x, is_enabled: !x.is_enabled } : x))
      else setError('Could not toggle visibility.')
    } catch {
      setError('Could not toggle visibility.')
    } finally {
      setBusy(null)
    }
  }

  // ── Reorder ──────────────────────────────────────────────────────────────
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= members.length) return
    const a = members[index]
    const b = members[target]
    setBusy(a.id)
    setError(null)
    try {
      await Promise.all([
        fetch(`/api/admin/team/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_order: b.display_order }) }),
        fetch(`/api/admin/team/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_order: a.display_order }) }),
      ])
      setMembers(ms => {
        const next = [...ms]
        next[index] = { ...a, display_order: b.display_order }
        next[target] = { ...b, display_order: a.display_order }
        return next.sort((x, y) => x.display_order - y.display_order)
      })
    } catch {
      setError('Could not reorder.')
    } finally {
      setBusy(null)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from the team?`)) return
    setBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' })
      const j = await res.json()
      if (j.ok) setMembers(ms => ms.filter(m => m.id !== id))
      else setError(j.message ?? 'Failed to delete.')
    } catch {
      setError('Failed to delete.')
    } finally {
      setBusy(null)
    }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────
  async function handlePhotoChange(memberId: string, file: File) {
    setUploadingFor(memberId)
    setError(null)
    try {
      const form = new FormData()
      form.append('photo', file)
      const res = await fetch(`/api/admin/team/${memberId}/photo`, { method: 'POST', body: form })
      const j = await res.json()
      if (j.ok) {
        setMembers(ms => ms.map(m => m.id === memberId ? { ...m, photo_storage_path: j.photo_path as string } : m))
      } else {
        setError(j.message ?? 'Upload failed.')
      }
    } catch {
      setError('Upload failed.')
    } finally {
      setUploadingFor(null)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-1 gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-ink">Team Members</h1>
          <p className="text-sm text-ink-soft mt-0.5">Shown on the About page. Photos must be uploaded here.</p>
        </div>
        <button
          onClick={() => { setShowCreate(v => !v); setCreateDraft(BLANK) }}
          className="shrink-0 text-sm py-2 px-4 bg-maroon text-cream rounded-mj-sm hover:bg-maroon-deep"
        >
          {showCreate ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {error && (
        <div className="my-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-mj-sm px-3 py-2">{error}</div>
      )}

      {/* ── Create form ── */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card p-5 mb-6 space-y-3">
          <h2 className="font-serif text-base text-ink">New team member</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-soft font-medium">Full name *</span>
              <input
                required
                value={createDraft.display_name}
                onChange={e => setCreateDraft(d => ({ ...d, display_name: e.target.value }))}
                className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
                placeholder="Firstname Lastname"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-soft font-medium">Role *</span>
              <input
                required
                value={createDraft.role}
                onChange={e => setCreateDraft(d => ({ ...d, role: e.target.value }))}
                className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
                placeholder="Head of Technology"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-soft font-medium">Short bio</span>
            <textarea
              rows={2}
              value={createDraft.bio}
              onChange={e => setCreateDraft(d => ({ ...d, bio: e.target.value }))}
              className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
              placeholder="One or two sentences about this person's role."
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-soft font-medium">Responsibilities (one per line)</span>
            <textarea
              rows={4}
              value={createDraft.responsibilities}
              onChange={e => setCreateDraft(d => ({ ...d, responsibilities: e.target.value }))}
              className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
              placeholder={"Technology strategy\nWebsite development\nSecurity"}
            />
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="text-sm py-2 px-5 bg-maroon text-cream rounded-mj-sm hover:bg-maroon-deep disabled:opacity-60"
            >
              {creating ? 'Adding…' : 'Add Member'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-sm py-2 px-4 border border-ink/20 text-ink-soft rounded-mj-sm hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Member list ── */}
      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : members.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">No team members yet.</div>
      ) : (
        <div className="space-y-4">
          {members.map((m, i) => {
            const url = photoUrl(m.photo_storage_path)
            const ini = initials(m.display_name)
            const isEditing = editId === m.id
            return (
              <div key={m.id} className={['card p-4', !m.is_enabled ? 'opacity-60' : ''].join(' ')}>
                {isEditing ? (
                  /* ── Inline edit form ── */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-ink-soft font-medium">Full name *</span>
                        <input
                          value={editDraft.display_name}
                          onChange={e => setEditDraft(d => ({ ...d, display_name: e.target.value }))}
                          className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-ink-soft font-medium">Role *</span>
                        <input
                          value={editDraft.role}
                          onChange={e => setEditDraft(d => ({ ...d, role: e.target.value }))}
                          className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
                        />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-ink-soft font-medium">Short bio</span>
                      <textarea
                        rows={2}
                        value={editDraft.bio}
                        onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
                        className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-ink-soft font-medium">Responsibilities (one per line)</span>
                      <textarea
                        rows={4}
                        value={editDraft.responsibilities}
                        onChange={e => setEditDraft(d => ({ ...d, responsibilities: e.target.value }))}
                        className="border border-ink/20 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(m.id)}
                        disabled={saving}
                        className="text-sm py-2 px-5 bg-maroon text-cream rounded-mj-sm hover:bg-maroon-deep disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-sm py-2 px-4 border border-ink/20 text-ink-soft rounded-mj-sm hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Member row ── */
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0 w-12 h-12 rounded-full ring-2 ring-gold ring-offset-1 overflow-hidden bg-maroon flex items-center justify-center">
                      {url ? (
                        <Image src={url} alt={m.display_name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <span className="font-serif text-gold text-sm font-bold select-none">{ini}</span>
                      )}
                      {uploadingFor === m.id && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-[10px]">…</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm leading-tight">{m.display_name}</p>
                      <p className="text-xs text-ink-soft">{m.role}</p>
                      {!m.is_enabled && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Hidden</span>}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <button onClick={() => move(i, -1)} disabled={i === 0 || !!busy} aria-label="Move up"
                        className="text-xs py-1 px-2 border border-ink/20 text-ink rounded hover:bg-cream disabled:opacity-40">↑</button>
                      <button onClick={() => move(i, 1)} disabled={i === members.length - 1 || !!busy} aria-label="Move down"
                        className="text-xs py-1 px-2 border border-ink/20 text-ink rounded hover:bg-cream disabled:opacity-40">↓</button>

                      {/* Photo upload */}
                      <button
                        onClick={() => { fileRef.current && (fileRef.current.dataset.target = m.id); fileRef.current?.click() }}
                        disabled={uploadingFor === m.id}
                        className="text-xs py-1.5 px-3 border border-ink/20 text-ink-soft rounded-mj-sm hover:bg-cream disabled:opacity-60"
                      >
                        {m.photo_storage_path ? 'Replace photo' : 'Upload photo'}
                      </button>

                      <button onClick={() => startEdit(m)}
                        className="text-xs py-1.5 px-3 border border-ink/20 text-ink-soft rounded-mj-sm hover:bg-cream">
                        Edit
                      </button>

                      <button
                        onClick={() => toggleEnabled(m)}
                        disabled={busy === m.id}
                        className={['text-xs py-1.5 px-3 border rounded-mj-sm disabled:opacity-60',
                          m.is_enabled
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-ink/20 text-ink-soft hover:bg-cream',
                        ].join(' ')}
                      >
                        {m.is_enabled ? 'Visible' : 'Hidden'}
                      </button>

                      <button
                        onClick={() => handleDelete(m.id, m.display_name)}
                        disabled={busy === m.id}
                        className="text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hidden file input shared across all upload buttons */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          const targetId = e.target.dataset.target
          if (file && targetId) handlePhotoChange(targetId, file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
