import type { Metadata } from 'next'
import {
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_E164,
  INSTAGRAM_URL,
} from '@/lib/constants'

/**
 * Metadata builders.
 *
 * Before this, every page hand-wrote `alternates: { canonical: `${SITE}/path` }`
 * plus its own openGraph block. That is ~15 copies of the same shape, and a
 * canonical is the one tag where a typo is both invisible in review and
 * expensive — a page canonicalised to the wrong path drops out of the index
 * quietly. Passing a `path` and deriving the absolute URL from SITE_URL once
 * removes that whole class of mistake.
 *
 * `SITE_URL` reads NEXT_PUBLIC_SITE_URL and falls back to the apex domain, so
 * nothing here can emit a localhost canonical in a production build.
 */

/** The 1200×630 brand card. A real Mithila Jodi image, not a framework default. */
export const OG_IMAGE = '/og-card.png'

export type PageSeo = {
  /** Absolute path from the site root, e.g. '/explore'. Use '/' for the homepage. */
  path: string
  /**
   * Page title WITHOUT the brand suffix — the root layout applies the
   * '%s | Mithila Jodi' template. Repeating the brand here produces
   * "… | Mithila Jodi | Mithila Jodi".
   */
  title: string
  description: string
  keywords?: string[]
  /** Defaults to the brand card; pass a page-specific 1200×630 image if one exists. */
  image?: string
  ogType?: 'website' | 'article'
  /** Title used in OG/Twitter, where there is no template to append the brand. */
  socialTitle?: string
}

/** Canonical absolute URL for a path. */
export function canonicalUrl(path: string): string {
  if (path === '/') return SITE_URL
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Complete metadata for a public, indexable page: canonical, Open Graph and
 * Twitter card, all consistent with each other by construction.
 */
export function pageMetadata({
  path, title, description, keywords, image = OG_IMAGE, ogType = 'website', socialTitle,
}: PageSeo): Metadata {
  const url = canonicalUrl(path)
  const social = socialTitle ?? `${title} | Mithila Jodi`

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: ogType,
      url,
      siteName: 'Mithila Jodi',
      locale: 'en_IN',
      title: social,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: 'Mithila Jodi' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: social,
      description,
      images: [image],
    },
  }
}

/**
 * Metadata for a page that must never be indexed.
 *
 * A title is still worth setting: these pages are real destinations for signed-in
 * members, and without one they all inherit the root default, which makes every
 * browser tab and history entry read "Mithila Jodi — जहाँ परम्परा मिले, प्रेम से".
 *
 * `follow: true` by default so link equity still flows through utility pages to
 * the public ones they link to; pass `follow: false` for genuinely private areas.
 */
export function noindexMetadata(title: string, { follow = true }: { follow?: boolean } = {}): Metadata {
  return {
    title,
    robots: { index: false, follow },
  }
}

// ─── Structured data ─────────────────────────────────────────────────────────

/**
 * BreadcrumbList for a page's ancestry.
 *
 * Only worth emitting where the crumb trail matches something a user can
 * actually see or infer from the navigation — Google treats a breadcrumb that
 * contradicts the page as a reason to distrust the rest of the markup.
 */
export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  }
}

/** A free, browser-based tool page (the biodata and invitation makers). */
export function webAppJsonLd({
  name, path, description, languages,
}: {
  name: string
  path: string
  description: string
  languages?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: canonicalUrl(path),
    description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    ...(languages ? { inLanguage: languages } : {}),
    // The platform genuinely costs nothing, so this is a statement of fact
    // rather than a marketing claim. No ratings, reviews or user counts are
    // asserted anywhere — none of those are verifiable here.
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@type': 'Organization', name: 'Mithila Jodi', url: SITE_URL },
  }
}

/** FAQPage — only for pages whose Q&A is visible in the rendered HTML. */
export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** Renders one or more JSON-LD blocks as a single script tag. */
export function jsonLdScript(...blocks: object[]): { __html: string } {
  return { __html: JSON.stringify(blocks.length === 1 ? blocks[0] : blocks) }
}

/**
 * Trim a string to `max` characters at a word boundary.
 *
 * For meta descriptions that are composed from data whose length varies — a
 * festival name, a list of song titles — where the result must still fit what
 * Google displays (~155-160 characters) no matter what the data is. Cutting at
 * a space avoids ending mid-word, which reads like a bug in the SERP.
 */
export function clamp(text: string, max = 158): string {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:—-]+$/, '') + '…'
}

/** The canonical node id for the organisation, referenced from every page. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`

/**
 * The one authoritative Organization node.
 *
 * Eight pages each declared their own Organization. Several did so as an
 * anonymous `publisher: { '@type': 'Organization', name: 'Mithila Jodi' }` with
 * no `@id`, so instead of one richly described entity a crawler saw a handful of
 * thin, unlinked ones. Others shared the `@id` but disagreed on which
 * properties they carried. Both fragment the entity at exactly the point where
 * we want it consolidated.
 *
 * That fragmentation is the on-site half of a real problem: searching the brand
 * returns an AI Overview describing "Mithila Jodi" as devotional Madhubani
 * paintings of divine couples, because nothing authoritative tied the phrase to
 * this organisation. Every page now emits this identical node, and anything
 * needing a publisher or author references ORGANIZATION_ID instead of
 * describing the organisation again.
 *
 * Everything asserted here is already published on the site — the founder is
 * named on /about, the contact details on /contact, the Instagram account in the
 * footer. Nothing is invented to pad the entity out.
 */
export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Mithila Jodi',
    // Spellings people and other sites actually use.
    alternateName: ['MithilaJodi', 'Mithila Jodi Matrimony', 'Mithila Jodi Matrimonial'],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/favicon-512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/og-card.png`,
    slogan: 'जहाँ परम्परा मिले, प्रेम से | Where tradition meets love.',
    description:
      'A matrimonial platform for the Mithila (Maithili) community of India, offering marriage biodata creation in English, Hindi, Maithili and Sanskrit.',
    // schema.org provides this property specifically to separate an entity from
    // similarly named ones, which is the whole difficulty with this brand name.
    disambiguatingDescription:
      'Mithila Jodi is an online matrimonial and matchmaking platform for Maithil families. It is a company and website, not a style of Madhubani painting or a depiction of a divine couple.',
    foundingDate: '2026',
    founder: { '@type': 'Person', name: 'Sandeep Jha' },
    // Official accounts. sameAs is the strongest on-site signal for tying a name
    // to a specific organisation, and it was missing entirely.
    sameAs: [INSTAGRAM_URL],
    areaServed: { '@type': 'Country', name: 'India' },
    knowsAbout: [
      'Maithil matrimony',
      'Mithila marriage traditions',
      'Gotra and mool in Mithila',
      'Marriage biodata in Maithili',
      'Maithili culture',
    ],
    telephone: `+${SUPPORT_PHONE_E164}`,
    email: SUPPORT_EMAIL,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${SUPPORT_PHONE_E164}`,
      email: SUPPORT_EMAIL,
      contactType: 'customer support',
      availableLanguage: ['English', 'Hindi', 'Maithili'],
      areaServed: 'IN',
    },
  }
}

/** A reference to the organisation, for publisher / author slots. */
export function organizationRef() {
  return { '@id': ORGANIZATION_ID }
}
