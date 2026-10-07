import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { EDITORIAL_RELATED, pillarRank, readingMinutes } from '@/lib/journal'

/*
 * Journal reads. The corpus is small (tens of articles), so the index loads
 * every published post once and does search, hubs and pagination in memory —
 * one query instead of a dozen, and search can look inside the article body
 * without a full-text index. Content never leaves the server: cards get a
 * reading time, not the markdown.
 */

export type JournalCategory = { id: number; name: string; slug: string; description: string | null }

export type JournalPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  author: string
  publishedAt: string | null
  updatedAt: string | null
  featured: boolean
  coverUrl: string | null
  keywords: string[]
  minutes: number
  category: { id: number; name: string; slug: string } | null
  href: string
}

type Row = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  author_name: string | null
  published_at: string | null
  updated_at: string | null
  featured: boolean | null
  cover_url: string | null
  keywords: string[] | null
  blog_categories: { id: number; name: string; slug: string } | null
}

export type JournalPostWithText = JournalPost & { text: string }

function toPost(r: Row): JournalPostWithText {
  const category = r.blog_categories
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    author: r.author_name || 'Mithila Jodi Team',
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
    featured: !!r.featured,
    coverUrl: r.cover_url,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    minutes: readingMinutes(r.content),
    category,
    href: category ? `/blogs/${category.slug}/${r.slug}` : '/blogs',
    text: r.content ?? '',
  }
}

/** Every published article, newest first. */
export async function getJournalPosts(): Promise<JournalPostWithText[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select(
      `id, title, slug, excerpt, content, author_name, published_at, updated_at, featured, cover_url, keywords,
       blog_categories(id, name, slug)`,
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return ((data ?? []) as unknown as Row[]).map(toPost)
}

/** Active categories that have at least one article, in pillar order. */
export async function getJournalCategories(posts: JournalPost[]): Promise<JournalCategory[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('blog_categories')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  // Empty categories stay out of navigation: they are noindexed and the
  // sitemap omits them, so linking to them only spends crawl budget.
  const used = new Set(posts.map(p => p.category?.slug).filter(Boolean))
  return ((data ?? []) as JournalCategory[])
    .filter(c => used.has(c.slug))
    .sort((a, b) => pillarRank(a.slug) - pillarRank(b.slug))
}

/** Strip the server-only body before a post is handed to a component. */
export function card(p: JournalPostWithText): JournalPost {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { text, ...rest } = p
  return rest
}

/** Look up posts by slug, keeping the given order and skipping unpublished ones. */
export function pick(posts: JournalPost[], slugs: string[]): JournalPost[] {
  const bySlug = new Map(posts.map(p => [p.slug, p]))
  return slugs.map(s => bySlug.get(s)).filter((p): p is JournalPost => !!p)
}

/**
 * Search over title, excerpt, category, keywords ("tags") and the body.
 * Every word must match somewhere; title and keyword hits rank above body hits.
 */
export function searchPosts(posts: JournalPostWithText[], query: string): JournalPostWithText[] {
  const terms = query.toLowerCase().split(/\s+/).map(t => t.replace(/[^\p{L}\p{N}-]/gu, '')).filter(t => t.length > 1)
  if (terms.length === 0) return []
  const scored: Array<{ p: JournalPostWithText; score: number }> = []
  for (const p of posts) {
    const fields = {
      title: p.title.toLowerCase(),
      tags: p.keywords.join(' ').toLowerCase(),
      category: (p.category?.name ?? '').toLowerCase(),
      excerpt: (p.excerpt ?? '').toLowerCase(),
      body: p.text.toLowerCase(),
    }
    let score = 0
    let all = true
    for (const t of terms) {
      const s =
        (fields.title.includes(t) ? 8 : 0) +
        (fields.tags.includes(t) ? 5 : 0) +
        (fields.category.includes(t) ? 3 : 0) +
        (fields.excerpt.includes(t) ? 2 : 0) +
        (fields.body.includes(t) ? 1 : 0)
      if (s === 0) { all = false; break }
      score += s
    }
    if (all) scored.push({ p, score })
  }
  return scored.sort((a, b) => b.score - a.score).map(s => s.p)
}

/**
 * Related articles: the editorial cluster first, then the same category, then
 * shared keywords. Recency only breaks ties.
 */
export function relatedPosts(posts: JournalPost[], post: JournalPost, limit = 3): JournalPost[] {
  const others = posts.filter(p => p.slug !== post.slug)
  const chosen = pick(others, EDITORIAL_RELATED[post.slug] ?? [])
  if (chosen.length >= limit) return chosen.slice(0, limit)

  const tags = new Set(post.keywords.flatMap(k => k.toLowerCase().split(/\s+/)).filter(w => w.length > 3))
  const overlap = (p: JournalPost) =>
    p.keywords.flatMap(k => k.toLowerCase().split(/\s+/)).filter(w => tags.has(w)).length
  const rest = others
    .filter(p => !chosen.includes(p))
    .map(p => ({ p, score: (p.category?.slug === post.category?.slug ? 10 : 0) + overlap(p) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p)
  return [...chosen, ...rest].slice(0, limit)
}
