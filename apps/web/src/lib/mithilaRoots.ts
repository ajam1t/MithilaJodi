/**
 * The gotras and mools of the Mithila Panji, for the public guide pages at
 * /gotra, /gotra/[slug] and /mool.
 *
 * The lists match the profile options in community_masters (migration
 * 20260907000001_maithil_gotra_mool_masters), so a family reading a guide
 * page sees the same names the profile form offers. The traditional rules
 * stated here are the ones the Journal's same-gotra article and the match
 * score (lib/matchScore) already use — keep the three in step.
 *
 * Lineage notes are given only where the rishi's identity is widely
 * attested; the other gotras get no note rather than an invented one.
 */

export type Gotra = {
  slug: string
  /** As the profile form shows it. */
  name: string
  deva: string
  /** Other spellings families write, for the page copy (and searchers). */
  aliases: string[]
  /** One or two sentences on the rishi, only where well attested. */
  lineage?: string
}

export const GOTRAS: Gotra[] = [
  { slug: 'vatsa', name: 'Vatsa', deva: 'वत्स', aliases: ['Vats', 'Vatsya'], lineage: 'Vatsa gotra traces its line to Rishi Vatsa.' },
  { slug: 'shandilya', name: 'Shandilya', deva: 'शाण्डिल्य', aliases: ['Sandilya', 'Shandily'], lineage: 'Shandilya gotra traces its line to Rishi Shandilya, whose teaching on Brahman — the Shandilya Vidya — is preserved in the Chandogya Upanishad.' },
  { slug: 'kashyapa', name: 'Kashyapa', deva: 'काश्यप', aliases: ['Kashyap', 'Kasyap', 'Kashyab'], lineage: 'Kashyapa gotra traces its line to Rishi Kashyapa, counted among the Saptarishi, the seven great sages of the Vedic tradition.' },
  { slug: 'parashara', name: 'Parashara', deva: 'पराशर', aliases: ['Parashar', 'Parasar'], lineage: 'Parashara gotra traces its line to Rishi Parashara — in the tradition, the grandson of Rishi Vashishtha and the father of Veda Vyasa.' },
  { slug: 'katyayana', name: 'Katyayana', deva: 'कात्यायन', aliases: ['Katyayan', 'Katyayn'], lineage: 'Katyayana gotra traces its line to Rishi Katyayana.' },
  { slug: 'bharadwaja', name: 'Bharadwaja', deva: 'भारद्वाज', aliases: ['Bharadwaj', 'Bhardwaj', 'Bharadvaja'], lineage: 'Bharadwaja gotra traces its line to Rishi Bharadwaja, one of the Saptarishi, to whom many hymns of the sixth book of the Rigveda are attributed.' },
  { slug: 'savarna', name: 'Savarna', deva: 'सावर्ण', aliases: ['Savarn', 'Sawarna'] },
  { slug: 'gargya', name: 'Gargya', deva: 'गार्ग्य', aliases: ['Garg', 'Garga'], lineage: 'Gargya gotra traces its line to Rishi Garga.' },
  { slug: 'kaushika', name: 'Kaushika', deva: 'कौशिक', aliases: ['Kaushik', 'Koushik'], lineage: 'Kaushika gotra is the line of Kushika, from which Rishi Vishvamitra came; the third book of the Rigveda is attributed to Vishvamitra.' },
  { slug: 'alambukasha', name: 'Alambukasha', deva: 'अलम्बुकाश', aliases: ['Alambukaksha'] },
  { slug: 'krishnatreya', name: 'Krishnatreya', deva: 'कृष्णात्रेय', aliases: ['Krishnayan', 'Krishnatrey'] },
  { slug: 'gautama', name: 'Gautama', deva: 'गौतम', aliases: ['Gautam', 'Gotam'], lineage: 'Gautama gotra traces its line to Rishi Gautama, one of the Saptarishi. In Mithila the sage is remembered at Ahalya Asthan in Darbhanga district, associated by tradition with his wife Ahalya.' },
  { slug: 'maudgalya', name: 'Maudgalya', deva: 'मौद्गल्य', aliases: ['Maudgal', 'Moudgalya', 'Mudgal'], lineage: 'Maudgalya gotra traces its line to Rishi Mudgala.' },
  { slug: 'vashishtha', name: 'Vashishtha', deva: 'वशिष्ठ', aliases: ['Vashisht', 'Vasishtha', 'Vashist'], lineage: 'Vashishtha gotra traces its line to Rishi Vashishtha, one of the Saptarishi, to whom the seventh book of the Rigveda is attributed.' },
  { slug: 'kaundinya', name: 'Kaundinya', deva: 'कौण्डिन्य', aliases: ['Kaundilya', 'Kondinya'], lineage: 'Kaundinya gotra traces its line to Rishi Kaundinya.' },
  { slug: 'upamanyu', name: 'Upamanyu', deva: 'उपमन्यु', aliases: ['Upmanyu'], lineage: 'Upamanyu gotra traces its line to Rishi Upamanyu.' },
  { slug: 'kapila', name: 'Kapila', deva: 'कपिल', aliases: ['Kapil'], lineage: 'Kapila gotra traces its line to Rishi Kapila.' },
  { slug: 'vishnuvriddhi', name: 'Vishnuvriddhi', deva: 'विष्णुवृद्धि', aliases: ['Vishnu Vriddhi', 'Vishnubriddhi'] },
  // The URL slug follows the name the page shows; the profile value in
  // community_masters is still 'tandi' (the alias keeps it matching).
  { slug: 'tandilya', name: 'Tandilya', deva: 'ताण्डिल्य', aliases: ['Tandi', 'Tandil'] },
  { slug: 'jatukarnya', name: 'Jatukarnya', deva: 'जातुकर्ण्य', aliases: ['Jatukarna', 'Jatukarn'] },
]

