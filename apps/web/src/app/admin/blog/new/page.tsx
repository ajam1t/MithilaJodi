'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: number; name: string; slug: string }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function AdminNewBlogPostPage() {
  const router = useRouter()

  const [categories, setCategories] = useState<Category[]>([])

  // Editor fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Settings
  const [categoryId, setCategoryId] = useState<string>('')
  const [authorName, setAuthorName] = useState('Mithila Jodi Team')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [featured, setFeatured] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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

  async function submit(overrideStatus?: 'draft' | 'published') {
    const resolvedStatus = overrideStatus ?? status
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          status: resolvedStatus,
          featured,
          cover_url: coverUrl || null,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        router.push(`/admin/blog/${json.post.id}`)
      } else {
        setError(json.message ?? 'Failed to create post.')
      }
    } catch {
      setError('Failed to create post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/blog"
          className="text-sm text-ink-soft hover:text-ink transition-colors"
        >
          ← Blog Posts
        </Link>
        <span className="text-ink-soft">/</span>
        <h1 className="font-serif text-xl sm:text-2xl text-ink">New Blog Post</h1>
      </div>

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
              placeholder="Post title…"
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
              placeholder="post-url-slug"
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
              placeholder="Brief summary shown in post listings…"
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
              placeholder="Write your post content in Markdown…"
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full border border-paper-3 rounded-mj-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-maroon"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
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

          {/* Submit buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => submit('published')}
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
            >
              {submitting && status === 'published' ? 'Publishing…' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => submit('draft')}
              disabled={submitting}
              className="btn-ghost w-full py-2.5 text-sm disabled:opacity-60"
            >
              {submitting && status === 'draft' ? 'Saving…' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
