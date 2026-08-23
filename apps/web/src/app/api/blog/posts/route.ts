import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/blog/posts
// Public — no auth required
// Query params: ?category=<slug> ?featured=1 ?limit=<n> ?offset=<n>
// Returns only published posts ordered by published_at DESC
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const featuredOnly = searchParams.get('featured') === '1'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 50)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10) || 0

    const supabase = await createAdminClient()

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('blog_posts')
      .select(
        `id, title, slug, excerpt, author_name, published_at, featured, cover_url,
         blog_categories!inner(id, name, slug)`,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (categorySlug) {
      query = query.eq('blog_categories.slug', categorySlug)
    }

    if (featuredOnly) {
      query = query.eq('featured', true)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[blog/posts] query error:', error.message)
      return NextResponse.json({ ok: false, message: 'Failed to fetch posts' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts = (data ?? []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      author_name: post.author_name,
      published_at: post.published_at,
      featured: post.featured,
      cover_url: post.cover_url,
      category: post.blog_categories
        ? { id: post.blog_categories.id, name: post.blog_categories.name, slug: post.blog_categories.slug }
        : null,
    }))

    return NextResponse.json({ ok: true, posts, total: count ?? 0 })
  } catch (err) {
    console.error('[blog/posts] unexpected error:', err)
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 })
  }
}