export const getGotra = (slug: string) => GOTRAS.find(g => g.slug === slug)

/**
 * Whether a gotra's guide page is worth indexing. Without a lineage note the
 * page is the shared template with only the name changed, so it is served
 * `noindex, follow` and left out of the sitemap and llms.txt. To re-enable a
 * gotra, add its (well-attested) `lineage` above — nothing else needs changing.
 */
export const isIndexableGotra = (g: Gotra) => !!g.lineage

/** The gotras whose pages are indexable — the ones the sitemap and llms.txt list. */
export const INDEXABLE_GOTRAS = GOTRAS.filter(isIndexableGotra)

/** Distinct alternative spellings, without the name itself. */
export const gotraAliases = (g: Gotra) => [...new Set(g.aliases)].filter(a => a.toLowerCase() !== g.name.toLowerCase())

/** The mools of the Mithila Panji, as the profile form lists them (spelling variants kept). */
export const MOOLS: string[] = [
  'Ahpur', 'Alhona', 'Allari', 'Auriba', 'Bahibhat', 'Baliasaya',
  'Bareba', 'Basamaya', 'Basha', 'Bhataur', 'Bhigual', 'Bigua',
  'Biranama', 'Bisapi', 'Brahmapur', 'Brahmapura', 'Budhaur', 'Budhaura',
  'Budhvaraya', 'Busawala', 'Chhatauni', 'Chhatiman', 'Chhattis Karmah', 'Dahibhat',
  'Damakatari', 'Dariharaya', 'Digho', 'Digho Uttampur', 'Ekhara', 'Ekharaya',
  'Gangoli / Gangauli', 'Gangor', 'Gangouli', 'Gangoura', 'Gangual', 'Ganguara',
  'Ghosiyam', 'Ghosiyama', 'Ghusautaya', 'Gorhara', 'Hariambaya', 'Hoiar',
  'Hoiara', 'Jagati', 'Jajiwal', 'Jalaki', 'Jallaki', 'Jamugam',
  'Jamugama', 'Kaligama', 'Karahiya', 'Karama', 'Karhiwar', 'Karion',
  'Karmah / Karmahaya', 'Karmahaya', 'Kataya', 'Katayi', 'Kauthue', 'Khandavala',
  'Khandwala', 'Kharambha Ahapur', 'Kharhauraya', 'Khauarayaya', 'Kodaria', 'Kodariya',
  'Koiara', 'Koiyar', 'Kothua', 'Kujolibaraya', 'Machhwal', 'Mahesari',
  'Mahua', 'Malichha', 'Mandam', 'Mandaraya', 'Mararh', 'Mararha',
  'Mataur', 'Meni', 'Merandi', 'Nanaur', 'Nanauti', 'Nanpur',
  'Naraunaya', 'Naruon', 'Nikuti', 'Nonouti', 'Oini', 'Oriya',
  'Paboli / Pavauli', 'Paboulivaraya', 'Palivaraya', 'Pandaul', 'Pandauli', 'Pandouli',
  'Pandua', 'Panibala', 'Panichobh', 'Panichobhaya', 'Panisara', 'Parasanda',
  'Parisara', 'Parsanda', 'Paruva', 'Phanda', 'Piparauna', 'Ratwal',
  'Rayorha', 'Sajhuar', 'Sakarhola', 'Sakona', 'Sambuala', 'Sandepur',
  'Sandupadoli', 'Sarisab / Sarisav', 'Sarouni', 'Satlakha', 'Sauripali', 'Simbalabh',
  'Simbalamba', 'Simhashram', 'Singasama', 'Sodarpur', 'Souni', 'Suari',
  'Surauro', 'Surgana', 'Talhanpura', 'Tankvalaya / Takwaal', 'Tapanpur', 'Telhanpur',
  'Tilaimahar / Tilayi', 'Tilayi', 'Tisautaya', 'Tisuri', 'Ujativara', 'Uttamapur',
  'Uttampur', 'Vrishtiwal',
]

