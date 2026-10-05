/**
 * Every word the invitation itself says, in each invitation language.
 *
 * Only system text lives here — headings, buttons, labels, countdown units,
 * default messages. What the couple types (names, story, ceremonies, family
 * message) is shown exactly as written and never translated.
 *
 * To add a language: add its code to LANGS, a label to LANG_LABEL, and a
 * dictionary. Any missing string falls back to English, so a partial
 * dictionary can never show a key, `undefined` or an empty button.
 */

export const LANGS = ['hi', 'en', 'mai', 'sa'] as const
export type Lang = (typeof LANGS)[number]

export const LANG_LABEL: Record<Lang, string> = { hi: 'हिन्दी', en: 'English', mai: 'मैथिली', sa: 'संस्कृत' }
/** BCP 47 tags for the lang attribute. */
export const LANG_TAG: Record<Lang, string> = { hi: 'hi', en: 'en', mai: 'mai', sa: 'sa' }

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v)

const en = {
  invitation: 'Wedding Invitation',
  shubhVivah: 'Shubh Vivah',
  openCta: 'Open Invitation',
  openHint: 'Tap the seal to open',
  skip: 'Skip',
  replay: 'Open again',
  viewInvitation: 'View invitation',
  and: 'and',
  language: 'Language',
  bridePlaceholder: 'Bride',
  groomPlaceholder: 'Groom',

  coupleTitle: 'The Bride & Groom',
  bride: 'Bride',
  groom: 'Groom',
  storyTitle: 'Our Story',
  mithilaTitle: 'Our Mithila Roots',
  brideSide: 'The Bride’s Family',
  groomSide: 'The Groom’s Family',
  field_gram: 'Native village',
  field_jila: 'District',
  field_mool: 'Mool',
  field_gotra: 'Gotra',
  field_matrikGotra: 'Maternal gotra',
  field_parivar: 'Family',

  countdownTitle: 'Counting down to the wedding',
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  countdownAria: '{d} days, {h} hours and {m} minutes to go',
  today: 'Today is our wedding day ❤️',
  married: 'Shubh Vivah ❤️',

  eventsTitle: 'Wedding Ceremonies',
  venueTitle: 'The Venue',
  directions: 'Get directions on Google Maps',
  dressCode: 'Dress code',
  mapOf: 'Map of {venue}',

  rsvpTitle: 'Kindly Respond',
  rsvpBy: 'Kindly respond by {date}',
  rsvpQuestion: 'Will you be attending the wedding?',
  rsvpYes: 'Yes, gladly ❤️',
  rsvpMaybe: 'Maybe',
  rsvpNo: 'Unable to attend',
  yourName: 'Your name (optional)',
  howMany: 'How many of you will come?',
  oneFewer: 'One fewer',
  oneMore: 'One more',
  replyTo: 'Your reply goes on WhatsApp to {name}.',
  theFamily: 'the family',
  msgSubject: '{couple} — Wedding Invitation',
  msgYes: 'We will be there ❤️',
  msgMaybe: 'We will do our best to come 🙂',
  msgNo: 'Sorry, we won’t be able to come 🙏 — warmest wishes ❤️',
  msgGuests: 'We will be {n} of us.',

  familyTitle: 'With Blessings From',
  brideParents: 'The Bride’s Parents',
  groomParents: 'The Groom’s Parents',

  shareTitle: 'Share this invitation with family and friends',
  whatsapp: 'Send on WhatsApp',
  copyLink: 'Copy link',
  copied: 'Link copied ✓',
  shareMore: 'Share…',
  shareText: '💍 You’re invited!\n\n{couple} are getting married ❤️\n\nView their wedding invitation:\n{url}\n\nWe would love to celebrate this special day with you! ❤️',
  shareTitleNative: '{couple} — Wedding Invitation',

  madeWith: 'Made with ❤️ on {brand}',
  tagline: 'Where tradition meets love.',
  createOwn: 'Create your own Mithila wedding invitation →',
  footerNote: 'Made by the couple with Mithila Jodi’s free invitation maker.',
  report: 'Report this invitation',

  metaInvite: '{couple} warmly invite you to their wedding',
}

export type WeddingStrings = typeof en
type Key = keyof WeddingStrings

