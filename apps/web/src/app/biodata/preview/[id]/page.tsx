import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

// This page renders one member's personal biodata — name, gotra, family and
// contact details. It is session-gated and /biodata is disallowed in robots.txt,
// but declare noindex explicitly too: robots.txt only asks crawlers not to
// fetch, it does not stop a URL discovered elsewhere from being indexed.
export const metadata = {
  robots: { index: false, follow: false },
}

// Section heading labels per language
const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Biodata for Marriage',
    community: 'Community Details',
    personal: 'Personal Details',
    career: 'Education & Career',
    location: 'Location',
    about: 'About Me',
    family: 'Family Background',
    contact: 'Contact',
    sub_caste: 'Sub-caste', self_gotra: 'Gotra', maternal_gotra: 'Maternal Gotra',
    mool: 'Mool', gram: 'Gram', height: 'Height', diet: 'Diet',
    smoking: 'Smoking', drinking: 'Drinking', marital_status: 'Marital Status',
    mother_tongue: 'Mother Tongue', education: 'Education',
    profession: 'Profession', employer: 'Employer',
    current_location: 'Currently in', native_place: 'Native place',
    mobile: 'Mobile', email: 'Email',
    family_type: 'Family Type', managed_by: 'Profile Managed By', family_values: 'Family Values',
    parents: 'Parents', siblings: 'Siblings', expectations: 'Family Expectations', family_introduction: 'Family Introduction',
    income: 'Income', rashi: 'Rashi', nakshatra: 'Nakshatra', mangalik: 'Mangalik', birth_time: 'Birth time', birth_place: 'Birth place', kundli: 'Kundli', address: 'Address',
    age: 'Age', gender: 'Gender', religion: 'Religion', caste: 'Caste', years: 'years',
  },
  mai: {
    title: 'विवाह बायोडाटा',
    community: 'समुदाय विवरण', personal: 'व्यक्तिगत विवरण',
    career: 'शिक्षा एवं करियर', location: 'स्थान',
    marital_status: 'वैवाहिक स्थिति', mother_tongue: 'मातृभाषा',
    about: 'अपने बारे में', family: 'परिवार परिचय', contact: 'संपर्क',
    sub_caste: 'उपजाति', self_gotra: 'गोत्र', maternal_gotra: 'मातृ गोत्र',
    mool: 'मूल', gram: 'ग्राम', height: 'ऊँचाई', diet: 'आहार',
    smoking: 'धूम्रपान', drinking: 'मद्यपान', education: 'शिक्षा',
    profession: 'पेशा', employer: 'नियोक्ता',
    current_location: 'वर्तमान स्थान', native_place: 'मूल स्थान',
    mobile: 'मोबाइल', email: 'ईमेल',
    family_type: 'परिवार का प्रकार', managed_by: 'प्रोफ़ाइल प्रबंधक', family_values: 'पारिवारिक मूल्य',
    parents: 'माता-पिता', siblings: 'भाई-बहन', expectations: 'परिवार की अपेक्षाएँ', family_introduction: 'परिवार परिचय',
    income: 'आय', rashi: 'राशि', nakshatra: 'नक्षत्र', mangalik: 'मांगलिक', birth_time: 'जन्म समय', birth_place: 'जन्म स्थान', kundli: 'कुंडली', address: 'पता',
    age: 'आयु', gender: 'लिंग', religion: 'धर्म', caste: 'जाति', years: 'वर्ष',
  },
  hi: {
    title: 'विवाह बायोडाटा',
    community: 'सामाजिक विवरण', personal: 'व्यक्तिगत विवरण',
    career: 'शिक्षा एवं व्यवसाय', location: 'स्थान',
    marital_status: 'वैवाहिक स्थिति', mother_tongue: 'मातृभाषा',
    about: 'परिचय', family: 'पारिवारिक परिचय', contact: 'संपर्क',
    sub_caste: 'उपजाति', self_gotra: 'गोत्र', maternal_gotra: 'ननिहाल गोत्र',
    mool: 'मूल', gram: 'ग्राम', height: 'ऊँचाई', diet: 'आहार',
    smoking: 'धूम्रपान', drinking: 'मद्यपान', education: 'शिक्षा',
    profession: 'पेशा', employer: 'नियोक्ता',
    current_location: 'वर्तमान शहर', native_place: 'मूल स्थान',
    mobile: 'मोबाइल', email: 'ईमेल',
    family_type: 'परिवार का प्रकार', managed_by: 'प्रोफ़ाइल प्रबंधक', family_values: 'पारिवारिक मूल्य',
    parents: 'माता-पिता', siblings: 'भाई-बहन', expectations: 'परिवार की अपेक्षाएँ', family_introduction: 'परिवार परिचय',
    income: 'आय', rashi: 'राशि', nakshatra: 'नक्षत्र', mangalik: 'मांगलिक', birth_time: 'जन्म समय', birth_place: 'जन्म स्थान', kundli: 'कुंडली', address: 'पता',
    age: 'आयु', gender: 'लिंग', religion: 'धर्म', caste: 'जाति', years: 'वर्ष',
  },
  sa: {
    title: 'विवाहार्थं परिचयपत्रम्',
    community: 'समाजविवरणम्', personal: 'वैयक्तिकविवरणम्',
    career: 'शिक्षा वृत्तिश्च', location: 'स्थानम्',
    marital_status: 'वैवाहिकस्थितिः', mother_tongue: 'मातृभाषा',
    about: 'आत्मपरिचयः', family: 'कुटुम्बपरिचयः', contact: 'सम्पर्कः',
    sub_caste: 'उपजातिः', self_gotra: 'गोत्रम्', maternal_gotra: 'मातृगोत्रम्',
    mool: 'मूलम्', gram: 'ग्रामः', height: 'औन्नत्यम्', diet: 'आहारः',
    smoking: 'धूम्रपानम्', drinking: 'मद्यपानम्', education: 'शिक्षा',
    profession: 'वृत्तिः', employer: 'नियोक्ता',
    current_location: 'वर्तमानस्थानम्', native_place: 'मूलस्थानम्',
    mobile: 'चलभाषः', email: 'विपत्रम्',
    family_type: 'कुटुम्बप्रकारः', managed_by: 'परिचयपत्रप्रबन्धकः', family_values: 'कुटुम्बमूल्यानि',
    parents: 'मातापितरौ', siblings: 'भ्रातरः', expectations: 'कुटुम्बापेक्षाः', family_introduction: 'कुटुम्बपरिचयः',
    income: 'आयः', rashi: 'राशिः', nakshatra: 'नक्षत्रम्', mangalik: 'माङ्गलिकम्', birth_time: 'जन्मसमयः', birth_place: 'जन्मस्थानम्', kundli: 'कुण्डली', address: 'पता',
    age: 'वयः', gender: 'लिङ्गम्', religion: 'धर्मः', caste: 'जातिः', years: 'वर्षाणि',
  },
}

