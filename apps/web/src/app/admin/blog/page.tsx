'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Category = { id: number; name: string; slug: string }
type Post = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  published_at: string | null
  created_at: string
  author_name: string | null
  excerpt: string | null
  category: Category | null
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'archived', label: 'Archived' },
]

function StatusBadge({ status }: { status: Post['status'] }) {
  const cls =
    status === 'published'
      ? 'bg-green-100 text-green-700 border border-green-200'
      : status === 'draft'
      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
      : 'bg-gray-100 text-gray-500 border border-gray-200'
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [archiving, setArchiving] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (categoryFilter) params.set('category_id', categoryFilter)

    fetch(`/api/admin/blog/posts?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setPosts(j.posts as Post[])
        else setError('Failed to load posts.')
      })
      .catch(() => setError('Failed to load posts.'))
      .finally(() => setLoading(false))
  }, [statusFilter, categoryFilter])

  useEffect(() => {
    fetch('/api/admin/blog/categories')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setCategories(j.categories as Category[]) })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  async function archivePost(id: string, title: string) {
    if (!window.confirm(`Archive "${title}"? It will no longer be publicly visible.`)) return
    setArchiving(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        setPosts((ps) => ps.map((p) => p.id === id ? { ...p, status: 'archived' } : p))
      } else {
        setError(json.message ?? 'Failed to archive post.')
      }
    } catch {
      setError('Failed to archive post.')
    } finally {
      setArchiving(null)
    }
  }

  function formatDate(dt: string | null) {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-ink">Blog Posts</h1>
          <p className="text-sm text-ink-soft mt-0.5">Manage all blog content</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="btn-primary text-sm px-4 py-2"
        >
          + New Post
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-mj-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex gap-0.5 bg-paper border border-paper-3 rounded-mj-sm p-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={[
                'text-xs px-3 py-1.5 rounded transition-colors',
                statusFilter === tab.key
                  ? 'bg-maroon text-cream'
                  : 'text-ink-soft hover:text-ink',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-paper-3 rounded-mj-sm px-2 py-1.5 bg-white text-ink focus:outline-none focus:border-maroon"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-ink-soft text-sm animate-pulse">Loading posts…</p>
      ) : posts.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">
          No posts found.{' '}
          <Link href="/admin/blog/new" className="text-maroon hover:underline">
            Create the first one.
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header row — hidden on mobile */}
          <div className="hidden sm:grid grid-cols-[1fr_160px_100px_110px_120px] gap-3 text-xs text-ink-soft font-medium px-3 pb-1 border-b border-paper-3">
            <span>Title</span>
            <span>Category</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Actions</span>
          </div>

          {posts.map((post) => (
            <div
              key={post.id}
              className="card p-3 sm:grid sm:grid-cols-[1fr_160px_100px_110px_120px] sm:gap-3 sm:items-center flex flex-col gap-2"
            >
              {/* Title + featured */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-ink text-sm truncate">{post.title}</span>
                  {post.featured && (
                    <span className="text-[10px] bg-gold/20 text-maroon border border-gold/40 px-1.5 py-0.5 rounded-full font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5 font-mono">{post.slug}</p>
              </div>

              {/* Category */}
              <span className="text-sm text-ink-soft truncate">
                {post.category?.name ?? <span className="italic">Uncategorised</span>}
              </span>

              {/* Status */}
              <div className="flex items-center">
                <StatusBadge status={post.status} />
              </div>

              {/* Date */}
              <span className="text-xs text-ink-soft">
                {post.status === 'published'
                  ? formatDate(post.published_at)
                  : formatDate(post.created_at)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:justify-end">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="text-xs py-1.5 px-3 border border-ink/20 text-ink rounded-mj-sm hover:bg-cream transition-colors"
                >
                  Edit
                </Link>
                {post.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => archivePost(post.id, post.title)}
                    disabled={archiving === post.id}
                    className="text-xs py-1.5 px-3 border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60 transition-colors"
                  >
                    {archiving === post.id ? 'Archiving…' : 'Archive'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
