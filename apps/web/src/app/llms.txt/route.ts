import { SITE_URL } from '@/lib/constants'
import { FESTIVALS, festivalsWithSongs } from '@/lib/festivals'
import { ASTROLOGY_TOOLS, PILLARS } from '@/lib/journal'
import { ENTITY_SUMMARY } from '@/lib/seo'
import { INDEXABLE_GOTRAS } from '@/lib/mithilaRoots'
import { COMPETITORS } from '@/lib/compare'
import { BIODATA_LANGUAGE_PAGES } from '@/lib/biodataLanguagePages'

/*
 * /llms.txt — a plain-text map of the site for AI assistants and other
 * machine readers (the llmstxt.org convention). It says nothing the pages do
 * not: the same one-sentence identity as the Organization JSON-LD, then the
 * public sections with their real URLs, built from the same data the pages
 * use so it cannot drift. Private areas (member pages, shared /p/ links) are
 * deliberately absent.
 */

export const dynamic = 'force-static'

function body(): string {
  const u = (path: string) => `${SITE_URL}${path}`
  const lines = [
    '# Mithila Jodi',
    '',
    `> ${ENTITY_SUMMARY}`,
    '',
    'Mithila Jodi is for people and families connected to the Mithila (Maithili) community, mainly in India. Matrimony is its purpose; the other resources support the marriage journey and Mithila culture.',
    '',
    '## Matrimony',
    `- [Mithila matrimonial profiles](${u('/explore')}): browse Maithil bride and groom profiles; members sign up free to search and send interests.`,
    `- [Digital Profile](${u('/digital-profile')}): a shareable matrimonial profile, sent as a private link the owner controls.`,
    `- [Safety & verification](${u('/safety')}): what verification checks and how to report a profile.`,
    `- [Pricing](${u('/pricing')}): Mithila Jodi is currently free for every member.`,
    `- [Mithila Jodi vs all-India matrimony sites](${u('/compare')}): free for every member, built around gotra, mool and gram, gotra checked in every match.`,
    ...COMPETITORS.map(c => `  - [${c.name} alternative for Maithil families](${u(`/compare/${c.slug}`)})`),
    '',
    '## Wedding resources',
    `- [Marriage Biodata Maker](${u('/marriage-biodata')}): a free marriage biodata in Maithili, Hindi, English or Sanskrit, with gotra, mool and gram; downloads as a PDF, no login.`,
    ...BIODATA_LANGUAGE_PAGES.map(l => `  - [Marriage biodata in ${l.name}](${u(`/marriage-biodata/${l.slug}`)}): the biodata's field names in ${l.name} beside English, and the maker opened in ${l.name}.`),
    `- [Maithil Gotra List](${u('/gotra')}): the 20 gotras of the Mithila Panji in English and Devanagari, with a free same-gotra / maternal-gotra match checker.`,
    // Only gotras whose page has a lineage note; the rest are noindex (lib/mithilaRoots isIndexableGotra).
    ...INDEXABLE_GOTRAS.map(g => `  - [${g.name} gotra](${u(`/gotra/${g.slug}`)}): origin, marriage rules and the gotras it can match with.`),
    `- [Maithil Mool List](${u('/mool')}): the mools of the Mithila Panji, and how mool differs from gotra and gram.`,
    `- [Match Score](${u('/match-score')}): how Mithila Jodi scores every rishta — nine weighted factors (location, gotra and maternal gotra, age, community, marriage timeline, lifestyle, family roots, education, family) from both profiles and both families' preferences; same-gotra pairs are capped so they never read as a good match, blank fields are never scored, and every score lists its reasons. A transparent rule-based calculation, not machine learning.`,
    `- [Wedding Invitations](${u('/marriage-invitation')}): a free Mithila-inspired invitation card (${u('/marriage-invitation/basic')}) a Mithila Premium wedding webpage (${u('/marriage-invitation/premium')}), the MJ Scratch & Reveal wedding webpage, opened by scratching the date free (${u('/marriage-invitation/scratch-reveal')}), or the Blush Lace Elegance wedding webpage in blush, ivory and lace (${u('/marriage-invitation/blush-lace')}).`,
    '',
    '## Astrology tools for marriage',
    `Free tools families use during the marriage conversation, with the method explained on each page. They are for understanding, not predictions or guarantees. Hub: ${u('/astrology')}`,
    ...ASTROLOGY_TOOLS.map(t => `- [${t.title}](${u(t.href)}): ${t.subtitle}.`),
    '',
    '## Mithila festivals and songs',
    `- [Mithila Festivals](${u('/festivals')}): guides to the festivals Mithila keeps, with their stories, rituals and Mithila significance.`,
    ...FESTIVALS.map(f => `- [${f.name}](${u(`/festivals/${f.slug}`)}): ${f.tagline}. Season: ${f.season}.`),
    `- [Festival Songs](${u('/festival-songs')}): Maithili festival geet, played from their publishers' videos.`,
    ...festivalsWithSongs().map(f => `  - [${f.name.split('—')[0].trim()} songs](${u(`/festival-songs/${f.slug}`)}): ${f.songs.length} Maithili geet recordings.`),
    '',
    '## Mithila Jodi Journal',
    `Articles on marriage, Mithila, family and culture: ${u('/blogs')}`,
    ...PILLARS.map(p => `- [${p.label}](${u(`/blogs/${p.slug}`)})`),
    '',
    '## About',
    `- [About Mithila Jodi](${u('/about')})`,
    `- [Help & FAQ](${u('/help')})`,
    `- [Contact](${u('/contact')})`,
    `- [Privacy Policy](${u('/legal/privacy')}) · [Terms](${u('/legal/terms')})`,
    '',
  ]
  return lines.join('\n')
}

export function GET() {
  return new Response(body(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
