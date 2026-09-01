import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = ReturnType<typeof createServerClient<any>>

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies are read-only
          }
        },
      },
    }
  )
}

/**
 * Service-role client for server-only admin operations.
 * Bypasses RLS — NEVER import in client-side code.
 * Typed as `any` to avoid Supabase generic inference issues with custom schemas.
 *
 * Deliberately does NOT read cookies. Service-role auth is carried by the key,
 * so the cookie adapter this used to pass was never actually used for anything —
 * but calling `cookies()` opted every caller out of static rendering. That had
 * two real consequences at build time:
 *
 *   - /sitemap.xml threw DYNAMIC_SERVER_USAGE while collecting blog entries and
 *     fell back to its catch block, so the production sitemap silently shipped
 *     without a single blog article URL;
 *   - any server component reading public data (e.g. the homepage's featured
 *     profiles band) could not be statically rendered.
 *
 * Routes that genuinely need the visitor's session use getSessionAccount(),
 * which reads cookies itself — so nothing loses access to session state here.
 */
export async function createAdminClient(): Promise<AnyClient> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  ) as unknown as AnyClient
}