const hi: Partial<WeddingStrings> = {
  invitation: 'विवाह आमंत्रण',
  shubhVivah: 'शुभ विवाह',
  openCta: 'निमंत्रण खोलें ❤️',
  openHint: 'खोलने के लिए मुहर को स्पर्श करें',
  skip: 'छोड़ें',
  replay: 'फिर से खोलें',
  viewInvitation: 'निमंत्रण देखें',
  and: 'और',
  language: 'भाषा',
  bridePlaceholder: 'वधू',
  groomPlaceholder: 'वर',

  coupleTitle: 'वर-वधू',
  bride: 'वधू',
  groom: 'वर',
  storyTitle: 'हमारी कहानी',
  mithilaTitle: 'हमारी मिथिला',
  brideSide: 'वधू पक्ष',
  groomSide: 'वर पक्ष',
  field_gram: 'पैतृक गाँव',
  field_jila: 'ज़िला',
  field_mool: 'मूल',
  field_gotra: 'गोत्र',
  field_matrikGotra: 'मातृ गोत्र',
  field_parivar: 'परिवार',

  countdownTitle: 'शुभ विवाह में अब बस…',
  days: 'दिन',
  hours: 'घंटे',
  minutes: 'मिनट',
  seconds: 'सेकंड',
  countdownAria: 'विवाह में {d} दिन, {h} घंटे और {m} मिनट शेष',
  today: 'आज हमारा शुभ विवाह है ❤️',
  married: 'शुभ विवाह सम्पन्न ❤️',

  eventsTitle: 'विवाह कार्यक्रम',
  venueTitle: 'विवाह स्थल',
  directions: 'Google Maps पर रास्ता देखें',
  dressCode: 'परिधान',
  mapOf: '{venue} का नक्शा',

  rsvpTitle: 'उपस्थिति की पुष्टि',
  rsvpBy: 'कृपया {date} तक उत्तर दें',
  rsvpQuestion: 'क्या आप विवाह में उपस्थित होंगे?',
  rsvpYes: 'हाँ, अवश्य ❤️',
  rsvpMaybe: 'शायद',
  rsvpNo: 'उपस्थित नहीं हो सकूँगा',
  yourName: 'आपका नाम (वैकल्पिक)',
  howMany: 'आप कितने लोग आएँगे?',
  oneFewer: 'एक कम',
  oneMore: 'एक और',
  replyTo: 'आपका उत्तर WhatsApp पर {name} तक पहुँचेगा।',
  theFamily: 'परिवार',
  msgSubject: '{couple} — विवाह आमंत्रण',
  msgYes: 'हम अवश्य आएँगे ❤️',
  msgMaybe: 'हम आने का पूरा प्रयास करेंगे 🙂',
  msgNo: 'क्षमा करें, हम नहीं आ पाएँगे 🙏 — हार्दिक शुभकामनाएँ ❤️',
  msgGuests: 'हम {n} लोग आएँगे।',

  familyTitle: 'शुभाशीर्वाद सहित',
  brideParents: 'वधू के माता-पिता',
  groomParents: 'वर के माता-पिता',

  shareTitle: 'अपने परिजनों और मित्रों को निमंत्रण भेजें',
  whatsapp: 'WhatsApp पर निमंत्रण भेजें',
  copyLink: 'लिंक कॉपी करें',
  copied: 'लिंक कॉपी हो गया ✓',
  shareMore: 'साझा करें…',
  shareText: '💍 आप सादर आमंत्रित हैं!\n\n{couple} विवाह के पवित्र बंधन में बंध रहे हैं ❤️\n\nविवाह निमंत्रण देखें:\n{url}\n\nइस शुभ दिन पर आपके साथ की प्रतीक्षा रहेगी! ❤️',
  shareTitleNative: '{couple} — विवाह आमंत्रण',

  madeWith: '{brand} पर ❤️ से बनाया गया',
  tagline: 'जहाँ परम्परा और प्रेम मिलते हैं।',
  createOwn: 'अपना मिथिला विवाह निमंत्रण बनाएँ →',
  footerNote: 'यह निमंत्रण युगल ने मिथिला जोड़ी के निःशुल्क निमंत्रण-निर्माता से बनाया है।',
  report: 'इस निमंत्रण की शिकायत करें',

  metaInvite: '{couple} आपको अपने विवाह में सादर आमंत्रित करते हैं',
}

