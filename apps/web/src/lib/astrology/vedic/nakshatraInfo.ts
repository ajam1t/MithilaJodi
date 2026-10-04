/**
 * Traditional nakshatra reference data — deity, symbol and the name syllables
 * (akshara) of each pada from the Avakahada Chakra. Data, not logic; same
 * order as NAKSHATRAS (0 = Ashwini). Client-safe.
 *
 * The syllables are the set most commonly printed in North Indian panchangs.
 * Regional lists differ in a few places (notably Uttara Bhadrapada's fourth
 * pada); families following a different list should use theirs.
 */
import { INAUSPICIOUS_TARAS, TARA_NAMES } from '../rules/tables'
import { NAKSHATRAS, NAKSHATRA_SPAN, PADA_SPAN, type NakshatraSlug } from './zodiac'

export type NakshatraInfo = {
  deity: string
  symbol: string
  /** Four syllables, one per pada: [Devanagari, transliteration]. */
  syllables: ReadonlyArray<readonly [string, string]>
}

const S = (pairs: string): ReadonlyArray<readonly [string, string]> =>
  pairs.split(',').map(p => {
    const [hi, en] = p.trim().split(' ')
    return [hi, en] as const
  })

export const NAKSHATRA_INFO: Readonly<Record<NakshatraSlug, NakshatraInfo>> = {
  ashwini: { deity: 'Ashvini Kumaras', symbol: "Horse's head", syllables: S('चु Chu, चे Che, चो Cho, ला La') },
  bharani: { deity: 'Yama', symbol: 'Yoni (womb)', syllables: S('ली Li, लू Lu, ले Le, लो Lo') },
  krittika: { deity: 'Agni', symbol: 'Razor or flame', syllables: S('अ A, इ I, उ U, ए E') },
  rohini: { deity: 'Brahma (Prajapati)', symbol: 'Ox-cart or chariot', syllables: S('ओ O, वा Va, वी Vi, वू Vu') },
  mrigashira: { deity: 'Soma (Chandra)', symbol: "Deer's head", syllables: S('वे Ve, वो Vo, का Ka, की Ki') },
  ardra: { deity: 'Rudra', symbol: 'Teardrop', syllables: S('कु Ku, घ Gha, ङ Nga, छ Chha') },
  punarvasu: { deity: 'Aditi', symbol: 'Bow and quiver', syllables: S('के Ke, को Ko, हा Ha, ही Hi') },
  pushya: { deity: 'Brihaspati', symbol: "Cow's udder", syllables: S('हु Hu, हे He, हो Ho, डा Da') },
  ashlesha: { deity: 'Sarpa (the Nagas)', symbol: 'Coiled serpent', syllables: S('डी Di, डू Du, डे De, डो Do') },
  magha: { deity: 'Pitrs (the ancestors)', symbol: 'Royal throne', syllables: S('मा Ma, मी Mi, मू Mu, मे Me') },
  purva_phalguni: { deity: 'Bhaga', symbol: 'Front legs of a bed', syllables: S('मो Mo, टा Ta, टी Ti, टू Tu') },
  uttara_phalguni: { deity: 'Aryaman', symbol: 'Back legs of a bed', syllables: S('टे Te, टो To, पा Pa, पी Pi') },
  hasta: { deity: 'Savitr (Surya)', symbol: 'Hand', syllables: S('पू Pu, ष Sha, ण Na, ठ Tha') },
  chitra: { deity: 'Vishvakarma (Tvashtr)', symbol: 'Bright jewel', syllables: S('पे Pe, पो Po, रा Ra, री Ri') },
  swati: { deity: 'Vayu', symbol: 'Young shoot swaying in the wind', syllables: S('रू Ru, रे Re, रो Ro, ता Ta') },
  vishakha: { deity: 'Indra and Agni', symbol: 'Triumphal arch', syllables: S('ती Ti, तू Tu, ते Te, तो To') },
  anuradha: { deity: 'Mitra', symbol: 'Lotus', syllables: S('ना Na, नी Ni, नू Nu, ने Ne') },
  jyeshtha: { deity: 'Indra', symbol: 'Circular amulet', syllables: S('नो No, या Ya, यी Yi, यू Yu') },
  mula: { deity: 'Nirriti', symbol: 'Bunch of roots', syllables: S('ये Ye, यो Yo, भा Bha, भी Bhi') },
  purva_ashadha: { deity: 'Apas (the waters)', symbol: 'Winnowing fan', syllables: S('भू Bhu, धा Dha, फा Pha, ढा Dha') },
  uttara_ashadha: { deity: 'Vishvedevas', symbol: "Elephant's tusk", syllables: S('भे Bhe, भो Bho, जा Ja, जी Ji') },
  shravana: { deity: 'Vishnu', symbol: 'Ear', syllables: S('खी Khi, खू Khu, खे Khe, खो Kho') },
  dhanishta: { deity: 'The eight Vasus', symbol: 'Drum', syllables: S('गा Ga, गी Gi, गू Gu, गे Ge') },
  shatabhisha: { deity: 'Varuna', symbol: 'Empty circle', syllables: S('गो Go, सा Sa, सी Si, सू Su') },
  purva_bhadrapada: { deity: 'Aja Ekapada', symbol: 'Front of a funeral cot', syllables: S('से Se, सो So, दा Da, दी Di') },
  uttara_bhadrapada: { deity: 'Ahir Budhnya', symbol: 'Back of a funeral cot', syllables: S('दू Du, थ Tha, झ Jha, ञ Na') },
  revati: { deity: 'Pushan', symbol: 'Fish', syllables: S('दे De, दो Do, चा Cha, ची Chi') },
}

/** Start and end of nakshatra `index` and of each of its padas, in sidereal degrees. */
export function nakshatraBounds(index: number) {
  const start = index * NAKSHATRA_SPAN
  return {
    start,
    end: start + NAKSHATRA_SPAN,
    padas: [0, 1, 2, 3].map(p => ({ start: start + p * PADA_SPAN, end: start + (p + 1) * PADA_SPAN })),
  }
}

/**
 * Navatara: the 27 nakshatras counted from the Janma nakshatra in nine taras
 * of three. Taras 3, 5 and 7 are traditionally inauspicious — the same rule
 * the Tara koota uses.
 */
export function navatara(janmaIndex: number) {
  return TARA_NAMES.map((name, t) => ({
    tara: t + 1,
    name,
    auspicious: !INAUSPICIOUS_TARAS.has(t + 1),
    nakshatras: [0, 9, 18].map(cycle => NAKSHATRAS[(janmaIndex + t + cycle) % 27].slug),
  }))
}