/**
 * Spellings in MOOLS that are plainly one mool. Only obvious variants are
 * grouped — a doubled letter, a trailing -a/-aya, au/ou — never two names that
 * merely look alike, since the Panji does record distinct mools with close names.
 * The first spelling is the one shown; the rest are listed beside it.
 */
const MOOL_VARIANTS: string[][] = [
  ['Brahmapur', 'Brahmapura'],
  ['Budhaur', 'Budhaura'],
  ['Ekhara', 'Ekharaya'],
  ['Gangoli / Gangauli', 'Gangouli'],
  ['Ghosiyam', 'Ghosiyama'],
  ['Hoiar', 'Hoiara'],
  ['Jalaki', 'Jallaki'],
  ['Jamugam', 'Jamugama'],
  ['Karmah / Karmahaya', 'Karmahaya'],
  ['Khandwala', 'Khandavala'],
  ['Kodaria', 'Kodariya'],
  ['Mararh', 'Mararha'],
  ['Pandaul', 'Pandauli', 'Pandouli'],
  ['Panichobh', 'Panichobhaya'],
  ['Parsanda', 'Parasanda'],
  ['Tilaimahar / Tilayi', 'Tilayi'],
  ['Uttampur', 'Uttamapur'],
]

export type MoolGroup = { name: string; variants: string[] }

/**
 * MOOLS with spelling variants folded together, alphabetical — for the /mool
 * page, whose count is the number of distinct mools rather than spellings.
 * MOOLS itself stays flat for anything matching on a single spelling.
 */
export const MOOL_GROUPS: MoolGroup[] = (() => {
  const grouped = new Map<string, string>()
  for (const [name, ...rest] of MOOL_VARIANTS) rest.forEach(v => grouped.set(v, name))
  const groups = new Map<string, MoolGroup>()
  for (const m of MOOLS) {
    const name = grouped.get(m) ?? m
    const g = groups.get(name) ?? { name, variants: [] }
    // A spelling already written into a combined name ("Karmah / Karmahaya") is not repeated.
    if (m !== name && !name.split(' / ').includes(m)) g.variants.push(m)
    groups.set(name, g)
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name))
})()

export type GotraVerdict =
  | { kind: 'incomplete' }
  | { kind: 'unknown' }
  | { kind: 'sagotra'; gotra: string }
  | { kind: 'maternal'; gotra: string; whose: 'yours' | 'theirs' }
  | { kind: 'clear' }

/**
 * The two traditional checks, as the Journal states them: the paternal gotras
 * must differ (sagotra is avoided), and — in stricter practice — neither
 * side's paternal gotra should be the other side's maternal gotra.
 */
export function checkGotras(a: { self?: string; maternal?: string }, b: { self?: string; maternal?: string }): GotraVerdict {
  if (!a.self || !b.self) return { kind: 'incomplete' }
  if (a.self === 'other' || b.self === 'other') return { kind: 'unknown' }
  const name = (slug: string) => getGotra(slug)?.name ?? slug
  if (a.self === b.self) return { kind: 'sagotra', gotra: name(a.self) }
  if (b.self === a.maternal) return { kind: 'maternal', gotra: name(b.self), whose: 'yours' }
  if (a.self === b.maternal) return { kind: 'maternal', gotra: name(a.self), whose: 'theirs' }
  return { kind: 'clear' }
}
