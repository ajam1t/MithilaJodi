import type { Invite, OpeningId, ThemeId } from './schema'

/**
 * The premium invitations. Each is its own product with its own page and
 * builder, but they share the content model, the builder form, the short-link
 * storage and the public page — only the look and the opening differ.
 *
 *   mithila — Mithila Premium: five themes, the sealed envelope opening.
 *   scratch — MJ Scratch & Reveal: one ivory-and-gold design, opened by
 *             scratching the date free under the gold MJ seal.
 */
export type ProductId = 'mithila' | 'scratch'

export type PremiumProduct = {
  id: ProductId
  name: string
  /** Its page and builder. */
  path: string
  /** Theme for a new invitation; with `fixedTheme` it is the only one. */
  theme: ThemeId
  fixedTheme: boolean
  /** Stored in the invitation as `o`; absent means the classic envelope. */
  opening?: OpeningId
  /** Separate drafts, so starting one invitation never overwrites the other. */
  draftKey: string
}

export const PRODUCTS: Record<ProductId, PremiumProduct> = {
  mithila: {
    id: 'mithila', name: 'Mithila Premium Invitation', path: '/marriage-invitation/premium',
    theme: 'kohbar', fixedTheme: false, draftKey: 'mj-wedding-draft',
  },
  scratch: {
    id: 'scratch', name: 'MJ Scratch & Reveal Invitation', path: '/marriage-invitation/scratch-reveal',
    theme: 'mj-ivory', fixedTheme: true, opening: 'scratch', draftKey: 'mj-wedding-draft-scratch',
  },
}

/** Which product an invitation was made with. */
export const productOf = (invite: Pick<Invite, 'o'>): PremiumProduct => (invite.o === 'scratch' ? PRODUCTS.scratch : PRODUCTS.mithila)
