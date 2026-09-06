import type { BiodataData, BiodataLanguage } from '@/lib/biodata'
import { BIODATA_LABELS } from '@/lib/biodata'

/**
 * The printed biodata itself — one A4 page, inline styles only.
 *
 * Inline styles rather than Tailwind classes on purpose: this is the one
 * component in the app whose output is a physical piece of paper. Print
 * stylesheets and `window.print()` are far more predictable when every rule is
 * on the element, and a member emailing the printed PDF should not depend on a
 * utility class surviving a future Tailwind purge.
 *
 * Presentational and dependency-free, so both the member tool (server-rendered
 * from a saved profile) and the public maker (client-rendered from a form) can
 * render exactly the same document.
 */

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

/** True when at least one of the named fields has a value. */
function any(data: BiodataData, keys: Array<keyof BiodataData>): boolean {
  return keys.some(k => {
    const v = data[k]
    return v != null && String(v).trim() !== ''
  })
}

export function BiodataDocument({
  data,
  language = 'en',
  photoUrl = null,
  templateSlug = 'classic',
}: {
  data: BiodataData
  language?: BiodataLanguage
  /** Either a signed profile-photo URL or a local object URL from a file input. */
  photoUrl?: string | null
  templateSlug?: string
}) {
  const L = BIODATA_LABELS[language] ?? BIODATA_LABELS.en

  return (
    <div
      className="biodata-page"
      data-template={templateSlug}
      style={{
        fontFamily: "'Times New Roman', Georgia, serif",
        width: '210mm',
        maxWidth: '100%',
        minHeight: '297mm',
        boxSizing: 'border-box',
        margin: '0 auto',
        background: 'white',
        boxShadow: 'inset 0 0 0 2px #D8B45A, inset 0 0 0 7px #fff8e8, 0 2px 20px rgba(0,0,0,0.12)',
        border: '10px solid #7A1220',
        padding: '20mm',
        color: '#222',
        position: 'relative',
      }}
    >
      {/* Mithila-inspired geometric frame and corner motifs */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: '7px', border: '2px dashed #D8B45A', pointerEvents: 'none' }} />
      {(['top:12px;left:14px', 'top:12px;right:14px', 'bottom:12px;left:14px', 'bottom:12px;right:14px'] as const).map((position, index) => (
        <div
          key={position}
          aria-hidden="true"
          style={{
            position: 'absolute',
            ...Object.fromEntries(position.split(';').map(part => part.split(':'))) as React.CSSProperties,
            color: '#D8B45A', fontSize: '22px', lineHeight: 1, zIndex: 1,
          }}
        >
          {index % 2 === 0 ? '❋' : '✤'}
        </div>
      ))}

      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #7A1220', paddingBottom: '14px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
              alt={data.full_name ?? ''}
              style={{ width: '112px', height: '145px', objectFit: 'cover', border: '1px solid #7A1220', display: 'block' }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          {data.full_name && (
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#7A1220', marginBottom: '8px' }}>
              {data.full_name}
            </div>
          )}
          <table style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
            <tbody>
              <Row label={L.age} value={data.age ? `${data.age} ${L.years}` : null} />
              <Row label={L.gender} value={data.gender} />
              <Row label={L.religion} value={data.religion} />
              <Row label={L.caste} value={data.caste} />
            </tbody>
          </table>
        </div>
      </div>

      {any(data, ['sub_caste', 'self_gotra', 'maternal_gotra', 'mool', 'gram']) && (
        <Section title={L.community}>
          <Row label={L.sub_caste} value={data.sub_caste} />
          <Row label={L.self_gotra} value={data.self_gotra} />
          <Row label={L.maternal_gotra} value={data.maternal_gotra} />
          <Row label={L.mool} value={data.mool} />
          <Row label={L.gram} value={data.gram} />
        </Section>
      )}

      {any(data, ['marital_status', 'mother_tongue', 'dob', 'height', 'complexion', 'blood_group', 'diet', 'smoking', 'drinking']) && (
        <Section title={L.personal}>
          <Row label={L.marital_status} value={data.marital_status} />
          <Row label={L.mother_tongue} value={data.mother_tongue} />
          <Row label={L.dob} value={data.dob} />
          <Row label={L.height} value={data.height} />
          <Row label={L.complexion} value={data.complexion} />
          <Row label={L.blood_group} value={data.blood_group} />
          <Row label={L.diet} value={data.diet} />
          <Row label={L.smoking} value={data.smoking} />
          <Row label={L.drinking} value={data.drinking} />
        </Section>
      )}

      {any(data, ['education', 'profession', 'employer', 'income']) && (
        <Section title={L.career}>
          <Row label={L.education} value={data.education} />
          <Row label={L.profession} value={data.profession} />
          <Row label={L.employer} value={data.employer} />
          <Row label={L.income} value={data.income} />
        </Section>
      )}

      {any(data, ['current_location', 'native_place']) && (
        <Section title={L.location}>
          <Row label={L.current_location} value={data.current_location} />
          <Row label={L.native_place} value={data.native_place} />
        </Section>
      )}

      {data.about_me && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ backgroundColor: '#7A1220', color: 'white', padding: '4px 10px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', borderRadius: '2px' }}>
            {L.about}
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.8', color: '#333', whiteSpace: 'pre-wrap' }}>{data.about_me}</p>
        </div>
      )}

      {any(data, ['father_name', 'mother_name', 'family_type', 'managed_by', 'family_values', 'parents', 'siblings', 'expectations', 'family_about', 'family_introduction']) && (
        <Section title={L.family}>
          <Row label={L.father_name} value={data.father_name} />
          <Row label={L.mother_name} value={data.mother_name} />
          <Row label={L.family_type} value={data.family_type} />
          <Row label={L.managed_by} value={data.managed_by} />
          <Row label={L.family_values} value={data.family_values} />
          <Row label={L.parents} value={data.parents} />
          <Row label={L.siblings} value={data.siblings} />
          <Row label={L.expectations} value={data.expectations} />
          <Row label={L.family} value={data.family_about} />
          <Row label={L.family_introduction} value={data.family_introduction} />
        </Section>
      )}

      {any(data, ['rashi', 'nakshatra', 'mangalik', 'birth_time', 'birth_place', 'kundli']) && (
        <Section title={L.astrology}>
          <Row label={L.rashi} value={data.rashi} />
          <Row label={L.nakshatra} value={data.nakshatra} />
          <Row label={L.mangalik} value={data.mangalik} />
          <Row label={L.birth_time} value={data.birth_time} />
          <Row label={L.birth_place} value={data.birth_place} />
          <Row label={L.kundli} value={data.kundli} />
        </Section>
      )}

      {any(data, ['mobile', 'email', 'address']) && (
        <Section title={L.contact}>
          <Row label={L.mobile} value={data.mobile} />
          <Row label={L.email} value={data.email} />
          <Row label={L.address} value={data.address} />
        </Section>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #D8B45A', marginTop: '32px', paddingTop: '9px', textAlign: 'center', fontSize: '11px', color: '#7A1220', letterSpacing: '0.04em' }}>
        <strong>Mithila Jodi</strong> · mithilajodi.com · A thoughtful beginning to forever
      </div>
    </div>
  )
}

export default BiodataDocument
