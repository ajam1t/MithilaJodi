import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const supabase = await createAdminClient()

  const { data: categories, error } = await supabase
    .from('blog_categories')
    .select('id, name, slug, description, seo_title, seo_description, sort_order, is_active')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[admin/blog/categories GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryIds = (categories as any[] ?? []).map((c) => c.id)

  const postCountMap: Record<number, number> = {}
  if (categoryIds.length > 0) {
    const { data: countRows } = await supabase
      .from('blog_posts')
      .select('category_id')
      .in('category_id', categoryIds)
      .neq('status', 'archived')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(countRows as any[] ?? []).forEach((row) => {
      postCountMap[row.category_id] = (postCountMap[row.category_id] ?? 0) + 1
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (categories as any[] ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    seo_title: c.seo_title,
    seo_description: c.seo_description,
    sort_order: c.sort_order,
    is_active: c.is_active,
    post_count: postCountMap[c.id] ?? 0,
  }))

  return NextResponse.json({ ok: true, categories: result })
}

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const body = await request.json()
  const { name, slug, description, seo_title, seo_description, sort_order, is_active } = body as {
    name?: string
    slug?: string
    description?: string
    seo_title?: string
    seo_description?: string
    sort_order?: number
    is_active?: boolean
  }

  if (!name?.trim()) {
    return NextResponse.json({ ok: false, message: 'Name is required.' }, { status: 400 })
  }
  if (!slug?.trim()) {
    return NextResponse.json({ ok: false, message: 'Slug is required.' }, { status: 400 })
  }
  // Validate slug is URL-safe
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return NextResponse.json({ ok: false, message: 'Slug must be lowercase alphanumeric with hyphens only.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: category, error } = await supabase
    .from('blog_categories')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description ?? null,
      seo_title: seo_title ?? null,
      seo_description: seo_description ?? null,
      sort_order: sort_order ?? 0,
      is_active: is_active ?? true,
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('[admin/blog/categories POST] insert error:', error.message)
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, message: 'A category with that slug already exists.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newCat = category as any

  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'blog_cat_create',
    target_type: 'blog_categories',
    target_id: String(newCat.id),
    payload: { name, slug },
  })

  return NextResponse.json({ ok: true, category: { id: newCat.id, slug: newCat.slug } })
}