const mai: Partial<WeddingStrings> = {
  invitation: 'विवाह निमंत्रण',
  shubhVivah: 'शुभ विवाह',
  openCta: 'निमंत्रण खोलू ❤️',
  openHint: 'खोलबाक लेल मोहर छुबू',
  skip: 'छोड़ू',
  replay: 'फेर सँ खोलू',
  viewInvitation: 'निमंत्रण देखू',
  and: 'आ',
  language: 'भाषा',
  bridePlaceholder: 'वधू',
  groomPlaceholder: 'वर',

  coupleTitle: 'वर-वधू',
  bride: 'वधू',
  groom: 'वर',
  storyTitle: 'हमर कहानी',
  mithilaTitle: 'हमर मिथिला',
  brideSide: 'वधू पक्ष',
  groomSide: 'वर पक्ष',
  field_gram: 'गाम',
  field_jila: 'जिला',
  field_mool: 'मूल',
  field_gotra: 'गोत्र',
  field_matrikGotra: 'मातृक गोत्र',
  field_parivar: 'परिवार',

  countdownTitle: 'विवाहमे आब बस…',
  days: 'दिन',
  hours: 'घंटा',
  minutes: 'मिनट',
  seconds: 'सेकेंड',
  countdownAria: 'विवाहमे {d} दिन, {h} घंटा आ {m} मिनट बाँकी',
  today: 'आज हमर शुभ विवाह ❤️',
  married: 'शुभ विवाह सम्पन्न ❤️',

  eventsTitle: 'विवाहक कार्यक्रम',
  venueTitle: 'विवाह स्थल',
  directions: 'Google Maps पर रस्ता देखू',
  dressCode: 'पहिरन',
  mapOf: '{venue}क नक्शा',

  rsvpTitle: 'उपस्थितिक पुष्टि',
  rsvpBy: 'कृपया {date} धरि उत्तर दिअ',
  rsvpQuestion: 'अहाँ विवाहमे आबि रहल छी?',
  rsvpYes: 'हँ, अवश्य ❤️',
  rsvpMaybe: 'प्रयास करब',
  rsvpNo: 'नहि आबि सकब',
  yourName: 'अहाँक नाम (वैकल्पिक)',
  howMany: 'अहाँ सभ कतेक गोटे आएब?',
  oneFewer: 'एक गोटे कम',
  oneMore: 'एक गोटे आर',
  replyTo: 'अहाँक उत्तर WhatsApp पर {name} लग पहुँचत।',
  theFamily: 'परिवार',
  msgSubject: '{couple} — विवाह निमंत्रण',
  msgYes: 'हम अवश्य आएब ❤️',
  msgMaybe: 'हम आबैक पूरा प्रयास करब 🙂',
  msgNo: 'क्षमा करब, हम नहि आबि सकब 🙏 — बहुत-बहुत शुभकामना ❤️',
  msgGuests: 'हम सभ {n} गोटे आएब।',

  familyTitle: 'शुभाशीर्वादक संग',
  brideParents: 'वधूक माता-पिता',
  groomParents: 'वरक माता-पिता',

  shareTitle: 'अपन परिजन आ मित्र सभकेँ निमंत्रण पठाउ',
  whatsapp: 'WhatsApp पर निमंत्रण पठाउ',
  copyLink: 'लिंक कॉपी करू',
  copied: 'लिंक कॉपी भ’ गेल ✓',
  shareMore: 'साझा करू…',
  shareText: '💍 अहाँ सादर आमंत्रित छी!\n\n{couple}क शुभ विवाह भ रहल अछि ❤️\n\nविवाहक निमंत्रण देखू:\n{url}\n\nएहि शुभ दिन पर अहाँक संग पाबि हम सभ धन्य होएब! ❤️',
  shareTitleNative: '{couple} — विवाह निमंत्रण',

  madeWith: '{brand} पर ❤️ सँ बनाओल गेल',
  tagline: 'जतय परम्परा आ प्रेम एक भेल।',
  createOwn: 'अपन मिथिला विवाह निमंत्रण बनाउ →',
  footerNote: 'ई निमंत्रण युगल मिथिला जोड़ीक निःशुल्क निमंत्रण-निर्माता सँ बनौलनि अछि।',
  report: 'एहि निमंत्रणक शिकायत करू',

  metaInvite: '{couple} अहाँकेँ अपन विवाहमे सादर आमंत्रित करैत छथि',
}

