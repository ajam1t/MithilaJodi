/**
 * Shared biodata vocabulary and shape.
 *
 * Two surfaces render a biodata: the member tool at /biodata, which fills it
 * from a saved profile, and the public maker at /marriage-biodata, where a
 * visitor types everything and nothing is stored. Both go through
 * `BiodataData` and `BIODATA_LABELS` so the printed document is identical —
 * otherwise the two would drift into different-looking documents carrying the
 * same brand.
 *
 * No server-only imports here: the public maker is a client component.
 */

export const BIODATA_LANGUAGES = [
  { code: 'en',  label: 'English' },
  { code: 'hi',  label: 'हिन्दी' },
  { code: 'mai', label: 'मैथिली' },
  { code: 'sa',  label: 'संस्कृत' },
] as const

export type BiodataLanguage = typeof BIODATA_LANGUAGES[number]['code']

/**
 * Everything the printed document can show, already display-ready.
 *
 * Deliberately flat strings rather than the profile's own shape: the public
 * maker has no profile to draw on, and the member tool already has to map ids
 * (location, education level, profession) to names before printing.
 */
export type BiodataData = {
  full_name?: string | null
  age?: string | null
  gender?: string | null
  religion?: string | null
  caste?: string | null

  sub_caste?: string | null
  self_gotra?: string | null
  maternal_gotra?: string | null
  mool?: string | null
  gram?: string | null

  marital_status?: string | null
  mother_tongue?: string | null
  height?: string | null
  diet?: string | null
  smoking?: string | null
  drinking?: string | null
  dob?: string | null
  complexion?: string | null
  blood_group?: string | null

  education?: string | null
  profession?: string | null
  employer?: string | null
  income?: string | null

  current_location?: string | null
  native_place?: string | null

  about_me?: string | null

  father_name?: string | null
  mother_name?: string | null
  family_type?: string | null
  managed_by?: string | null
  family_values?: string | null
  parents?: string | null
  siblings?: string | null
  expectations?: string | null
  family_about?: string | null
  family_introduction?: string | null

  rashi?: string | null
  nakshatra?: string | null
  mangalik?: string | null
  birth_time?: string | null
  birth_place?: string | null
  kundli?: string | null

  mobile?: string | null
  email?: string | null
  address?: string | null
}

export type BiodataLabels = Record<string, string>

