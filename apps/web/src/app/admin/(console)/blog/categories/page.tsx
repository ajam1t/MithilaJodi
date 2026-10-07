'use client'

import { useState, useEffect, useCallback } from 'react'

type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
  sort_order: number
  is_active: boolean
  post_count: number
}

type EditDraft = {
  name: string
  slug: string
  description: string
  seo_title: string
  seo_description: string
  sort_order: string
  is_active: boolean
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

const emptyDraft = (): EditDraft => ({
  name: '',
  slug: '',
  description: '',
  seo_title: '',
  seo_description: '',
  sort_order: '0',
  is_active: true,
})

export default function AdminBlogCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New category form
  const [showNewForm, setShowNewForm] = useState(false)
  const [newDraft, setNewDraft] = useState<EditDraft>(emptyDraft())
  const [saving, setSaving] = useState(false)

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft>(emptyDraft())
  const [editSaving, setEditSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/admin/blog/categories')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setCategories(j.categories as Category[])
        else setError('Failed to load categories.')
      })
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function flash(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  async function createCategory() {
    if (!newDraft.name.trim()) { setError('Name is required.'); return }
    if (!newDraft.slug.trim()) { setError('Slug is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDraft.name.trim(),
          slug: newDraft.slug.trim(),
          description: newDraft.description || null,
          seo_title: newDraft.seo_title || null,
          seo_description: newDraft.seo_description || null,
          sort_order: parseInt(newDraft.sort_order, 10) || 0,
          is_active: newDraft.is_active,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setNewDraft(emptyDraft())
        setShowNewForm(false)
        load()
        flash('Category created.')
      } else {
        setError(json.message ?? 'Failed to create category.')
      }
    } catch {
      setError('Failed to create category.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditDraft({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      seo_title: cat.seo_title ?? '',
      seo_description: cat.seo_description ?? '',
      sort_order: String(cat.sort_order),
      is_active: cat.is_active,
    })
  }

  async function saveEdit(id: number) {
    if (!editDraft.name.trim()) { setError('Name is required.'); return }
    if (!editDraft.slug.trim()) { setError('Slug is required.'); return }
    setEditSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/blog/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          slug: editDraft.slug.trim(),
          description: editDraft.description || null,
          seo_title: editDraft.seo_title || null,
          seo_description: editDraft.seo_description || null,
          sort_order: parseInt(editDraft.sort_order, 10) || 0,
          is_active: editDraft.is_active,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setEditingId(null)
        load()
        flash('Category updated.')
      } else {
        setError(json.message ?? 'Failed to update category.')
      }
    } catch {
      setError('Failed to update category.')
    } finally {
      setEditSaving(false)
    }
  }

  async function toggleActive(cat: Category) {
    setTogglingId(cat.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/blog/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !cat.is_active }),
      })
      const json = await res.json()
      if (json.ok) {
        setCategories((cs) => cs.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      } else {
        setError(json.message ?? 'Failed to update.')
      }
    } catch {
      setError('Failed to update.')
    } finally {
      setTogglingId(null)
    }
  }

  async function deleteCategory(cat: Category) {
    if (cat.post_count > 0) {
      setError(`Cannot delete "${cat.name}": it has ${cat.post_count} post(s) assigned to it.`)
      return
    }
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return
    setDeletingId(cat.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/blog/categories/${cat.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        setCategories((cs) => cs.filter((c) => c.id !== cat.id))
        flash('Category deleted.')
      } else {
        setError(json.message ?? 'Failed to delete category.')
      }
    } catch {
      setError('Failed to delete category.')
    } finally {
      setDeletingId(null)
    }
  }

  function DraftForm({
    draft,
    onChange,
    onSubmit,
    onCancel,
    submitting,
    submitLabel,
  }: {
    draft: EditDraft
    onChange: (patch: Partial<EditDraft>) => void
    onSubmit: () => void
    onCancel: () => void
    submitting: boolean
    submitLabel: string
  }) {
    return (
      <div className="grid sm:grid-cols-2 gap-3 p-3 bg-cream rounded-mj-sm border border-paper-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1">Name *</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value
              onChange({ name, slug: draft.slug || toSlug(name) })
            }}
            className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1">Slug *</label>
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white font-mono focus:outline-none focus:border-maroon"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft mb-1">Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1">SEO Title</label>
          <input
            type="text"
            value={draft.seo_title}
            onChange={(e) => onChange({ seo_title: e.target.value })}
            className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1">Sort Order</label>
          <input
            type="number"
            value={draft.sort_order}
            onChange={(e) => onChange({ sort_order: e.target.value })}
            className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft mb-1">SEO Description</label>
          <textarea
            value={draft.seo_description}
            onChange={(e) => onChange({ seo_description: e.target.value })}
            rows={2}
            className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => onChange({ is_active: e.target.checked })}
              className="rounded"
            />
            Active
          </label>
        </div>
        <div className="sm:col-span-2 flex gap-2 pt-1">
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-sm px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-ink">Blog Categories</h1>
          <p className="text-sm text-ink-soft mt-0.5">Organise blog posts into categories</p>
        </div>
        {!showNewForm && (
          <button
            type="button"
            onClick={() => { setShowNewForm(true); setNewDraft(emptyDraft()); setError(null) }}
            className="btn-primary text-sm px-4 py-2"
          >
            + New Category
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-mj-sm px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-mj-sm px-3 py-2">
          {success}
        </div>
      )}

      {showNewForm && (
        <div className="mb-6">
          <h2 className="font-serif text-base text-ink mb-3">New Category</h2>
          <DraftForm
            draft={newDraft}
            onChange={(patch) => setNewDraft((d) => ({ ...d, ...patch }))}
            onSubmit={createCategory}
            onCancel={() => { setShowNewForm(false); setError(null) }}
            submitting={saving}
            submitLabel="Create Category"
          />
        </div>
      )}

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading…</p>
      ) : categories.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">
          No categories yet.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_120px] gap-3 text-xs text-ink-soft font-medium px-3 pb-1 border-b border-paper-3">
            <span>Category</span>
            <span>Posts</span>
            <span>Order</span>
            <span>Active</span>
            <span className="text-right">Actions</span>
          </div>

          {categories.map((cat) => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <DraftForm
                  draft={editDraft}
                  onChange={(patch) => setEditDraft((d) => ({ ...d, ...patch }))}
                  onSubmit={() => saveEdit(cat.id)}
                  onCancel={() => { setEditingId(null); setError(null) }}
                  submitting={editSaving}
                  submitLabel="Save Changes"
                />
              ) : (
                <div className="card p-3 sm:grid sm:grid-cols-[1fr_80px_80px_80px_120px] sm:gap-3 sm:items-center flex flex-col gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink text-sm">{cat.name}</span>
                      {!cat.is_active && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-soft font-mono mt-0.5">{cat.slug}</p>
                    {cat.description && (
                      <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">{cat.description}</p>
                    )}
                  </div>

                  <span className="text-sm text-ink-soft">
                    {cat.post_count === 0 ? (
                      <span className="text-ink-soft">0</span>
                    ) : (
                      <span className="font-medium text-ink">{cat.post_count}</span>
                    )}
                  </span>

                  <span className="text-sm text-ink-soft">{cat.sort_order}</span>

                  <button
                    type="button"
                    onClick={() => toggleActive(cat)}
                    disabled={togglingId === cat.id}
                    className={[
                      'w-fit text-xs py-1 px-2.5 border rounded-full disabled:opacity-60',
                      cat.is_active
                        ? 'border-green-200 text-green-700 hover:bg-green-50'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </button>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="text-xs py-1.5 px-3 border border-ink/20 text-ink rounded-mj-sm hover:bg-cream transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat)}
                      disabled={deletingId === cat.id}
                      className="text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60 transition-colors"
                    >
                      {deletingId === cat.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
