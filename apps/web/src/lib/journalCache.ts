import 'server-only'
import { revalidatePath } from 'next/cache'

/**
 * Blog articles are cached (ISR, one hour) instead of being rendered on every
 * visit — crawlers alone were costing most of the site's server CPU. Call this
 * after any change to a post or category so readers see it at once rather than
 * when the hour runs out.
 */
export function refreshJournal(): void {
  try {
    revalidatePath('/blogs', 'layout')
    revalidatePath('/sitemap.xml')
  } catch {
    /* outside a request scope (scripts/tests): nothing to refresh */
  }
}
