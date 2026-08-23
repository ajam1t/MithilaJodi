import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const VALID_STATUSES = ['draft', 'published', 'archived'] as const
type PostStatus = typeof VALID_STATUSES[number]

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const statusParam = request.nextUrl.searchParams.get('status')
  const categoryIdParam = request.nextUrl.searchParams.get('category_id')

  if (statusParam && !VALID_STATUSES.includes(statusParam as PostStatus)) {
    return NextResponse.json({ ok: false, message: 'Invalid status filter.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, status, featured, published_at, created_at, author_name, excerpt, category_id, blog_categories(id, name, slug)')
    .order('created_at', { ascending: false })

  if (statusParam) {
    query = query.eq('status', statusParam)
  }
  if (categoryIdParam) {
    query = query.eq('category_id', parseInt(categoryIdParam, 10))
  }

  const { data: posts, error } = await query

  if (error) {
    console.error('[admin/blog/posts GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (posts as any[] ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    featured: p.featured,
    published_at: p.published_at,
    created_at: p.created_at,
    author_name: p.author_name,
    excerpt: p.excerpt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: p.blog_categories as any ?? null,
  }))

  return NextResponse.json({ ok: true, posts: result })
}

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const body = await request.json()
  const {
    title,
    slug,
    category_id,
    excerpt,
    content,
    author_name,
    seo_title,
    seo_description,
    keywords,
    status,
    featured,
    cover_url,
  } = body as {
    title?: string
    slug?: string
    category_id?: number
    excerpt?: string
    content?: string
    author_name?: string
    seo_title?: string
    seo_description?: string
    keywords?: string[]
    status?: string
    featured?: boolean
    cover_url?: string
  }

  if (!title?.trim()) {
    return NextResponse.json({ ok: false, message: 'Title is required.' }, { status: 400 })
  }
  if (!slug?.trim()) {
    return NextResponse.json({ ok: false, message: 'Slug is required.' }, { status: 400 })
  }
  if (!category_id) {
    return NextResponse.json({ ok: false, message: 'Category is required.' }, { status: 400 })
  }
  const resolvedStatus = (status ?? 'draft') as PostStatus
  if (!VALID_STATUSES.includes(resolvedStatus)) {
    return NextResponse.json({ ok: false, message: 'Invalid status.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      title: title.trim(),
      slug: slug.trim(),
      category_id,
      excerpt: excerpt ?? null,
      content: content ?? null,
      author_name: author_name ?? null,
      seo_title: seo_title ?? null,
      seo_description: seo_description ?? null,
      keywords: keywords ?? null,
      status: resolvedStatus,
      featured: featured ?? false,
      cover_url: cover_url ?? null,
      published_at: resolvedStatus === 'published' ? new Date().toISOString() : null,
      created_by: session.id,
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('[admin/blog/posts POST] insert error:', error.message)
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, message: 'A post with that slug already exists.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newPost = post as any

  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'blog_post_create',
    target_type: 'blog_posts',
    target_id: newPost.id,
    payload: { title, slug, status: resolvedStatus },
  })

  return NextResponse.json({ ok: true, post: { id: newPost.id, slug: newPost.slug } })
}
