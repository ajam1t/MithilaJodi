import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { BiodataDocument } from '@/components/biodata/BiodataDocument'
import {
  computeAge, humanizeValue, isBiodataLanguage,
  type BiodataData, type BiodataLanguage,
} from '@/lib/biodata'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

// This page renders one member's personal biodata — name, gotra, family and
// contact details. It is session-gated and /biodata is disallowed in robots.txt,
// but declare noindex explicitly too: robots.txt only asks crawlers not to
// fetch, it does not stop a URL discovered elsewhere from being indexed.
export const metadata = {
  robots: { index: false, follow: false },
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
  const rawLang = g.language as string
  const lang: BiodataLanguage = isBiodataLanguage(rawLang) ? rawLang : 'en'

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

  const has = (f: string) => fields.includes(f)
  /** A field the member chose to leave out is passed as null, not omitted. */
  const pick = <T,>(field: string, value: T) => (has(field) ? value : null)

  const income =
    privateDetails.income_min_lpa != null || privateDetails.income_max_lpa != null
      ? [
          privateDetails.income_min_lpa != null ? `₹${privateDetails.income_min_lpa} LPA` : null,
          privateDetails.income_max_lpa != null ? `₹${privateDetails.income_max_lpa} LPA` : null,
        ].filter(Boolean).join(' – ')
      : null

  // Map the saved profile onto the same shape the public maker produces, so
  // both render through one document component and cannot drift apart.
  const data: BiodataData = {
    full_name: pick('name', p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name),
    age: pick('age', p.dob ? String(computeAge(p.dob as string)) : null),
    gender: pick('gender', humanizeValue(p.gender)),
    religion: pick('religion', p.religion),
    caste: pick('caste', p.caste),

    sub_caste: pick('sub_caste', p.sub_caste),
    self_gotra: pick('self_gotra', p.self_gotra),
    maternal_gotra: pick('maternal_gotra', p.maternal_gotra),
    mool: pick('mool', p.mool),
    gram: pick('gram', p.gram),

    marital_status: pick('marital_status', humanizeValue(p.marital_status)),
    mother_tongue: pick('mother_tongue', humanizeValue(p.mother_tongue)),
    height: pick('height', p.height_cm ? `${p.height_cm} cm` : null),
    diet: pick('diet', humanizeValue(p.diet)),
    smoking: pick('smoking', humanizeValue(p.smoking)),
    drinking: pick('drinking', humanizeValue(p.drinking)),

    education: pick('education', [educationLabel, p.education_detail].filter(Boolean).join(' — ') || null),
    profession: pick('profession', [professionLabel, p.profession_detail].filter(Boolean).join(' — ') || null),
    employer: pick('profession', p.employer),
    income: pick('income', income),

    current_location: pick('current_location', p.current_loc_id ? (locMap[p.current_loc_id] ?? null) : null),
    native_place: pick('native_place', p.native_place_id ? (locMap[p.native_place_id] ?? null) : null),

    about_me: pick('about_me', p.about_me),

    family_type: pick('family', humanizeValue(p.family_type)),
    managed_by: pick('family', humanizeValue(p.managed_by)),
    family_values: pick('family', humanizeValue(p.family_values)),
    parents: pick('family', p.parents_info),
    siblings: pick('family', p.siblings_info),
    expectations: pick('family', p.family_expectations),
    family_about: pick('family_about', p.family_about),
    family_introduction: pick('family', p.family_introduction),

    rashi: pick('astrology', humanizeValue(privateDetails.rashi)),
    nakshatra: pick('astrology', humanizeValue(privateDetails.nakshatra)),
    mangalik: pick('astrology', humanizeValue(privateDetails.mangalik)),
    birth_time: pick('astrology', privateDetails.birth_time),
    birth_place: pick('astrology', privateDetails.birth_place),
    kundli: pick('kundli', privateDetails.kundli_url),

    mobile: pick('contact', privateDetails.contact_mobile),
    email: pick('contact', privateDetails.contact_email),
    address: pick('address', privateDetails.address),
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .biodata-page {
            box-shadow: none !important; margin: 0 !important;
            padding: 18mm 20mm !important; width: 100% !important; max-width: 100% !important;
          }
          @page { size: A4; margin: 0; }
        }
        body { background: #f0ece4; }
      `}</style>

      <PrintButton />

      <div style={{ padding: '20px 0' }}>
        <BiodataDocument data={data} language={lang} photoUrl={photoUrl} templateSlug={templateSlug} />
      </div>
    </>
  )
}
