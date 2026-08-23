'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  updated_at: string | null
  author_name: string | null
  excerpt: string | null
  content: string | null
  category_id: number | null
  seo_title: string | null
  seo_description: string | null
  keywords: string[] | null
  cover_url: string | null
  blog_categories: { id: number; name: string; slug: string } | null
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

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

export default function AdminEditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editor fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Settings
  const [categoryId, setCategoryId] = useState<string>('')
  const [authorName, setAuthorName] = useState('')
  const [featured, setFeatured] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const loadPost = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/blog/posts/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          const p = j.post as Post
          setPost(p)
          setTitle(p.title ?? '')
          setSlug(p.slug ?? '')
          setExcerpt(p.excerpt ?? '')
          setContent(p.content ?? '')
          setCategoryId(p.category_id ? String(p.category_id) : '')
          setAuthorName(p.author_name ?? '')
          setFeatured(p.featured ?? false)
          setSeoTitle(p.seo_title ?? '')
          setSeoDescription(p.seo_description ?? '')
          setKeywords((p.keywords ?? []).join(', '))
          setCoverUrl(p.cover_url ?? '')
        } else {
          setError(j.message ?? 'Failed to load post.')
        }
      })
      .catch(() => setError('Failed to load post.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadPost() }, [loadPost])

  useEffect(() => {
    fetch('/api/admin/blog/categories')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setCategories(j.categories as Category[]) })
      .catch(() => {})
  }, [])

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugEdited) {
      setSlug(toSlug(val))
    }
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required.'
    if (!slug.trim()) errs.slug = 'Slug is required.'
    if (!categoryId) errs.category = 'Category is required.'
    return errs
  }

  async function save(statusOverride?: 'draft' | 'published' | 'archived') {
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        slug: slug.trim(),
        category_id: parseInt(categoryId, 10),
        excerpt: excerpt || null,
        content: content || null,
        author_name: authorName || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        keywords: keywords
          ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
        featured,
        cover_url: coverUrl || null,
      }
      if (statusOverride !== undefined) {
        body.status = statusOverride
      }

      const res = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.ok) {
        loadPost()
      } else {
        setError(json.message ?? 'Failed to save post.')
      }
    } catch {
      setError('Failed to save post.')
    } finally {
      setSubmitting(false)
    }
  }

  async function archivePost() {
    if (!window.confirm('Archive this post? It will no longer be publicly visible.')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        router.push('/admin/blog')
      } else {
        setError(json.message ?? 'Failed to archive post.')
      }
    } catch {
      setError('Failed to archive post.')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dt: string | null) {
    if (!dt) return null
    return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-ink-soft text-sm animate-pulse">Loading post…</p>
      </div>
    )
  }

  if (!post && error) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-red-600 text-sm">{error}</p>
        <Link href="/admin/blog" className="text-sm text-maroon hover:underline mt-2 inline-block">
          ← Back to Blog Posts
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Link href="/admin/blog" className="text-sm text-ink-soft hover:text-ink transition-colors">
          ← Blog Posts
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-serif text-xl sm:text-2xl text-ink">Edit Post</h1>
        {post && <StatusBadge status={post.status} />}
      </div>

      {post && (
        <div className="flex flex-wrap gap-3 text-xs text-ink-soft mb-4">
          {post.published_at && (
            <span>Published: {formatDate(post.published_at)}</span>
          )}
          <span>Created: {formatDate(post.created_at)}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-mj-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left — Editor */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={[
                'w-full border rounded-mj-sm px-3 py-2.5 text-base bg-white focus:outline-none focus:border-maroon',
                fieldErrors.title ? 'border-red-400' : 'border-paper-3',
              ].join(' ')}
            />
            {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
              className={[
                'w-full border rounded-mj-sm px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:border-maroon',
                fieldErrors.slug ? 'border-red-400' : 'border-paper-3',
              ].join(' ')}
            />
            {fieldErrors.slug && <p className="text-xs text-red-500 mt-1">{fieldErrors.slug}</p>}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-ink">
                Content <span className="text-xs text-ink-soft font-normal">(Markdown supported)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-xs text-maroon hover:underline"
              >
                {showPreview ? 'Hide preview' : 'Show preview'}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon font-mono resize-y"
              style={{ minHeight: '400px' }}
            />
            {showPreview && (
              <div className="mt-3 border border-paper-3 rounded-mj-sm p-4 bg-cream">
                <p className="text-xs text-ink-soft mb-2 font-medium uppercase tracking-wide">Preview (raw markdown)</p>
                <pre className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed">
                  {content || <span className="text-ink-soft italic">Nothing to preview yet.</span>}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right — Settings sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h2 className="font-serif text-base text-ink border-b border-paper-3 pb-2">Settings</h2>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={[
                  'w-full border rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon',
                  fieldErrors.category ? 'border-red-400' : 'border-paper-3',
                ].join(' ')}
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fieldErrors.category && <p className="text-xs text-red-500 mt-1">{fieldErrors.category}</p>}
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Author</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
              />
            </div>

            {/* Featured */}
            <div>
              <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded"
                />
                Featured post
              </label>
            </div>

            {/* Cover URL */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Cover Image URL</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
                className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
              />
            </div>
          </div>

          {/* SEO */}
          <div className="card p-4 space-y-4">
            <h2 className="font-serif text-base text-ink border-b border-paper-3 pb-2">SEO</h2>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">SEO Description</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Keywords
                <span className="text-xs text-ink-soft font-normal ml-1">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="matrimony, Mithila, Bihar…"
                className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="card p-4 space-y-2">
            <h2 className="font-serif text-base text-ink border-b border-paper-3 pb-2 mb-3">Actions</h2>

            <button
              type="button"
              onClick={() => save()}
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>

            {post?.status !== 'published' && (
              <button
                type="button"
                onClick={() => save('published')}
                disabled={submitting}
                className="w-full py-2.5 text-sm border border-green-300 text-green-700 rounded-mj-sm hover:bg-green-50 disabled:opacity-60 transition-colors"
              >
                Publish
              </button>
            )}

            {post?.status === 'published' && (
              <button
                type="button"
                onClick={() => save('draft')}
                disabled={submitting}
                className="w-full py-2.5 text-sm border border-yellow-300 text-yellow-700 rounded-mj-sm hover:bg-yellow-50 disabled:opacity-60 transition-colors"
              >
                Unpublish (revert to Draft)
              </button>
            )}

            {post?.status !== 'archived' && (
              <button
                type="button"
                onClick={archivePost}
                disabled={submitting}
                className="w-full py-2.5 text-sm border border-red-200 text-red-600 rounded-mj-sm hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                Archive Post
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