// Humanize a master-data slug (e.g. "never_married" → "Never married").
function humanize(v: string | null | undefined): string | null {
  if (!v) return null
  const s = String(v).replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function computeAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

type PrivateDetails = {
  contact_mobile?: string | null
  contact_email?: string | null
  address?: string | null
  income_min_lpa?: number | null
  income_max_lpa?: number | null
  rashi?: string | null
  nakshatra?: string | null
  mangalik?: string | null
  birth_time?: string | null
  birth_place?: string | null
  kundli_url?: string | null
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <tr>
      <td style={{ width: '38%', padding: '4px 12px 4px 0', color: '#666', fontWeight: 500, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
        {label}
      </td>
      <td style={{ padding: '4px 0', color: '#222', verticalAlign: 'top' }}>
        {value}
      </td>
    </tr>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        backgroundColor: '#7A1220', color: 'white',
        padding: '4px 10px', fontSize: '12px', fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        marginBottom: '8px', borderRadius: '2px',
      }}>
        {title}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export default async function BiodataPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSessionAccount()
  const { id } = await params
  if (!session) redirect(`/login?next=/biodata/preview/${id}`)

  const admin = await createAdminClient()

  const { data: gen } = await admin
    .from('biodata_generations')
    .select('id, profile_id, template_id, language, fields_included, status')
    .eq('id', id)
    .eq('status', 'ready')
    .maybeSingle()

  if (!gen) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Biodata not found or has expired.</p>
        <a href="/biodata" style={{ color: '#7A1220', marginTop: '12px', display: 'inline-block' }}>
          Generate new biodata
        </a>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = gen as any
  const fields: string[] = Array.isArray(g.fields_included) ? g.fields_included : []
  const lang = (g.language as string) in LABELS ? (g.language as string) : 'en'
  const L = LABELS[lang]

  const { data: template } = await admin
    .from('biodata_templates')
    .select('slug')
    .eq('id', g.template_id)
    .maybeSingle()
  const templateSlug = template?.slug ?? 'classic'

  // Verify this generation belongs to the current user
  const { data: profileCheck } = await admin
    .from('profiles')
    .select('id')
    .eq('id', g.profile_id)
    .eq('account_id', session.id)
    .maybeSingle()

  if (!profileCheck) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Access denied.</p>
        <a href="/biodata" style={{ color: '#7A1220' }}>Go back</a>
      </div>
    )
  }

  // Fetch profile fields
  const { data: rawProfile } = await admin
    .from('profiles')
    .select(
      'first_name, last_name, gender, dob, religion, caste, sub_caste, self_gotra, maternal_gotra, mool, gram, height_cm, diet, smoking, drinking, marital_status, mother_tongue, about_me, family_about, family_type, managed_by, family_values, parents_info, siblings_info, family_expectations, family_introduction, native_place_id, current_loc_id, education_level_id, education_detail, profession_id, profession_detail, employer'
    )
    .eq('id', g.profile_id)
    .maybeSingle()

  if (!rawProfile) return <div style={{ padding: 40 }}>Profile not found.</div>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = rawProfile as any

  // Location names
  const locIds = [p.native_place_id, p.current_loc_id].filter(Boolean)
  const locMap: Record<number, string> = {}
  if (locIds.length > 0) {
    const { data: locs } = await admin.from('india_locations').select('id, name_en').in('id', locIds)
    for (const l of locs ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      locMap[(l as any).id] = (l as any).name_en
    }
  }

  // Education / profession labels
  let educationLabel: string | null = null
  let professionLabel: string | null = null
  if (p.education_level_id) {
    const { data: edu } = await admin.from('education_levels').select('label_en').eq('id', p.education_level_id).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    educationLabel = (edu as any)?.label_en ?? null
  }
  if (p.profession_id) {
    const { data: prof } = await admin.from('professions').select('label_en').eq('id', p.profession_id).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    professionLabel = (prof as any)?.label_en ?? null
  }

  // Photo
  let photoUrl: string | null = null
  if (fields.includes('photo')) {
    const { data: photo } = await admin
      .from('profile_photos')
      .select('storage_path')
      .eq('profile_id', g.profile_id)
      .eq('is_primary', true)
      .eq('status', 'approved')
      .maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (photo && (photo as any).storage_path) {
      const { data: signed } = await admin.storage
        .from('profile-photos')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .createSignedUrl((photo as any).storage_path, 3600)
      photoUrl = signed?.signedUrl ?? null
    }
  }

  // Contact
  let privateDetails: PrivateDetails = {}
  if (fields.some(field => ['contact', 'income', 'astrology', 'kundli', 'address'].includes(field))) {
    const { data: priv } = await admin
      .from('profile_private')
      .select('contact_mobile, contact_email, address, income_min_lpa, income_max_lpa, rashi, nakshatra, mangalik, birth_time, birth_place, kundli_url')
      .eq('profile_id', g.profile_id)
      .maybeSingle()
    privateDetails = (priv as PrivateDetails) ?? {}
  }

  const contactMobile = privateDetails.contact_mobile
  const contactEmail = privateDetails.contact_email

  const has = (f: string) => fields.includes(f)
  const fullName = p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name
  const age = computeAge(p.dob as string)
  const educationFull = [educationLabel, p.education_detail].filter(Boolean).join(' — ') || null
  const professionFull = [professionLabel, p.profession_detail].filter(Boolean).join(' — ') || null

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .biodata-page { box-shadow: none !important; margin: 0 !important; padding: 18mm 20mm !important; max-width: 100% !important; }
          @page { size: A4; margin: 0; }
        }
        body { background: #f0ece4; }
      `}</style>

      <PrintButton />

      <div
        className="biodata-page"
        data-template={templateSlug}
        style={{
          fontFamily: "'Times New Roman', Georgia, serif",
          maxWidth: '210mm',
          minHeight: '297mm',
          boxSizing: 'border-box',
          margin: '20px auto',
          background: 'white',
          boxShadow: 'inset 0 0 0 2px #D8B45A, inset 0 0 0 7px #fff8e8, 0 2px 20px rgba(0,0,0,0.12)',
          border: '10px solid #7A1220',
          padding: '20mm 20mm',
          color: '#222',
          position: 'relative',
        }}
      >
        {/* Mithila-inspired geometric frame and corner motifs */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: '7px', border: '2px dashed #D8B45A', pointerEvents: 'none' }} />
        {(['top:12px;left:14px', 'top:12px;right:14px', 'bottom:12px;left:14px', 'bottom:12px;right:14px'] as const).map((position, index) => (
          <div key={position} aria-hidden="true" style={{ position: 'absolute', ...Object.fromEntries(position.split(';').map(part => part.split(':'))) as React.CSSProperties, color: '#D8B45A', fontSize: '22px', lineHeight: 1, zIndex: 1 }}>
            {index % 2 === 0 ? '❋' : '✤'}
          </div>
        ))}

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #7A1220', paddingBottom: '14px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
          <img src="/logo.png" alt="Mithila Jodi" style={{ width: '58px', height: '58px', objectFit: 'contain', margin: '0 auto 5px', display: 'block' }} />
          <div style={{ fontSize: '12px', color: '#A27A2A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '5px' }}>Mithila Jodi</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#7A1220', fontWeight: 'normal', letterSpacing: '0.04em' }}>
            {L.title}
          </h1>
        </div>

        {/* Photo + name row */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '22px', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          {photoUrl && (
            <div style={{ flexShrink: 0, padding: '5px', border: '2px solid #D8B45A', background: '#fff8e8', boxShadow: '0 2px 0 #7A1220' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt={fullName}
                style={{ width: '112px', height: '145px', objectFit: 'cover', border: '1px solid #7A1220', display: 'block' }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            {has('name') && (
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#7A1220', marginBottom: '8px' }}>
                {fullName}
              </div>
            )}
            <table style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
              <tbody>
                {has('age') && <Row label={L.age} value={`${age} ${L.years}`} />}
                {has('gender') && <Row label={L.gender} value={p.gender} />}
                {has('religion') && <Row label={L.religion} value={p.religion} />}
                {has('caste') && <Row label={L.caste} value={p.caste} />}
              </tbody>
            </table>
          </div>
        </div>

        {/* Community */}
        {(has('self_gotra') || has('maternal_gotra') || has('mool') || has('gram') || has('sub_caste')) && (
          <Section title={L.community}>
            {has('sub_caste') && <Row label={L.sub_caste} value={p.sub_caste} />}
            {has('self_gotra') && <Row label={L.self_gotra} value={p.self_gotra} />}
            {has('maternal_gotra') && <Row label={L.maternal_gotra} value={p.maternal_gotra} />}
            {has('mool') && <Row label={L.mool} value={p.mool} />}
            {has('gram') && <Row label={L.gram} value={p.gram} />}
          </Section>
        )}

        {/* Personal */}
        {(has('marital_status') || has('mother_tongue') || has('height') || has('diet') || has('smoking') || has('drinking')) && (
          <Section title={L.personal}>
            {has('marital_status') && <Row label={L.marital_status} value={humanize(p.marital_status)} />}
            {has('mother_tongue') && <Row label={L.mother_tongue} value={humanize(p.mother_tongue)} />}
            {has('height') && <Row label={L.height} value={p.height_cm ? `${p.height_cm} cm` : null} />}
            {has('diet') && <Row label={L.diet} value={p.diet?.replace('_', '-') ?? null} />}
            {has('smoking') && <Row label={L.smoking} value={p.smoking} />}
            {has('drinking') && <Row label={L.drinking} value={p.drinking} />}
          </Section>
        )}

        {/* Education & Career */}
        {(has('education') || has('profession')) && (
          <Section title={L.career}>
            {has('education') && <Row label={L.education} value={educationFull} />}
            {has('profession') && <Row label={L.profession} value={professionFull} />}
            {has('profession') && <Row label={L.employer} value={p.employer} />}
          </Section>
        )}

        {/* Location */}
        {(has('native_place') || has('current_location')) && (
          <Section title={L.location}>
            {has('current_location') && <Row label={L.current_location} value={p.current_loc_id ? (locMap[p.current_loc_id] ?? null) : null} />}
            {has('native_place') && <Row label={L.native_place} value={p.native_place_id ? (locMap[p.native_place_id] ?? null) : null} />}
          </Section>
        )}

        {/* About */}
        {has('about_me') && p.about_me && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{ backgroundColor: '#7A1220', color: 'white', padding: '4px 10px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', borderRadius: '2px' }}>
              {L.about}
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.8', color: '#333', whiteSpace: 'pre-wrap' }}>{p.about_me}</p>
          </div>
        )}

        {/* Family */}
        {(has('family') || has('family_about')) && (p.family_about || p.family_type || p.managed_by || p.family_values || p.parents_info || p.siblings_info || p.family_expectations || p.family_introduction) && (
          <Section title={L.family}>
            {p.family_type && <Row label={L.family_type} value={humanize(p.family_type)} />}
            {p.managed_by && <Row label={L.managed_by} value={humanize(p.managed_by)} />}
            {p.family_values && <Row label={L.family_values} value={humanize(p.family_values)} />}
            {p.parents_info && <Row label={L.parents} value={p.parents_info} />}
            {p.siblings_info && <Row label={L.siblings} value={p.siblings_info} />}
            {p.family_expectations && <Row label={L.expectations} value={p.family_expectations} />}
            {p.family_about && <Row label={L.family} value={p.family_about} />}
            {p.family_introduction && <Row label={L.family_introduction} value={p.family_introduction} />}
          </Section>
        )}

        {/* Contact */}
        {has('contact') && (contactMobile || contactEmail) && (
          <Section title={L.contact}>
            {contactMobile && <Row label={L.mobile} value={contactMobile} />}
            {contactEmail && <Row label={L.email} value={contactEmail} />}
          </Section>
        )}

        {/* Income and astrology */}
        {has('income') && (privateDetails.income_min_lpa != null || privateDetails.income_max_lpa != null) && (
          <Section title={L.income}>
            <Row label={L.income} value={`${privateDetails.income_min_lpa != null ? `₹${privateDetails.income_min_lpa} LPA` : ''}${privateDetails.income_min_lpa != null && privateDetails.income_max_lpa != null ? ' – ' : ''}${privateDetails.income_max_lpa != null ? `₹${privateDetails.income_max_lpa} LPA` : ''}`} />
          </Section>
        )}

        {has('astrology') && (privateDetails.rashi || privateDetails.nakshatra || privateDetails.mangalik || privateDetails.birth_time || privateDetails.birth_place) && (
          <Section title="Astrology & Birth Details">
            <Row label={L.rashi} value={humanize(privateDetails.rashi as string)} />
            <Row label={L.nakshatra} value={humanize(privateDetails.nakshatra as string)} />
            <Row label={L.mangalik} value={humanize(privateDetails.mangalik as string)} />
            <Row label={L.birth_time} value={privateDetails.birth_time as string} />
            <Row label={L.birth_place} value={privateDetails.birth_place as string} />
          </Section>
        )}

        {has('kundli') && privateDetails.kundli_url && (
          <Section title={L.kundli}>
            <Row label={L.kundli} value={privateDetails.kundli_url as string} />
          </Section>
        )}

        {has('address') && privateDetails.address && (
          <Section title={L.address}>
            <Row label={L.address} value={privateDetails.address as string} />
          </Section>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #D8B45A', marginTop: '32px', paddingTop: '9px', textAlign: 'center', fontSize: '11px', color: '#7A1220', letterSpacing: '0.04em' }}>
          <strong>Mithila Jodi</strong> · mithilajodi.com · A thoughtful beginning to forever
        </div>
      </div>
    </>
  )
}
