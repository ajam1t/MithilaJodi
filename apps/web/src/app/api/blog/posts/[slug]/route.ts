import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/blog/posts/[slug]
// Public — no auth required
// Returns the full published post by slug + up to 4 related posts from same category
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createAdminClient()

    // Fetch full post with category
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(
        `id, title, slug, excerpt, content, cover_url, author_name,
         seo_title, seo_description, keywords, status, featured,
         published_at, created_at, updated_at, category_id,
         blog_categories(id, name, slug)`
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return NextResponse.json({ ok: false }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postData = post as any

    // Fetch related posts from same category (exclude current)
    const { data: related } = await supabase
      .from('blog_posts')
      .select(
        `id, title, slug, excerpt, author_name, published_at, cover_url,
         blog_categories(id, name, slug)`
      )
      .eq('status', 'published')
      .eq('category_id', postData.category_id)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(4)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relatedPosts = (related ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      author_name: r.author_name,
      published_at: r.published_at,
      cover_url: r.cover_url,
      category: r.blog_categories
        ? { id: r.blog_categories.id, name: r.blog_categories.name, slug: r.blog_categories.slug }
        : null,
    }))

    return NextResponse.json({
      ok: true,
      post: {
        id: postData.id,
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        content: postData.content,
        cover_url: postData.cover_url,
        author_name: postData.author_name,
        seo_title: postData.seo_title,
        seo_description: postData.seo_description,
        keywords: postData.keywords,
        featured: postData.featured,
        published_at: postData.published_at,
        created_at: postData.created_at,
        updated_at: postData.updated_at,
        category: postData.blog_categories
          ? {
              id: postData.blog_categories.id,
              name: postData.blog_categories.name,
              slug: postData.blog_categories.slug,
            }
          : null,
      },
      related: relatedPosts,
    })
  } catch (err) {
    console.error('[blog/posts/slug] unexpected error:', err)
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 })
  }
}