const sa: Partial<WeddingStrings> = {
  invitation: 'विवाहामन्त्रणम्',
  shubhVivah: 'शुभविवाहः',
  openCta: 'आमन्त्रणम् उद्घाटयन्तु ❤️',
  openHint: 'उद्घाटनाय मुद्रां स्पृशन्तु',
  skip: 'अग्रे',
  replay: 'पुनः उद्घाटयन्तु',
  viewInvitation: 'आमन्त्रणं पश्यन्तु',
  and: 'च',
  language: 'भाषा',
  bridePlaceholder: 'वधूः',
  groomPlaceholder: 'वरः',

  coupleTitle: 'वरवधू',
  bride: 'वधूः',
  groom: 'वरः',
  storyTitle: 'अस्माकं कथा',
  mithilaTitle: 'अस्माकं मिथिला',
  brideSide: 'वधूपक्षः',
  groomSide: 'वरपक्षः',
  field_gram: 'मूलग्रामः',
  field_jila: 'जनपदः',
  field_mool: 'मूलम्',
  field_gotra: 'गोत्रम्',
  field_matrikGotra: 'मातृगोत्रम्',
  field_parivar: 'कुटुम्बम्',

  countdownTitle: 'शुभविवाहाय अवशिष्टः कालः',
  days: 'दिवसाः',
  hours: 'होराः',
  minutes: 'कलाः',
  seconds: 'विकलाः',
  countdownAria: 'विवाहाय {d} दिवसाः {h} होराः {m} कलाः च अवशिष्टाः',
  today: 'अद्य अस्माकं शुभविवाहः ❤️',
  married: 'शुभविवाहः सम्पन्नः ❤️',

  eventsTitle: 'विवाहसंस्काराः',
  venueTitle: 'विवाहस्थलम्',
  directions: 'Google Maps इत्यत्र मार्गं पश्यन्तु',
  dressCode: 'वेषः',
  mapOf: '{venue} — मानचित्रम्',

  rsvpTitle: 'उपस्थितेः पुष्टिः',
  rsvpBy: '{date} पर्यन्तं प्रत्युत्तरं ददतु',
  rsvpQuestion: 'किं भवान् विवाहे उपस्थितः भविष्यति?',
  rsvpYes: 'आम्, अवश्यम् ❤️',
  rsvpMaybe: 'प्रयतिष्ये',
  rsvpNo: 'उपस्थातुं न शक्ष्यामि',
  yourName: 'भवतः नाम (ऐच्छिकम्)',
  howMany: 'कति जनाः आगमिष्यन्ति?',
  oneFewer: 'एकः न्यूनः',
  oneMore: 'एकः अधिकः',
  replyTo: 'भवतः उत्तरं WhatsApp द्वारा {name} प्रति गमिष्यति।',
  theFamily: 'कुटुम्बम्',
  msgSubject: '{couple} — विवाहामन्त्रणम्',
  msgYes: 'वयम् अवश्यम् आगमिष्यामः ❤️',
  msgMaybe: 'आगन्तुं प्रयतिष्यामहे 🙂',
  msgNo: 'क्षम्यताम्, आगन्तुं न शक्ष्यामः 🙏 — शुभाशयाः ❤️',
  msgGuests: 'वयं {n} जनाः आगमिष्यामः।',

  familyTitle: 'शुभाशीर्भिः सह',
  brideParents: 'वध्वाः पितरौ',
  groomParents: 'वरस्य पितरौ',

  shareTitle: 'स्वजनेभ्यः मित्रेभ्यः च आमन्त्रणं प्रेषयन्तु',
  whatsapp: 'WhatsApp द्वारा आमन्त्रणं प्रेषयन्तु',
  copyLink: 'लिङ्कं प्रतिलिखन्तु',
  copied: 'लिङ्कः प्रतिलिखितः ✓',
  shareMore: 'अन्यत्र प्रेषयन्तु…',
  shareText: '💍 भवन्तः सादरम् आमन्त्रिताः!\n\n{couple} इत्यनयोः शुभविवाहः ❤️\n\nविवाहामन्त्रणं पश्यन्तु:\n{url}\n\nअस्मिन् मङ्गलदिने भवतां सान्निध्यम् अपेक्षामहे! ❤️',
  shareTitleNative: '{couple} — विवाहामन्त्रणम्',

  madeWith: '{brand} इत्यत्र ❤️ सह निर्मितम्',
  tagline: 'यत्र परम्परा प्रेम्णा मिलति',
  createOwn: 'स्वकीयं मिथिलाविवाहामन्त्रणं रचयन्तु →',
  footerNote: 'इदम् आमन्त्रणं दम्पतिभ्यां मिथिला जोडी इत्यस्य निःशुल्कसाधनेन रचितम्।',
  report: 'अस्य आमन्त्रणस्य विषये सूचयन्तु',

  metaInvite: '{couple} स्वविवाहे भवतः सादरम् आमन्त्रयतः',
}