export const BIODATA_LABELS: Record<BiodataLanguage, BiodataLabels> = {
  en: {
    title: 'Biodata for Marriage',
    community: 'Community Details',
    personal: 'Personal Details',
    career: 'Education & Career',
    location: 'Location',
    about: 'About Me',
    family: 'Family Background',
    contact: 'Contact',
    astrology: 'Astrology & Birth Details',
    sub_caste: 'Sub-caste', self_gotra: 'Gotra', maternal_gotra: 'Maternal Gotra',
    mool: 'Mool', gram: 'Gram', height: 'Height', diet: 'Diet',
    smoking: 'Smoking', drinking: 'Drinking', marital_status: 'Marital Status',
    mother_tongue: 'Mother Tongue', education: 'Education',
    profession: 'Profession', employer: 'Employer',
    current_location: 'Currently in', native_place: 'Native place',
    mobile: 'Mobile', email: 'Email',
    family_type: 'Family Type', managed_by: 'Profile Managed By', family_values: 'Family Values',
    father_name: "Father's Name", mother_name: "Mother's Name",
    parents: 'Parents', siblings: 'Siblings', expectations: 'Family Expectations',
    family_introduction: 'Family Introduction',
    income: 'Income', rashi: 'Rashi', nakshatra: 'Nakshatra', mangalik: 'Mangalik',
    birth_time: 'Birth time', birth_place: 'Birth place', dob: 'Date of Birth',
    complexion: 'Complexion', blood_group: 'Blood Group',
    kundli: 'Kundli', address: 'Address',
    age: 'Age', gender: 'Gender', religion: 'Religion', caste: 'Caste', years: 'years',
  },
  mai: {
    title: 'विवाह बायोडाटा',
    community: 'समुदाय विवरण', personal: 'व्यक्तिगत विवरण',
    career: 'शिक्षा एवं करियर', location: 'स्थान',
    marital_status: 'वैवाहिक स्थिति', mother_tongue: 'मातृभाषा',
    about: 'अपने बारे में', family: 'परिवार परिचय', contact: 'संपर्क',
    astrology: 'ज्योतिष एवं जन्म विवरण',
    sub_caste: 'उपजाति', self_gotra: 'गोत्र', maternal_gotra: 'मातृ गोत्र',
    mool: 'मूल', gram: 'ग्राम', height: 'ऊँचाई', diet: 'आहार',
    smoking: 'धूम्रपान', drinking: 'मद्यपान', education: 'शिक्षा',
    profession: 'पेशा', employer: 'नियोक्ता',
    current_location: 'वर्तमान स्थान', native_place: 'मूल स्थान',
    mobile: 'मोबाइल', email: 'ईमेल',
    family_type: 'परिवार का प्रकार', managed_by: 'प्रोफ़ाइल प्रबंधक', family_values: 'पारिवारिक मूल्य',
    father_name: 'पिताक नाम', mother_name: 'माताक नाम',
    parents: 'माता-पिता', siblings: 'भाई-बहन', expectations: 'परिवार की अपेक्षाएँ',
    family_introduction: 'परिवार परिचय',
    income: 'आय', rashi: 'राशि', nakshatra: 'नक्षत्र', mangalik: 'मांगलिक',
    birth_time: 'जन्म समय', birth_place: 'जन्म स्थान', dob: 'जन्म तिथि',
    complexion: 'वर्ण', blood_group: 'रक्त समूह',
    kundli: 'कुंडली', address: 'पता',
    age: 'आयु', gender: 'लिंग', religion: 'धर्म', caste: 'जाति', years: 'वर्ष',
  },
  hi: {
    title: 'विवाह बायोडाटा',
    community: 'सामाजिक विवरण', personal: 'व्यक्तिगत विवरण',
    career: 'शिक्षा एवं व्यवसाय', location: 'स्थान',
    marital_status: 'वैवाहिक स्थिति', mother_tongue: 'मातृभाषा',
    about: 'परिचय', family: 'पारिवारिक परिचय', contact: 'संपर्क',
    astrology: 'ज्योतिष एवं जन्म विवरण',
    sub_caste: 'उपजाति', self_gotra: 'गोत्र', maternal_gotra: 'ननिहाल गोत्र',
    mool: 'मूल', gram: 'ग्राम', height: 'ऊँचाई', diet: 'आहार',
    smoking: 'धूम्रपान', drinking: 'मद्यपान', education: 'शिक्षा',
    profession: 'पेशा', employer: 'नियोक्ता',
    current_location: 'वर्तमान शहर', native_place: 'मूल स्थान',
    mobile: 'मोबाइल', email: 'ईमेल',
    family_type: 'परिवार का प्रकार', managed_by: 'प्रोफ़ाइल प्रबंधक', family_values: 'पारिवारिक मूल्य',
    father_name: 'पिता का नाम', mother_name: 'माता का नाम',
    parents: 'माता-पिता', siblings: 'भाई-बहन', expectations: 'परिवार की अपेक्षाएँ',
    family_introduction: 'परिवार परिचय',
    income: 'आय', rashi: 'राशि', nakshatra: 'नक्षत्र', mangalik: 'मांगलिक',
    birth_time: 'जन्म समय', birth_place: 'जन्म स्थान', dob: 'जन्म तिथि',
    complexion: 'रंग', blood_group: 'रक्त समूह',
    kundli: 'कुंडली', address: 'पता',
    age: 'आयु', gender: 'लिंग', religion: 'धर्म', caste: 'जाति', years: 'वर्ष',
  },
  sa: {
    title: 'विवाहार्थं परिचयपत्रम्',
    community: 'समाजविवरणम्', personal: 'वैयक्तिकविवरणम्',
    career: 'शिक्षा वृत्तिश्च', location: 'स्थानम्',
    marital_status: 'वैवाहिकस्थितिः', mother_tongue: 'मातृभाषा',
    about: 'आत्मपरिचयः', family: 'कुटुम्बपरिचयः', contact: 'सम्पर्कः',
    astrology: 'ज्योतिषं जन्मविवरणं च',
    sub_caste: 'उपजातिः', self_gotra: 'गोत्रम्', maternal_gotra: 'मातृगोत्रम्',
    mool: 'मूलम्', gram: 'ग्रामः', height: 'औन्नत्यम्', diet: 'आहारः',
    smoking: 'धूम्रपानम्', drinking: 'मद्यपानम्', education: 'शिक्षा',
    profession: 'वृत्तिः', employer: 'नियोक्ता',
    current_location: 'वर्तमानस्थानम्', native_place: 'मूलस्थानम्',
    mobile: 'चलभाषः', email: 'विपत्रम्',
    family_type: 'कुटुम्बप्रकारः', managed_by: 'परिचयपत्रप्रबन्धकः', family_values: 'कुटुम्बमूल्यानि',
    father_name: 'पितुः नाम', mother_name: 'मातुः नाम',
    parents: 'मातापितरौ', siblings: 'भ्रातरः', expectations: 'कुटुम्बापेक्षाः',
    family_introduction: 'कुटुम्बपरिचयः',
    income: 'आयः', rashi: 'राशिः', nakshatra: 'नक्षत्रम्', mangalik: 'माङ्गलिकम्',
    birth_time: 'जन्मसमयः', birth_place: 'जन्मस्थानम्', dob: 'जन्मतिथिः',
    complexion: 'वर्णः', blood_group: 'रक्तवर्गः',
    kundli: 'कुण्डली', address: 'पता',
    age: 'वयः', gender: 'लिङ्गम्', religion: 'धर्मः', caste: 'जातिः', years: 'वर्षाणि',
  },
}

export function isBiodataLanguage(v: string): v is BiodataLanguage {
  return v in BIODATA_LABELS
}

/** Humanize a master-data slug (e.g. "never_married" → "Never married"). */
export function humanizeValue(v: string | null | undefined): string | null {
  if (!v) return null
  const s = String(v).replace(/_/g, ' ').trim()
  if (!s) return null
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function computeAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

/** `Priya-Jha-biodata.pdf` — used as the suggested print filename. */
export function biodataFileName(name: string | null | undefined): string {
  const base = (name ?? 'marriage').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
  return `${base || 'marriage'}-biodata`
}
