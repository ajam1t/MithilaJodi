import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/blog/categories
// Public — no auth required
// Returns all active categories ordered by sort_order, with post count
export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('blog_categories')
      .select(
        `id, name, slug, description, seo_title,
         blog_posts(count)`
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[blog/categories] query error:', error.message)
      return NextResponse.json({ ok: false, message: 'Failed to fetch categories' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = (data ?? []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      seo_title: cat.seo_title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      post_count: Array.isArray(cat.blog_posts) ? cat.blog_posts.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0) : 0,
    }))

    return NextResponse.json({ ok: true, categories })
  } catch (err) {
    console.error('[blog/categories] unexpected error:', err)
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 })
  }
}
