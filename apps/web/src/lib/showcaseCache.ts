import 'server-only'
import { revalidatePath } from 'next/cache'

/**
 * The homepage's featured profiles are cached (ISR, 15 minutes). Call this
 * whenever something that decides who appears there — or which photo — has
 * changed: visibility, photo privacy, photos, the showcase list, account or
 * profile status. Otherwise a member who went private or was removed would
 * stay on the public homepage until the cache expired.
 */
export function refreshPublicShowcase(): void {
  try {
    revalidatePath('/')
  } catch {
    /* outside a request scope (scripts/tests): nothing to refresh */
  }
}
