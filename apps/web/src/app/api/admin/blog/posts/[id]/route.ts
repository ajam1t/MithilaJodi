import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const VALID_STATUSES = ['draft', 'published', 'archived'] as const
type PostStatus = typeof VALID_STATUSES[number]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createAdminClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*, blog_categories(id, name, slug)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin/blog/posts/[id] GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  if (!post) {
    return NextResponse.json({ ok: false, message: 'Post not found.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, post })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createAdminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, status, published_at')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('[admin/blog/posts/[id] PATCH] fetch error:', fetchError.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Post not found.' }, { status: 404 })
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

  if (status && !VALID_STATUSES.includes(status as PostStatus)) {
    return NextResponse.json({ ok: false, message: 'Invalid status.' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingRow = existing as any
  const updates: Record<string, unknown> = {}

  if (title !== undefined) updates.title = title
  if (slug !== undefined) updates.slug = slug
  if (category_id !== undefined) updates.category_id = category_id
  if (excerpt !== undefined) updates.excerpt = excerpt
  if (content !== undefined) updates.content = content
  if (author_name !== undefined) updates.author_name = author_name
  if (seo_title !== undefined) updates.seo_title = seo_title
  if (seo_description !== undefined) updates.seo_description = seo_description
  if (keywords !== undefined) updates.keywords = keywords
  if (featured !== undefined) updates.featured = featured
  if (cover_url !== undefined) updates.cover_url = cover_url

  if (status !== undefined) {
    updates.status = status
    // If transitioning to published and no published_at yet, set it now
    if (status === 'published' && !existingRow.published_at) {
      updates.published_at = new Date().toISOString()
    }
    // Do NOT clear published_at when moving away from published
  }

  updates.updated_at = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)

  if (updateError) {
    console.error('[admin/blog/posts/[id] PATCH] update error:', updateError.message)
    if (updateError.code === '23505') {
      return NextResponse.json({ ok: false, message: 'A post with that slug already exists.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'blog_post_update',
    target_type: 'blog_posts',
    target_id: id,
    payload: { changes: updates },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Post not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/blog/posts/[id] DELETE] archive error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingRow = existing as any

  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'blog_post_archive',
    target_type: 'blog_posts',
    target_id: id,
    payload: { title: existingRow.title, slug: existingRow.slug },
  })

  return NextResponse.json({ ok: true })
}
