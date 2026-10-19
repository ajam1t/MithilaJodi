import type { Invite, OpeningId, ThemeId } from './schema'

/**
 * The premium invitations. Each is its own product with its own page and
 * builder, but they share the content model, the builder form, the short-link
 * storage and the public page — only the look and the opening differ.
 *
 *   mithila — Mithila Premium: five themes, the sealed envelope opening.
 *   scratch — MJ Scratch & Reveal: one ivory-and-gold design, opened by
 *             scratching the date free under the gold MJ seal.
 *   lace    — Blush Lace Elegance: blush, ivory and fine lace, opened by
 *             parting a pearl-dotted lace veil.
 */
export type ProductId = 'mithila' | 'scratch' | 'lace'

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
  /** For a fixed design, a line in the builder describing it. */
  designNote?: { title: string; body: string }
}

export const PRODUCTS: Record<ProductId, PremiumProduct> = {
  mithila: {
    id: 'mithila', name: 'Mithila Premium Invitation', path: '/marriage-invitation/premium',
    theme: 'kohbar', fixedTheme: false, draftKey: 'mj-wedding-draft',
  },
  scratch: {
    id: 'scratch', name: 'MJ Scratch & Reveal Invitation', path: '/marriage-invitation/scratch-reveal',
    theme: 'mj-ivory', fixedTheme: true, opening: 'scratch', draftKey: 'mj-wedding-draft-scratch',
    designNote: { title: 'Ivory & gold, sealed with the MJ monogram.', body: 'Guests scratch gold foil to reveal your wedding date, then the card opens onto your invitation.' },
  },
  lace: {
    id: 'lace', name: 'Blush Lace Elegance', path: '/marriage-invitation/blush-lace',
    theme: 'blush-lace', fixedTheme: true, opening: 'lace', draftKey: 'mj-wedding-draft-lace',
    designNote: { title: 'Blush, ivory and fine lace, with champagne gold.', body: 'Guests part a pearl-dotted lace veil to open your invitation. Your photos, if you add them, sit in lace frames on the cover.' },
  },
}

/** Which product an invitation was made with. */
export const productOf = (invite: Pick<Invite, 'o'>): PremiumProduct =>
  invite.o === 'scratch' ? PRODUCTS.scratch : invite.o === 'lace' ? PRODUCTS.lace : PRODUCTS.mithila
