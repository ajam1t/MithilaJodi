import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

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

  if (slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return NextResponse.json({ ok: false, message: 'Slug must be lowercase alphanumeric with hyphens only.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (slug !== undefined) updates.slug = slug
  if (description !== undefined) updates.description = description
  if (seo_title !== undefined) updates.seo_title = seo_title
  if (seo_description !== undefined) updates.seo_description = seo_description
  if (sort_order !== undefined) updates.sort_order = sort_order
  if (is_active !== undefined) updates.is_active = is_active
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('blog_categories')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('[admin/blog/categories/[id] PATCH] update error:', error.message)
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, message: 'A category with that slug already exists.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'blog_cat_update',
    target_type: 'blog_categories',
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

  // Check post count — only allow delete if no posts use this category
  const { data: postRows } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('category_id', parseInt(id, 10))
    .limit(1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((postRows as any[] ?? []).length > 0) {
    return NextResponse.json(
      { ok: false, message: 'Cannot delete: this category still has posts assigned to it.' },
      { status: 400 }
    )
  }

  const { data: existing } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Category not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/blog/categories/[id] DELETE] delete error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingRow = existing as any

  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'blog_cat_delete',
    target_type: 'blog_categories',
    target_id: id,
    payload: { name: existingRow.name, slug: existingRow.slug },
  })

  return NextResponse.json({ ok: true })
}