const DICT: Record<Lang, Partial<WeddingStrings>> = { en, hi, mai, sa }

/** One string, with {placeholders} filled in. Falls back to English, never to the key. */
export function wt(lang: Lang, key: Key, vars: Record<string, string | number> = {}): string {
  const raw = DICT[lang]?.[key] ?? en[key]
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : ''))
}

/** A bound translator for one language. */
export function translator(lang: Lang) {
  return (key: Key, vars?: Record<string, string | number>) => wt(lang, key, vars)
}

// ─── Dates, times and numerals ──────────────────────────────────────────────

const MONTHS: Record<Lang, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
  mai: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'],
  sa: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'],
}
const WEEKDAYS: Record<Lang, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
  mai: ['रविदिन', 'सोमदिन', 'मंगलदिन', 'बुधदिन', 'बृहस्पतिदिन', 'शुक्रदिन', 'शनिदिन'],
  sa: ['रविवासरः', 'सोमवासरः', 'मङ्गलवासरः', 'बुधवासरः', 'गुरुवासरः', 'शुक्रवासरः', 'शनिवासरः'],
}

const DEVA_DIGITS = '०१२३४५६७८९'
/** Sanskrit is written with Devanagari numerals; the other languages use 0–9, as Indian invitations usually do. */
export function num(lang: Lang, n: number | string): string {
  const s = String(n)
  return lang === 'sa' ? s.replace(/\d/g, d => DEVA_DIGITS[Number(d)]) : s
}

function ymd(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}
const isIso = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso)

/** '2026-11-25' → '25 November 2026' / '25 नवंबर 2026' / '२५ नवम्बर २०२६' */
export function dateL(lang: Lang, iso: string): string {
  if (!isIso(iso)) return ''
  const { y, m, d } = ymd(iso)
  return `${num(lang, d)} ${MONTHS[lang][m - 1]} ${num(lang, y)}`
}

export function weekdayL(lang: Lang, iso: string): string {
  return isIso(iso) ? WEEKDAYS[lang][ymd(iso).wd] : ''
}

/** '19:30' → '7:30 PM' / 'सायं 7:30 बजे' / 'साँझ 7:30 बजे' / 'सायं ७:३० वादने' */
export function timeL(lang: Lang, hhmm: string): string {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const clock = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`
  if (lang === 'en') return `${clock} ${h < 12 ? 'AM' : 'PM'}`
  const part = (labels: [string, string, string, string]) => (h < 4 || h >= 20 ? labels[3] : h < 12 ? labels[0] : h < 16 ? labels[1] : labels[2])
  if (lang === 'hi') return `${part(['प्रातः', 'दोपहर', 'सायं', 'रात्रि'])} ${clock} बजे`
  if (lang === 'mai') return `${part(['भोर', 'दुपहर', 'साँझ', 'राति'])} ${clock} बजे`
  return `${part(['प्रातः', 'मध्याह्ने', 'सायं', 'रात्रौ'])} ${num('sa', clock)} वादने`
}
